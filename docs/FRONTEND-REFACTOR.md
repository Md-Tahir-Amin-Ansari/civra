# Frontend refactor boundary

The native-inference feature was merged before this structural cleanup. This branch moves the active inline styles and JavaScript out of `index.html`, replaces the unused scaffold files, and separates state, native persistence, setup, chat streaming, rendering, dialogs, and event bindings. It deliberately does not change model behavior, the approved artifact, SQLite schema, or the release/download workflow.

`main.js` is the composition root. Modules take only the dependencies they need, avoiding hidden access to one giant closure. Tauri commands remain behind `tauri-bridge.js`; browser-preview simulation is isolated in `mockup-controls.js` and is not bound in the desktop app. The stream batcher is an ES module instead of a global script. All assets stay local for offline use.

The test gate is formatting, ESLint, the 16,000-chunk stream regression, frontend behavior tests, and a Windows desktop build. The behavior tests cover first-use setup, saved-model startup and failure recovery, streaming, cancellation, and ordered persistence. They use a simulated DOM/native bridge, so a short manual desktop smoke test is still required before merge.

UI polish from `POLISH-BACKLOG.md`—scrollbar appearance, safe Markdown and tables, and any chart format decision—remains separate from this structural change. Native runtime packaging, installer, and downloader remain on the product roadmap.
