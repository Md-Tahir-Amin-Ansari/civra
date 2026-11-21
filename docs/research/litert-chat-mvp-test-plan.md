# Civra MVP Test Plan

## 1 Scope

This is the executable test plan for the MVP described in `litert-chat-mvp-srs.md`. Deferred features are not MVP pass/fail criteria. They are listed separately so they are not forgotten.

## 2 Test environments

- Windows research machine: Ryzen 5 7520U, 16 GB RAM, integrated Radeon graphics.
- At least one additional lower-spec supported Windows machine before limited release.
- Linux is a post-MVP validation target; it is not an MVP release gate.
- A clean Windows user profile or VM for installation and first-launch tests.

Record OS build, app/runtime version, model SHA-256, backend, free storage, and whether network is enabled for every failed case.

## 3 MVP release-blocking tests

| ID | Area | Test | Expected result |
| --- | --- | --- | --- |
| T-01 | Installation | Install on a clean supported Windows profile. | No Python or developer prerequisite is requested. |
| T-02 | Setup | Decline model download. | App explains that chat is unavailable; no model transfer begins. |
| T-03 | Setup | Download model normally. | Progress is visible; SHA-256 verifies before chat opens. |
| T-04 | Setup | Interrupt download, then retry. | Retry starts a clean download; incomplete file is never loaded. |
| T-05 | Integrity | Alter model bytes before loading. | App rejects model with a clear recovery action. |
| T-06 | Chat | Send ordinary English and Hindi prompts. | Streamed useful response appears in the active chat. |
| T-07 | Context | Ask a follow-up that depends on the prior turn. | Model receives current-chat context only. |
| T-08 | Stop | Stop during response, then send another prompt. | UI stays responsive and next response succeeds. |
| T-09 | Retry | Retry latest prompt. | New answer is associated with correct session; prior data is not corrupted. |
| T-10 | History | Restart app, rename/search/delete a chat. | Expected data persists and deleted chat cannot reopen. |
| T-11 | Deletion | Delete all history and restart. | No deleted sessions remain accessible. |
| T-12 | Oversized input | Paste content beyond safe context budget. | App declines or offers local shortening; engine does not crash. |
| T-13 | Backend | Force or simulate GPU failure. | CPU fallback or actionable error; app remains usable. |
| T-14 | Offline | Disable network after verified setup. | Normal chat completes; no network dependency or cloud fallback occurs. |
| T-15 | Privacy | Monitor connections during ordinary local chat. | No outbound network connection is made. |
| T-16 | Recovery | Close app during generation and restart. | App starts; previous completed history remains readable. |
| T-17 | Context compaction | Continue a conversation until it crosses the pre-compaction threshold. | Older turns are summarized locally; recent turns stay verbatim; the chat remains coherent and usable. |
| T-18 | UI | Switch light/dark theme, use labelled icons, and navigate the primary chat flow. | Theme persists, controls remain understandable, and no emoji are used as UI controls. |
| T-19 | Backend policy | Start in default settings and inspect the selected backend. | CPU is the reliable default; GPU is clearly identified as experimental when selected. |
| T-20 | Artifact allowlist | Attempt to substitute a same-named or unapproved model artifact. | The app rejects it unless its approved revision and SHA-256 match. |

## 4 Performance and usability checks

These are measurements, not hard release thresholds until multiple target machines are tested.

- Record first-launch download time, disk footprint, initial engine load, first token, and sustained decode speed.
- Compare CPU and GPU on the same prompt with the rest of the machine idle.
- Have at least five nontechnical testers install, chat, find history, and delete history without help.
- Ask testers what stays local, what needs internet, and whether model answers can be wrong.
- Verify that first-launch copy says “Download your private AI,” shows the approximate storage required, and keeps technical model details behind Details.

## 5 Evidence requirements

- Save terminal/runtime logs for every failure.
- Record screenshots or a short video for each completed end-to-end flow.
- Keep model hash, app build, and test environment next to results.
- Update `research/feasibility_report.md` for runtime discoveries; record app acceptance results in a dated test-results file.
- Keep the approved model repository, revision, filename, SHA-256, LiteRT-LM version, and verified context ceiling in the release record.

## 6 Post-MVP validation backlog

These are intentionally excluded from MVP release gating:

- Resumable HTTP Range downloads, partial-file recovery, pause, and bandwidth handling.
- E4B quality/performance comparison and multiple-model support.
- Linux packaging, inference, accelerator fallback, and privacy checks.
- Encrypted history, application lock, export, attachments, multimodal input, updates, rollback, and code signing.
- Long-running cancellation/restart soak, thermal behavior, and large-context stress testing beyond the MVP safe ceiling.
