# Civra project context

## Current status

**Milestone:** 1 — local app shell

**Current objective:** validate the desktop shell and build the local-first MVP incrementally.

## Product in one sentence

Civra — Private Offline AI Chat is a Windows-first, noncommercial, open-source desktop app for nontechnical users to chat locally with one curated LiteRT-LM model.

## Locked MVP decisions

- Windows 11 x64 first; do not introduce Windows-only core assumptions. Linux packaging is deferred.
- Tauri with vanilla HTML, CSS, and JavaScript; no Bootstrap.
- One approved Gemma 4 E2B LiteRT-LM artifact only. Do not allow arbitrary imports or conversion.
- SQLite stores local history. Encryption, export, and app lock are deferred.
- CPU is the reliable default. GPU is optional and explicitly experimental.
- Light and dark themes; clean, minimalist, lightweight interface; icons need labels/tooltips; no emoji controls.
- The first setup says “Download your private AI,” shows approximate storage, and reveals technical model terminology only under Details.
- Begin local context compaction before 12K conversation tokens; preserve recent turns verbatim.
- The product is Apache-2.0 planned, personal, noncommercial, and open source.

## Evidence already collected

Research lives separately in `C:\personal projects\litert-test` so it remains an independent, reproducible lab record.

- LiteRT-LM 0.17.1 and the approved Gemma 4 E2B artifact ran fully offline.
- Exact tested artifact SHA-256: `181938105E0EEFD105961417E8DA75903EACDA102C4FCE9CE90F50B97139A63C`.
- On Ryzen 5 7520U / 16 GB / integrated Radeon: CPU was better for initialization and first token; GPU had higher sustained decode but needs an experimental fallback policy.
- End-to-end context tests passed at 4K, 8K, and 16K; a 32K run did not complete within 10 minutes. 16K is the proven ceiling, not a promise of 32K.
- The official CLI downloader does not support resuming. Download resume is post-MVP; model SHA-256 verification is MVP-required.

Detailed source evidence: `C:\personal projects\litert-test\research\feasibility_report.md`.

## Working rules

1. Update this file in every substantive commit: state the new decision, evidence, unresolved risk, or next step.
2. Do not commit directly to `main`; use a named branch and pull request after GitHub is connected.
3. Run the relevant local checks before committing. CI is required for every pull request.
4. Never add model files, downloaded runtime assets, credentials, local databases, or generated release artifacts to Git.
5. Do not claim privacy, compatibility, performance, or a context limit without recorded evidence.

## Next steps

1. Replace the simulated setup flow with an approved local-model selection flow.
2. Integrate LiteRT-LM CPU inference and stream genuine local replies into the existing chat UI.
3. Define a versioned approved-artifact manifest and implement verified download.
4. Add context-window tracking and compaction before the 12K-token threshold.

## Open risks

- Windows native build tooling may be missing; verify before committing to a packaging timeline.
- LiteRT-LM native bridge design and redistribution packaging are not yet validated.
- Civra is a working name; public launch needs an availability/trademark review.

## Latest change

- Milestone 0 foundation was committed locally as `a9578f8`. Git attributes keep the versioned shell hook in LF format so it executes reliably on Windows Git installations.
- Public remote connected: `https://github.com/Md-Tahir-Amin-Ansari/civra`; protected `main` is now the integration branch.
- CI quality gate: GitHub Actions checks required project/context files and Prettier formatting. Future behavior changes must add focused automated tests before merge; test infrastructure will be added with the implementation it validates.
- CI formatting correction: enforce LF line endings for repository text files. Windows CRLF working copies previously masked Prettier differences that the Linux GitHub runner correctly rejected.
- Tauri 2 vanilla-JavaScript shell scaffolded in `app/` on `feat/desktop-shell`; npm dependencies installed with zero reported npm vulnerabilities. Visual Studio's installer exists, but the C++ linker (`cl.exe`) is absent from this environment, so the first native Windows build remains blocked pending the Desktop C++ workload.
- Desktop-shell sources were brought to the mandatory Prettier baseline after rebasing onto the foundation quality gate; `npm run format:check` passes.
- Provisional UI direction selected: Claude-inspired information architecture with a DeepSeek-derived teal/neutral palette. Newsreader and Atkinson Hyperlegible are bundled as local OFL-1.1 assets; no runtime font request is permitted.
- User-provided UI mockup HTML files are reference-only artifacts and are excluded from automated formatting and commits.
- Desktop-shell UI corrected: the Claude reference is the actual structural baseline; only its colour system, local font delivery, and non-MVP resumable-download behavior are changed. Retry starts a clean download, as required for MVP.
- Native build bootstrap: Cargo’s sparse registry metadata route returned a temporary proxy 503, so the official Git-index fallback was used successfully. The Tauri capability configuration referenced an unavailable `opener:default` permission; it now grants only `core:default` until a real opener integration is added.
- Native desktop shell verified: `cargo build --no-default-features` succeeds and the local `civra-desktop.exe` launches. Generated Tauri schemas are ignored by formatting checks; the generated Cargo lockfile is versioned for reproducible desktop builds.
- Native-shell visual correction: Civra uses the Windows-provided title bar only; the reference mockup's in-page title bar is hidden. The shell root now fills the native content area with percentage sizing (rather than a constrained stage plus `100vw`), preventing the left gutter and horizontal overflow when maximized.
- Local-history foundation: Civra now stores chats and messages in a local SQLite database through native Tauri commands. The visible UI loads saved chats at startup (opening the most recent saved chat when one exists) and persists send/reply completion, rename, single delete, and delete-all actions. `rusqlite` is bundled, so users do not need a separate SQLite installation. Rust unit tests cover save, load, rename, delete, and message-role validation; LiteRT-LM replies are still simulated.
- Persistence follow-up in progress: database inspection confirmed that a user chat and reply were written correctly. Startup hydration is being made tolerant of both camelCase and snake_case timestamp payloads so a display-format mismatch cannot prevent a saved chat from rendering.
- UI exploration is intentionally separated from runtime work. `docs/UI-REQUIREMENTS.md` is a neutral, functional source brief for comparing external design concepts before committing to a final visual direction; it intentionally does not prescribe layout or visual style.
