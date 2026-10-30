# Vihar — website, brand, and experience brief

**Domain:** https://vihar.online  
**Brand spelling:** Vihar  
**Primary tagline:** A space to play.  
**Purpose:** A premium, welcoming home for original browser and downloadable games across different genres.  
**Document status:** Design and implementation brief, not a claim that the website, domains, or advertising are already configured.

## 1. The idea

Vihar is a place to discover a game, take a break, and return with friends. It should feel thoughtful and approachable: Indian in its cultural grounding, international in its clarity, and playful without visual clutter.

The Sanskrit word विहार (vihāra) has meanings associated with wandering, recreation, and leisure; it also has historical religious uses, including a residence or monastery. This brand draws on recreation and exploration. It does not claim a religious affiliation or that its logo is an ancient sacred emblem.

The platform must accommodate driving, stealth, card or strategy games, social hide-and-seek, and genres not yet planned. Each game has its own personality; Vihar supplies the common home.

### Brand voice

Use clear, friendly English for navigation, support, and platform information. Add short Hinglish touches where they feel natural. Game-specific dialogue can retain its own language and humour.

Avoid exaggerated claims, fake player counts, fake reviews, manufactured urgency, and corporate jargon. Describe a game through what the player can do.

Suggested homepage copy:

> A space to play.
>
> Original games. Different worlds. Find your next little escape.
>
> Explore games

Supporting phrases: “Pick your next adventure.”, “Made for a little escape.”, and “Something new is taking shape.”

## 2. Logo and its meaning

The current concept is the charcoal emblem containing a V, an orange dot, and two enclosing strokes, paired with the VIHAR wordmark. Preserve this concept as the starting point. The later lowercase wordmark idea is an optional refinement, not an approved replacement.

### What the two markings above and around the V mean

The two outer strokes form an **open architectural arch or gateway**. They suggest the sides of a welcoming courtyard: a space you enter to explore and spend time. Their opening at the top suggests openness and discovery.

They are a contemporary abstraction inspired by Indian architectural spaces. They do not represent a specific deity, scripture, temple, or historical symbol. This is the intended brand interpretation, rather than an established traditional meaning.

- **V:** Vihar, and a pair of paths meeting in one shared place.
- **Two outer strokes:** the welcoming space around those paths—the entrance to different game worlds.
- **Terracotta dot:** the player at the centre of that space; a small point of warmth and curiosity.
- **Together:** a person, a place, and possibilities. “A space to play.” expresses this directly.

### Logo system

Create a clean vector master before production; the generated concept image is a visual reference, not a finished SVG. Optically balance the strokes and negative spaces rather than mechanically tracing every generated edge.

Required versions:

1. Horizontal emblem + wordmark for the website header.
2. Stacked emblem + wordmark + tagline for brand presentations.
3. Emblem only for favicon, mobile icon, and social avatar.
4. Charcoal on ivory, ivory on charcoal, and optional terracotta-dot versions.

Use a single-colour version whenever size or contrast makes the dot unclear. Test the symbol at 16, 24, and 32 px. The full emblem may need a simplified small-size variant with wider gaps. Do not place the tagline inside the favicon or tiny navigation logo.

Keep clear space of at least one dot diameter around the emblem. Never stretch, add glow, bevel, heavy shadow, or animate the logo continuously. Brand gradients belong primarily to surrounding artwork, not essential logo strokes.

## 3. Reference and original design direction

Reference: https://www.sarvam.ai/

This brief is based on the screenshots supplied by the owner: the orange/lavender hero, editorial manuscript collage, lavender architectural illustration, and three-column product section. Live interactions, source code, and exact font families have not been verified.

Borrow these principles:

- Warm white surfaces and generous whitespace.
- A quiet header with a distinctive wordmark and few navigation items.
- Large, elegant serif headlines paired with clean sans-serif interface text.
- Soft atmospheric colour transitions rather than hard, saturated panels everywhere.
- Cultural references expressed through original illustrations and geometric motifs.
- Fine borders, gently rounded imagery, and restrained pill buttons.
- Clear editorial sections with alternating text and imagery.

Develop original Vihar artwork and compositions. Do not reuse Sarvam's logo, rosette, proprietary illustrations, text, or exact page layout. Avoid decorative random Sanskrit text. Any meaningful Indian-language text must be proofread.

### Suggested design tokens

