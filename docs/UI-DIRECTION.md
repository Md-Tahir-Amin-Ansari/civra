# Provisional UI direction

## Decision

Use the Claude mockup as a reference for information architecture and state coverage, while using a DeepSeek-derived teal and neutral palette for the Civra desktop shell.

This is a reference decision, not a license to copy third-party mockup source code or visual assets.

## Adopted principles

- A desktop chat-history sidebar with search and simple grouped history.
- A restrained top bar that states the current chat and local execution state.
- A focused, readable chat workspace and prominent composer.
- Setup, verification, offline, and GPU fallback must remain first-class states as implementation grows.
- Teal is the single primary action/status colour; cool neutrals support it.
- Newsreader is limited to display headings. Atkinson Hyperlegible is the UI/body face.

## Explicit exclusions

- No runtime Google Fonts request.
- No resumable-download wording or behavior in the MVP.
- No mockup review controls, demo simulation controls, copied icons, or copied logo assets.
- No technical jargon in primary user flows.

## Accessibility and localization

- Primary teal is darkened to `#087A66` so white button text has stronger contrast than the original reference accent.
- `Segoe UI` and `Nirmala UI` remain fallbacks. The bundled Latin typefaces do not replace Windows fallback glyphs for Hindi/Devanagari text.
