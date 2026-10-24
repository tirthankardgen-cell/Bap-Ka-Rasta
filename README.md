# Bap ka Rasta

A planned lightweight 3D Indian driving game for desktop and mobile browsers, hosted on Vercel with no login.

The first-stage research and architecture specification is complete:

- [Game design and architecture](docs/Bap-ka-Rasta-Game-Plan.md)
- [Readable PDF](output/pdf/Bap-ka-Rasta-Game-Plan.pdf)
- [Browser document](output/Bap-ka-Rasta-Game-Plan.html)
- [Primary source verification record](docs/research/source-checks.json)
- [Visual storyboard: cities, characters, vehicles, and player journey](docs/storyboard/README.md)

The plan covers Mumbai, Delhi, Kolkata, Chennai, and Bangalore, with auto rickshaw, Thar, Fortuner, scooty, and KTM available at launch. The intended flow is landing page, Mera Bap Ka Rasta, city selection, vehicle selection, then driving. Revision 1 adds original street humour, explicit controller axes, local chunk activation, first playable build tasks, and a generated content manifest contract.

The game application has not been scaffolded yet. The next milestone is a playable Mumbai and auto rickshaw slice using React, TypeScript, Vite, Three.js, and React Three Fiber, followed by the rest of the launch roster.

## Document tools

`scripts/research_sources.py` retrieves the primary references and writes the verification record. Its recorded research date is 24 October 2026; change that constant when performing a later research refresh.

`scripts/build_game_plan.py` builds the PDF from the Markdown source using ReportLab and writes a browser-readable HTML copy to `output/`. It requires the project's document dependencies, not the future game's JavaScript packages.

These files are research and documentation tools. No game server, user account, secret key, or database is required to use the specification.