| Role | Starting value | Use |
| --- | --- | --- |
| Warm canvas | `#FAF9F6` | Main background |
| Surface | `#FFFFFF` | Cards and raised panels |
| Ink | `#26272C` | Text and primary buttons |
| Muted text | `#62616A` | Supporting copy |
| Hairline | `#E7E4DE` | Dividers and borders |
| Terracotta | `#C77B53` | Logo dot and restrained accents |
| Saffron glow | `#F5A35E` | Decorative gradient regions |
| Lavender | `#BBBDF3` | Decorative fields |
| Pale lilac | `#EEEFFC` | Quiet sections |
| Soft sage | `#C9D8BF` | Occasional secondary artwork |

These are starting values, not an accessibility certification. Validate every text/background pairing. Do not put low-contrast coloured text directly over a changing gradient.

Suggested type pairing: **Newsreader** for editorial headlines and **DM Sans** for navigation, descriptions, and controls. Self-host licensed WOFF2 files, use font-display swap, and load only needed weights. Treat the logo lettering independently from body fonts.

Use a content width around 1200–1280 px, 24–40 px desktop gutters, and 16–20 px mobile gutters. Desktop section spacing can be 88–120 px; mobile 48–72 px. Card radii should usually stay within 16–24 px. Primary actions use charcoal pills with readable ivory text.

## 4. Website structure

### Main navigation

Logo links home. Main links: **Games**, **About**. Primary action: **Explore games**. Add Help in the footer initially. Do not show Login until accounts provide a real feature.

### Pages

| Route | Purpose |
| --- | --- |
| `/` | Brand introduction, featured game, catalogue preview |
| `/games` | Full catalogue with useful filters once the library grows |
| `/games/bap-ka-rasta` | Screenshots, description, requirements, and Play action |
| `/games/ekka-chor` | Future game detail page when there is approved content |
| `/about` | Studio story, meaning of Vihar, development approach |
| `/help` | Browser support, controls, download help, troubleshooting |
| `/privacy` | Accurate data, analytics, cookies, and advertising disclosure |
| `/terms` | Platform and game terms |
| `/contact` | Support/contact method |

Downloads should be accessed through each game's page, with explicit platform, version, file size, and system requirements. Do not publish a generic download button that hides what the user is downloading.

### Homepage sequence

1. **Header:** compact wordmark, minimal navigation, no advertisement.
2. **Hero:** “A space to play.”, one short introduction, Explore games. Soft saffron/lavender atmosphere and one original Vihar motif. Keep it calm and readable.
3. **Featured game:** Bap Ka Rasta with a wide actual screenshot or clearly labelled concept image, short pitch, Browser label, and Play now. Never autoplay audio.
4. **Game collection:** generous image-led cards for released and announced games. Each shows title, genre, platform, and availability. Announced games use Coming soon, not a misleading Play button.
5. **Optional sponsor placement:** after a complete game section, with clear separation and an Advertisement label. Omit it while inventory or commercial readiness is absent.
6. **The world of Vihar:** brief editorial section about exploration and play, with original Indian-play-inspired artwork.
7. **Footer:** logo, tagline, Games, About, Help, Contact, Privacy, Terms, and cookie settings when applicable.

If only one game is playable, feature it confidently. Do not build a wall of empty cards. Ekka Chor and the unnamed hide-and-seek game can appear as forthcoming titles only with approved names and honest development status.

### Game detail page

Lead with title, short pitch, key artwork, platform badges, and a prominent Play or Download action. Follow with real screenshots, controls, device requirements, content information where appropriate, and release notes. Place optional advertising after screenshots or another complete informational section—not beside the primary action.

For Bap Ka Rasta, explain mobile landscape use and device expectations accurately. The catalogue itself should remain comfortable in portrait. Game launch must be explicit; never load the full Three.js game in the catalogue background.

### Game card requirements

Cards include one strong image, title, short description, platform, and availability. A small browser/download icon must also have text. Reserve consistent image aspect ratios to prevent layout shifts. Use visible keyboard focus and actual links. Hover-only information is insufficient on mobile.

## 5. Motion and interaction

Motion should reinforce hierarchy and feedback. It should not compete with game artwork or affect readability.

| Element | Behaviour |
| --- | --- |
| Hero atmosphere | Optional slow 20–30 second movement of a pre-rendered gradient layer; stop offscreen |
| Section entrance | One-time opacity and 8–12 px translation, about 350–450 ms |
| Buttons | 120–180 ms colour/border transition; optional 1–2 px arrow movement |
| Game cards | Subtle border/shadow change; artwork scale no more than 1.02 |
| Header | Gentle background/border transition after scrolling |
| Dialogs | Short fade, correct focus management, explicit close control |
| Loading | Small, lightweight progress treatment with useful status text |

