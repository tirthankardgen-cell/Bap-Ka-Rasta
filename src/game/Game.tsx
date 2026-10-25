import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Home,
  Megaphone,
  ArrowUp,
  ArrowDown,
  Gauge,
} from "lucide-react";
import { createEngine, type Engine, type Stats } from "./engine";
import type { Input } from "./simulation";
import "./game.css";
const initial: Stats = {
  audioStatus: "idle",
  speed: 0,
  distance: 0,
  topSpeed: 0,
  street: "Marine Drive",
  signal: "",
  time: 0,
  x: -266,
  z: 325,
  yaw: Math.PI,
  impact: false,
  fps: 0,
};
export default function Game({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<Engine | null>(null);
  const [stats, setStats] = useState(initial),
    [status, setStatus] = useState<"ready" | "driving" | "paused">("ready");
  const [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [session, setSession] = useState(0),
    [sound, setSound] = useState(true),
    [low, setLow] = useState(false),
    [hornActive, setHornActive] = useState(false);
  const hornTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setError("");
    setSound(true);
    setLow(false);
    setStats(initial);
    try {
      engine.current = createEngine(
        host.current!,
        (s) => {
          if (active) setStats(s);
        },
        () => {
          if (active) setStatus("paused");
        },
        (message) => {
          if (active) setError(message);
        },
      );
      setLoaded(true);
    } catch (e) {
      setError(
        "Scene load nahi hua, bhidu. WebGL 2 aur hardware acceleration wala browser try karo.",
      );
      console.error(e);
    }
    return () => {
      active = false;
      engine.current?.dispose();
      engine.current = null;
      if (hornTimer.current) clearTimeout(hornTimer.current);
    };
  }, [session]);
  function start() {
    setStatus("driving");
    engine.current?.setPaused(false);
    setSound(engine.current?.sound(sound) ?? false);
    (document.activeElement as HTMLElement)?.blur();
  }
  function pause() {
    engine.current?.setPaused(true);
    setStatus("paused");
  }
  function exit() {
    onExit();
  }
  function restart() {
    setStatus("ready");
    setSession((v) => v + 1);
  }
  function toggleSound() {
    const enabled = engine.current?.sound(!sound) ?? false;
    setSound(enabled);
  }
  function horn() {
    engine.current?.horn();
    setHornActive(true);
    if (hornTimer.current) clearTimeout(hornTimer.current);
    hornTimer.current = setTimeout(() => setHornActive(false), 2500);
  }
  function pedal(action: keyof Input, label: string, icon: React.ReactNode) {
    return (
      <button
        className={`drive-control ${action}`}
        aria-label={label}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          engine.current?.pointer(e.pointerId, action);
        }}
        onPointerUp={(e) => {
          engine.current?.pointer(e.pointerId, null);
        }}
        onPointerCancel={(e) => engine.current?.pointer(e.pointerId, null)}
        onLostPointerCapture={(e) => engine.current?.pointer(e.pointerId, null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {icon}
        <span>
          {
            {
              left: "Baayein",
              right: "Daayein",
              throttle: "Chalao",
              brake: "Ruko / reverse",
              handbrake: "Brake",
            }[action]
          }
        </span>
      </button>
    );
  }
  return (
    <main
      className="game"
      aria-label="Mumbai auto rickshaw game"
      data-status={status}
      data-distance={stats.distance.toFixed(2)}
      data-speed={stats.speed.toFixed(2)}
      data-position={`${stats.x.toFixed(2)},${stats.z.toFixed(2)}`}
    >
      <div className="game-canvas" ref={host} />
      <header className="game-top">
        <div className="location-pill">
          <span className="live-dot" /> MUMBAI{" "}
          <small>{stats.street.toUpperCase()}</small>
        </div>
        <div className="game-actions">
          <button
            onClick={toggleSound}
            aria-label={sound ? "Mute sound" : "Enable sound"}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={pause}
            aria-label="Pause drive"
            disabled={status !== "driving"}
          >
            <Pause size={21} />
          </button>
        </div>
      </header>
      <div className="speedometer">
        <strong>{Math.round(Math.abs(stats.speed))}</strong>
        <span>KM/H {stats.speed < -0.1 ? "· R" : ""}</span>
      </div>
      {status === "driving" && (
        <>
          <div className="driving-message" aria-live="polite">
            {sound && stats.audioStatus === "loading"
              ? "Mumbai ka soundcheck chal raha hai…"
              : sound && stats.audioStatus === "unavailable"
                ? "Sound ne nakhra kiya. Off-on karke dekho."
                : stats.impact
                  ? "Arre bhidu, thoda aaram se!"
                  : hornActive
                    ? "Horn OK please, bhidu!"
                    : stats.signal === "red"
                      ? "Laal batti, bhidu! Crossing se pehle ruk."
                      : stats.signal === "amber"
                        ? "Peeli batti! Hero, zara slow ho ja."
                        : stats.signal === "pedestrian"
                          ? "Public cross kar rahi hai, pehle unko jaane de."
                          : ""}
          </div>
          <div className="keyboard-hint">
            WASD / ARROWS <i>·</i> H HORN <i>·</i> R RESET <i>·</i> ESC PAUSE
          </div>
          <div className="drive-buttons">
            <div className="steering">
              {pedal("left", "Steer left", <ArrowLeft />)}
              {pedal("right", "Steer right", <ArrowRight />)}
            </div>
            <div className="utility">
              <button onClick={horn} aria-label="Horn">
                <Megaphone />
              </button>
              <button
                onClick={() => engine.current?.reset()}
                aria-label="Reset vehicle"
              >
                <RotateCcw />
              </button>
            </div>
            <div className="pedals">
              {pedal("brake", "Brake / reverse", <ArrowDown />)}
              {pedal("throttle", "Accelerate", <ArrowUp />)}
            </div>
          </div>
        </>
      )}
      {(status !== "driving" || error) && (
        <div className="game-overlay">
          <section className="drive-panel" aria-labelledby="drive-panel-title">
            {error ? (
              <>
                <span className="panel-kicker">
                  PICTURE ABHI BAAKI HAI, BHIDU
                </span>
                <h1 id="drive-panel-title">Arre, chhota sa panga!</h1>
                <p>{error}</p>
                <button
                  className="game-primary"
                  onClick={restart}
                  aria-label="Retry drive"
                >
                  Phir try karein <RotateCcw size={18} />
                </button>
                <button
                  className="game-secondary"
                  onClick={exit}
                  aria-label="Back to home"
                >
                  Ghar chalo
                </button>
              </>
            ) : status === "ready" ? (
              <>
                <span className="panel-kicker">
                  MUMBAI · APNA SHEHER, APNI RIDE
                </span>
                <h1 id="drive-panel-title">
                  Meter down.
                  <br />
                  <em>Tension down.</em>
                </h1>
                <p>
                  Kaali-peeli ready hai, bhidu! Galiyon mein ghoom, signal pe
                  ruk, phir samundar ki hawa kha. Na race, na deadline — bas
                  apni ride.
                </p>
                <div className="ride-spec">
                  <span>AUTO RICKSHAW</span>
                  <span>65 KM/H</span>
                  <span>BINDASS GHUMO</span>
                </div>
                <div className="control-guide">
                  <div>
                    <strong>Keyboard</strong>
                    <span>
                      WASD / arrows se chalao · Space se brake
                      <br />H horn · R reset · Esc pause
                    </span>
                  </div>
                  <div>
                    <strong>Phone / tablet</strong>
                    <span>
                      Steering aur pedal daba ke rakho.
                      <br />
                      Reverse ke liye ruk ke brake dabaao.
                    </span>
                  </div>
                </div>
                <button
                  className="game-primary"
                  disabled={!loaded}
                  onClick={start}
                >
                  {loaded ? "Chal Chala" : "Rasta taiyaar ho raha hai…"}{" "}
                  <ArrowRight size={20} />
                </button>
                <button
                  className="game-secondary"
                  onClick={exit}
                  aria-label="Back to home"
                >
                  Ghar chalo
                </button>
              </>
            ) : (
              <>
                <span className="panel-kicker">EK CHAI BREAK?</span>
                <h1 id="drive-panel-title">
                  Zara chai
                  <br />
                  <em>ho jaaye?</em>
                </h1>
                <p>Auto side mein hai. Chai pee, phir scene banate hain.</p>
                <a href="/audio/credits.html" target="_blank" rel="noreferrer">
                  Sound ke asli kalakaar
                </a>
                <button
                  className="game-primary"
                  onClick={start}
                  aria-label="Resume drive"
                >
                  <Play size={18} /> Chal, phir niklein
                </button>
                <div className="pause-grid">
                  <button
                    aria-label="Reset vehicle"
                    onClick={() => {
                      engine.current?.reset();
                      start();
                    }}
                  >
                    <RotateCcw size={18} /> Auto seedha karo
                  </button>
                  <button onClick={toggleSound}>
                    {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}Sound{" "}
                    {sound ? "on" : "off"}
                  </button>
                  <button
                    onClick={() => {
                      setLow(!low);
                      engine.current?.quality(!low);
                    }}
                  >
                    <Gauge size={18} />
                    {low ? "Low" : "Standard"} graphics
                  </button>
                  <button onClick={exit} aria-label="End drive">
                    <Home size={18} /> Aaj ka ho gaya
                  </button>
                </div>
                <button
                  className="game-secondary"
                  onClick={exit}
                  aria-label="Back to home"
                >
                  <Home size={16} /> Ghar chalo
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
