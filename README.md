# Civra — Private Offline AI Chat

Civra is a Windows-first, open-source desktop chat app for running a curated AI model locally. It is being built for people who want a private, simple chat experience without accounts, cloud inference, or developer setup.

## Project status

The local development build supports private CPU chat, streaming replies, and saved history. It is not released: the model downloader and installer are still unfinished.

## What Civra will do

- Download one approved local model after clear consent.
- Store chats locally and run inference locally after setup.
- Keep the interface clean, fast, light, and dark-theme capable.
- Default to reliable CPU inference; label GPU acceleration as experimental.

## What it will not do in the MVP

- Send prompts to a cloud service, create accounts, or collect telemetry.
- Require Python, Git, or developer tooling for end users.
- Support arbitrary models, model conversion, Linux packaging, or resumable downloads.

## Trust and safety

Local processing does not protect against malware, device users, backups, or an unlocked Windows account. Model outputs can be inaccurate or harmful: verify important information and use the app responsibly and lawfully.

## Project documents

- [Current project context](CONTEXT.md)
- [Engineering and agent standards](STANDARDS.md)
- [Roadmap](ROADMAP.md)
- [Desktop frontend structure](app/README.md)
- [GitHub setup and protected-main policy](docs/GITHUB-SETUP.md)

## License

Planned: Apache-2.0. A final release will include all required third-party and model notices.