Prefer transform and opacity. Avoid giant animated blur filters, constant SVG path morphing, scroll-jacking, custom cursors, heavy parallax, and videos playing in multiple cards. Content must remain visible if JavaScript animation fails. Implement prefers-reduced-motion with static states and no entrance delays.

A mobile-friendly static gradient is preferable to a costly animation. Pause decorative animation when the tab is hidden. Games have their own performance budget; the catalogue must not add work to their rendering loop.

## 6. Advertising: revenue without irritating players

### Principle

A premium site can carry advertising when it is predictable, restrained, clearly identified, and separated from gameplay and controls. Clever placement means choosing a natural pause—not disguising an ad as content or engineering accidental clicks.

Start with **at most one ad slot per main catalogue or detail page**, and preferably a direct, relevant sponsorship when available. This is an initial ceiling, not a target to fill every page. There is no guaranteed revenue; traffic, audience, geography, demand, consent, and viewability determine results.

### Placement plan

| Surface | Initial policy |
| --- | --- |
| Homepage hero and header | No ads |
| Homepage below a completed game collection | One optional labelled sponsor/banner slot |
| Game catalogue | One slot after a meaningful set of real games; omit if the catalogue is too short |
| Game detail page | One optional slot after screenshots or useful information, away from Play/Download |
| About, Help, Privacy, Terms | No ads initially |
| Active driving or other live gameplay | No ads over the canvas, HUD, touch controls, or camera gestures |
| Loading screen | No ad that delays entry or resembles loading progress |
| Pause/failure/newspaper screens | No automatic ads initially; keep navigation clear |
| Download actions | No fake Download buttons, forced redirects, or ads immediately touching the button |

In a later phase, consider **opt-in rewarded ads** only if a game has a suitable optional reward and a supported provider. Say what the player receives before asking. Declining must preserve ordinary play, and mandatory restarting or continuing must not require viewing an ad. Do not insert ads into Bap Ka Rasta's incident sequence.

### Visual treatment

- Clearly label every paid placement **Advertisement** or **Sponsored** as appropriate.
- Use whitespace and a quiet neutral container to separate it from adjacent content.
- Do not format an ad so that it looks like another playable game card.
- Choose a provider-supported responsive format. Reserve its intended dimensions before it loads; mobile and desktop may use different formats.
- Do not crop, cover, restyle, or interfere with a third-party creative, its attribution, or close controls.
- Never use flashing units, autoplay sound, popunders, sticky full-screen takeovers, fake alerts, or forced interstitials.
- If no ad is available or an ad blocker is present, the site must continue working. Avoid inserting or collapsing a large region after it is already visible; use a predictable reserved slot or an honest house promotion.

### Loading, privacy, and measurement

Load advertising asynchronously and near its intended viewport when supported. Keep it out of the critical rendering path. Use the provider's approved integration; do not force rapid refreshes or manipulate impressions. Obtain consent where required before relevant advertising or tracking requests. Make privacy disclosures reflect the actual services used.

Before selecting a network, check content eligibility for each game and page, including depictions of injury or death. Keep ad eligibility decisions separate from gameplay logic. An ad provider must never be a dependency for loading or playing a game.

Measure revenue alongside page speed, game-launch rate, return visits, and complaints. Set an initial policy of one visible ad at a time. If adding advertising meaningfully hurts engagement or responsiveness, reduce or remove it. Review results against a pre-ad baseline rather than judging by ad clicks alone.

## 7. Independent games and Vercel hosting

Use separate repositories and Vercel projects. The catalogue links directly to each game's subdomain; it does not embed games in iframes by default.

| Project | Intended address |
| --- | --- |
| Vihar catalogue | `vihar.online` |
| Optional www alias | `www.vihar.online`, redirected to the canonical domain |
| Bap Ka Rasta | `rasta.vihar.online` |
| Ekka Chor | `ekkachor.vihar.online` |
| Future hide-and-seek game | Decide the subdomain when the title is final |

Add each hostname in its corresponding Vercel project's Domains settings and use the exact DNS records Vercel requests. Verify HTTPS before publishing links. These are proposed addresses; this document does not establish that DNS is configured.

On each game, add a quiet “More games from Vihar” link in an appropriate menu or end screen. Keep the primary game experience distinct. Avoid repeated intrusive return-home prompts.

For downloadable games, store large versioned installers in object storage/CDN or an appropriate distribution service. Link from the catalogue with version, platform, file size, release notes, and checksum where useful. Do not put large installers in the catalogue Git repository.

