import React, { useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, MapPin } from "lucide-react";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "./style.css";
import LandscapeStage from "./LandscapeStage";
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
      <LandscapeStage>
        <Suspense
          fallback={
            <div className="game-loading">
              Road taiyaar ho raha hai…
              <small>Mumbai ki kaali-peeli aa rahi hai, bhidu</small>
            </div>
          }
        >
          <Game onExit={() => setScreen("home")} />
        </Suspense>
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
      </LandscapeStage>
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
          <img
            className="brand-mark"
            src="/brand/br-mark.svg"
            alt=""
            width="42"
            height="42"
          />
          <span>
            BAP KA
            <br />
            RASTA.
          </span>
        </a>
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> DESI SADKEIN. FULL FILMY VIBES.
          </div>
          <h1 id="hero-title">
            APNA SHEHER.
            <br />
            APNI SAWAARI.
            <br />
            <span>APNA RASTA.</span>
          </h1>
          <p>
            Paanch sheher ka plan. Pehla stop, Mumbai.
            <br />
            Aur full-on <strong>“bhai, side de!”</strong>
          </p>
          <button className="primary" onClick={() => setScreen("city")}>
            Mera Bap Ka Rasta{" "}
            <span>
              <ArrowUpRight size={24} />
            </span>
          </button>
          <span className="hero-note">
            LOGIN KA CHAKKAR NAHI. BAS CHAL PAD.
          </span>
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
