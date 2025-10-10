using Agents, Random, Distributions
# Agents: base para crear nuestro modelo con agentes (árboles).
# Random y Distributions: para generar números aleatorios que se usarán para decidir dónde plantar árboles.

@enum TreeStatus green burning burnt # "enumeración" para los estados de un árbol -> un árbol solo puede estar en uno de estos tres estados: green, burning o burnt.

# Definimos cómo es un agente "árbol".
# Hereda de GridAgent{2}, lo que significa que vive en una cuadrícula de 2 dimensiones. Tiene una propiedad llamada "status" que guarda su estado actual (por defecto, "green").
@agent struct TreeAgent(GridAgent{2})
    status::TreeStatus = green
end

function forest_step(tree::TreeAgent, model) #función define qué hace un árbol en cada paso de la simulación
    if tree.status == burning # Si el árbol está "burning", entonces:
        for neighbor in nearby_agents(tree, model) # busca a todos sus vecinos en la cuadrícula.
            #si vecino está "green", lo contagiamos y ahora estará "burning".
            if neighbor.status == green
                #Calculo de la dirección relativa entre el árbol y su vecino
                dx=neighbor.pos[1]-tree.pos[1]
                dy=neighbor.pos[2]-tree.pos[2]
                prob=model.probability_of_spread
                wind_bonus=0.0
                #Viento de sur a norte(dy>0)
                if dy>0
                    wind_bonus+=model.south_wind_speed/100
                elseif dy<0
                    wind_bonus-=model.south_wind_speed/100
                end
                #Viento de este a oeste(dx>0)
                if dx>0
                    wind_bonus+=model.west_wind_speed/100
                elseif dx<0
                    wind_bonus-=model.west_wind_speed/100
                end

                #Se aplica la probabilidad ajustada por el Viento
                adjusted_prob=clamp(prob+wind_bonus, 0.0, 1.0)

                #La propagación ahora se ajustara a adjusted_prob
                if rand(model.rng)<adjusted_prob
                    neighbor.status = burning #el vecino se quema 
                end
            end
        end

        #Propagación a distancia
        if get(model.properties, :big_jumps, false)
            scale_factor=15.0
            jump_x=tree.pos[1]+Int(round(model.west_wind_speed/scale_factor))
            jump_y=tree.pos[2]+Int(round(model.south_wind_speed/scale_factor))
            distant_pos=(jump_x, jump_y)

            if all(>=(1), distant_pos) &&
                distant_pos[1]<=model.space.dims[1]&&
                distant_pos[2]<=model.space.dims[2]
                distant_agents=agentes_in_position(distant_pos, model)
                for distant_tree in distant_agents
                    if distant_tree.status==green
                        distant_tree.status=burning
                    end
                end
            end
        end
        tree.status = burnt  #después de haber contagiado a sus vecinos, el árbol original pasa a estar "burnt".
    end
end

# función principal que crea nuestro modelo del bosque.
function forest_fire(;
    density = 0.45, 
    griddims = (5, 5), 
    probability_of_spread = 1.0, 
    south_wind_speed=0.0, 
    west_wind_speed=0.0,
    big_jumps=false
) # parámetros opcionales: density (densidad de árboles) y griddims (dimensiones de la cuadrícula). ahora también probability_of_spread (probabilidad de que el fuego se propague de un árbol a otro).
    
    #Se crea el espacio: una cuadrícula de 5x5 donde los árboles no pueden compartir la misma celda.
    space = GridSpaceSingle(griddims; periodic = false, metric = :manhattan)

    properties = Dict(
        :probability_of_spread => probability_of_spread, 
        :south_wind_speed => south_wind_speed, 
        :west_wind_speed => west_wind_speed, 
        :big_jumps=>big_jumps
        :rng => Random.default_rng() 
    ) #propiedad del modelo que guarda la probabilidad de propagación del fuego. 

    # Creamos el modelo de agentes (el bosque), usando nuestros árboles (TreeAgent) y la función de paso (forest_step)
    forest = StandardABM(TreeAgent, space; 
        properties, 
        agent_step! = forest_step, 
        scheduler = Schedulers.ByID())

    for pos in positions(forest) # Recorremos cada posición de la cuadrícula para plantar árboles
        # Usamos la density para decidir si plantamos un árbol o no.
        # rand(Uniform(0,1)) genera un número al azar entre 0 y 1, si ese número es menor que la densidad, plantamos un árbol.
        if rand(Uniform(0,1)) < density
            tree = add_agent!(pos, TreeAgent, forest)  #plantar el árbol en esa posición.
            #si el árbol está en la primera columna (la orilla izquierda)...
            if pos[1] == 1  
                # ... iniciamos el fuego ahí, cambiando su estado a "burning".
                tree.status = burning 
            end
        end
    end
    return forest # devolver el bosque ya creado
end