// Development-only integration fixture: uses the real world, model, actors and engine.
// It is not a Vite build entry and supplies no production debug/teleport controls.
import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  createEngine,
  type Engine,
  type Stats,
} from "../../../src/game/engine";
import {
  loadAutoRickshaw,
  disposeAutoModel,
} from "../../../src/game/auto-model";
import { newDrive } from "../../../src/game/simulation";
import { createActors, actorPose } from "../../../src/game/characters";
import IncidentNewspaper from "../../../src/game/IncidentNewspaper";
import LandscapeStage from "../../../src/LandscapeStage";
import "../../../src/game/game.css";
function Fixture() {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<Engine | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let active = true;
    void loadAutoRickshaw().then((model) => {
      if (!active) {
        disposeAutoModel(model);
        return;
      }
      const a = createActors().find((a) => a.cross >= 0)!;
      const time = 35 - (a.cross % 4) * 4;
      const p = actorPose(a, time);
      const drive = Object.assign(newDrive(), {
        x: p.x,
        z: p.z + 1.8,
        yaw: Math.PI,
        time,
        speed: location.search.includes("slow") ? 2 : 10,
      });
      engine.current = createEngine(
        host.current!,
        setStats,
        () => {},
        console.error,
        model,
        drive,
      );
      engine.current.quality(true);
      engine.current.skipIntro();
      engine.current.setPaused(false);
    });
    return () => {
      active = false;
      engine.current?.dispose();
    };
  }, []);
  return (
    <LandscapeStage>
      <main
        className="game"
        data-incident={stats?.incident?.phase ?? "none"}
        data-position={`${stats?.x},${stats?.z}`}
        data-speed={stats?.speed}
      >
        <div className="game-canvas" ref={host} />
        {stats?.subtitle && (
          <div className="character-subtitle">
            {stats.speaker}: {stats.subtitle}
          </div>
        )}
        <button id="reset" onClick={() => engine.current?.reset()}>
          Reset fixture
        </button>
        {stats?.incident?.phase === "report" && (
          <IncidentNewspaper
            incident={stats.incident}
            onExit={() => location.assign("/")}
          />
        )}
      </main>
    </LandscapeStage>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
