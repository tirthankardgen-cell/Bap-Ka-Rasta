import { initializeGameAds } from "./game-ads";
import React, { useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import Landing from "./Landing";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "./style.css";
import LandscapeStage from "./LandscapeStage";
import Selection, { cities } from "./selection/Selection";

import GameLoader from "./GameLoader";
import { mobileFullscreen } from "./fullscreen";

initializeGameAds();

function App() {
  const [screen, setScreen] = useState<"home" | "city" | "vehicle" | "game">(
    "home",
  );
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(0);

  function navigate(next: typeof screen) {
    mobileFullscreen(next !== "home");
    setScreen(next);
  }

  if (screen === "game")
    return (
      <LandscapeStage>
        <GameLoader onExit={() => navigate("home")} />
      </LandscapeStage>
    );

  if (screen === "city" || screen === "vehicle")
    return (
      <LandscapeStage>
        <Selection
          key={screen}
          kind={screen}
          selected={screen === "city" ? selectedCity : selectedVehicle}
          onSelect={screen === "city" ? setSelectedCity : setSelectedVehicle}
          city={cities[selectedCity].name}
          onBack={() => navigate(screen === "city" ? "home" : "city")}
          onConfirm={() => {
            if (screen === "city" && selectedCity === 0) {
              setSelectedVehicle(0);
              navigate("vehicle");
            } else if (
              screen === "vehicle" &&
              selectedCity === 0 &&
              selectedVehicle === 0
            )
              navigate("game");
          }}
        />
      </LandscapeStage>
    );

  return <Landing onStart={() => navigate("city")} />;
}

const root = document.getElementById("root")!;
const app = <React.StrictMode><App /></React.StrictMode>;
if (root.dataset.prerendered === "true") hydrateRoot(root, app);
else createRoot(root).render(app);
