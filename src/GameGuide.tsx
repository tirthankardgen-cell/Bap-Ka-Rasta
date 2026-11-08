import { cities, vehicles } from "./selection/Selection";
import { characters } from "./game/characters";
import { landmarkSites } from "./game/landmark-layout";

const controls = [
  ["Accelerate", "W / Arrow up"], ["Brake and reverse", "S / Arrow down"],
  ["Steer", "A, D / Arrow left, Arrow right"], ["Handbrake", "Space"],
  ["Select gear (auto rickshaw)", "1–4"], ["Horn", "H"], ["Change camera", "C"],
  ["Reset to the road", "R"], ["Pause", "Esc / P"],
];

export default function GameGuide() {
  return <>
    <header className="guide-header"><a href="/" className="guide-brand"><img src="/brand/icon-192.png" width="40" height="40" alt="BR" />Bap Ka Rasta</a><a href="/" className="play-link">Play Mumbai ↗</a></header>
    <main id="main-content">
      <div className="guide-intro"><p className="eyebrow">Apna sheher. Apni sawaari.</p><h1>Your guide to Bap Ka Rasta.</h1><p>A free, single-player 3D driving game in your browser. Explore Mumbai-inspired streets in a black-and-yellow auto rickshaw or turquoise scooty, with traffic, pedestrians and street conversations.</p><p>This is an early playable build. Mumbai, the auto rickshaw and scooty are available today; the other cities and rides are concept previews.</p></div>
      <nav className="guide-nav" aria-label="In this guide">{["play", "cities", "vehicles", "characters", "landmarks", "images", "credits"].map((id) => <a key={id} href={`#${id}`}>{id}</a>)}</nav>
      <section id="play"><h2>Your first drive</h2><ol><li>Open the game and press “Mera Bap Ka Rasta”.</li><li>Choose Mumbai, then “Yahin Chalao”.</li><li>Choose Auto rickshaw or Scooty, then “Drive Mumbai”.</li><li>Press “Chal Chala”. The scooty starts directly; the auto has a skippable opening with “Drive without intro” or Enter.</li></ol><h3>Controls and devices</h3><dl className="controls">{controls.map(([action, key]) => <div key={action}><dt>{action}</dt><dd>{key}</dd></div>)}</dl><p>Hold brake after stopping to reverse. The scooty reverses steering: left input turns right and right input turns left. Its foot brake moves the rider forward toward the handlebars, rises from the seat and plants both feet on the road before slowing; release to sit back. These comedy controls apply to the vehicle regardless of rider gender. Space uses the same foot brake without reversing. The scooty is automatic, reaches 60 km/h and backs up at walking pace; gear keys apply only to the auto. Phones have on-screen steering and pedals in a landscape play canvas. A modern browser with WebGL 2 and hardware acceleration is required. Pause offers graphics and sound settings.</p><p>No account or download is required. Multiplayer, saved progress, passenger fares, purchases and repairs are future features.</p><p><a href="https://www.vihar.online/guides/bap-ka-rasta-first-drive">Read the full first-drive guide on Vihar ↗</a></p></section>
      <section id="cities"><h2>The cities</h2><p>Mumbai is playable. Delhi, Kolkata, Chennai and Bangalore are planned; no release dates are announced.</p><div className="cards">{cities.map((city, index) => <article key={city.name}><span className="status">{index === 0 ? "Playable now" : "Coming soon · Concept preview"}</span><h3>{city.name}</h3><p>{city.subtitle}</p><p>{city.description}</p><small>{city.detail}</small></article>)}</div></section>
      <section id="vehicles"><h2>The garage</h2><p>Choose Sachin's auto rickshaw or the automatic scooty with Riya, a helmeted female rider. Both have third-person and driver-eye cameras. The other vehicles shown in the gallery are previews.</p><div className="cards">{vehicles.map((vehicle) => <article key={vehicle.name}><span className="status">{vehicle.playerId ? "Playable in Mumbai" : "Coming soon · Concept preview"}</span><h3>{vehicle.name}</h3><p>{vehicle.subtitle}</p><p>{vehicle.description}</p></article>)}</div></section>
      <section id="characters"><h2>Meet the neighbourhood</h2><p>The driver and fictional locals bring the streets to life, with Hindi dialogue and occasional Marathi phrases. Nearby characters have their own street remarks and conversations.</p><ul className="people">{characters.map((person) => <li key={person.id}><strong>{person.name}</strong><span>{person.role}</span></li>)}</ul><p><a href="/audio/mumbai/voices/">Listen to the character lines and read their translations ↗</a></p></section>
      <section id="landmarks"><h2>Mumbai landmarks and shops</h2><p>Explore original game interpretations of these places. The compact neighbourhood is inspired by Mumbai; it is not a geographic navigation map.</p><ul className="people">{landmarkSites.map((landmark) => <li key={landmark.id}><strong>{landmark.name}</strong><span>{landmark.district}</span></li>)}</ul></section>
      <section id="images"><h2>A look around</h2><p>Concept artwork for the world and garage. Mumbai, the auto and scooty are playable; these illustrations do not show finished versions of the future cities and rides.</p>{[
        ["/images/landing-hero.webp", "A driver and black-and-yellow auto on Mumbai’s golden-hour seafront"],
        ["/images/world-board.webp", "City concepts: Mumbai, Delhi, Kolkata, Chennai and Bangalore"],
        ["/images/vehicle-gallery.webp", "Vehicle concepts: auto rickshaw, Thar, Fortuner, Scooty and KTM"],
        ["/images/toto-erickshaw.png", "Blue Toto electric rickshaw concept"],
      ].map(([src, caption]) => <figure key={src}><a href={src}><img src={src} alt={caption} loading="lazy" /></a><figcaption>{caption}</figcaption></figure>)}<p><a href="https://www.vihar.online/games/bap-ka-rasta/screenshots">See actual gameplay, the playable map, models and screenshots on Vihar ↗</a></p></section>
      <section id="credits"><h2>Credits and more</h2><ul><li><a href="/audio/credits.html">Street recordings and voice attribution</a></li><li><a href="/audio/mumbai/voices/">Mumbai dialogue, translations and voice previews</a></li><li><a href="https://www.vihar.online/games/bap-ka-rasta">The game, screenshots and requirements on Vihar</a></li><li><a href="https://www.vihar.online/site-map">Explore all Vihar pages</a></li><li><a href="https://github.com/tirthankardgen-cell/Bap-Ka-Rasta">Build notes and project documentation on GitHub</a></li></ul></section>
    </main><footer><a href="/">Back to Bap Ka Rasta</a> · <a href="https://www.vihar.online/">Vihar — a space to play.</a></footer>
  </>;
}
