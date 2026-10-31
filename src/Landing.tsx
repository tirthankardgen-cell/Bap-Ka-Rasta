import { ArrowUpRight, MapPin } from "lucide-react";

export default function Landing({ onStart }: { onStart: () => void }) {
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
          <button className="primary" onClick={onStart}>
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
