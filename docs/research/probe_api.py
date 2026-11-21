"""Small disposable LiteRT-LM API probe for the feasibility spike.

Run only from research/.venv.  It deliberately has no third-party
dependencies beyond the official litert-lm-api package installed there.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import litert_lm


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=Path)
    parser.add_argument("--backend", choices=("cpu", "gpu"), default="cpu")
    parser.add_argument("--threads", type=int, default=8)
    parser.add_argument("--max-tokens", type=int, default=4096)
    parser.add_argument("--prompt", default="Reply with exactly: local inference confirmed.")
    parser.add_argument("--cancel-after-chunks", type=int, default=0)
    args = parser.parse_args()

    backend = (
        litert_lm.Backend.CPU(thread_count=args.threads)
        if args.backend == "cpu"
        else litert_lm.Backend.GPU()
    )
    started = time.perf_counter()
    first_chunk_at: float | None = None
    chunks = 0
    content: list[str] = []
    result: dict[str, object] = {"backend": args.backend, "max_tokens": args.max_tokens}

    try:
        with litert_lm.Engine(
            str(args.model), backend=backend, max_num_tokens=args.max_tokens
        ) as engine:
            result["engine_ready_seconds"] = round(time.perf_counter() - started, 4)
            with engine.create_conversation() as conversation:
                stream = conversation.send_message_async(args.prompt)
                for chunk in stream:
                    chunks += 1
                    if first_chunk_at is None:
                        first_chunk_at = time.perf_counter()
                    for item in chunk.get("content", []):
                        if item.get("type") == "text":
                            content.append(item.get("text", ""))
                    if args.cancel_after_chunks and chunks >= args.cancel_after_chunks:
                        conversation.cancel_process()
                        break
                if args.cancel_after_chunks:
                    for _ in stream:
                        pass
    except Exception as exc:  # report native runtime errors without hiding them
        result["error_type"] = type(exc).__name__
        result["error"] = str(exc)
        result["ok"] = False
    else:
        result["ok"] = True

    result["chunks"] = chunks
    result["time_to_first_chunk_seconds"] = (
        round(first_chunk_at - started, 4) if first_chunk_at else None
    )
    result["total_seconds"] = round(time.perf_counter() - started, 4)
    result["text"] = "".join(content)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
