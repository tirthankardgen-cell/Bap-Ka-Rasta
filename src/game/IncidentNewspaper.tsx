import { useEffect, useRef } from "react";
import type { IncidentReport } from "./pedestrian-rules";
import "./incident-newspaper.css";

export default function IncidentNewspaper({
  incident,
  onExit,
}: {
  incident: IncidentReport;
  onExit: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
  }, []);
  return (
    <div className="incident-overlay">
      <section
        className="incident-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-headline"
        aria-describedby="incident-summary"
      >
        <article className="incident-paper">
          <div className="paper-edition">
            <span>BR · MUMBAI EDITION</span>
            <span>GAME OVER · FICTIONAL GAME REPORT</span>
          </div>
          <header className="paper-masthead">Mumbai Ki Khabar</header>
          <div className="paper-rule">
            <span>APNA SHEHER · AAJ KI KHABAR</span>
            <span>LOCAL REPORT · #{incident.actorId + 1}</span>
          </div>
          <h1 id="incident-headline">
            Tez raftaar ka anjaam: {incident.name} ki jaan gayi
          </h1>
          <div className="paper-columns">
            <figure>
              {incident.photo ? (
                <img
                  src={incident.photo}
                  alt={`In-game collision scene at ${incident.street}`}
                />
              ) : (
                <div className="paper-photo-fallback">
                  Incident photo unavailable
                </div>
              )}
              <figcaption>
                {incident.street}, Mumbai — isi ghatna ki in-game tasveer.
              </figcaption>
            </figure>
            <div className="paper-copy" id="incident-summary">
              <p>
                <strong>MUMBAI, {incident.street.toUpperCase()}:</strong> Auto
                rickshaw ki takkar mein {incident.name} ki maut ho gayi. Ghatna
                ke waqt auto ki raftaar lagbhag {Math.round(incident.speed)}{" "}
                km/h thi.
              </p>
              <p>
                <strong>Kaun:</strong> {incident.name}
                <br />
                <strong>Pehchaan:</strong> {incident.role}
                <br />
                <strong>Kahan:</strong> {incident.street}
                <br />
                <strong>Kaise:</strong> Tez raftaar auto se takkar.
              </p>
              <p className="paper-closing">
                Ek pal ki laaparwahi. Ek zindagi khatam. Is ride ka safar yahin
                ruk gaya.
              </p>
            </div>
          </div>
          <footer>BAP KA RASTA? NAHI, BHAU — SADAK SABKI HAI.</footer>
        </article>
        <button
          ref={button}
          className="incident-restart"
          onClick={onExit}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              button.current?.focus();
            }
          }}
        >
          Phir se shuru · Home par chalo <span aria-hidden="true">↗</span>
        </button>
      </section>
    </div>
  );
}
