// src/components/Roulette.js
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import "./Roulette.css";

const Roulette = ({ candidates, onDraw }) => {
  const scene = useRef();
  const engineRef = useRef(null);
  const partsRef = useRef();
  const [candidateInfo, setCandidateInfo] = useState([]);

  useEffect(() => {
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events;

    const engine = Engine.create();
    engine.constraintIterations = 300;
    engine.positionIterations = 900;

    engineRef.current = engine;
    const world = engine.world;

    let rotationForceInterval = null;

    const render = Render.create({
      element: scene.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: "#fafafa",
      },
    });

    // Create hollow circular ball box
    
    let parts = [];
    partsRef.current = parts;
    for (let i = 0; i < 360; i += 0.5) {
      const x = 400 + Math.cos((i * Math.PI) / 180) * 200;
      const y = 300 + Math.sin((i * Math.PI) / 180) * 200;

      const part = Bodies.rectangle(x, y, 10, 10, {
        isStatic: true,
        angle: (i * Math.PI) / 180,
        restitution: 0.9,
        render: {
          fillStyle: "#000",
        },
      });
      parts.push(part);
    }

    // Create ground and walls to prevent balls from escaping
    const ground = Bodies.rectangle(400, 590, 800, 20, { isStatic: true });
    const ceiling = Bodies.rectangle(400, 10, 800, 20, { isStatic: true });
    const leftWall = Bodies.rectangle(10, 300, 20, 600, { isStatic: true });
    const rightWall = Bodies.rectangle(790, 300, 20, 600, { isStatic: true });

    // Blocker to temporarily block the hole
    const blocker = Bodies.rectangle(400, 570, 40, 20, {
      isStatic: true,
      render: { fillStyle: "gray" },
    });

    Composite.add(world, [
      ...parts,
      ground,
      ceiling,
      leftWall,
      rightWall,
      blocker,
    ]);

    // Assign colors and numbers to candidates
    const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#800", "#080", "#008"];
    const candidateInfoList = candidates.map((candidate, index) => ({
      ...candidate,
      color: colors[index % colors.length],
      number: index + 1,
    }));
    setCandidateInfo(candidateInfoList);

    // Create balls for each candidate inside the ball box
    const balls = candidateInfoList.map((candidate) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100; // Ensure balls are inside the ball box
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      return Bodies.circle(x, y, 20, {
        label: candidate.name,
        restitution: 1.0,
        render: {
          fillStyle: candidate.color,
          text: {
            content: candidate.number.toString(),
            color: "white",
            size: 12,
          },
        },
      });
    });

    Composite.add(world, balls);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Add collision event for determining the winner
    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA.label === "hole" || pair.bodyB.label === "hole") {
          const winningBall =
            pair.bodyA.label === "hole" ? pair.bodyB : pair.bodyA;
          clearInterval(rotationForceInterval);
          onDraw(winningBall.label);
        }
      });
    });

    const applyRotationalForce = () => {
      balls.forEach((ball) => {
        const angle = Math.atan2(ball.position.y - 300, ball.position.x - 400);
        const forceMagnitude = 0.01 * ball.mass;
        Body.applyForce(ball, ball.position, {
          x: Math.cos(angle + Math.PI / 2) * forceMagnitude,
          y: Math.sin(angle + Math.PI / 2) * forceMagnitude,
        });
      });
    };

    // Function to create the hole and start applying rotational force
    const draw = () => {
      Composite.remove(world, blocker);
      const hole = Bodies.rectangle(400, 570, 40, 40, {
        isStatic: true,
        isSensor: true,
        label: "hole",
        render: { fillStyle: "black" },
      });

      rotationForceInterval = setInterval(applyRotationalForce, 100);

      let multiflier = parts.length / 360;
      let minGakdo = 83;
      let maxGakdo = 97;
      let range = [minGakdo*multiflier, maxGakdo*multiflier];

      for (let i = 0; i < parts.length; i++) {
        
        if(i>=range[0] && i<=range[1]){
          // Remove the parts that are in the range of the hole
          Composite.remove(world, parts[i]);
          
        }

      } 

      Composite.add(world, hole);
    };

    // Add event listeners to the buttons
    const drawButton = document.getElementById("draw-button");
    if (drawButton) {
      drawButton.addEventListener("click", draw);
    }

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};

      // Remove the event listeners when the component unmounts
      if (drawButton) {
        drawButton.removeEventListener("click", draw);
      }
    };
  }, [candidates, onDraw]);

  return (
    <div className="roulette-container">
      <div ref={scene} className="roulette-scene"></div>
      <div className="candidate-info">
        <h2>Candidate Information</h2>
        <ul>
          {candidateInfo.map((candidate) => (
            <li key={candidate.number} style={{ color: candidate.color }}>
              {candidate.number}. {candidate.name}
            </li>
          ))}
        </ul>
      </div>
      <button id="draw-button" className="draw-button">
        Draw
      </button>
    </div>
  );
};

export default Roulette;
