# Civra engineering and agent standards

## Source of truth

Read `CONTEXT.md`, this file, and the relevant issue or task before making a change. If facts conflict, stop and resolve the conflict in `CONTEXT.md`.

## Commit discipline

- Work on a named branch. `main` is integration-only.
- Every substantive commit must stage an update to `CONTEXT.md`; the repository hook enforces this locally.
- Keep commits small and coherent. Use imperative subjects, for example `Add setup consent screen`.
- Do not bypass hooks. If a rule is wrong, change the rule in a reviewed commit.

## Quality

- Add or update a test for changed behavior when practical.
- Run formatting, linting, and relevant tests locally before commit.
- CI must pass before merge.
- Record exact commands and observed results for runtime/performance claims.

## Privacy and security

- Local inference is a product invariant: never silently use remote inference.
- No telemetry, analytics, accounts, cloud sync, or background network actions in the MVP.
- Never commit secrets, tokens, user chats, model files, runtime caches, or machine-specific paths.
- Verify an approved model artifact by pinned revision and SHA-256 before loading it.
- Bind any optional local service loopback-only, never a public interface by default.

## User experience

- Prefer plain language; hide implementation jargon behind an explicit Details affordance.
- Keep the UI minimal, responsive, keyboard-accessible, and usable in light and dark themes.
- Do not use emoji as interface controls. Use familiar icons with text labels or tooltips.
- Error states must say what happened, what was not affected, and a recovery action.
- Never overstate model accuracy, privacy, hardware support, or performance.

## Architecture

- Keep inference behind a small app-owned boundary; do not parse CLI presentation output as a product protocol.
- Use SQLite for local history; apply migrations and preserve prior data.
- CPU is default reliable mode. GPU is experimental and must have clear fallback behavior.
- Compact context locally before the safe budget; do not hand unchecked oversized context to the engine.

## Documentation

- Update `README.md` for user-facing scope changes.
- Update `ROADMAP.md` when milestones move.
- Update `CONTEXT.md` for decisions, evidence, risks, and current work.
- Keep third-party and model-license notices complete before distributing a build.
