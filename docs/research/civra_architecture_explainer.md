# Civra architecture — plain-English guide

This is a study note, not a product document. It lives in the separate LiteRT
research folder so it does not affect Civra's release repository or users.

## The short version

Civra will be one Windows desktop application. There is no web server, cloud
backend, account, or remote API between the person typing a message and the AI
model.

```text
You
  ↓ type a message
Civra window (HTML / JavaScript)
  ↓ local command
Civra native app code (Rust)
  ↓ small translation layer, called the “native bridge”
LiteRT-LM engine DLL (Google's fast model runner)
  ↓ CPU, or later optional GPU
Gemma model file on this PC
  ↓ generated text pieces travel back up the same path
Civra window updates while the answer is being written
```

Everything after the Civra window runs on the same computer. The arrows are
function calls and in-memory messages, not network traffic.

## What each part does

### 1. The visible Civra window

This is the chat screen: sidebar, saved chats, message box, settings, light and
dark themes. It is made with HTML, CSS, and JavaScript because those tools are
excellent for a clean desktop interface.

It **does not** run the AI model. It asks the native Civra code to do that and
shows the answer as it arrives.

### 2. The native Civra app code

This is written in Rust and packaged by Tauri into the Windows application.

Its jobs are deliberately practical:

- store chat history in the local SQLite file;
- verify that the approved model file has not been damaged or replaced;
- find and verify the local LiteRT-LM runtime;
- start/stop the model engine;
- send a user's message to the engine;
- pass generated text back to the visible chat screen;
- keep errors understandable (for example, “model file is missing”).

Rust is not a separate backend server. It is the trusted local part of the same
desktop program, used for filesystem access, SQLite, and high-performance
native calls that a browser-style UI cannot safely make by itself.

### 3. LiteRT-LM

LiteRT-LM is the actual inference engine. It is a Windows DLL: a compiled
library containing performance-critical C/C++ code. It reads the Gemma model
file and performs the mathematical work that produces tokens.

This is where most generation speed is decided: model architecture,
quantization, CPU/GPU support, memory bandwidth, and drivers matter far more
than Civra's UI code.

### 4. The approved model artifact

For the MVP, Civra accepts one exact Gemma 4 E2B LiteRT-LM file. Civra checks
its size and SHA-256 fingerprint before using it. That prevents a half-finished
download or random incompatible model from becoming a mysterious crash.

## What “native C API” and “bridge” mean

The LiteRT-LM DLL exposes named functions written for the C language, such as:

```text
create engine
create conversation
send message and stream response
cancel current response
destroy engine
```

Rust cannot automatically call those functions because it needs to know their
exact inputs and outputs. Civra's **native bridge** is a small, carefully
tested Rust module that describes those functions and calls them safely.

Think of it as a correctly labelled electrical adapter:

- Civra speaks Rust and desktop-app events.
- LiteRT-LM speaks the C API defined by its DLL.
- The bridge converts between them without converting the model or modifying
  its computations.

The bridge has no AI intelligence of its own. It should be thin, boring, and
well-tested. Keeping it small is both faster and safer.

## How a normal reply will work

1. The user presses Send.
2. Civra immediately saves the user's text locally and displays it.
3. The native code sends the message and relevant recent conversation context
   to the existing LiteRT-LM conversation.
4. LiteRT-LM generates small response pieces (“chunks”).
5. The bridge relays each chunk directly to the UI.
6. The UI appends those chunks on screen, so the answer appears progressively.
7. When the engine marks the response complete, Civra saves the final assistant
   message in SQLite.

Stopping a response sends a local cancellation request to the same engine. It
does not require a network call.

## Why the engine must stay loaded

Loading a multi-gigabyte model takes noticeable time and memory. Loading it for
every single message would make Civra feel slow even if generation itself were
fast.

The intended design is therefore:

```text
Open Civra → verify model → load one CPU engine → create/reuse conversation
→ stream many replies → release engine when Civra exits
```

The engine is kept alive while the app is open. A fresh chat gets a fresh
conversation state, but should reuse the already-loaded model engine.

## Performance rules Civra will follow

These are choices under Civra's control. They aim to avoid adding avoidable
delay around LiteRT-LM's own work.

1. **Keep the native bridge thin.** Do not put token-by-token processing,
   markdown rendering, database writes, or large JSON copies on the engine's
   hot path.
2. **Stream immediately.** Forward response chunks to the UI as received;
   never wait for the complete answer before showing it.
3. **Keep the engine warm.** Load the model once per app session, not per turn.
4. **CPU first.** CPU is the currently proven reliable path. GPU remains an
   opt-in experimental setting with a clean CPU fallback.
5. **Do not block the UI.** Inference runs off the UI event loop, keeping the
   window responsive while a reply is generated.
6. **Use a bounded context.** Civra will begin compacting older conversation
   material before the proven 16K context window is exhausted. More context
   means more prefill work and slower time to first token.
7. **Save intelligently.** Persist final messages transactionally. Do not make
   SQLite disk work hold up text streaming.
8. **No cloud fallback or telemetry.** Apart from privacy, avoiding hidden
   network calls prevents latency surprises and makes offline behaviour real.
9. **Measure on weaker hardware.** A fast office PC is useful, but acceptance
   decisions must include the lower-spec target machine.

## What we have already proven

- The approved E2B LiteRT-LM model initialized on CPU at a 16K setting and was
  released cleanly.
- The official runtime DLL exposes the engine, conversation, streaming, and
  cancellation functions Civra needs.
- Civra now verifies the exact approved model checksum.
- Civra now detects whether its native runtime DLL is missing or incompatible
  before it tries to use it.

## What is still being built

- A persistent loaded-engine manager in Civra's native code.
- A conversation manager that keeps each chat's local context separate.
- Streaming events from LiteRT-LM into the visible chat UI.
- Cancel/stop behaviour.
- Replacing the prototype's simulated download and sample reply behaviour with
  the verified real setup and local inference flow.
- Context tracking and compaction before the 16K proven limit.
- Release packaging, required notices, and clean-machine testing.

## Vocabulary

| Term | Meaning here |
| --- | --- |
| DLL | A compiled Windows library used by an app. LiteRT-LM is delivered this way. |
| C API | A stable set of named functions a native DLL offers to other programs. |
| Bridge | Civra's small Rust translator that calls the LiteRT-LM C API safely. |
| Engine | The loaded model runner, held in memory while Civra is open. |
| Conversation | A chat-specific context state managed by the engine. |
| Streaming | Sending partial generated text to the UI as soon as it is available. |
| Prefill | Processing the conversation context before generating the first new token. |
| Token | A small unit of model text; it is not exactly the same as a word. |
| SHA-256 | A file fingerprint used to check that an expected file is complete and unchanged. |

## One important boundary

Civra cannot make the model intrinsically faster than LiteRT-LM, the selected
model, and the PC allow. It *can* avoid wasting that speed through a warm
engine, direct streaming, responsive UI code, efficient context handling, and
careful CPU/GPU policy. That is our responsibility.
