# Mumbai street audio research

Collected and checked on **25 October 2026**. The library contains **57 real recordings**, **110.6 MB** in decimal units (**105.4 MiB**) and **81.6 minutes** of audio. It includes **18 recordings explicitly located in Mumbai by their uploaders**, **one BEST bus recording with Mumbai-region context inferred from the service name**, **32 supplementary Indian references**, and **six recordings without a confirmed recording city**.

The audio is stored in [`assets/audio/mumbai/`](../../../../assets/audio/mumbai/README.md). Open the standalone [listening catalogue](../../../../assets/audio/mumbai/listen.html) locally to play it. The [manifest](../../../../assets/audio/mumbai/manifest.json) gives each file's creator, exact source, license, location basis, encoding, duration, size and SHA-256. The [attribution file](../../../../assets/audio/mumbai/ATTRIBUTION.md) and [license texts](../../../../assets/audio/mumbai/licenses/) accompany the collection.

## What is ready

- Auto-rickshaws: real Bajaj starting, ignition attempts, idle, revving, passing, pulling away, riding, stopping, body clanks, gravel wheels and entry/exit sounds; Mumbai onboard/road recordings and a Mumbai engine take.
- Horns: isolated Indian vehicle honks and a **real Jaipur electric-rickshaw horn within a ride**; bus horns are in the bus recordings. The vehicle producing the isolated generic Indian honks is not confirmed. The electric-rickshaw recording is not labeled as a Mumbai Bajaj horn. Mumbai onboard/traffic takes are mixed recordings, so individual horn owners cannot be identified from uploader metadata.
- Buses and other vehicles: a BEST interior, other Indian bus engines/horns, Royal Enfield Bullet start/idle/exhaust, Mumbai truck brakes, and Kerala car/bike passes with an auto indicator. A scooter pass and BMW diesel idle are clearly labeled generic references; they are not claimed to be Mumbai, Thar or Fortuner recordings.
- Street life: a Mumbai market near CSMT, actual Kolkata hawker calls, Delhi–Jaipur water sellers, Bangalore vendor calls, pedestrians, station voices and footsteps, Mumbai traffic, Churchgate arrivals/PA, Kurla station ambience, Mumbai crows, Marine Drive, waterfront waves, road work, Ganpati drums and street celebrations.

## Source and reuse decisions

These are recordings of real vehicles and places, rather than synthesized sound effects. All checked-in audio is licensed **CC0 1.0**, **CC BY 4.0** or **CC BY 3.0**. Commercial use and redistribution are allowed under those terms; CC BY requires the supplied creator/source/license credits and disclosure of changes. Licenses apply individually to the sound assets, not to the game code.

Files are the **complete, unmodified Freesound high-quality MP3 previews**, renamed locally. They are lossy encodings even when an upstream title says WAV, FLAC or M4A. Original lossless downloads require a Freesound account; no account or API token was used here. Download URLs and source-page hashes are retained. Source-page licenses were checked directly, rather than relying on older search-index license metadata.

The [research record](research.json) records successful search queries, inspected sources, exclusions and limitations. General web/Openverse/Wikimedia discovery was followed by direct Freesound searching, uploader-pack browsing and individual sound-page checks. It records first-page candidates, not an exhaustive count of every sound on the internet. Some Openverse filtered searches needed authentication and some site searches briefly returned HTTP 429; successful primary-source searches supplied the collection.

Several attractive Mumbai street-food and vegetable-market recordings were excluded from the raw asset collection because their licenses are Sampling+ or NonCommercial. Their source links are retained in the research record for reference. Isolated Mumbai/Marathi vendor calls and an isolated horn positively identified as a Mumbai Bajaj auto remain future sourcing targets; the current usable alternatives are labeled accurately.

## The recording you downloaded

The local `auto sound 1.mp3` was checked as a valid **231.096-second stereo MP3 at 24 kHz / 160 kbps**. Its Windows download metadata points to Pixabay's “Inside an auto rickshaw in Mumbai” (50615), credited there to `freesound_community`.

