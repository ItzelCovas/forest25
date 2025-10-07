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
                neighbor.status = burning
            end
        end
        tree.status = burnt  #después de haber contagiado a sus vecinos, el árbol original pasa a estar "burnt".
    end
end

# función principal que crea nuestro modelo del bosque.
function forest_fire(; density = 0.45, griddims = (5, 5)) # parámetros opcionales: density (densidad de árboles) y griddims (dimensiones de la cuadrícula).
    #Se crea el espacio: una cuadrícula de 5x5 donde los árboles no pueden compartir la misma celda.
    space = GridSpaceSingle(griddims; periodic = false, metric = :manhattan)
    # Creamos el modelo de agentes (el bosque), usando nuestros árboles (TreeAgent) y la función de paso (forest_step)
    forest = StandardABM(TreeAgent, space; agent_step! = forest_step, scheduler = Schedulers.ByID())

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