"""Minimal local CLI chat for the LiteRT-LM feasibility spike.

Run from the research directory:
  .\\.venv\\Scripts\\python.exe .\\chat.py

No messages or history are written to disk by this script.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import litert_lm


DEFAULT_MODEL = (
    Path(__file__).parent
    / "runtime"
    / "cache"
    / "huggingface"
    / "litert-community"
    / "gemma-4-E2B-it-litert-lm"
    / "gemma-4-E2B-it.litertlm"
)


def stream_response(conversation: litert_lm.AbstractConversation, prompt: str) -> None:
    stream = conversation.send_message_async(prompt)
    try:
        for chunk in stream:
            for item in chunk.get("content", []):
                if item.get("type") == "text":
                    print(item.get("text", ""), end="", flush=True)
            # LiteRT-LM can expose non-user-facing channels, such as reasoning.
            # This prototype intentionally does not print or retain those channels.
        print()
    except KeyboardInterrupt:
        print("\nStopping generation...", flush=True)
        conversation.cancel_process()
        for _ in stream:
            pass
        print("[Generation cancelled]")


def main() -> int:
    parser = argparse.ArgumentParser(description="Small local LiteRT-LM chat")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--backend", choices=("cpu", "gpu"), default="cpu")
    parser.add_argument("--threads", type=int, default=8)
    parser.add_argument("--max-tokens", type=int, default=4096)
    args = parser.parse_args()

    if not args.model.is_file():
        parser.error(f"Model file was not found: {args.model}")

    backend = (
        litert_lm.Backend.CPU(thread_count=args.threads)
        if args.backend == "cpu"
        else litert_lm.Backend.GPU()
    )

    print(f"Loading {args.model.name} on {args.backend}...")
    print("Commands: /new starts a fresh chat; /help shows commands; /exit quits.")
    print("Press Ctrl+C while a response is generating to stop it.\n")

    with litert_lm.Engine(
        str(args.model), backend=backend, max_num_tokens=args.max_tokens
    ) as engine:
        conversation = engine.create_conversation()
        try:
            while True:
                try:
                    prompt = input("You> ").strip()
                except (EOFError, KeyboardInterrupt):
                    print("\nGoodbye.")
                    break

                if not prompt:
                    continue
                if prompt == "/exit":
                    print("Goodbye.")
                    break
                if prompt == "/help":
                    print("/new, /help, /exit; Ctrl+C stops a response.")
                    continue
                if prompt == "/new":
                    conversation.close()
                    conversation = engine.create_conversation()
                    print("[Started a new local chat]")
                    continue

                print("Assistant> ", end="", flush=True)
                stream_response(conversation, prompt)
        finally:
            conversation.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
