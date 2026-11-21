# LiteRT LM Desktop Feasibility Report

## Status

In progress. The E2B model is downloaded and core Windows runtime checks have begun.

## Test environment

- OS: Windows 11 Home Single Language, build 26200, x64
- CPU: AMD Ryzen 5 7520U, 4 cores and 8 logical processors
- Memory: 16 GB installed
- GPU: AMD Radeon integrated graphics, driver 32.0.21039.2003
- CLI and API: LiteRT LM 0.17.1, installed only in `research/.venv`
- Model cache: `research/runtime`, intentionally isolated from user and system locations
- Candidate: Gemma 4 E2B instruction model in LiteRT LM format

This machine is a lower-power Windows observation point, not the project’s declared Ryzen 7 reference machine or Linux target.

## Findings before model execution

### Supported integration surfaces

LiteRT LM offers a stable Python API, a stable C++ API, and a CLI. The CLI also offers an OpenAI-compatible local server. JavaScript is documented as an early-preview SDK. The CLI is valid for a command-line proof, but is not an ideal app protocol: its source emits ANSI-formatted display text and human-facing channel labels, rather than an explicit structured event stream.

**Decision:** Use the CLI only for the feasibility spike. For the product, validate either the versioned C API from Tauri/Rust or a tightly controlled loopback server. Do not make terminal-output parsing the permanent inference boundary.

### Download behavior

The CLI downloader writes to a temporary file and moves the file only after a successful transfer. Its current implementation deletes the temporary file on an exception and makes no Range request. It therefore does not resume an interrupted model download.

**Decision:** The application must own resumable downloading, with a partial file, HTTP Range support, content-length validation, SHA-256 verification, and atomic promotion into the final model location. The CLI downloader cannot satisfy the RFP requirement by itself.

### Local server exposure

`litert-lm serve` defaults to `0.0.0.0:9379`, which exposes the service on all interfaces.

**Decision:** If the server approach is used, bind only `127.0.0.1`, randomize or reserve a private port safely, disable CORS unless the app’s exact origin is known, and do not expose a user-configurable network host in the consumer MVP.

### Licensing

Gemma 4 is published under Apache License 2.0. LiteRT-LM is also Apache 2.0. This is favorable for commercial distribution, but the release process must retain notices and re-check the exact model artifact repository before shipping.

## Runtime test results

### E2B CLI benchmark on the research Windows machine

Conditions: Gemma 4 E2B (2.41 GiB), LiteRT-LM 0.17.1, 256-token prefill and 256-token decode, one warm-up and three measured iterations, disk cache, and no intentional competing workload. The model SHA-256 is `181938105E0EEFD105961417E8DA75903EACDA102C4FCE9CE90F50B97139A63C`.

| Backend | Prefill tokens per second | Decode tokens per second | Initialization | Time to first token | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| CPU, 8 threads | 107.45 | 8.27 | 1.05 s | 2.51 s | Completed cleanly |
| GPU, speculative decoding enabled | 48.33 | 16.31 | 14.39 s | 5.38 s | Completed cleanly |

**Interpretation:** On this Ryzen 5 7520U integrated-GPU machine, CPU is materially better for load, prefill, and first answer. GPU approximately doubles decode throughput for a long response but imposes an initialization and first-token penalty. The first product policy should benchmark both modes during setup, default to CPU when perceived first-response latency matters, and choose GPU only where sustained-generation advantage wins.

Still pending:

- Process restart and resource-stability soak test
- Context-capacity sweep and oversized-input recovery
- No-network inference verification
- E4B quality/performance comparison

### Python API streaming and cancellation

Using the official `litert-lm-api` package with CPU, eight threads, and a 4096-token KV cache, a one-shot conversation produced four structured chunks and the exact requested response. Engine-ready time was 0.51 seconds, first chunk arrived at 2.36 seconds, and the complete request took 3.20 seconds.

A second request asking for a long answer was cancelled after its first chunk. `conversation.cancel_process()` returned, the stream drained, and the engine closed with no exception in 2.82 seconds total. This validates the API cancellation path for a single request; it does not yet prove repeated in-process cancellation stability.

