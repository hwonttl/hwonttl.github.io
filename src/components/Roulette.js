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
      const hue = ((i * 360) / numColors) % 360;
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
    engine.constraintIterations = 1000;
    engine.positionIterations = 3000;
    engine.gravity.y = 0.35;

    engineRef.current = engine;
    const world = engine.world;

    let rotationForceInterval = null;

    const render = Render.create({
      element: scene.current,
      engine: engine,
      options: {
        width: 800,
        height: 1000,
        wireframes: false,
        background: "#fafafa",
      },
    });

    let parts = [];
    partsRef.current = parts;
    const radius = 300; // Increase the radius for a larger circle

    const minGakdo = 81;
    const maxGakdo = 99;

    for (let i = 0; i < 360; i += 0.5) {
      const x = 400 + Math.cos((i * Math.PI) / 180) * radius;
      const y = 350 + Math.sin((i * Math.PI) / 180) * radius;

      const part = Bodies.rectangle(x, y, 10, 10, {
        isStatic: true,
        angle: (i * Math.PI) / 180,
        restitution: 0.1,
        render: {
          fillStyle: i > minGakdo && i <= maxGakdo ? "#D3D3D3" : "#000",
        },
      });
      parts.push(part);
    }

    const multiflier = parts.length / 360;
    const removeRange = [minGakdo * multiflier, maxGakdo * multiflier];

    // Create ground and walls to prevent balls from escaping
    const ground = Bodies.rectangle(400, 890, 800, 20, { isStatic: true });
    const ceiling = Bodies.rectangle(400, 10, 800, 20, { isStatic: true });
    const leftWall = Bodies.rectangle(10, 400, 20, 1000, { isStatic: true });
    const rightWall = Bodies.rectangle(790, 400, 20, 1000, { isStatic: true });

    Composite.add(world, [...parts, ground, ceiling, leftWall, rightWall]);

    const candidatesWithColors = candidates.map((candidate, index) => ({
      ...candidate,
      color: colors[index],
      number: index + 1,
    }));

    const pipeWidth = 100;
    const pipeHeight = 250;
    const pipeY = 900 - pipeHeight / 2;

    const pipeLeft = Bodies.rectangle(
      400 - pipeWidth / 2,
      pipeY,
      10,
      pipeHeight,
      {
        restitution: 0.1,
        isStatic: true,
        render: { fillStyle: "black" },
      }
    );

    const pipeRight = Bodies.rectangle(
      400 + pipeWidth / 2,
      pipeY,
      10,
      pipeHeight,
      {
        restitution: 0.1,
        isStatic: true,
        render: { fillStyle: "black" },
      }
    );

    Composite.add(world, [pipeLeft, pipeRight]);

    const balls = candidatesWithColors.map((candidate) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100;
      const x = 400 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);
      const ballRadius = 40;
      return Bodies.circle(x, y, ballRadius, {
        label: candidate.name,
        restitution: 1,
        render: {
          sprite: {
            texture: `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="${
                ballRadius * 2
              }" height="${
                ballRadius * 2
              }"><circle cx="${ballRadius}" cy="${ballRadius}" r="${ballRadius}" fill="${
                candidate.color
              }"/><text x="${ballRadius}" y="${ballRadius * 1.2}" font-size="${
                ballRadius * 0.4
              }" fill="white" text-anchor="middle" font-family="Arial">${
                candidate.name
              }</text></svg>`
            )}`,
          },
        },
      });
    });

    Composite.add(world, balls);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    const hole = Bodies.rectangle(400, 870, 90, 20, {
      isStatic: true,
      isSensor: true,
      label: "hole",
      render: { fillStyle: "red" },
    });

    Composite.add(world, hole);

      Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA.label === "hole" || pair.bodyB.label === "hole") {
          const winningBall =
            pair.bodyA.label === "hole" ? pair.bodyB : pair.bodyA;
          clearInterval(rotationForceInterval);
          let winner = candidatesWithColors.find((candidate) => candidate.name === winningBall.label);
          onDraw(winner);
        }
      });
    });

    const applyRotationalForce = () => {
      balls.forEach((ball) => {
        const angle = Math.atan2(ball.position.y - 400, ball.position.x - 400);
        const forceMagnitude = 0.01 * ball.mass;
        if (ball.position.y < pipeY - 240) {
          Body.applyForce(ball, ball.position, {
            x: Math.cos(angle + Math.PI / 2) * forceMagnitude,
            y: Math.sin(angle + Math.PI / 2) * forceMagnitude,
          });
        }
      });
    };

    const draw = () => {
      rotationForceInterval = setInterval(applyRotationalForce, 150);

      up();
      setTimeout(() => {
        for (let i = 0; i < parts.length; i++) {
          if (i >= removeRange[0] && i <= removeRange[1]) {
            Composite.remove(world, parts[i]);
          }
        }
      }, 3000);
    };

    const reset = () => {
      onDraw(null);
    };

    const up = () => {
      balls.forEach((ball) => {
        Body.applyForce(ball, ball.position, { x: 0, y: -0.2 });
      });
    };

    const drawButton = document.getElementById("draw-button");
    if (drawButton) {
      drawButton.addEventListener("click", draw);
    }

    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
      resetButton.addEventListener("click", reset);
    }

    const upButton = document.getElementById("up-button");
    if (upButton) {
      upButton.addEventListener("click", up);
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
            <li
              key={index}
              style={{
                backgroundColor: colors[index],
                color: "white",
                fontWeight: "bold",
                borderRadius: "8px", // 모서리를 둥글게
                padding: "10px", // 내부 여백을 줘서 사각형을 더 명확하게
                margin: "5px 0", // 리스트 아이템 간의 간격
              }}
            >
              {index + 1}. {candidate.name}
            </li>
          ))}
        </ul>
      </div>
      <button id="draw-button" className="draw-button">
        Draw
      </button>
      <button id="up-button" className="up-button">
        Up!
      </button>
      <button id="reset-button" className="reset-button">
        Reset
      </button>
    </div>
  );
};

export default Roulette;
