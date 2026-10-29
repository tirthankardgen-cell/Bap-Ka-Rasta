import "./road-loading.css";

/** Animate HTML compositor layers, not SVG groups: scene setup can occupy JS. */
export default function RoadLoading() {
  return (
    <div className="road-loading" role="status" aria-live="polite">
      <div className="road-work" aria-hidden="true">
        <svg viewBox="0 0 360 150" className="road-layer">
          <path d="M20 126H340" stroke="#d5cbb4" strokeWidth="3" />
          <path d="M34 102H326L350 136H10Z" fill="#ddd4bf" />
        </svg>
        <div className="road-layer asphalt-strip">
          <svg viewBox="0 0 360 150">
            <path d="M34 102H326L350 136H10Z" fill="#344b45" />
            <path
              d="M35 122H325"
              stroke="#fff5d6"
              strokeWidth="3"
              strokeDasharray="24 16"
            />
          </svg>
        </div>
        <svg viewBox="0 0 360 150" className="road-layer">
          {[40, 298].map((x) => (
            <g key={x} transform={`translate(${x} 88)`}>
              <path d="M0 24L9 0L18 24Z" fill="#ed852e" />
              <path d="M5 12H13" stroke="#fff9e7" strokeWidth="4" />
              <rect x="-3" y="23" width="24" height="4" rx="2" fill="#253b33" />
            </g>
          ))}
          {[104, 238].map((x) => (
            <g key={x} transform={`translate(${x} 18)`} className="road-worker">
              <path
                d="M-10 55L-15 86M9 55L18 86"
                stroke="#25453c"
                strokeWidth="10"
              />
              <path d="M-15 87H-23M18 87H25" stroke="#1b2e29" strokeWidth="7" />
              <rect
                x="-15"
                y="27"
                width="30"
                height="34"
                rx="4"
                fill="#f5b832"
              />
              <path
                d="M-9 29V57M9 29V57M-14 47H14"
                stroke="#fff5d7"
                strokeWidth="3"
              />
              <rect
                x="-10"
                y="9"
                width="20"
                height="20"
                rx="4"
                fill="#b78056"
              />
              <path d="M-13 12Q-13 -3 0 -3Q13 -3 13 12Z" fill="#ffce36" />
              <path d="M-17 12H17" stroke="#d59a15" strokeWidth="4" />
            </g>
          ))}
        </svg>
        {[104, 238].map((x, i) => (
          <div
            key={x}
            className={`road-layer worker-shovel worker-${i}`}
            style={{ transformOrigin: `${((x + 12) / 360) * 100}% 36%` }}
          >
            <svg viewBox="0 0 360 150">
              <g transform={`translate(${x} 18)`}>
                <path
                  d="M12 36L29 50"
                  stroke="#b78056"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path d="M26 29L36 87" stroke="#87653e" strokeWidth="4" />
                <path d="M27 79H44L43 93Q35 101 29 92Z" fill="#60766f" />
              </g>
            </svg>
          </div>
        ))}
        <div className="road-layer road-gravel">
          <svg viewBox="0 0 360 150">
            <g fill="#887858">
              <circle cx="158" cy="111" r="3" />
              <circle cx="170" cy="106" r="4" />
              <circle cx="180" cy="113" r="3" />
              <circle cx="193" cy="108" r="2" />
            </g>
          </svg>
        </div>
      </div>
      <strong id="drive-panel-title">Rasta ban raha hai…</strong>
      <small>Bas ek minute, bhidu.</small>
    </div>
  );
}
