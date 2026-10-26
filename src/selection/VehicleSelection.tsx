import { useEffect, useRef, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LockKeyhole,
} from "lucide-react";
import "./vehicle-selection.css";

type Vehicle = {
  name: string;
  subtitle: string;
  description: string;
  detail: string;
  x: number;
  y: number;
};
type Props = {
  vehicles: Vehicle[];
  selected: number;
  onSelect: (index: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  city: string;
};
// Clockwise around the oval: auto, Thar, Fortuner, KTM, Scooty.
const order = [0, 1, 2, 4, 3];
export default function VehicleSelection({
  vehicles,
  selected,
  onSelect,
  onBack,
  onConfirm,
  city,
}: Props) {
  const title = useRef<HTMLHeadingElement>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    id: number;
    vehicle: number | null;
  } | null>(null);
  const current = order.indexOf(selected),
    vehicle = vehicles[selected];
  const move = (direction: number) =>
    onSelect(order[(current + direction + order.length) % order.length]);
  useEffect(() => {
    title.current?.focus();
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        onSelect(
          order[
            (current + (e.key === "ArrowRight" ? 1 : -1) + order.length) %
              order.length
          ],
        );
      } else if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, onSelect, onBack]);
  return (
    <main className="ride-selection" aria-labelledby="selection-title">
      <header className="ride-header">
        <button className="ride-back" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to cities</span>
        </button>
        <span className="ride-brand">
          BAP KA RASTA<span>.</span>
        </span>
        <div className="ride-steps" aria-label="Step 2 of 2">
          <span>01 CITY</span>
          <i />
          <strong>02 RIDE</strong>
        </div>
      </header>
      <div className="ride-heading">
        <span className="ride-kicker">YOUR CITY. YOUR SAWAARI.</span>
        <h1 id="selection-title" ref={title} tabIndex={-1}>
          Sawaari chun<span>.</span>
        </h1>
        <span className="ride-city">
          <MapPin size={18} />
          {city}
        </span>
      </div>
      <section
        className="ride-gallery"
        aria-roledescription="carousel"
        aria-label="Vehicle gallery"
      >
        <div
          className="ride-orbit"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const button = (e.target as Element).closest<HTMLElement>(
              "[data-vehicle]",
            );
            gesture.current = {
              x: e.clientX,
              y: e.clientY,
              id: e.pointerId,
              vehicle: button ? Number(button.dataset.vehicle) : null,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            const start = gesture.current;
            gesture.current = null;
            if (!start || start.id !== e.pointerId) return;
            const dx = e.clientX - start.x,
              dy = e.clientY - start.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25)
              move(dx < 0 ? 1 : -1);
            else if (
              Math.abs(dx) < 10 &&
              Math.abs(dy) < 10 &&
              start.vehicle !== null
            )
              onSelect(start.vehicle);
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onLostPointerCapture={() => {
            gesture.current = null;
          }}
        >
          <svg
            className="ride-orbit-line"
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 50 145 A 550 130 0 0 0 1150 145" />
            <path d="M 420 268 Q 600 292 780 268" />
          </svg>
          {order.map((id, index) => {
            const offset = ((index - current + 7) % 5) - 2;
            const item = vehicles[id];
            return (
              <button
                key={item.name}
                type="button"
                data-vehicle={id}
                data-offset={offset}
                className={`ride-vehicle ${offset === 0 ? "is-selected" : ""}`}
                style={{ "--slot": offset } as CSSProperties}
                aria-label={`Preview ${item.name}`}
                aria-pressed={selected === id}
                onClick={(e) => {
                  if (e.detail === 0) onSelect(id);
                }}
              >
                <svg
                  className="ride-art"
                  viewBox={`${item.x + 12} ${item.y + 45} 488 440`}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`${item.name} vehicle concept art`}
                >
                  <defs>
                    <clipPath id={`ride-crop-${id}`}>
                      <rect
                        x={item.x + 12}
                        y={item.y + 45}
                        width="488"
                        height="440"
                      />
                    </clipPath>
                  </defs>
                  <image
                    href="/images/vehicle-gallery.webp"
                    width="1536"
                    height="1024"
                    clipPath={`url(#ride-crop-${id})`}
                  />
                </svg>
                <span className="ride-preview-label" aria-hidden={offset === 0}>
                  <strong>{item.name}</strong>
                  <small>
                    {id === 0 ? (
                      <>
                        <i /> AVAILABLE NOW
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={10} /> COMING SOON
                      </>
                    )}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="ride-arrow previous"
          aria-label="Previous vehicle"
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <button
          className="ride-arrow next"
          aria-label="Next vehicle"
          onClick={() => move(1)}
        >
          <ChevronRight />
        </button>
      </section>
      <section className="ride-details" aria-label="Selected vehicle">
        <span
          className={`ride-availability ${selected === 0 ? "available" : ""}`}
        >
          {selected === 0 ? (
            <>
              <i />
              AVAILABLE NOW
            </>
          ) : (
            <>
              <LockKeyhole size={12} />
              COMING SOON
            </>
          )}
        </span>
        <h2>{vehicle.name}</h2>
        <span className="ride-subtitle">{vehicle.subtitle}</span>
        <p>
          {selected === 0
            ? "Teen pahiye, full Mumbai swag. Meter down, tension down!"
            : vehicle.description}
        </p>
        <span className="ride-specification">{vehicle.detail}</span>
        <button
          className="ride-confirm"
          onClick={onConfirm}
          disabled={selected !== 0}
        >
          {selected === 0 ? (
            <>
              Drive Mumbai <ArrowRight size={23} />
            </>
          ) : (
            <>
              Coming soon <LockKeyhole size={18} />
            </>
          )}
        </button>
      </section>
      <footer className="ride-footer">
        <span className="ride-count">
          {String(current + 1).padStart(2, "0")} / 05
        </span>
        <div className="ride-dots" role="group" aria-label="Choose a vehicle">
          {order.map((id) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-label={vehicles[id].name}
              aria-pressed={selected === id}
            >
              <span />
            </button>
          ))}
        </div>
        <span className="ride-help">
          DRAG TO EXPLORE <kbd>←</kbd>
          <kbd>→</kbd>
        </span>
      </footer>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {vehicle.name}. {selected === 0 ? "Available now." : "Coming soon."}{" "}
        {current + 1} of 5.
      </span>
    </main>
  );
}
