# Civra UI functional requirements

## Product context

Civra is a Windows desktop application for nontechnical, privacy-conscious people who want to chat with a local AI model. Its public name is **Civra — Private Offline AI Chat**.

The app uses one approved local model. Internet is required only when the user explicitly starts the first model download. After setup, normal chat must work without network access. Civra has no account, cloud inference, telemetry, plugins, or developer-facing model management in its MVP.

## Required user outcomes

The interface must let a user:

1. Understand that chats are processed locally and that model outputs can be inaccurate.
2. Consent to a one-time model download before any download starts.
3. See that the model needs approximately 2.4 GB of storage.
4. Understand that internet is needed for download and normal chatting works locally afterward.
5. View technical model details only when they deliberately request Details.
6. See download progress, failed-download recovery, and model-integrity-checking feedback.
7. Start a new text chat, send messages, see streamed replies, stop a reply, copy a reply, and retry the latest request.
8. Reopen local chat history, search it, rename a chat, delete one chat, and delete all history with confirmation.
9. Use the app in light and dark themes.
10. Choose between a reliable CPU default and an optional experimental GPU mode, with clear fallback/error feedback.
11. Understand what happened and what to do next when setup, model verification, local inference, or GPU initialization fails.

## Required states

Provide complete designs for:

- First launch before download consent.
- Download in progress.
- Download failure and retry.
- Model verification in progress and verification failure.
- Empty/new chat.
- Active conversation while an answer is streaming.
- Generation stopped by the user.
- Saved-history browsing and search.
- Settings.
- Offline-ready normal chat.
- GPU fallback or GPU unavailable.
- Light theme and dark theme.

## Constraints

- Desktop-first Windows application. Target window is approximately 1120 × 760 px; it must remain usable at smaller desktop sizes.
- The UI must be easy to understand without technical knowledge.
- Primary flows must avoid implementation jargon such as tokens, quantization, backend, and `.litertlm`. Such information may appear under an explicit Details control.
- No emoji may be used as an interface control. If icons are used, they require a text label or tooltip.
- Keyboard navigation, visible focus, readable text, and sufficient contrast are required.
- The UI must be usable on modest hardware and must not depend on a network connection after setup.
- Do not imply that local processing provides absolute security. Do not imply model answers are reliable for important decisions.
- Do not add functions outside the stated MVP: no cloud chat, sign-in, telemetry, plugin store, web search, arbitrary model imports, or developer console.

## Deliverable request

Create multiple clearly different UI concepts that meet all requirements above. For every concept, provide the required states and explain how each user outcome is supported. Do not assume an existing Civra layout, colour system, navigation model, icon, or visual style; those are open design decisions.
