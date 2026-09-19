# LiteRT-LM runtime staging

This document is for Civra release maintainers. It is not an end-user setup guide.

## Decision

Civra uses LiteRT-LM `0.17.1` through its native Windows shared library,
`litert-lm.dll`. Civra users do **not** install Python, pip, or the LiteRT-LM
CLI. The DLL is staged into a release build and loaded by Civra at runtime.

The DLL is deliberately ignored by Git. Its source package and binary checksum
are pinned so a release build cannot silently accept a different runtime.

| Item              | Pinned value                                                       |
| ----------------- | ------------------------------------------------------------------ |
| LiteRT-LM version | `0.17.1`                                                           |
| DLL file          | `litert-lm.dll`                                                    |
| DLL SHA-256       | `0D6C933000245E86F53F591E38104B434DC77B516C7B6912C82F1B00C73BF191` |

## Stage a release runtime

1. Obtain the official `litert-lm==0.17.1` Windows distribution in an isolated
   maintainer environment. Python may be used only at this build-maintenance
   step; it is never a Civra end-user dependency.
2. Locate its `litert_lm\litert-lm.dll` file.
3. From the repository root, run:

   ```powershell
   .\scripts\stage-litert-runtime.ps1 -Source 'C:\path\to\litert-lm.dll'
   ```

4. Build the installer. The staging script refuses an unexpected runtime hash.
5. Before publishing, include the LiteRT-LM Apache-2.0 notice and audit every
   additional shipped runtime dependency.

## Non-negotiable safeguards

- Never commit the DLL, model artifacts, downloaded wheels, local databases, or
  installer output.
- Do not use LiteRT-LM's raw-file-descriptor model-loading API on Windows.
  Civra's bridge uses file paths.
- Do not replace the pinned DLL independently of a bridge compatibility test,
  checksum update, and release-notice review.
- A missing or incompatible runtime must result in a clear local error, never a
  cloud fallback.
