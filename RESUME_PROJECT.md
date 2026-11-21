# Civra — Project Resume & Developer Onboarding Guide

> **Quick status:** The project is in a clean, tested state on branch `feat/context-budget`. All 11 Rust tests and 10 frontend/streaming tests pass. Build caches have been cleared to save disk space, but the entire source code remains intact locally and synced to GitHub.

---

## 1. Project Overview & Architecture

**Civra** is an open-source, private, Windows-first desktop AI chat application. It runs Google's Gemma model locally on the user's PC via Google's LiteRT-LM runtime.

* **Privacy Promise:** 100% offline inference. No cloud accounts, no API keys, no telemetry, no remote servers.
* **Tech Stack:**
  * **Shell & Desktop Framework:** Tauri 2.0 (Rust)
  * **Local Database:** SQLite (stores chats, messages, and setup state locally)
  * **Inference Engine:** LiteRT-LM runtime DLL via custom C/Rust native bridge (`runtime.rs`)
  * **Frontend UI:** HTML5, CSS3, ES modules (clean, lightweight light/dark desktop interface)
  * **Model:** Gemma 4 E2B instruction model (`.litertlm` format, ~2.41 GB)

---

## 2. Current Project State (Where Development Paused)

You paused work on branch `feat/context-budget`. Here is what is working and what was in progress:

### What is 100% Implemented & Verified:
1. **SQLite Session & History Layer (`storage.rs`):**
   * Persists chat titles, messages, message order, and setup status.
   * Full CRUD operations (create, load, rename, delete chats).
2. **Streaming Frame Batcher (`tests/stream-batcher.test.mjs` & `app/src/`):**
   * High-throughput native token streaming is batched to at most 1 append-only DOM update per animation frame.
   * Prevents UI freezing during long (16,000+ token) responses.
3. **Model Verification & Native Bridge (`model.rs`, `runtime.rs`):**
   * Verifies model integrity with uppercase SHA-256 before loading.
   * Thread-safe inference runner with bounded CPU threading (defaults to 8 threads).
   * Stream cancellation support (user can press "Stop").
4. **Context Budgeting Engine (`context.rs`):**
   * *Status:* Native Rust algorithm complete and covered by unit tests.
   * *Mechanism:* Estimates tokens conservatively using UTF-8 byte division (1 token ≈ 3 bytes).
   * *Trigger:* When conversation reaches 12,000 tokens, marks `needs_compaction = true`.
   * *Target:* Identifies the oldest complete user/assistant exchanges to compact down to an 8,000-token retained window, while strictly preserving at least the latest 3 complete exchanges verbatim.

---

## 3. What Needs to Be Done Next (Actionable Roadmap)

When you resume development, pick up directly from these sequential tasks:

### Task 1: Wire Context Compaction into Chat UI / Backend
* **Where:** `app/src-tauri/src/lib.rs` and frontend chat loop (`app/src/main.js`).
* **Next Action:** When `inspect_context_budget` returns `needs_compaction: true`:
  1. Trigger an internal prompt to the local Gemma model to summarize the messages from index `0` through `compact_through_index`.
  2. Replace those older messages in SQLite with the generated summary record.
  3. Keep recent messages untouched so conversational continuity is preserved.

### Task 2: Background Model Downloader
* **Where:** First-launch setup flow (`app/src/` & `src-tauri/src/model.rs`).
* **Next Action:** Replace the mock download state with a real HTTP background downloader:
  * Downloads `gemma-4-E2B-it.litertlm` from the approved distribution source.
  * Shows real progress percentage, supports pause/resume or retry, and validates SHA-256 on completion.

### Task 3: Safe Markdown Rendering Polish
* **Where:** `app/src/render.js` (refer to `docs/POLISH-BACKLOG.md`).
* **Next Action:** Add lightweight, secure Markdown parsing for completed messages:
  * Render headings, bullet lists, code blocks with syntax highlighting, and responsive tables.
  * Ensure zero raw HTML execution or remote image loading.

### Task 4: Packaging & Windows Installer
* **Where:** Tauri configuration (`app/src-tauri/tauri.conf.json`).
* **Next Action:** Build standalone `.msi` and `.exe` installers using `npm run tauri build`.

---

## 4. How to Rebuild After Cleaning Caches

Because `app/src-tauri/target/` was cleaned to save 6.15 GB of disk space, here is how to recreate the build with zero friction:

### Prerequisites:
1. **Rust:** Ensure `cargo` and `rustc` are installed (`rustc --version`).
2. **Node.js:** Node v20+ and npm (`npm --version`).
3. **C++ Tools:** Visual Studio C++ Build Tools (MSVC + Windows 10/11 SDK).

### Rebuild & Run Commands:
```powershell
# 1. Navigate to civra root
cd "C:\personal projects\civra"

# 2. Run unit tests (verifies everything works)
npm run test:stream
npm run test:frontend

cd app/src-tauri
cargo test
cd ../..

# 3. Start development desktop app
npm run tauri dev

# 4. Or build release executable
npm run tauri build
```

---

## 5. Important Document Locations

* **Full Architecture Guide:** [`docs/research/civra_architecture_explainer.md`](file:///C:/personal%20projects/civra/docs/research/civra_architecture_explainer.md)
* **Benchmark & Feasibility Data:** [`docs/research/feasibility_report.md`](file:///C:/personal%20projects/civra/docs/research/feasibility_report.md)
* **Engineering Standards:** [`STANDARDS.md`](file:///C:/personal%20projects/civra/STANDARDS.md)
* **Roadmap & Milestones:** [`ROADMAP.md`](file:///C:/personal%20projects/civra/ROADMAP.md)
* **UI Polish Backlog:** [`docs/POLISH-BACKLOG.md`](file:///C:/personal%20projects/civra/docs/POLISH-BACKLOG.md)
* **Frontend Modular Structure:** [`docs/FRONTEND-REFACTOR.md`](file:///C:/personal%20projects/civra/docs/FRONTEND-REFACTOR.md)
* **Runtime Packaging Guide:** [`docs/LITERT-RUNTIME-PACKAGING.md`](file:///C:/personal%20projects/civra/docs/LITERT-RUNTIME-PACKAGING.md)
