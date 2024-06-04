import React, { useEffect, useRef } from "react";
import Matter from "matter-js";
import "./Roulette.css";
import { getGaussianRandomValue } from "../utils/MathUtil";

const Roulette = ({ candidates, onDraw }) => {
  const scene = useRef();
  const engineRef = useRef(null);
  const partsRef = useRef();

  const WALL_RESTITUTION = 0.2;

  const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = ((i * 360) / numColors) % 360;
      const saturation = 70 + Math.random() * 30;
      const lightness = 50 + Math.random() * 20;
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
    engine.constraintIterations = 3000;
    engine.positionIterations = 9000;
    engine.gravity.y = 1;

    engineRef.current = engine;
    const world = engine.world;

    let rotationForceInterval = null;
    const upForceIntervalCount = getGaussianRandomValue();
    let upForceIntervalCurrentCount = 0;

    const render = Render.create({
      element: scene.current,
      engine: engine,
      options: {
        width: 800,
        height: 900,
        wireframes: false,
        background: "#fafafa",
      },
    });

    let parts = [];
    partsRef.current = parts;
    const radius = 300;

    const minGakdo = 80;
    const maxGakdo = 100;

    for (let i = 0; i < 360; i += 0.5) {
      const x = 400 + Math.cos((i * Math.PI) / 180) * radius;
      const y = 350 + Math.sin((i * Math.PI) / 180) * radius;

      const part = Bodies.rectangle(x, y, 10, 10, {
        isStatic: true,
        angle: (i * Math.PI) / 180,
        restitution: WALL_RESTITUTION,
        render: {
          fillStyle: i > minGakdo && i <= maxGakdo ? "#D3D3D3" : "#000",
        },
      });
      parts.push(part);
    }

    const multiflier = parts.length / 360;
    const removeRange = [minGakdo * multiflier, maxGakdo * multiflier];

    Composite.add(world, [...parts]);

    const candidatesWithColors = candidates.map((candidate, index) => ({
      ...candidate,
      color: colors[index],
      number: index + 1,
    }));

    const pipeWidth = 110;
    const pipeHeight = 250;
    const pipeY = 900 - pipeHeight / 2;

    const pipeLeft = Bodies.rectangle(
      400 - pipeWidth / 2,
      pipeY,
      10,
      pipeHeight,
      {
        restitution: 0,
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

    let ballInitialY = 400;
    const balls = candidatesWithColors.map((candidate) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100;
      const x = 400 + radius * Math.cos(angle);
      const y = ballInitialY + radius * Math.sin(angle);
      ballInitialY -= 5;
      const ballRadius = 35;
      return Bodies.circle(x, y, ballRadius, {
        label: candidate.name,
        restitution: 0,
        friction: 0,
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
                ballRadius * 0.35
              }" fill="white" text-anchor="middle" font-family="Arial">${
                candidate.name
              }</text></svg>`
            )}`,
          },
        },
      });
    });

    Composite.add(world, balls);

    const runner = Runner.create({
      isFixed: true,      // 고정된 시간 간격 사용
      delta: 1000 / 120,  // 120Hz로 설정 (1000ms / 120 = 8.33ms)
      fps: 60,           // 목표 프레임 속도
      deltaMax: 1000 / 120 // 최대 delta 시간 (60Hz에 해당)
  });
    Runner.run(runner, engine);
    Render.run(render);

    const hole = Bodies.rectangle(400, 890, 100, 20, {
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
          let winner = candidatesWithColors.find(
            (candidate) => candidate.name === winningBall.label
          );
          onDraw(winner);
        }
      });
    });

    Events.on(engine, 'beforeUpdate', (event) => {
      let isBallNearbyHole = false;

      balls.forEach((ball) => {
        if (ball.position.y > pipeY - 100) {
          isBallNearbyHole = true;
        }
      });

      if (isBallNearbyHole) {
        if (engine.timing.timeScale === 1.0) {
          engine.timing.timeScale = 0.2;

          // 카메라 줌 인
          Render.lookAt(render, {
            min: { x: 200, y: 400 },
            max: { x: 600, y: 900 }
          });
        }
      } else {
        if (engine.timing.timeScale !== 1.0) {
          engine.timing.timeScale = 1.0;
          
          // 카메라 줌 아웃
          Render.lookAt(render, {
            min: { x: 0, y: 0 },
            max: { x: 800, y: 900 }
          });
        }
      }
    });

    let continuouslyReduceForceMultiplier = 1;
    const reduceForceValue = 0.0001;
    const applyRotationalForce = () => {
      balls.forEach((ball) => {
        const angle = Math.atan2(ball.position.y - 400, ball.position.x - 400);
        const forceMagnitude = 0.02 * ball.mass;
        const randomMultiplier = Math.random();
        if (ball.position.y < pipeY) {
          Body.applyForce(ball, ball.position, {
            x:
              Math.cos(angle + Math.PI / 2) * forceMagnitude * randomMultiplier * continuouslyReduceForceMultiplier,
            y:
              Math.sin(angle + Math.PI / 2) * forceMagnitude * randomMultiplier * continuouslyReduceForceMultiplier,
          });
        }
      });
      continuouslyReduceForceMultiplier -= reduceForceValue;
    };

    const dynamicAutoUpInterval = () => {
      upForceIntervalCurrentCount++;
      up(0.5);
    
      if (upForceIntervalCurrentCount <= upForceIntervalCount) {
        let interval = 3000 + Math.floor(Math.random() * 3001);
        setTimeout(dynamicAutoUpInterval, interval);
      } else {
        console.log('Interval cleared');
      }
    }

    let isDrawing = false;
    const draw = () => {
      if (isDrawing) {
        return;
      }else{
        isDrawing = true;
      }

      rotationForceInterval = setInterval(applyRotationalForce, 10);
      dynamicAutoUpInterval();

      up(0.2);

      setTimeout(() => {
        clearShield();
      }, 4000+Math.floor(Math.random()*7000));
    };

    let hasShield = true;
    const clearShield = () => {
      debugger; 
      if (!hasShield||!isDrawing) {
        return;
      }
      else{
        hasShield = false;
      }

      for (let i = 0; i < parts.length; i++) {
        if (i > removeRange[0] && i <= removeRange[1]) {
          Composite.remove(world, parts[i]);
        }
      }

      hasShield = false;
    }

    const reset = () => {
      hasShield = true;
      isDrawing = false;
      onDraw(null);
    };

    const up = (force) => {
      balls.forEach((ball) => {
        Body.applyForce(ball, ball.position, { x: 0, y: -1*force });
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

    const forceopenButton = document.getElementById("forceopen-button");
    if (forceopenButton) {
      forceopenButton.addEventListener("click", () => {
        clearShield();
      });
    }

    const upButton = document.getElementById("up-button");
    if (upButton) {
      upButton.addEventListener("click", () => up(0.3));
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
        <div className="roulette-buttons">
          <button id="draw-button" className="draw-button">
            Draw
          </button>
          <button id="forceopen-button" className="forceopen-button">
            Open
          </button>
          <button id="up-button" className="up-button" style={{display: "none"}}>
            Up!
          </button>
          
        </div>
        <h2>후보</h2>
        <ul>
          {candidates.map((candidate, index) => (
            <li
              key={index}
              style={{
                backgroundColor: colors[index],
                color: "white",
                fontWeight: "bold",
                borderRadius: "8px",
                padding: "10px",
                margin: "5px 0",
              }}
            >
              {index + 1}. {candidate.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Roulette;
