import React, { useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, MapPin } from "lucide-react";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "./style.css";
import Selection, { cities } from "./selection/Selection";

const Game = lazy(() => import("./game/Game"));

function App() {
  const [screen, setScreen] = useState<"home" | "city" | "vehicle" | "game">(
    "home",
  );
  const [selectedCity, setSelectedCity] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(0);

  if (screen === "game")
    return (
      <Suspense
        fallback={
          <div className="game-loading">
            Road taiyaar ho raha hai…
            <small>Getting your Mumbai auto ready</small>
          </div>
        }
      >
        <Game onExit={() => setScreen("home")} />
      </Suspense>
    );

  if (screen === "city" || screen === "vehicle")
    return (
      <Selection
        key={screen}
        kind={screen}
        selected={screen === "city" ? selectedCity : selectedVehicle}
        onSelect={screen === "city" ? setSelectedCity : setSelectedVehicle}
        city={cities[selectedCity].name}
        onBack={() => setScreen(screen === "city" ? "home" : "city")}
        onConfirm={() => {
          if (screen === "city" && selectedCity === 0) {
            setSelectedVehicle(0);
            setScreen("vehicle");
          } else if (
            screen === "vehicle" &&
            selectedCity === 0 &&
            selectedVehicle === 0
          )
            setScreen("game");
        }}
      />
    );

  return (
    <>
      <main className="hero" aria-labelledby="hero-title">
        <img
          className="hero-art"
          src="/images/landing-hero.webp"
          alt="A blocky auto driver and black-and-yellow rickshaw on Mumbai's golden-hour seafront"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <a className="brand" href="/" aria-label="Bap ka Rasta home">
          <span className="brand-mark">BR</span>
          <span>
            BAP KA
            <br />
            RASTA.
          </span>
        </a>
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> INDIAN STREETS. ENDLESS GOOD VIBES.
          </div>
          <h1 id="hero-title">
            APNA SHEHER.
            <br />
            APNI SAWAARI.
            <br />
            <span>APNA RASTA.</span>
          </h1>
          <p>
            Five iconic cities. Five legendary rides.
            <br />A whole lot of <strong>“bhai, side de!”</strong>
          </p>
          <button className="primary" onClick={() => setScreen("city")}>
            Mera Bap Ka Rasta{" "}
            <span>
              <ArrowUpRight size={24} />
            </span>
          </button>
          <span className="hero-note">NO LOGIN. JUST GOOD TIMES.</span>
        </div>
        <div className="scene-label">
          <MapPin size={16} />
          <span>
            MUMBAI <small>MARINE DRIVE · GOLDEN HOUR</small>
          </span>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
