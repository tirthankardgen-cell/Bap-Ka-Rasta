import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, X, MapPin } from "lucide-react";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "./style.css";

const Game = lazy(() => import("./game/Game"));

const cities = [
  { name: "Mumbai", route: "Samundar Loop", x: 8, y: 85 },
  { name: "Delhi", route: "Dilli Boulevard", x: 514, y: 85 },
  { name: "Kolkata", route: "Hooghly Hop", x: 1027, y: 85 },
  { name: "Chennai", route: "Marina Cruise", x: 8, y: 539 },
  { name: "Bangalore", route: "Garden City Run", x: 514, y: 539 },
];

function App() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const city = cities[selected];
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  if (playing)
    return (
      <Suspense
        fallback={
          <div className="game-loading">
            Road taiyaar ho raha hai…
            <small>Getting your Mumbai auto ready</small>
          </div>
        }
      >
        <Game onExit={() => setPlaying(false)} />
      </Suspense>
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
          <button className="primary" onClick={() => setOpen(true)}>
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
      <dialog
        ref={dialog}
        aria-labelledby="dialog-title"
        onCancel={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(false);
        }}
      >
        <button
          className="close-dialog"
          aria-label="Close dialog"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="eyebrow">YOUR NEXT ADVENTURE</div>
        <h2 id="dialog-title">
          Sawaari se pehle,
          <br />
          <span>sheher chun.</span>
        </h2>
        <div className="city-tabs" role="group" aria-label="Choose a city">
          {cities.map((item, i) => (
            <button
              key={item.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="city-preview">
          <svg
            className="city-art"
            viewBox={`${city.x} ${city.y} 498 447`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${city.name} concept art`}
          >
            <image href="/images/world-board.webp" width="1536" height="1024" />
          </svg>
        </div>
        <div className="city-caption">
          <h3>{city.name}</h3>
          <span>{city.route}</span>
        </div>
        {selected === 0 ? (
          <>
            <span className="availability">AVAILABLE NOW · AUTO RICKSHAW</span>
            <button
              className="primary game-launch"
              onClick={() => {
                setOpen(false);
                setPlaying(true);
              }}
            >
              Drive Mumbai <ArrowUpRight size={20} />
            </button>
            <p className="coming-soon">
              A seaside circuit, a khaki-clad driver, and your own
              black-and-yellow auto. Keyboard and touch controls.
            </p>
          </>
        ) : (
          <p className="coming-soon">
            {city.name} is coming soon. Select Mumbai to drive the auto rickshaw
            now.
          </p>
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
