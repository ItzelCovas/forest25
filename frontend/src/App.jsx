import { useRef, useState } from 'react'
// import './App.css'
import '@aws-amplify/ui-react/styles.css';
import { Button, SliderField } from "@aws-amplify/ui-react";

function App() {
  let [location, setLocation] = useState("");
  let [trees, setTrees] = useState([]);

  let [gridSize, setGridSize] = useState(20); //Ahora es una variable de estado, con valor inicial 20
  let [simSpeed, setSimSpeed] = useState(2); // 2 actualizaciones por segundo
  let [density, setDensity] = useState(0.45); // 45% de densidad de árboles

  const running = useRef(null);

  const handleGridSizeSliderChange = (value) => {
    setGridSize(value);
  };

  const handleSimSpeedSliderChange = (value) => {
    setSimSpeed(value);
  };

  const handleDensitySliderChange = (value) => { 
    setDensity(value);
  };

  let setup = () => {
    console.log("Hola");
    if (running.current) clearInterval(running.current); // Detener simulación si ya está corriendo
    running.current = null;

    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      // Enviar los parámetros al backend
      body: JSON.stringify({ griddims: [gridSize, gridSize], density: density }) 

    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]); 
      setTrees(data["trees"]);
    });
  };

  const handleStart = () => {
    if (running.current) clearInterval(running.current); 

    console.log("location", location);
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        if (data["trees"].length === 0) { // === significa "igualdad estricta", === 0 es igual a "ningún árbol", 
          handleStop();
        }
        setTrees(data["trees"]);
      });
    }, 1000/simSpeed); //usamos la velocidad del slider. 
  };

  const handleStop = () => {
    clearInterval(running.current);
    running.current = null; 
  }

  let burning = trees.filter(t => t.status == "burning").length;

  if (burning === 0 && running.current) {
    handleStop();
  }
  // if (burning == 0)
  //   handleStop();

  let offset = (500 - gridSize * 12) / 2;
  return (
    <>
      <div>
        <Button variant={"contained"} onClick={setup}>
          Setup
        </Button>
        <Button variant={"contained"} onClick={handleStart}>
          Start
        </Button>
        <Button variant={"contained"} onClick={(handleStop)}>
          Pause 
        </Button>
        <Button variant={"contained"} onClick={handleStop}> 
          Stop 
        </Button>
      </div>
      
      <div>
        <SliderField 
          label="Grid size" 
          min={10} 
          max={40} 
          step={10} 
          value={gridSize} 
          onChange={handleGridSizeSliderChange}
        />

        <SliderField 
          label="Simulation speed" 
          min={1} 
          max={10} 
          step={1} 
          value={simSpeed} 
          onChange={handleSimSpeedSliderChange}
        />

        <SliderField 
          label="Forest Density" 
          min={0.1} 
          max={1.0} 
          step={0.05} 
          value={density} 
          onChange={handleDensitySliderChange}
        />
      </div>

      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"white"}}>
      {
        trees.map(tree => 
          <image 
            key={tree["id"]} 
            x={offset + 12*(tree["pos"][0] - 1)} 
            y={offset + 12*(tree["pos"][1] - 1)} 
            width={15} href={
              tree["status"] === "green" ? "./greentree.svg" :
              (tree["status"] === "burning" ? "./burningtree.svg" : 
                "./burnttree.svg")
            }
          />
        )
      }
      </svg>
    </>
  );
}

export default App