**Decision:** The official API is suitable for the next prototype experiment because it provides structured chunks and a direct cancellation method. Keep the CLI only as a diagnostic and benchmark tool.

### Context capacity sweep

The E2B artifact accepted and answered tokenizer-verified long text through 16K. CPU results were: 3,606 conversation tokens in 37.6 seconds at a 4,096 cache; 7,703 tokens in 92.5 seconds at 8,192; and 15,897 tokens in 259.7 seconds at 16,384. Every completed probe returned the exact required reply and shut down cleanly.

At the artifact's approximately 32K setting, LiteRT-LM configured a 32,000-token target but the conversation request reached the runtime's 10-minute deadline without completing. Treat 16K as the verified technical ceiling for this hardware and runtime. Start local compaction before 12K, reserving space for the current input and response.

### Manual offline CLI chat observation

Date: 2026-09-18. A user ran `chat.py` with the CPU backend after the model had already been downloaded. The user confirmed that it ran perfectly while offline. The observed conversation completed normal English and Hindi turns, retained the immediately preceding question within the same open conversation, and identified itself as Gemma 4. The user exited normally.

One conversational limitation was also observed: the model initially interpreted an ambiguous question about remembering "previously" as referring to a different session, then correctly understood the follow-up that specified the current conversation. This is normal model ambiguity rather than a session-persistence failure.

**Decision:** E2B text chat is provisionally viable as the default interactive experience on this Windows machine. Do not treat the command-line script as a product UI; it is a successful runtime and usability probe only.

### Native Windows C API engine lifecycle

Date: 2026-09-19. A small research-only C++ program loaded the official
`litert-lm.dll` directly with Windows `LoadLibrary`, resolved the C API engine
symbols, created CPU engine settings with a 16,384-token limit, created the E2B
engine by model file path, and immediately released it. It printed both
`NATIVE_C_API_ENGINE_INIT_OK` and `NATIVE_C_API_ENGINE_RELEASE_OK` with exit
code 0.

Python was not involved in the engine call. The DLL registered its CPU XNNPACK
accelerator and loaded the expected model signatures. LiteRT-LM also emitted its
usual non-fatal NPU-registration warning; CPU inference still initialized and
released normally.

**Decision:** Civra can use a direct, path-based native bridge from Rust to the
version-pinned C API. Do not use LiteRT-LM's raw-file-descriptor loading path on
Windows. The remaining product work is lifecycle ownership, conversation
streaming, cancellation, and UI integration—not proof that Python is required.

### Native Windows C API conversation streaming

Date: 2026-09-19. The same direct C++ probe created a native conversation,
called `litert_lm_conversation_send_message_stream`, and received four
structured assistant JSON chunks for the requested text “native bridge works.”
It then released the conversation and engine cleanly. This was a CPU, 4,096
token test, not a benchmark.

The first equivalent direct streaming run at a 16,384-token setting initialized
the engine but failed when LiteRT-LM allocated CPU tensors for the response.
The runtime reported an XNNPACK tensor-allocation failure. The probe had left
LiteRT-LM's CPU-thread policy at its default, unlike the earlier Python test.

A second 16,384-token native streaming run explicitly set the CPU engine to
eight threads—the same configuration as the successful Python test. It streamed
the same four structured chunks and released cleanly. This isolates the failure
to the default CPU-thread configuration on this machine, rather than a 16K
artifact limit or the C API streaming path.

**Decision:** Native C API streaming is proven at 4K and 16K on this machine
when Civra explicitly configures CPU threads. Civra must never rely on
LiteRT-LM's default CPU-thread policy. Use a bounded explicit thread count and
still run a model-load smoke test on each materially different target machine.

## Current recommendation

Continue the feasibility spike. There is no architectural blocker, but the app must not promise resumable setup downloads or safe cancellation until the runtime measurements above are complete.

## Sources

- Google AI Edge, LiteRT-LM API Overview, accessed 2026-09-18
- Google AI Edge, LiteRT-LM CLI Usage, accessed 2026-09-18
- Google AI, Gemma 4 Apache License 2.0, accessed 2026-09-18
- LiteRT-LM 0.17.1 installed source inspection, `research/.venv`
