import { RotateCw, ArrowLeft } from "lucide-react";

export const PORTRAIT_GAME_QUERY =
  "(any-pointer: coarse) and (orientation: portrait)";
export default function LandscapeNotice({ onExit }: { onExit: () => void }) {
  return (
    <section
      className="landscape-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-title"
      aria-describedby="landscape-description"
    >
      <img
        src="/brand/br-mark.svg"
        width="72"
        height="72"
        alt="BR — Bap Ka Rasta"
      />
      <span className="landscape-kicker">MUMBAI IS WIDE. SO IS YOUR RIDE.</span>
      <div className="rotate-phone" aria-hidden="true">
        <RotateCw size={44} />
      </div>
      <h1 id="landscape-title">
        Phone ghumaao,
        <br />
        <em>bhidu.</em>
      </h1>
      <p id="landscape-description">
        Game landscape mein hi chalega.
        <br />
        Phone ko side mein ghumaao aur auto-rotate on rakho.
      </p>
      <small>Your drive stays paused while you rotate.</small>
      <button onClick={onExit} autoFocus>
        <ArrowLeft size={18} /> Back to home
      </button>
    </section>
  );
}
