"""Controlled LiteRT-LM long-context probe using the model's tokenizer."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import litert_lm


def make_prompt(engine: litert_lm.Engine, target_tokens: int) -> tuple[str, int]:
    """Build neutral, numbered content up to a raw-token budget."""
    parts: list[str] = []
    index = 1
    count = 0
    while count < target_tokens:
        candidate = f"\nRecord {index}: The quick brown fox observes a quiet local test."
        candidate_count = len(engine.tokenize(candidate))
        if count + candidate_count > target_tokens:
            break
        parts.append(candidate)
        count += candidate_count
        index += 1
    instruction = "\n\nRead the records. Reply with exactly CONTEXT_OK."
    prompt = "".join(parts) + instruction
    return prompt, len(engine.tokenize(prompt))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=Path)
    parser.add_argument("--cache-tokens", type=int, required=True)
    parser.add_argument("--reserve-tokens", type=int, default=512)
    parser.add_argument("--threads", type=int, default=8)
    args = parser.parse_args()

    result: dict[str, object] = {
        "cache_tokens": args.cache_tokens,
        "reserve_tokens": args.reserve_tokens,
    }
    started = time.perf_counter()
    try:
        with litert_lm.Engine(
            str(args.model),
            backend=litert_lm.Backend.CPU(thread_count=args.threads),
            max_num_tokens=args.cache_tokens,
        ) as engine:
            prompt, raw_tokens = make_prompt(
                engine, args.cache_tokens - args.reserve_tokens
            )
            result["raw_prompt_tokens"] = raw_tokens
            with engine.create_conversation() as conversation:
                response = conversation.send_message(prompt)
                text = "".join(
                    item.get("text", "")
                    for item in response.get("content", [])
                    if item.get("type") == "text"
                )
                result["conversation_tokens_after_response"] = conversation.token_count
                result["response"] = text
                result["exact_reply"] = text.strip() == "CONTEXT_OK"
        result["ok"] = bool(result["exact_reply"])
    except Exception as exc:
        result["ok"] = False
        result["error_type"] = type(exc).__name__
        result["error"] = str(exc)
    result["total_seconds"] = round(time.perf_counter() - started, 3)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
