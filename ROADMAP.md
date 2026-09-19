# Civra roadmap

This roadmap is intentionally short. It distinguishes a useful weekend MVP from later product work.

## Milestone 0 — Project foundation (now)

- [x] Separate Civra repository boundary from LiteRT research.
- [x] Define product context, standards, roadmap, and landing README.
- [x] Initialize local Git and a versioned pre-commit policy.
- [ ] Connect public GitHub repository and protect `main`.
- [ ] Scaffold Tauri and verify a clean Windows build.

## Milestone 1 — Local app shell

- [ ] First-launch consent and model-download state UI.
- [ ] Responsive light/dark chat interface.
- [ ] Local SQLite session/history layer.
- [ ] Context-budget and local-compaction plumbing.

## Milestone 2 — Reliable local inference

- [ ] Approved model-artifact manifest and SHA-256 verification.
- [ ] LiteRT-LM native bridge, streaming, cancellation, and CPU default.
- [ ] Experimental GPU setting and reliable fallback.
- [ ] Offline/privacy verification.

## Milestone 3 — MVP release candidate

- [ ] Execute MVP test plan on clean Windows and an additional lower-spec machine.
- [ ] Add Apache-2.0 license, notices, privacy/data-flow documentation, and release instructions.
- [ ] Limited tester feedback and fixes.

## Post-MVP

- Resumable downloads and partial-file recovery.
- Linux packaging and validation.
- More model choices, encrypted history, app lock, export, attachments, updates, and code signing.
