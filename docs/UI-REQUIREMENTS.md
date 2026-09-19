# Civra UI design brief

Use this brief to explore interface directions. It defines product constraints, not a required layout. A concept may replace the current prototype if it satisfies these requirements.

## Product

**Civra — Private Offline AI Chat** is a Windows desktop app for nontechnical, privacy-conscious people who want to chat with a local AI model. After one explicit model download, prompts and responses stay on the user's device. Civra is not a developer console, model manager, or cloud chatbot.

## Design objective

Make local AI feel calm, trustworthy, fast, and easy. A person should understand within a few seconds that the app is private, runs on their device, and is ready to use without learning technical terms.

The interface should feel like a thoughtfully made native desktop app: quiet confidence, clear hierarchy, generous whitespace, and restrained color. Avoid the generic “glowing futuristic AI dashboard” look and avoid an interface that resembles a terminal or developer tool.

## Required screens and states

Design these as one coherent system:

1. **First launch / setup consent**
   - Primary phrase: “Download your private AI”.
   - Clearly state that one approved model is about 2.4 GB.
   - Explain in plain language that internet is needed only for the download and normal chats run locally afterward.
   - A secondary “Details” disclosure can show technical model information; do not lead with model jargon.
   - The user must explicitly choose to begin download.

2. **Download progress and recovery**
   - Visible progress, approximate storage, a clear retry state, and an integrity-checking state.
   - Do not promise resumable downloads in the MVP.

3. **Ready chat**
   - A focused conversation view with a readable message width, streamed-answer state, Stop control, Copy, Retry, and New chat.
   - Local history with simple titles, search, rename, individual delete, and delete-all confirmation.
   - Composer is prominent but not visually noisy.

4. **Settings and honest states**
   - Light and dark themes.
   - “Reliable mode” uses CPU by default.
   - “Faster responses — GPU, experimental” is optional and must not imply it is equally reliable.
   - Clear offline, download-failed, model-check-failed, and GPU-fallback messages.

## Non-negotiable UX rules

- Privacy must be visible but not repetitive or alarmist. Never imply absolute security.
- Plain language in primary flows. Hide terms such as tokens, quantization, backend, and `.litertlm` under Details.
- No emojis as UI controls. Use familiar icons only with a text label or tooltip.
- Accessible keyboard navigation, visible focus states, good contrast, and readable type are required.
- The app should remain visually lightweight and responsive on modest hardware.
- Never suggest cloud inference, accounts, telemetry, plugins, or developer model selection; none exist in the MVP.
- Do not use stock AI imagery, robot heads, lock icons as the main identity, or copied brand marks.

## Visual direction

- Desktop-first Windows application, designed around roughly 1120 × 760 px but graceful at smaller widths.
- A minimalist original “Civra” wordmark/mark is welcome. The letter `C` and a subtle sense of speed are possible cues; do not directly copy a lightning-bolt logo from another product.
- Use a small, purposeful palette with a single confident accent colour and neutral surfaces.
- Treat local history as secondary navigation, not the visual centre of the app.
- Use motion sparingly for progress and streaming; respect reduced-motion preferences.

## Suggested exploration deliverables

Create **three distinctly different directions**, each including first-launch setup and ready-chat desktop mockups:

- Direction A: warm, editorial, calm.
- Direction B: crisp, compact, native-utility.
- Direction C: refined, premium-minimal.

For each direction, show light and dark theme intent, typography hierarchy, colour tokens, sidebar/history behavior, and the empty / generating / error states. Explain how the direction reassures a privacy-conscious nontechnical user.

## Implementation constraints

- Tauri desktop app with vanilla HTML, CSS, and JavaScript.
- Avoid heavy component libraries and Bootstrap.
- The design must be achievable without a permanent network connection or remote assets.
- Existing desktop shell is only a functional prototype, not the desired final visual design.
