# Civra desktop frontend

Tauri serves `src/index.html` and its local CSS/ES modules. The UI does not use a bundler or fetch code, fonts, or data from the network.

- `index.html`: document shell only.
- `styles.css`: active styles and local font declarations.
- `main.js`: bootstraps the app and composes its controllers.
- `state.js`: in-memory state, constants, and browser-preview sample data.
- `tauri-bridge.js`: native commands and ordered chat persistence.
- `setup-controller.js`, `chat-controller.js`: setup and streaming behavior.
- `setup-view.js`, `sidebar-view.js`, `chat-view.js`, `settings-view.js`, `views.js`: HTML rendering and targeted DOM updates.
- `dialogs.js`, `event-bindings.js`: dialog state and delegated interactions.
- `mockup-controls.js`: browser-preview controls only; never bound in Tauri.
- `stream-batcher.js`: one append-only native stream flush per animation frame.

The old scaffold `main.js` and `styles.css` are gone; these filenames now contain the active implementation. Browser preview requires a local HTTP server because `main.js` is an ES module; opening `index.html` via `file://` is not supported. The desktop app uses Tauri's local asset scheme.

From the repository root, run `npm run format:check`, `npm run lint`, `npm run test:stream`, and `npm run test:frontend`. The frontend tests use Happy DOM only during development; it is not bundled with the app.
