import { useRef, useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { Button, SliderField, Flex, View, Text, Card } from "@aws-amplify/ui-react";

function App() {
  let [location, setLocation] = useState("");
  let [trees, setTrees] = useState([]);

  //estados para los parámetros
  let [gridSize, setGridSize] = useState(20);
  let [simSpeed, setSimSpeed] = useState(4);
  let [density, setDensity] = useState(0.6);
  let [probabilityOfSpread, setProbabilityOfSpread] = useState(60);
  let [south_wind_speed, setsouth_wind_speed]=useState(0); // Viento sur a norte (-50 a 50)
  let [west_wind_speed, setwest_wind_speed]=useState[0]; //Viento  oeste a este (-50 a 50) 

  // para estadísticas
  const [steps, setSteps] = useState(0);
  const [initialTrees, setInitialTrees] = useState(0);
  const [burntPercentage, setBurntPercentage] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const running = useRef(null);

  const handleGridSizeSliderChange = (value) => setGridSize(value);
  const handleSimSpeedSliderChange = (value) => setSimSpeed(value);
  const handleDensitySliderChange = (value) => setDensity(value);
  const handleProbabilitySliderChange = (value) => setProbabilityOfSpread(value);
  const handleSouthWindSpeedChange=(value)=>setsouth_wind_speed(value);
  const handleWestWindSpeedChange=(value)=>setwest_wind_speed(value);

  const setup = () => {
    handleStop();
    setTrees([]);
    
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        griddims: [gridSize, gridSize], 
        density: density,
        probability_of_spread: probabilityOfSpread / 100 
      })
    }).then(resp => resp.json())
    .then(data => {
      setLocation(data.Location); 
      setTrees(data.trees);
      setInitialTrees(data.trees.length);
      setSteps(0);
      setBurntPercentage(0);
    });
  };

  const handleStart = () => {
    if (running.current || !location) return;
    setIsSimulating(true);

    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setTrees(data.trees);
        setSteps(prev => prev + 1);

        const isBurning = data.trees.some(tree => tree.status === "burning");
        if (!isBurning) {
          handleStop();
        }
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
    running.current = null;
    setIsSimulating(false);
  };
  
  useEffect(() => {
    if (!isSimulating && initialTrees > 0) {
      const burntCount = trees.filter(t => t.status === 'burnt').length;
      const percentage = (burntCount / initialTrees) * 100;
      setBurntPercentage(percentage.toFixed(2));
    }
  }, [isSimulating]);

  let offset = (500 - gridSize * 12) / 2;
  
  return (
    <Flex direction="column" alignItems="left" gap="1rem" padding="1rem">
      <Flex direction="row" gap="0.5rem">
        <Button variation="primary" onClick={setup}>Setup</Button>
        <Button onClick={handleStart} isDisabled={isSimulating}>Start</Button>
        <Button onClick={handleStop}>Pause</Button>
        <Button variation="destructive" onClick={handleStop}>Stop</Button>
      </Flex>
      
      <Flex direction={{base: 'column', large: 'row'}} gap="1rem" width="100%" justifyContent="center">
        <Card width={{base: '90%', large: '400px'}} variation="outlined">
          <SliderField label="Grid size" min={10} max={40} step={10} value={gridSize} onChange={handleGridSizeSliderChange} />
          <SliderField label="Simulation speed" min={1} max={10} step={1} value={simSpeed} onChange={handleSimSpeedSliderChange} />
          <SliderField label="Forest Density" min={0.1} max={1.0} step={0.05} value={density} onChange={handleDensitySliderChange} />
          <SliderField label={`Probability of Spread: ${probabilityOfSpread}%`} min={0} max={100} step={1} value={probabilityOfSpread} onChange={handleProbabilitySliderChange} />
        </Card>
        
        <Card width={{base: '90%', large: '300px'}} variation="outlined">
            <Text as="h3"><b>Simulation stats:</b></Text>
            <Text>Simulation steps: {steps}</Text>
            <Text>Initial trees: {initialTrees}</Text>
            <Text>Burnt percentage: {burntPercentage > 0 ? burntPercentage : '--'}%</Text>
        </Card>
      </Flex>

      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"white", border: "1px solid #ccc"}}>
        {trees.map(tree => 
          <image key={tree.id} x={offset + 12 * (tree.pos[0] - 1)} y={offset + 12 * (tree.pos[1] - 1)} width={15} href={
              tree.status === "green" ? "./greentree.svg" : (tree.status === "burning" ? "./burningtree.svg" : "./burnttree.svg")
          }/>
        )}
      </svg>
    </Flex>
  );
}

export default App;