import { useRef, useState } from 'react'
// import './App.css'
import '@aws-amplify/ui-react/styles.css';
import { Button } from "@aws-amplify/ui-react";

function App() {
  let [location, setLocation] = useState("");
  let [trees, setTrees] = useState([]);
  let gridSize = 5;
  const running = useRef(null);

  let setup = () => {
    console.log("Hola");
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]);
      setTrees(data["trees"]);
    });
  };

  const handleStart = () => {
    console.log("location", location);
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setTrees(data["trees"]);
      });
    }, 500);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  let burning = trees.filter(t => t.status == "burning").length;

  if (burning == 0)
    handleStop();

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
