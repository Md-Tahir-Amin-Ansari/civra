# LiteRT Chat MVP Software Requirements Specification

## 1 Purpose

Build Civra, a small Windows-first desktop chat application that lets a nontechnical user run one curated Gemma 4 E2B model locally through LiteRT-LM. Its public descriptive title is **Civra — Private Offline AI Chat**. The application is an offline-first private writing and explanation assistant, not a developer model manager.

## 2 Product boundary

### In scope for the MVP

- Windows 11 x64 desktop application. The core must avoid Windows-only assumptions so Linux packaging can follow.
- One bundled LiteRT-LM runtime and one curated E2B `.litertlm` model.
- Text-only chat with streamed responses, Stop, Copy, Retry, and New chat.
- Local session history: automatic title after first exchange, manual rename, search, single-chat delete, and delete-all confirmation.
- Local inference only; no account, remote inference, cloud sync, telemetry, tools, or plugins.
- First-launch setup that downloads the model once, shows required storage and progress, verifies SHA-256, and retries a failed download from the beginning.
- Automatic CPU/GPU choice using a measured compatibility policy, with CPU fallback.
- Light and dark themes, a clean minimalist interface, and familiar accessible icons with labels/tooltips. Do not use emoji in the interface.
- Public source code under Apache-2.0, with dependency notices, model-artifact details, and a privacy/data-flow document.
- A small public project landing page that plainly explains offline processing, current scope, system expectations, installation/release status, source availability, and model/license notices without analytics or misleading claims.

### Explicitly deferred

- Resumable download. A failed model download may restart from zero in the MVP.
- E4B selection, multiple models, importing arbitrary model files, and model conversion.
- Linux packaging and formal Linux compatibility validation, although the runtime architecture must not preclude it.
- Encrypted history, app lock, export, attachments, multimodality, branching, updates, and automatic update checks.

## 3 User promise and disclosures

- Prompts and responses are processed locally; the application must never silently fall back to cloud inference.
- Downloading the model is an explicit online action. MVP has no background update check.
- Local processing does not protect chats from malware, device users, backups, or an unlocked Windows account.
- The assistant can be wrong. The interface must not claim professional medical, legal, or financial reliability.
- Users are responsible for how they use outputs. The application must state that outputs may be inaccurate or harmful, must be verified for important decisions, and must not be used for prohibited or unlawful purposes. This product disclosure does not replace future legal review or terms of use.

## 4 Functional requirements

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-01 | First launch says “Download your private AI” and shows the approximate 2.4 GB requirement before requesting consent. Technical model details are available through a Details link. | No network model download starts before the user chooses Continue. |
| FR-02 | The application downloads the exact curated model and verifies its SHA-256 before use. | A mismatched file is rejected and cannot be loaded. |
| FR-03 | A user can create and continue text chats. | Messages stream into the active chat and use only that chat's context. |
| FR-04 | A user can stop generation. | Stop leaves the UI usable and a later request can complete. |
| FR-05 | A user can retry the latest request. | Retry creates a replacement assistant response without corrupting the session. |
| FR-06 | Sessions persist locally across restart. | A user can reopen, rename, search, and delete chats. |
| FR-07 | A user can delete all stored history after confirmation. | Deleted chats no longer appear or load. |
| FR-08 | Normal chat works without network access once setup is complete. | A disconnected-network test completes a chat. |
| FR-09 | Reliable mode uses CPU by default. Settings may offer “Faster responses — GPU, experimental”; a GPU failure falls back to CPU or reports a clear recovery action. | The application never becomes unusable because GPU initialization fails. |
| FR-10 | The application enforces a conservative context budget. | A too-long paste is declined or shortened with a clear explanation, never passed to the engine unchecked. |
| FR-11 | The project publishes a clear, static landing page for Civra — Private Offline AI Chat. | A visitor can understand what is local, what needs internet, MVP limits, and where to inspect the source without an account or tracking. |

## 5 Nonfunctional requirements

- The installer must not require Python, Git, or developer tooling.
- Installation and first-run language must be understandable to a nontechnical user; a user must be able to reach chat without developer documentation.
- The application shell must remain responsive and feel lightweight. Model generation speed is measured separately from UI responsiveness.
- No telemetry or background network activity in the MVP.
- History writes must be atomic enough that an app exit cannot corrupt all prior chats.
- UI language uses ordinary terms: do not expose tokens, quantization, or backends in the primary flow.
- Failures must present an actionable message and preserve unaffected local history.

## 6 Architecture decisions

### Inference boundary

Use LiteRT-LM's versioned native API through a small application-owned bridge. The CLI remains a research and diagnostic tool only because its stdout is presentation text, not a durable structured event protocol. Use Tauri with vanilla HTML, CSS, and JavaScript rather than Bootstrap, to keep the dependency surface and visual weight small.

### History storage: SQLite

SQLite is the MVP choice because it is embedded (no database service or account), transactional, portable, mature, and accessible from Tauri/Rust. It naturally represents sessions, messages, titles, timestamps, search indexes, and later branching through relational tables and migrations.

JSON files would be simpler initially, but become fragile for atomic writes, search, partial deletion, schema changes, and growing histories. IndexedDB would couple durable user data to the webview implementation rather than the native application. SQLite does not provide encryption by itself; encrypted storage is explicitly deferred.

### Model downloading

MVP owns model selection, user consent, destination, SHA-256 verification, and retry. It does not promise resume. Resumable Range-based transfer and partial-file recovery are post-MVP requirements because the current LiteRT-LM CLI downloader cannot supply them.

### Context policy

The verified technical ceiling on the research machine is 16K conversation tokens. Civra must begin local compaction before 12K tokens, preserve recent turns verbatim, and prepend a local summary of older turns. The compacted summary belongs only to its source session. The 32K artifact setting is not an MVP target because it exceeded the runtime deadline during testing.

### Open source and identity

Civra is a personal, noncommercial, open-source project. Apache-2.0 is the proposed code license. The name is a working public identity, not a claim that trademark clearance or company registration has occurred. Product pages, repository description, installer metadata, and store listings must use the descriptive phrase “Private Offline AI Chat” for discoverability.

## 7 Known performance evidence

On the research Windows machine (Ryzen 5 7520U, 16 GB RAM), Gemma 4 E2B completed cleanly on CPU and integrated GPU. CPU had better initialization and first-token latency; GPU had higher sustained decode speed. The exact figures and conditions are in `research/feasibility_report.md`. The application must use a conservative CPU-first policy until more machines are tested.

## 8 Release gate

An MVP candidate is ready for limited testers only when every MVP test-plan release-blocking case passes, licenses/notices are included, model integrity is verified, and the actual network behavior matches the privacy disclosure.