Suggested catalogue stack: Next.js with statically generated public pages on Vercel, TypeScript, lightweight CSS, and a small typed game catalogue. React/Vite with prerendering is also viable if the team prefers it. No account system, database, or heavy CMS is required for the first few games.

Suggested game metadata: slug, title, short description, status, genres, platforms, artwork, screenshots, play URL, download variants, controls, requirements, and release date when confirmed. Keep Coming soon entries from exposing nonexistent launch URLs.

## 8. Responsive behaviour and accessibility

- Support mobile portrait, mobile landscape, tablet, and desktop for the catalogue.
- Collapse to one-column editorial sections and one or two game cards according to actual available width.
- Keep main actions comfortably tappable, preferably at least 44 px in height.
- Provide keyboard navigation, visible focus, semantic headings, useful alt text, and accessible dialog behaviour.
- Aim for WCAG 2.2 AA; verify contrast and interactions rather than assuming compliance.
- Never lock website orientation to landscape. Individual games can manage their own orientation/fullscreen experience after an explicit launch gesture, within browser support.
- Respect reduced motion and avoid autoplay audio.
- Ensure consent tools and ads never obscure essential navigation on small screens.

## 9. Performance, search, and sharing

Target Core Web Vitals at the 75th percentile: LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1. Treat these as measured goals, not guarantees.

Use responsive AVIF/WebP images, dimensions/aspect ratios, lazy loading below the fold, and a small initial JavaScript bundle. Do not preload game models, audio, or videos on the catalogue. Keep font requests limited and third-party tags accountable.

Each public game page needs a unique title and description, canonical URL, meaningful text, and a share image. Provide sitemap.xml and robots.txt. Use truthful structured data where applicable, without invented ratings, download counts, prices, or release dates. Link the catalogue detail page and game subdomain clearly and avoid duplicating entire pages across both.

Proposed homepage title: **Vihar — A space to play.**

Proposed homepage description: **Discover original browser and downloadable games from Vihar. Explore different worlds and find your next space to play.** Adjust this if only browser games are available at launch so the wording does not imply downloadable releases already exist.

## 10. Required creative assets

- Vector logo master and the variants described above.
- Favicons, app icons, social avatar, and a readable monochrome mark.
- A 1200 × 630 social sharing image with safe margins.
- Original hero atmosphere and a restrained motif library.
- Game cover images with consistent framing, plus real gameplay screenshots.
- Small platform and availability badges.
- Optional original editorial collage inspired by Indian play: kites, courtyards, chaupar, or ganjifa, used thoughtfully and with accurate context.

Maintain an asset register with source, author/tool, licence, and intended usage. Do not treat cultural references as permission to reuse copyrighted artwork. Clearly distinguish concept art from actual gameplay when it matters to a player's expectations.

## 11. Rollout

### Phase 1 — credible, fast launch

Create the separate catalogue project, finish the logo vector, build the homepage and Bap Ka Rasta detail page, add accurate upcoming-game entries, publish support/privacy/terms/contact pages, configure the domain and game subdomain, and verify mobile/desktop launch links. Keep advertising off until placement, provider eligibility, and disclosures are ready.

### Phase 2 — restrained monetisation

Introduce one optional placement on selected pages. Test real ad loading, consent behaviour, blocked/no-fill cases, layout stability, and game-launch conversion. Prefer relevant direct sponsorship when commercially feasible; use a network only after approval and integration checks.

### Phase 3 — growing library

Add released games, useful filters, and downloadable releases. Add accounts, cross-game saves, or rewards only when they provide a concrete player benefit. Do not make users create an account merely to browse the catalogue.

## 12. Acceptance checklist

- [ ] Vihar spelling, vihar.online, and “A space to play.” are consistent.
- [ ] Logo meaning is presented as a contemporary design interpretation.
- [ ] Artwork and page composition are original, with Sarvam used as a reference for restraint and atmosphere.
- [ ] Released games launch correctly; upcoming games cannot launch accidentally.
- [ ] Catalogue and game projects deploy independently.
- [ ] All public pages work on mobile portrait and landscape.
- [ ] Keyboard, screen-reader basics, contrast, and reduced-motion behaviour are checked.
- [ ] The catalogue does not download game engines/models before launch.
- [ ] Advertisements are labelled, limited, and away from play/download controls.
- [ ] Ad blocking, consent refusal, slow ads, and no-fill do not block the site or games.
- [ ] No ads cover gameplay or interrupt the incident/restart sequence.
- [ ] Sharing previews, metadata, canonical URLs, and support links work.
- [ ] Performance is measured with third-party scripts enabled before monetisation ships.