The original [“INSIDE AN AUTO RICKSHAW IN MUMBAI.mp3” by ambar das](https://freesound.org/people/ambar%20das/sounds/203177/) is explicitly CC0 on Freesound. A waveform comparison of the full recordings at a common 1 kHz comparison rate, with a 46 ms encoding offset, gave **0.99587 correlation**. This is strong evidence that your file is a re-encoded copy of that recording. The checked-in [original Freesound HQ preview](../../../../assets/audio/mumbai/auto-rickshaw/inside-auto-mumbai-203177.mp3) is 48 kHz and 231.072 seconds. Your original local download was left untouched and was not duplicated in the Git commit. [Check details](user-download-check.json).

## Verification and future use

```sh
python scripts/verify_audio_assets.py
# Optional, if ffprobe and ffmpeg are installed:
python scripts/verify_audio_assets.py --ffprobe ffprobe --ffmpeg ffmpeg
npm run build
```

All 57 files passed SHA-256/size/credit checks, ffprobe metadata checks and a complete ffmpeg decode. The production build passed, and `dist/` contains no audio assets. No game source, game behavior, controls or deployment configuration was changed. `listen.html` is a separate, local review tool; it is not linked from the website.

These full recordings are not prepared engine loops or balanced gameplay one-shots. Before integration, audition and trim cues, preserve attribution, remove unrelated background speech/music where appropriate, create loop points/crossfades, normalize levels and test playback on phones. Some field recordings contain overlapping voices, traffic, reverberation or varying microphone levels. No claim is made that every background sound belongs to the featured vehicle.

## File catalogue

### Auto-rickshaw engines and movement

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [inside-auto-mumbai-203177.mp3](../../../../assets/audio/mumbai/auto-rickshaw/inside-auto-mumbai-203177.mp3) | 231.1s | Mumbai — Mumbai | CC0-1.0 | [ambar das](https://freesound.org/people/ambar%20das/sounds/203177/) |
| [mumbai-auto-ride-02-423368.mp3](../../../../assets/audio/mumbai/auto-rickshaw/mumbai-auto-ride-02-423368.mp3) | 64.0s | Mumbai — Mumbai | CC0-1.0 | [troycavas](https://freesound.org/people/troycavas/sounds/423368/) |
| [mumbai-auto-ride-01-423369.mp3](../../../../assets/audio/mumbai/auto-rickshaw/mumbai-auto-ride-01-423369.mp3) | 56.0s | Mumbai — Mumbai | CC0-1.0 | [troycavas](https://freesound.org/people/troycavas/sounds/423369/) |
| [rickshaw-tailpipe-engine-121886.mp3](../../../../assets/audio/mumbai/auto-rickshaw/rickshaw-tailpipe-engine-121886.mp3) | 16.8s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [StephenSaldanha](https://freesound.org/people/StephenSaldanha/sounds/121886/) |
| [mumbai-rickshaw-onboard-engine-121929.mp3](../../../../assets/audio/mumbai/auto-rickshaw/mumbai-rickshaw-onboard-engine-121929.mp3) | 47.7s | Mumbai — Mumbai | CC-BY-4.0 | [StephenSaldanha](https://freesound.org/people/StephenSaldanha/sounds/121929/) |
| [bajaj-wheels-gravel-261159.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-wheels-gravel-261159.mp3) | 21.2s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261159/) |
| [bajaj-start-return-stop-261158.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-start-return-stop-261158.mp3) | 76.6s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261158/) |
| [bajaj-fumble-start-drive-away-261067.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-fumble-start-drive-away-261067.mp3) | 39.6s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261067/) |
| [bajaj-pass-by-261066.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-pass-by-261066.mp3) | 39.7s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261066/) |
| [bajaj-start-pull-away-261065.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-start-pull-away-261065.mp3) | 31.9s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261065/) |
| [bajaj-back-seat-261064.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-back-seat-261064.mp3) | 15.8s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261064/) |
| [bajaj-start-lever-idle-rev-261063.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-start-lever-idle-rev-261063.mp3) | 17.6s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261063/) |
| [bajaj-start-ride-stop-voices-261062.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-start-ride-stop-voices-261062.mp3) | 102.7s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261062/) |
| [bajaj-body-clanks-261061.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-body-clanks-261061.mp3) | 12.6s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261061/) |
| [bajaj-start-idle-rev-261059.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-start-idle-rev-261059.mp3) | 46.4s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261059/) |
| [bajaj-engine-cabinet-261058.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-engine-cabinet-261058.mp3) | 27.1s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261058/) |
| [bajaj-get-in-out-261057.mp3](../../../../assets/audio/mumbai/auto-rickshaw/bajaj-get-in-out-261057.mp3) | 14.5s | India; city unspecified — Other Indian reference | CC-BY-4.0 | [kalhan](https://freesound.org/people/kalhan/sounds/261057/) |
| [rickshaw-ignition-273961.mp3](../../../../assets/audio/mumbai/auto-rickshaw/rickshaw-ignition-273961.mp3) | 6.7s | Unspecified — Location unverified | CC0-1.0 | [rsn267](https://freesound.org/people/rsn267/sounds/273961/) |
| [indian-auto-start-leave-approach-353664.mp3](../../../../assets/audio/mumbai/auto-rickshaw/indian-auto-start-leave-approach-353664.mp3) | 101.3s | India; city unspecified — Other Indian reference | CC0-1.0 | [Kriaa](https://freesound.org/people/Kriaa/sounds/353664/) |
| [cng-three-wheeler-723808.mp3](../../../../assets/audio/mumbai/auto-rickshaw/cng-three-wheeler-723808.mp3) | 32.8s | Unspecified — Location unverified | CC0-1.0 | [Balaram_Mahalder](https://freesound.org/people/Balaram_Mahalder/sounds/723808/) |

### Vehicle and rickshaw horns

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [indian-auto-horn-clean-451321.mp3](../../../../assets/audio/mumbai/horns/indian-auto-horn-clean-451321.mp3) | 2.0s | India; city unspecified — Other Indian reference | CC0-1.0 | [kyles](https://freesound.org/people/kyles/sounds/451321/) |
| [indian-traffic-beep-beep-563346.mp3](../../../../assets/audio/mumbai/horns/indian-traffic-beep-beep-563346.mp3) | 1.7s | India; city unspecified — Other Indian reference | CC0-1.0 | [Anzbot](https://freesound.org/people/Anzbot/sounds/563346/) |
| [jaipur-electric-rickshaw-horn-ride-508975.mp3](../../../../assets/audio/mumbai/horns/jaipur-electric-rickshaw-horn-ride-508975.mp3) | 126.0s | Jaipur, India — Other Indian reference | CC0-1.0 | [SoundEnsemble](https://freesound.org/people/SoundEnsemble/sounds/508975/) |

### BEST and other Indian buses

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [best-bus-interior-637267.mp3](../../../../assets/audio/mumbai/buses/best-bus-interior-637267.mp3) | 90.5s | BEST service; exact stop unspecified — BEST / region inferred | CC0-1.0 | [Xeroeight](https://freesound.org/people/Xeroeight/sounds/637267/) |
| [indian-bus-engine-horns-voices-263623.mp3](../../../../assets/audio/mumbai/buses/indian-bus-engine-horns-voices-263623.mp3) | 68.5s | India; city unspecified — Other Indian reference | CC0-1.0 | [Alcappuccino](https://freesound.org/people/Alcappuccino/sounds/263623/) |
| [indian-sleeper-bus-melodic-horn-508540.mp3](../../../../assets/audio/mumbai/buses/indian-sleeper-bus-melodic-horn-508540.mp3) | 29.7s | India; exact route unspecified — Other Indian reference | CC0-1.0 | [SoundEnsemble](https://freesound.org/people/SoundEnsemble/sounds/508540/) |
| [madhya-pradesh-bus-engine-horns-468438.mp3](../../../../assets/audio/mumbai/buses/madhya-pradesh-bus-engine-horns-468438.mp3) | 80.3s | Orchha to Chhatarpur, Madhya Pradesh, India — Other Indian reference | CC-BY-4.0 | [kevp888](https://freesound.org/people/kevp888/sounds/468438/) |

### Motorcycles

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [royal-enfield-bullet-start-idle-158738.mp3](../../../../assets/audio/mumbai/motorcycles/royal-enfield-bullet-start-idle-158738.mp3) | 30.1s | India-built 1986 Royal Enfield Bullet; recording city unspecified — Other Indian reference | CC-BY-4.0 | [Calcuttan](https://freesound.org/people/Calcuttan/sounds/158738/) |
| [royal-enfield-bullet-exhaust-195655.mp3](../../../../assets/audio/mumbai/motorcycles/royal-enfield-bullet-exhaust-195655.mp3) | 30.0s | Unspecified; basement recording — Location unverified | CC-BY-4.0 | [absent1010](https://freesound.org/people/absent1010/sounds/195655/) |

### Other vehicles

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [scooter-drive-by-319693.mp3](../../../../assets/audio/mumbai/other-vehicles/scooter-drive-by-319693.mp3) | 31.0s | Unspecified — Location unverified | CC-BY-4.0 | [peridactyloptrix](https://freesound.org/people/peridactyloptrix/sounds/319693/) |
| [bmw-diesel-engine-idle-401552.mp3](../../../../assets/audio/mumbai/other-vehicles/bmw-diesel-engine-idle-401552.mp3) | 3.1s | Unspecified — Location unverified | CC0-1.0 | [GiocoSound](https://freesound.org/people/GiocoSound/sounds/401552/) |
| [mumbai-truck-squeaky-brake-423374.mp3](../../../../assets/audio/mumbai/other-vehicles/mumbai-truck-squeaky-brake-423374.mp3) | 64.0s | Mumbai — Mumbai | CC0-1.0 | [troycavas](https://freesound.org/people/troycavas/sounds/423374/) |
| [kerala-traffic-auto-indicator-585570.mp3](../../../../assets/audio/mumbai/other-vehicles/kerala-traffic-auto-indicator-585570.mp3) | 71.2s | Alichuvadu Junction, Vennala, Kerala, India — Other Indian reference | CC0-1.0 | [Athul_PR](https://freesound.org/people/Athul_PR/sounds/585570/) |

### Markets and vendors

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [mumbai-market-near-csmt-453005.mp3](../../../../assets/audio/mumbai/markets-vendors/mumbai-market-near-csmt-453005.mp3) | 44.0s | Mumbai, near Victoria Terminus (CSMT) — Mumbai | CC0-1.0 | [Lenguaverde](https://freesound.org/people/Lenguaverde/sounds/453005/) |
| [kolkata-book-market-hawkers-181026.mp3](../../../../assets/audio/mumbai/markets-vendors/kolkata-book-market-hawkers-181026.mp3) | 56.4s | College Street, Kolkata, India — Other Indian reference | CC-BY-4.0 | [Calcuttan](https://freesound.org/people/Calcuttan/sounds/181026/) |
| [kolkata-hawker-call-608765.mp3](../../../../assets/audio/mumbai/markets-vendors/kolkata-hawker-call-608765.mp3) | 44.6s | Kolkata, India — Other Indian reference | CC-BY-4.0 | [rain+](https://freesound.org/people/rain+/sounds/608765/) |
| [delhi-jaipur-bus-water-hawker-508875.mp3](../../../../assets/audio/mumbai/markets-vendors/delhi-jaipur-bus-water-hawker-508875.mp3) | 160.7s | Delhi to Jaipur road, India — Other Indian reference | CC0-1.0 | [SoundEnsemble](https://freesound.org/people/SoundEnsemble/sounds/508875/) |
| [bangalore-residential-vendor-call-404900.mp3](../../../../assets/audio/mumbai/markets-vendors/bangalore-residential-vendor-call-404900.mp3) | 111.3s | Bangalore, India — Other Indian reference | CC0-1.0 | [seventhsamurai](https://freesound.org/people/seventhsamurai/sounds/404900/) |
| [indian-covered-market-traffic-vendors-451501.mp3](../../../../assets/audio/mumbai/markets-vendors/indian-covered-market-traffic-vendors-451501.mp3) | 200.3s | India; city unspecified — Other Indian reference | CC0-1.0 | [kyles](https://freesound.org/people/kyles/sounds/451501/) |

### Traffic and street chaos

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [mumbai-busy-street-traffic-people-221639.mp3](../../../../assets/audio/mumbai/traffic-chaos/mumbai-busy-street-traffic-people-221639.mp3) | 17.6s | Mumbai — Mumbai | CC0-1.0 | [dafiles](https://freesound.org/people/dafiles/sounds/221639/) |
| [mumbai-afternoon-traffic-balcony-585731.mp3](../../../../assets/audio/mumbai/traffic-chaos/mumbai-afternoon-traffic-balcony-585731.mp3) | 150.5s | Mumbai — Mumbai | CC0-1.0 | [seventhsamurai](https://freesound.org/people/seventhsamurai/sounds/585731/) |
| [mumbai-autos-buses-crows-crowd-427384.mp3](../../../../assets/audio/mumbai/traffic-chaos/mumbai-autos-buses-crows-crowd-427384.mp3) | 18.8s | Mumbai — Mumbai | CC-BY-4.0 | [gautamkeswani](https://freesound.org/people/gautamkeswani/sounds/427384/) |
| [indian-heavy-traffic-pedestrians-451514.mp3](../../../../assets/audio/mumbai/traffic-chaos/indian-heavy-traffic-pedestrians-451514.mp3) | 588.6s | India; city unspecified — Other Indian reference | CC0-1.0 | [kyles](https://freesound.org/people/kyles/sounds/451514/) |

### Pedestrians and crowds

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [kolhapur-outdoor-crowd-423510.mp3](../../../../assets/audio/mumbai/pedestrians-crowds/kolhapur-outdoor-crowd-423510.mp3) | 135.4s | Mahalakshmi Temple, Kolhapur, India — Other Indian reference | CC0-1.0 | [Martin.Sadoux](https://freesound.org/people/Martin.Sadoux/sounds/423510/) |
| [bangalore-station-voices-footsteps-263638.mp3](../../../../assets/audio/mumbai/pedestrians-crowds/bangalore-station-voices-footsteps-263638.mp3) | 60.6s | Bangalore railway station, India — Other Indian reference | CC0-1.0 | [Alcappuccino](https://freesound.org/people/Alcappuccino/sounds/263638/) |
| [indian-courtyard-footsteps-voices-637418.mp3](../../../../assets/audio/mumbai/pedestrians-crowds/indian-courtyard-footsteps-voices-637418.mp3) | 86.7s | India; city unspecified — Other Indian reference | CC0-1.0 | [kyles](https://freesound.org/people/kyles/sounds/637418/) |

### Mumbai railway stations

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [mumbai-kurla-station-01-180429.mp3](../../../../assets/audio/mumbai/railway-stations/mumbai-kurla-station-01-180429.mp3) | 25.3s | Kurla station, Mumbai — Mumbai | CC-BY-4.0 | [sankalp](https://freesound.org/people/sankalp/sounds/180429/) |
| [mumbai-kurla-station-02-180430.mp3](../../../../assets/audio/mumbai/railway-stations/mumbai-kurla-station-02-180430.mp3) | 18.1s | Kurla station, Mumbai — Mumbai | CC-BY-4.0 | [sankalp](https://freesound.org/people/sankalp/sounds/180430/) |
| [mumbai-churchgate-train-pa-wheels-566506.mp3](../../../../assets/audio/mumbai/railway-stations/mumbai-churchgate-train-pa-wheels-566506.mp3) | 139.5s | Churchgate, Mumbai — Mumbai | CC0-1.0 | [chhavi](https://freesound.org/people/chhavi/sounds/566506/) |

### Coast, rain, crows and dogs

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [mumbai-marine-drive-night-after-rain-240560.mp3](../../../../assets/audio/mumbai/environment/mumbai-marine-drive-night-after-rain-240560.mp3) | 302.0s | Marine Drive, South Mumbai — Mumbai | CC0-1.0 | [dropctuned](https://freesound.org/people/dropctuned/sounds/240560/) |
| [mumbai-waves-and-traffic-817955.mp3](../../../../assets/audio/mumbai/environment/mumbai-waves-and-traffic-817955.mp3) | 209.3s | Mumbai waterfront — Mumbai | CC-BY-4.0 | [mad_ad13](https://freesound.org/people/mad_ad13/sounds/817955/) |
| [mumbai-crows-rooftop-289657.mp3](../../../../assets/audio/mumbai/environment/mumbai-crows-rooftop-289657.mp3) | 46.0s | Mumbai skyscraper rooftop — Mumbai | CC-BY-4.0 | [The_Sound_Side](https://freesound.org/people/The_Sound_Side/sounds/289657/) |
| [balcony-rainy-night-530101.mp3](../../../../assets/audio/mumbai/environment/balcony-rainy-night-530101.mp3) | 152.7s | Unspecified in uploader description — Location unverified | CC0-1.0 | [DragonOfDoom](https://freesound.org/people/DragonOfDoom/sounds/530101/) |
| [bangalore-dogs-birds-crickets-513828.mp3](../../../../assets/audio/mumbai/environment/bangalore-dogs-birds-crickets-513828.mp3) | 128.8s | Bengaluru, India — Other Indian reference | CC-BY-4.0 | [psubhashish](https://freesound.org/people/psubhashish/sounds/513828/) |

### Work, festivals and celebrations

| Recording | Duration | Recorded location / status | License | Source |
| --- | ---: | --- | --- | --- |
| [mumbai-road-labour-423370.mp3](../../../../assets/audio/mumbai/street-life/mumbai-road-labour-423370.mp3) | 32.0s | Mumbai — Mumbai | CC0-1.0 | [troycavas](https://freesound.org/people/troycavas/sounds/423370/) |
| [mumbai-khar-ganpati-drums-353143.mp3](../../../../assets/audio/mumbai/street-life/mumbai-khar-ganpati-drums-353143.mp3) | 110.5s | Khar, Mumbai — Mumbai | CC-BY-3.0 | [loganbking](https://freesound.org/people/loganbking/sounds/353143/) |
| [mumbai-cricket-celebration-2026-847506.mp3](../../../../assets/audio/mumbai/street-life/mumbai-cricket-celebration-2026-847506.mp3) | 428.2s | Mumbai — Mumbai | CC0-1.0 | [siddharthgovindan](https://freesound.org/people/siddharthgovindan/sounds/847506/) |
