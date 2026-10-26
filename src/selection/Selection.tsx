import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LockKeyhole,
} from "lucide-react";
import "./selection.css";
import VehicleSelection from "./VehicleSelection";
export const cities = [
  {
    name: "Mumbai",
    subtitle: "South Mumbai ki galiyan",
    description:
      "Samundar ki hawa, kaali-peeli ka swag. Marine Drive se Colaba tak, apna Mumbai apne andaaz mein ghoom.",
    detail: "GALI SE GALI · BINDASS GHUMO",
    x: 8,
    y: 85,
  },
  {
    name: "Delhi",
    subtitle: "Dilli Boulevard",
    description:
      "Badi sadkein, bade landmarks, full Dilli wala swag. Rajdhani ki ride ki taiyaari chal rahi hai.",
    detail: "INDIA GATE · BROAD BOULEVARDS",
    x: 514,
    y: 85,
  },
  {
    name: "Kolkata",
    subtitle: "Hooghly Hop",
    description:
      "Peeli taxi, Hooghly ki hawa aur Howrah ka nazara. Purane sheher mein nayi kahaani banegi.",
    detail: "HOWRAH BRIDGE · RIVERSIDE STREETS",
    x: 1027,
    y: 85,
  },
  {
    name: "Chennai",
    subtitle: "Marina Cruise",
    description:
      "Marina ki hawa aur filter coffee ka break. Coast pe cruise karne ka scene jaldi banega.",
    detail: "MARINA BEACH · COASTAL CRUISE",
    x: 8,
    y: 539,
  },
  {
    name: "Bangalore",
    subtitle: "Garden City Run",
    description:
      "Pedon ki chhaanv, corner ki coffee aur Garden City ka chill scene. Ride ki taiyaari on hai.",
    detail: "CUBBON PARK · GREEN AVENUES",
    x: 514,
    y: 539,
  },
];
export const vehicles = [
  {
    name: "Auto rickshaw",
    subtitle: "Galiyon ka asli hero",
    description:
      "Teen pahiye, full Mumbai swag. Khaki mein apna driver aur kaali-peeli auto — meter down, tension down!",
    detail: "65 KM/H · NIMBLE HANDLING",
    x: 0,
    y: 0,
  },
  {
    name: "Thar",
    subtitle: "Bade tyre. Full tashan.",
    description:
      "Dhaakad look, full road presence. Thar ki entry garage mein abhi baaki hai, mere dost.",
    detail: "OFF-ROAD SUV · COMING SOON",
    x: 512,
    y: 0,
  },
  {
    name: "Fortuner",
    subtitle: "Entry ho toh aisi.",
    description:
      "Badi gaadi, lambi ride ka mood. Fortuner abhi backstage hai — entry ki taiyaari chal rahi hai.",
    detail: "LARGE SUV · COMING SOON",
    x: 1024,
    y: 0,
  },
  {
    name: "Scooty",
    subtitle: "Chhoti sawaari, full azaadi.",
    description:
      "Halki-phulki ride, poora sheher apna. Apni turquoise scooty raaste mein hai.",
    detail: "CITY SCOOTER · COMING SOON",
    x: 0,
    y: 512,
  },
  {
    name: "KTM",
    subtitle: "Orange wala josh.",
    description:
      "Sporty orange look, full filmy entry. Do pahiyon wali kahaani agle update mein aayegi.",
    detail: "SPORT MOTORCYCLE · COMING SOON",
    x: 512,
    y: 512,
  },
];
type Props = {
  kind: "city" | "vehicle";
  selected: number;
  onSelect: (i: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  city: string;
};
function ClassicSelection({
  kind,
  selected,
  onSelect,
  onBack,
  onConfirm,
  city,
}: Props) {
  const items = kind === "city" ? cities : vehicles;
  const title = useRef<HTMLHeadingElement>(null);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const move = (direction: number) =>
    onSelect((selected + direction + items.length) % items.length);
  useEffect(() => {
    title.current?.focus();
  }, [kind]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        onSelect(
          (selected + (e.key === "ArrowRight" ? 1 : -1) + items.length) %
            items.length,
        );
      } else if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, items.length, onSelect, onBack]);
  return (
    <main
      className={`selection selection-${kind}`}
      aria-labelledby="selection-title"
    >
      <header className="selection-header">
        <button className="selection-back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>{kind === "city" ? "Back to home" : "Back to cities"}</span>
        </button>
        <span className="selection-brand">BAP KA RASTA.</span>
        <div
          className="selection-steps"
          aria-label={`Step ${kind === "city" ? 1 : 2} of 2`}
        >
          <span className={kind === "city" ? "current" : "complete"}>
            01 <b>CITY</b>
          </span>
          <i />
          <span className={kind === "vehicle" ? "current" : ""}>
            02 <b>RIDE</b>
          </span>
        </div>
      </header>
      <div className="selection-heading">
        <div>
          <span className="selection-kicker">
            {kind === "city" ? "PICK YOUR PINCODE" : "YOUR CITY. YOUR SAWAARI."}
          </span>
          <h1 id="selection-title" ref={title} tabIndex={-1}>
            {kind === "city" ? "Sheher chun." : "Sawaari chun."}
          </h1>
        </div>
        <p>
          {kind === "city" ? (
            "Five cities. Find your kind of chaos."
          ) : (
            <>
              <MapPin size={14} />
              {city} <span> / </span> Apni sawaari chun
            </>
          )}
        </p>
      </div>
      <section
        className="gallery"
        aria-roledescription="carousel"
        aria-label={kind === "city" ? "City gallery" : "Vehicle gallery"}
      >
        <button
          className="gallery-arrow previous"
          onClick={() => move(-1)}
          aria-label={`Previous ${kind}`}
        >
          <ChevronLeft />
        </button>
        <div
          className="gallery-window"
          onPointerDown={(e) => {
            if ((e.target as Element).closest("button")) return;
            e.preventDefault();
            gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
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
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onLostPointerCapture={() => {
            gesture.current = null;
          }}
        >
          <div
            className="gallery-track"
            style={{ transform: `translateX(-${selected * 100}%)` }}
          >
            {items.map((item, i) => (
              <article
                className="gallery-slide"
                key={item.name}
                inert={i !== selected}
                aria-hidden={i !== selected}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${items.length}: ${item.name}`}
              >
                <div className="gallery-art-wrap">
                  <svg
                    className="gallery-art"
                    viewBox={`${item.x} ${item.y} ${kind === "city" ? "498 447" : "512 512"}`}
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label={`${item.name} ${kind === "city" ? "city" : "vehicle"} concept art`}
                  >
                    <defs>
                      <clipPath id={`preview-${kind}-${i}`}>
                        <rect
                          x={item.x}
                          y={item.y}
                          width={kind === "city" ? 498 : 512}
                          height={kind === "city" ? 447 : 512}
                        />
                      </clipPath>
                    </defs>
                    <image
                      clipPath={`url(#preview-${kind}-${i})`}
                      href={
                        kind === "city"
                          ? "/images/world-board.webp"
                          : "/images/vehicle-gallery.webp"
                      }
                      width="1536"
                      height="1024"
                    />
                  </svg>
                  <span className="art-caption">
                    {kind === "city"
                      ? "A POSTCARD FROM YOUR NEXT DRIVE"
                      : "YOUR FUTURE GARAGE · CONCEPT PREVIEW"}
                  </span>
                </div>
                <div className="gallery-copy">
                  <span
                    className={`gallery-status ${i === 0 ? "available" : ""}`}
                  >
                    {i === 0 ? (
                      <>
                        <span /> AVAILABLE NOW
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={12} /> COMING SOON
                      </>
                    )}
                  </span>
                  <span className="gallery-subtitle">{item.subtitle}</span>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <span className="gallery-detail">{item.detail}</span>
                  <button
                    className="primary gallery-confirm"
                    disabled={i !== 0}
                    onClick={onConfirm}
                  >
                    {i === 0
                      ? kind === "city"
                        ? "Yahin Chalao"
                        : "Drive Mumbai"
                      : "Coming soon"}
                    {i === 0 ? (
                      <ArrowRight size={20} />
                    ) : (
                      <LockKeyhole size={16} />
                    )}
                  </button>
                  <span className="gallery-footnote">
                    {kind === "city"
                      ? i === 0
                        ? "Ab apni sawaari chun, bhidu."
                        : `${item.name} is coming soon. Mumbai is playable now.`
                      : i === 0
                        ? "Mumbai + auto rickshaw. Bas chalao."
                        : "Auto ready hai. Bas tu aa ja, bhidu."}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
        <button
          className="gallery-arrow next"
          onClick={() => move(1)}
          aria-label={`Next ${kind}`}
        >
          <ChevronRight />
        </button>
      </section>
      <footer className="gallery-footer">
        <span className="gallery-count">
          <strong>{String(selected + 1).padStart(2, "0")}</strong> /{" "}
          {String(items.length).padStart(2, "0")}
        </span>
        <div
          className="gallery-dots"
          role="group"
          aria-label={`Choose a ${kind}`}
        >
          {items.map((item, i) => (
            <button
              key={item.name}
              onClick={() => onSelect(i)}
              aria-label={item.name}
              aria-pressed={selected === i}
            >
              <span />
            </button>
          ))}
        </div>
        <span className="gallery-help">
          SWIPE OR USE <kbd>←</kbd> <kbd>→</kbd>
        </span>
      </footer>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {items[selected].name}.{" "}
        {selected === 0 ? "Available now." : "Coming soon."} {selected + 1} of{" "}
        {items.length}.
      </span>
    </main>
  );
}

export default function Selection(props: Props) {
  return props.kind === "vehicle" ? (
    <VehicleSelection {...props} vehicles={vehicles} />
  ) : (
    <ClassicSelection {...props} />
  );
}
