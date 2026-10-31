# Licensing and Attribution Notice

## Original game code

The original game code currently has no open-source license. The `UNLICENSED` marker in `package.json` records that status; it is not a new license grant. Public repository access and contribution instructions do not establish permission to reuse the code under an open-source license.

This notice does not replace the terms of any third-party material. Questions about permissions can be raised through the project support process before reusing material whose terms are unclear.

## Audio

The research collection contains Freesound recordings distributed under individual CC0 1.0, CC BY 4.0, or CC BY 3.0 terms. The stored source files are high-quality MP3 previews; they are not the original lossless masters.

- [Full attribution](assets/audio/mumbai/ATTRIBUTION.md)
- [Source, license, size, and checksum manifest](assets/audio/mumbai/manifest.json)
- [License texts](assets/audio/mumbai/licenses/)
- [Research and source-location notes](docs/research/mumbai/audio/README.md)

Four edited excerpts are shipped in the game. Their [deployed credits](public/audio/credits.html) identify the source, license, and changes. Preserve these credits and the accompanying license texts when redistributing the excerpts. CC BY material requires attribution and disclosure of modifications.

The separate [Mumbai character voice pack](assets/audio/mumbai/voices/README.md) contains 119 ElevenLabs recordings generated on a free account. These require **non-commercial use and ElevenLabs attribution** under the provider's terms; they are not Creative Commons recordings. Paid library voices and voice cloning were not used. The production manifest preserves the selected free presets, script, model, settings, dates and file hashes. See the [ElevenLabs terms](https://elevenlabs.io/terms-of-use) and keep the deployed attribution with these assets.

## Map reference

The municipal reference illustration is derived from DataMeet's Mumbai ward dataset under **CC BY-SA 2.5 India**. Its source, scope, attribution, and derivative terms are documented in the [map-reference notes](docs/research/mumbai/README.md).

The runtime street network is independently authored gameplay geometry. Municipal polygons are not included in the game bundle.

## Artwork

The [Mumbai auto rickshaw](assets/vehicles/mumbai-auto/README.md) is original Blender geometry created for this project. Its editable source and runtime GLB contain no third-party meshes or textures. Visual reference provenance and the export contract are recorded with the asset; no separate reuse license is granted.

The landing image, gallery previews, and storyboards are generated concept artwork created for this project. See the [storyboard provenance](docs/storyboard/README.md#image-provenance) for the source context. They are promotional and design references; a separate artwork reuse license has not been declared in this repository.

## Fonts and software dependencies

Barlow Condensed and DM Sans are served through Fontsource and use the **SIL Open Font License 1.1**. Their full notices are included in the installed `@fontsource/barlow-condensed` and `@fontsource/dm-sans` packages.

React, Three.js, Vite, Lucide, test tooling, and other dependencies retain their own licenses. Consult the installed packages and the versions recorded in `package-lock.json` for the applicable notices. A dependency's license does not establish a license for the original game code.

## When adding or changing assets

Record the creator, original source, exact license, and modifications. Keep full license texts when required, update the relevant manifest, and ensure deployed derivatives retain their credits. Do not assign an existing asset's license to unrelated material.
