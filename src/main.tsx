import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Play,
  X,
  Menu,
  Keyboard,
  Smartphone,
  Flag,
  Check,
  MoveRight,
} from "lucide-react";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "./style.css";

const cities = [
  {
    name: "Mumbai",
    route: "SAMUNDAR LOOP",
    line: "Sea breeze. Street beats.",
    tag: "THE FIRST STOP",
    image: "mumbai",
  },
  {
    name: "Delhi",
    route: "DILLI BOULEVARD",
    line: "Big roads. Bigger attitude.",
    tag: "DIL SE DILLI",
    image: "delhi",
  },
  {
    name: "Kolkata",
    route: "HOOGHLY HOP",
    line: "Old soul. New adventures.",
    tag: "CITY OF JOY",
    image: "kolkata",
  },
  {
    name: "Chennai",
    route: "MARINA CRUISE",
    line: "Coastal roads. Filter coffee.",
    tag: "COAST MODE ON",
    image: "chennai",
  },
  {
    name: "Bangalore",
    route: "GARDEN CITY RUN",
    line: "A little green. A little chaos.",
    tag: "TAKE THE SCENIC ROUTE",
    image: "bangalore",
  },
];
function App() {
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState(0);
  const [modal, setModal] = useState<"cities" | "controls" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);
  const choose = (index = 0) => {
    setSelected(index);
    setModal("cities");
    setMenu(false);
  };
  return (
    <>
      <header className="header">
        <a className="brand" href="#" aria-label="Bap ka Rasta home">
          <span className="brand-mark">
            B<span>R</span>
          </span>
          <span>
            BAP KA
            <br />
            RASTA<span className="brand-dot">.</span>
          </span>
        </a>
        <nav
          className={menu ? "navigation open" : "navigation"}
          aria-label="Main navigation"
        >
          <a href="#cities" onClick={() => setMenu(false)}>
            The cities
          </a>
          <a href="#the-vibe" onClick={() => setMenu(false)}>
            The vibe
          </a>
          <button
            onClick={() => {
              setModal("controls");
              setMenu(false);
            }}
          >
            How to play <ArrowUpRight size={14} />
          </button>
        </nav>
        <button className="header-cta" onClick={() => choose()}>
          LET’S ROLL <ArrowUpRight size={16} />
        </button>
        <button
          className="menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-label="Toggle navigation"
          aria-expanded={menu}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-art"
            src="/images/landing-hero.webp"
            alt="A blocky auto driver and black-and-yellow rickshaw on a sunlit Mumbai seafront"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> MADE OF INDIAN STREETS & GOOD VIBES
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
              <br />A whole lot of <em>“bhai, side de!”</em>
            </p>
            <button className="primary" onClick={() => choose()}>
              Mera Bap Ka Rasta{" "}
              <span>
                <ArrowUpRight size={24} />
              </span>
            </button>
            <div className="hero-note">
              <span className="tiny-dot" /> BROWSER GAME IN THE MAKING{" "}
              <span className="note-divider">/</span> NO LOGIN. JUST GOOD TIMES.
            </div>
          </div>
          <div className="scene-label">
            <MapPin size={17} />
            <div>
              POSTCARD FROM MUMBAI<span>MARINE DRIVE · GOLDEN HOUR</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>INDIAN ROADS. MAIN CHARACTER ENERGY.</span>
            <a href="#cities">
              TAKE A LOOK AROUND <span>↓</span>
            </a>
          </div>
        </section>
        <div className="ticker" aria-label="Game highlights">
          <span>5 ICONIC CITIES</span>
          <i>✳</i>
          <span>5 LEGENDARY RIDES</span>
          <i>✳</i>
          <span>ZERO BORING ROADS</span>
          <i>✳</i>
          <span>100% DESI ENERGY</span>
          <i>✳</i>
          <span>HORN OK PLEASE</span>
          <i>✳</i>
        </div>
        <section className="cities section" id="cities">
          <div className="section-heading">
            <div>
              <div className="kicker">01 / PICK YOUR PINCODE</div>
              <h2>
                Same country.
                <br />
                <span>Five different vibes.</span>
              </h2>
            </div>
            <p>
              From seaside sunsets to chai-stop detours.
              <br />
              Every city has a story. Make it your drive.
            </p>
          </div>
          <div className="city-grid">
            {cities.map((city, i) => (
              <button
                className="city-card"
                key={city.name}
                onClick={() => choose(i)}
                aria-label={`Explore ${city.name}`}
              >
                <div className="city-image">
                  <img
                    src="/images/world-board.webp"
                    style={{
                      left: `${-1.6 - (i % 3) * 102.2}%`,
                      top: i < 3 ? "-19.2%" : "-120.6%",
                    }}
                    alt={`${city.name} driving concept with its signature landmarks`}
                    loading="lazy"
                  />
                  <span className="city-number">0{i + 1}</span>
                  <span className="city-tag">{city.tag}</span>
                </div>
                <div className="city-details">
                  <span className="route">{city.route}</span>
                  <div className="city-name">
                    <h3>{city.name}</h3>
                    <ArrowUpRight size={22} />
                  </div>
                  <p>{city.line}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="concept-note">
            <span /> A sneak peek at the roads ahead. City scenes are concept
            art.
          </p>
        </section>
        <section className="vibe section" id="the-vibe">
          <div className="vibe-art">
            <img
              src="/images/world-board.webp"
              alt="Original blocky characters and the five planned vehicles: auto, two SUVs, scooty, and sport bike"
              loading="lazy"
            />
            <span className="sticker">
              FULL DESI.
              <br />
              FULL SEND.
            </span>
          </div>
          <div className="vibe-copy">
            <div className="kicker">02 / BUILT FOR THE JOYRIDE</div>
            <h2>
              No missions.
              <br />
              No rush.
              <br />
              <span>Bas chalao.</span>
            </h2>
            <p>
              Take the auto out for a spin. Cruise in an SUV. Or find your own
              rhythm on two wheels. This is your little escape into the
              beautiful chaos of Indian streets.
            </p>
            <div className="vibe-features">
              <span>
                <Check size={16} /> All rides. No unlocks.
              </span>
              <span>
                <Check size={16} /> Desktop & mobile
              </span>
              <span>
                <Check size={16} /> Your pace. Your route.
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => setModal("controls")}
            >
              Get to know the controls <ArrowRight size={18} />
            </button>
          </div>
        </section>
        <section className="closing">
          <span className="kicker">THE ROAD IS CALLING.</span>
          <h2>Chalein?</h2>
          <button className="dark-button" onClick={() => choose()}>
            Find your city <ArrowUpRight size={21} />
          </button>
          <p>First stop: Mumbai. The playable drive is coming next.</p>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-brand">
          BAP KA RASTA.
        </a>
        <p>Made for the joy of taking the long way home.</p>
        <span>INDIA, WITH A LITTLE EXTRA CHAOS ↗</span>
      </footer>
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
        aria-labelledby="dialog-title"
      >
        <button
          className="close-dialog"
          aria-label="Close dialog"
          onClick={() => setModal(null)}
        >
          <X />
        </button>
        {modal === "cities" ? (
          <>
            <div className="kicker">YOUR NEXT ADVENTURE</div>
            <h2 id="dialog-title">
              Sawaari se pehle,
              <br />
              <span>sheher chun.</span>
            </h2>
            <div className="city-tabs" role="group" aria-label="Choose a city">
              {cities.map((city, i) => (
                <button
                  key={city.name}
                  aria-pressed={selected === i}
                  className={selected === i ? "active" : ""}
                  onClick={() => setSelected(i)}
                >
                  {city.name}
                </button>
              ))}
            </div>
            <div className="dialog-image">
              <img
                className="dialog-city"
                src="/images/world-board.webp"
                style={{
                  left: `${-1.6 - (selected % 3) * 102.2}%`,
                  top: selected < 3 ? "-19.2%" : "-120.6%",
                }}
                alt={`${cities[selected].name} concept art`}
              />
            </div>
            <div className="dialog-route">
              <div>
                <span className="route">{cities[selected].route}</span>
                <h3>{cities[selected].name}</h3>
              </div>
              <MapPin />
            </div>
            <div className="coming-soon">
              <Flag size={20} />
              <p>
                <strong>Your road is taking shape.</strong>The landing page is
                here. Playable driving starts with Mumbai and the auto rickshaw
                in the next build.
              </p>
            </div>
            <button className="dark-button" onClick={() => setModal(null)}>
              Keep exploring <MoveRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="kicker">LESS LEARNING. MORE DRIVING.</div>
            <h2 id="dialog-title">Easy does it.</h2>
            <p className="controls-intro">
              The planned controls for your first joyride.
            </p>
            <div className="control-group">
              <h3>
                <Keyboard /> On your keyboard
              </h3>
              <div>
                <span>Accelerate / brake</span>
                <span>
                  <kbd>W</kbd> <kbd>S</kbd> or <kbd>↑</kbd> <kbd>↓</kbd>
                </span>
              </div>
              <div>
                <span>Steer</span>
                <span>
                  <kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd>
                </span>
              </div>
              <div>
                <span>Horn / reset / pause</span>
                <span>
                  <kbd>H</kbd> <kbd>R</kbd> <kbd>Esc</kbd>
                </span>
              </div>
            </div>
            <div className="control-group">
              <h3>
                <Smartphone /> On your phone
              </h3>
              <p>
                Thumb-friendly steering arrows on the left. Accelerator and
                brake on the right. Horn, reset, and pause within easy reach.
              </p>
            </div>
            <div className="coming-soon">
              <Play size={20} />
              <p>
                <strong>Driving is coming next.</strong>For now, explore the
                cities and meet your future rides.
              </p>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
