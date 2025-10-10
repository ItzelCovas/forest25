include("forest.jl")
using Genie, Genie.Renderer.Json, Genie.Requests, HTTP
using UUIDs

instances = Dict()

route("/simulations", method = POST) do
    payload =jsonpayload() 
    x = payload["griddims"][1]
    y = payload["griddims"][2]
    d = payload["density"]
    prob_spread = payload["probability_of_spread"] #extraemos la probabilidad de propagación del fuego del JSON recibido (del frontend) 
    south_wind_speed=get(payload, "south_wind_speed", 0.0)
    west_wind_speed=get(payload, "west_wind_speed", 0.0)
    big_jumps=get(payload, "big_jumps", false)

    #Crear el modelo con el viento
    model=forest_fire(
        griddims=(x, y),
        density=d,
        probability_of_spread=prob_spread,
        south_wind_speed=south_wind_speed,
        west_wind_speed=west_wind_speed,
        big_jumps=big_jumps
    ) 

    # model = forest_fire()
    id = string(uuid1())
    instances[id] = model

    trees = []
    for tree in allagents(model)
        push!(trees, tree)
    end
    
    json(Dict(:msg => "Hola", "Location" => "/simulations/$id", "trees" => trees))
end

route("/simulations/:id") do
    id = Genie.params(:id)
    println("GET id recibido: $id")  # depuración
    if !haskey(instances, id)
        return json(Dict(:error => "Simulación no encontrada"))
    end

    model = instances[id]
    run!(model, 1)
    trees = [tree for tree in allagents(model)]
    json(Dict(:msg => "Simulación actualizada", "trees" => trees))
end

Genie.config.run_as_server = true
Genie.config.cors_headers["Access-Control-Allow-Origin"] = "*"
Genie.config.cors_headers["Access-Control-Allow-Headers"] = "Content-Type"
Genie.config.cors_headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS" 
Genie.config.cors_allowed_origins = ["*"]

up()