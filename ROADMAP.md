# Civra roadmap

This roadmap is intentionally short. It distinguishes a useful weekend MVP from later product work.

## Milestone 0 — Project foundation (now)

- [x] Separate Civra repository boundary from LiteRT research.
- [x] Define product context, standards, roadmap, and landing README.
- [x] Initialize local Git and a versioned pre-commit policy.
- [x] Connect public GitHub repository.
- [x] Protect `main` and require CI in GitHub settings.
- [x] Scaffold the Tauri shell and install its JavaScript dependencies.
- [x] Verify a clean Windows build after adding the Desktop C++ workload.

## Milestone 1 — Local app shell

- [~] First-launch consent and model-download state UI (visual flow exists; real downloader remains).
- [~] Responsive light/dark chat interface (working; scrollbar and Markdown polish tracked separately).
- [x] Local SQLite session/history layer.
- [ ] Context-budget and local-compaction plumbing.

## Milestone 2 — Reliable local inference

- [x] Approved model-artifact manifest and SHA-256 verification for selected local file.
- [~] LiteRT-LM native bridge, streaming, cancellation, and CPU default (implemented; manual branch acceptance checks remain).
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

UI improvements and acceptance checks are tracked in [the polish backlog](docs/POLISH-BACKLOG.md).
