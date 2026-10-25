# Mumbai street audio library

Real field recordings collected on 25 October 2026 for sound design. Four edited excerpts now power the game; originals here remain unchanged.

- Open [listen.html](listen.html) locally to audition the collection. Playback starts only when you press a recording's play button.
- See the [catalogue and research notes](../../../docs/research/mumbai/audio/README.md) for locations, coverage, limitations and the checked user download.
- [manifest.json](manifest.json) records source URLs, creators, licenses, durations, encoding details, file sizes and SHA-256 checksums.
- Keep [ATTRIBUTION.md](ATTRIBUTION.md) and the [license texts](licenses/) with the audio. CC BY credits must accompany any future use.

The stored files are the unmodified, lossy **Freesound HQ MP3 previews**, not the original WAV/FLAC/M4A masters. A Freesound account can download original files from the credited source pages when higher-quality production masters are needed.

`assets/` is outside Vite's `public/` and has no imports from `src/`, so these recordings are not copied into the deployed site. Selected derivatives are served from `public/audio/mumbai/`: engine (121886, seconds 3–13), horn (451321, full clip), traffic (221639, seconds 1–17), and market (453005, seconds 3–33). They are mono 44.1 kHz/96 kbps MP3, normalized to -22 LUFS / -3 dBTP with short edge fades. Web Audio crossfades the loop seams and varies engine playback rate. Deployed credits and license texts live in `public/audio/`; in-game pause links to the credits.
