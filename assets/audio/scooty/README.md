# Scooty player audio

Searched in Google Chrome and checked against the Freesound source pages on 8 November 2026. Both recordings permit modification, commercial use and redistribution. These are generic scooter/small two-wheeler references, not recordings of a verified Mumbai vehicle or the exact rendered scooty model.

| Cue | Source | License | Runtime edit |
| --- | --- | --- | --- |
| Engine | [Gilera Runner 2007 revs backfire cold idle by lovretta](https://freesound.org/people/lovretta/sounds/140384/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 4.0–7.8 seconds of steady idle from the recorded Gilera Runner SP50 two-stroke scooter. |
| Horn | [vintage moped horn.wav by extrafonia](https://freesound.org/people/extrafonia/sounds/198612/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 0.04–0.48 seconds: one short beep from a recorded 50 cc two-wheeler horn. |

The complete, unmodified HQ MP3 previews are retained here. `sources.json` records download URLs, source-page hashes, licenses and source/runtime checksums. The engine has high/low-pass filtering and loudness normalization; the horn also has short edge fades. Both runtime cues are mono 44.1 kHz / 128 kbps MP3. The game crossfades the engine loop and varies pitch with the scooty's CVT speed/throttle. Traffic keeps its existing separate horn and ambience. Credits and edit disclosures are accessible from the game's Sound credits link at `/audio/credits.html`.

Rebuild and fully decode both cues with:

```sh
python assets/audio/scooty/prepare.py --ffmpeg /path/to/ffmpeg
```

Discovery searches included `free scooter engine idle horn sound freesound CC0`, `scooter idle`, `scooter engine`, `scooter horn`, `vespa horn` and `moped horn`. The Vespa ET4 beep by Kibben was excluded because its Sampling+ license has more restrictive reuse terms. Scooter travel/start recordings by killerrack8017 were excluded because they are NonCommercial.
