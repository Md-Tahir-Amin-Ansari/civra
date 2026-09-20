# UI polish backlog

These are observed or requested improvements, not acceptance criteria for the current native-inference branch unless a defect blocks basic chat use. Keep scrolling functional and avoid weakening the offline/privacy promise while addressing them.

## Before the MVP release

- **Unnecessary or visually intrusive scrollbars:** Audit setup, sidebar, chat, and settings at normal, maximized, and smaller window sizes. Remove accidental overflow; make necessary scrolling visually unobtrusive without hiding the ability to scroll by wheel, touchpad, keyboard, or touch. Preserve visible keyboard focus and accessibility.
- **Safe Markdown replies:** Render common model output such as paragraphs, headings, lists, emphasis, links, fenced code, and Markdown tables. Do not execute raw HTML, scripts, remote images, or network-loaded content. Streaming must remain readable while the Markdown is incomplete, and saved replies must render the same after restart. Tables should scroll within the message on narrow windows, not create whole-window horizontal overflow.

## Evaluate separately

- **Charts and diagrams:** Ordinary Markdown has no standard chart syntax. First collect examples of what the approved model actually emits. Preserve unsupported output as readable text or code; only add a chart renderer if there is a well-defined, safe local format and a useful test case. Do not infer a chart from arbitrary prose.

## Current native-inference branch acceptance checks

- On startup, the saved model loads with an animated status and the window remains responsive; it does not hash the full file again. Native model initialization may still take time.
- Send a normal prompt, then a follow-up that depends on the first answer; both stream and the follow-up uses only that chat's context.
- Stop a longer reply, then send another prompt. The app should not hang or retain a stuck generation state.
- Close and reopen the app. Existing chats remain intact, a fresh blank chat opens, and the saved model is reused from disk without another file-picker or download.
- With the internet disconnected, restart and chat successfully. No prompts or replies require a network service.

Installer/download flow, GPU fallback, context compaction, release packaging, and full MVP test-plan execution remain separate milestones.
