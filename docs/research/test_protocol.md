# LiteRT LM feasibility test protocol

## Environment isolation

- Python package and test scripts: `research/.venv`
- LiteRT LM cache and downloaded models: `research/runtime`
- Model under test: `litert-community/gemma-4-E2B-it-litert-lm/gemma-4-E2B-it.litertlm`

## Required measurements

For each backend, record:

1. CLI and API package versions, OS, hardware, model byte size, and SHA 256.
2. Cold and warm process time to first visible generated token.
3. Decode throughput from the CLI benchmark tool at 256 token prefill and decode, three measured runs after warmup.
4. Exit, restart, and repeated cancellation behavior.
5. Context-capacity behavior with fixed generated fixtures and a reserved response budget.

## Acceptance criteria for the spike

- A CPU chat completes repeatedly without a Python installation outside the virtual environment.
- GPU either completes or returns a diagnosable failure followed by a successful CPU fallback.
- Stop ends generation and permits a fresh process without unreleased resources.
- A safe context policy can be calculated and enforced before passing input to the engine.
- Offline inference makes no network connection.

## Important interpretation rules

- CLI benchmark prefill/decode throughput is not equivalent to end-to-end chat latency.
- Input tokens, output reserve, and total KV cache limit are reported separately.
- Any timeout, crash, or nonzero exit code is a result, not silently retried.
