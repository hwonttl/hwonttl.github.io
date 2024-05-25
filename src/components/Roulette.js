// src/components/Roulette.js
import React, { useEffect, useRef } from "react";
import Matter from "matter-js";
import "./Roulette.css";

const Roulette = ({ candidates, onDraw }) => {
  const scene = useRef();
  const engineRef = useRef(null);
  const partsRef = useRef();

  const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = (i * 360 / numColors) % 360;
      const saturation = 70 + Math.random() * 30; // Saturation between 70% and 100%
      const lightness = 50 + Math.random() * 20; // Lightness between 50% and 70%
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  };
  const colors = generateColors(candidates.length);

  useEffect(() => {
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events;

    const engine = Engine.create();
    engine.constraintIterations = 500;
    engine.positionIterations = 1500;

    engineRef.current = engine;
    const world = engine.world;

    let rotationForceInterval = null;

    const render = Render.create({
      element: scene.current,
      engine: engine,
      options: {
        width: 800,
        height: 800, // Increase height to make room for larger circle
        wireframes: false,
        background: "#fafafa",
      },
    });

    // Create hollow circular ball box
    let parts = [];
    partsRef.current = parts;
    const radius = 300; // Increase the radius for a larger circle
    for (let i = 0; i < 360; i += 0.5) {
      const x = 400 + Math.cos((i * Math.PI) / 180) * radius;
      const y = 400 + Math.sin((i * Math.PI) / 180) * radius;

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
    const ground = Bodies.rectangle(400, 790, 800, 20, { isStatic: true });
    const ceiling = Bodies.rectangle(400, 10, 800, 20, { isStatic: true });
    const leftWall = Bodies.rectangle(10, 400, 20, 800, { isStatic: true });
    const rightWall = Bodies.rectangle(790, 400, 20, 800, { isStatic: true });

    // Blocker to temporarily block the hole
    const blocker = Bodies.rectangle(400, 770, 40, 20, {
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

    const candidatesWithColors = candidates.map((candidate, index) => ({
      ...candidate,
      color: colors[index],
    }));

    // Create balls for each candidate inside the ball box
    let ballIndex = 1;
    const balls = candidatesWithColors.map((candidate) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100; // Ensure balls are inside the ball box
      const x = 400 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);
      return Bodies.circle(x, y, 20, {
        label: candidate.name,
        restitution: 1.0,
        render: {
          //fillStyle: candidate.color,
          sprite: {
            texture: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="${candidate.color}"/><text x="20" y="25" font-size="20" fill="white" text-anchor="middle" font-family="Arial">${ballIndex++}</text></svg>`)}`,
          },
        },
      });
    });

    Composite.add(world, balls);

    // Add pipe to guide the ball to the hole
    const pipeWidth = 60;
    const pipeHeight = 70;
    const pipeY = 770 - pipeHeight / 2;

    const pipeLeft = Bodies.rectangle(400 - pipeWidth / 2, pipeY, 10, pipeHeight, {
      isStatic: true,
      render: { fillStyle: "black" },
    });

    const pipeRight = Bodies.rectangle(400 + pipeWidth / 2, pipeY, 10, pipeHeight, {
      isStatic: true,
      render: { fillStyle: "black" },
    });

    Composite.add(world, [pipeLeft, pipeRight]);

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
        const angle = Math.atan2(ball.position.y - 400, ball.position.x - 400);
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
      const hole = Bodies.rectangle(400, 770, 40, 40, {
        isStatic: true,
        isSensor: true,
        label: "hole",
        render: { fillStyle: "black" },
      });

      rotationForceInterval = setInterval(applyRotationalForce, 100);

      let multiflier = parts.length / 360;
      let minGakdo = 83;
      let maxGakdo = 97;
      let range = [minGakdo * multiflier, maxGakdo * multiflier];

      setTimeout(() => {
      for (let i = 0; i < parts.length; i++) {
        if (i >= range[0] && i <= range[1]) {
          // Remove the parts that are in the range of the hole
          Composite.remove(world, parts[i]);
        }
      }}, 3000);

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

      if (drawButton) {
        drawButton.removeEventListener("click", draw);
      }
    };
  }, [candidates, colors, onDraw]);

  return (
    <div className="roulette-container">
      <div ref={scene} className="roulette-scene"></div>
      <div className="candidate-info">
        <h2>Candidate Information</h2>
        <ul>
          {candidates.map((candidate, index) => (
            <li key={index} style={{ color: colors[index] }}>
              {index + 1}. {candidate.name}
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
