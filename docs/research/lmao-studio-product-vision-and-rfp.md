# LMAO Studio Product Vision and Request for Proposal

**Product vision and request for proposal**

**A lightweight Windows application for private local AI chat**

| **Document**     | **Value**                           |
|------------------|-------------------------------------|
| Status           | Working brief for future planning   |
| Version          | 0.1                                 |
| Prepared         | 18 September 2026                   |
| Initial platform | Windows 10 and Windows 11 on x86 64 |
| Working name     | LMAO Studio                         |

# Purpose

This document records what LMAO Studio should become before implementation decisions or limited development time pull the project in different directions. It defines the intended user experience, the minimum viable product, the privacy promise, the proposed technical direction, and the questions that remain open. It can later be used to plan the build, evaluate contributors, or request implementation proposals.

# Product decision

LMAO Studio should be a simple desktop chat application that runs an AI model on the user's own computer. It should serve people who want help writing, explaining, organizing, and summarizing private material without uploading their conversations to an AI service. The default experience must require no knowledge of models, inference engines, tokens, quantization, or hardware backends.

# Product vision

A person should be able to discover the application on a clear public website, download one installer, complete installation without technical choices, allow the application to prepare its private AI, and begin chatting. After the initial setup, basic chat should continue to work without an internet connection.

The application should feel closer to a private writing assistant or familiar messaging app than a machine learning control panel. Advanced controls may exist later, but they must not dominate the main experience.

# Intended users

| **User**               | **Need**                                            | **Design response**                                       |
|------------------------|-----------------------------------------------------|-----------------------------------------------------------|
| Everyday home user     | Help with letters, messages, explanations and notes | Plain language, starter prompts and no technical setup    |
| Privacy conscious user | Work with personal text without uploading it        | Local inference, local storage and visible privacy status |
| Student or job seeker  | Draft, revise and understand ordinary material      | Fast text chat, saved sessions and copy controls          |
| Small business user    | Prepare routine internal drafts                     | Dependable history, export later and clear limitations    |

# Primary promise

The primary promise is that chat prompts and generated responses are processed locally and are not uploaded for inference. The product must not imply that local processing makes every use safe or every answer correct. Its privacy language must distinguish local processing from encryption, device security, backups, malware, and other risks outside the application's control.

## Common tasks

- Draft or improve a personal letter, email, complaint, invitation or message.

- Rewrite text to make it clearer, shorter, friendlier or more formal.

- Explain unfamiliar text in simpler language.

- Organize pasted notes into a useful outline or checklist.

- Summarize text that the user pastes directly into the chat.

- Brainstorm ordinary personal or household decisions while keeping context on the device.

# Experience principles

| **Principle**       | **Required behavior**                                                                                                           |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Ordinary language   | The main interface avoids terms such as model, backend, context length, tokens and quantization.                                |
| Safe defaults       | The application chooses a compatible execution mode and sensible response settings automatically.                               |
| Visible privacy     | The interface states when processing is local and clearly identifies any operation that needs internet access.                  |
| Recoverable failure | Interrupted downloads can resume, failed responses can be retried, and compatibility mode is available.                         |
| Calm interface      | The application emphasizes the conversation and avoids dashboards, benchmarks and configuration clutter.                        |
| Honest capability   | The interface warns that answers can be wrong and avoids presenting the app as professional medical, legal or financial advice. |

# Minimum viable product

The MVP proves that a nontechnical Windows user can install the application, complete setup, hold text conversations, and find earlier conversations without developer assistance.

## MVP scope

| **Area**      | **Included in MVP**                                             | **Acceptance condition**                                                                                         |
|---------------|-----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Discovery     | Static public landing page with one Windows download action     | A visitor can understand the privacy benefit and system requirements before downloading.                         |
| Installation  | Signed setup executable with shortcut and uninstall entry       | A standard user completes installation without installing Python, Git or developer tools.                        |
| First launch  | Hardware check and guided AI preparation                        | The app explains required storage, downloads once, resumes after interruption and opens chat when ready.         |
| Chat          | Streaming text conversation, stop, copy and retry               | The user can send text, see a response as it is generated and recover from an unsatisfactory or failed response. |
| Sessions      | New chat, automatic title, rename and delete                    | Separate conversations retain their own message history.                                                         |
| History       | Local list and search                                           | The user can close the app, reopen it and find an earlier conversation.                                          |
| Privacy       | Local inference, no telemetry by default and delete all history | The app performs no remote inference and clearly reports network use during setup or updates.                    |
| Compatibility | Automatic accelerator choice with CPU fallback                  | Unsupported acceleration does not prevent basic chat on a supported machine.                                     |

## MVP exclusions

- Image, audio, camera and document attachment support.

- Multiple model marketplace or manual model importing.

- Developer parameters, benchmarks or backend selection in the main interface.

- Cloud inference, account login, cloud synchronization or collaboration.

- Plugin systems, agents, external tools and autonomous actions.

- Claims that the application is suitable for professional diagnosis or advice.

# First launch flow

1.  The application checks the operating system, available memory, free storage and compatible execution methods.

2.  It explains that the private AI component must be downloaded once and shows its approximate size.

3.  The user selects Continue. Advanced hardware choices remain hidden.

4.  The application downloads the selected package with progress, pause, resume and retry controls.

5.  The application verifies the downloaded file before loading it.

6.  A short privacy and accuracy notice appears before the first conversation.

7.  The user enters the chat interface and can use the product offline.

# Main interface

The main window should use a narrow history column and a large conversation area. The primary actions are New chat, Search history, Send, Stop, Copy, Retry and Delete. Settings should contain only appearance, storage, update and privacy controls during the MVP.

Suggested starter prompts should describe tasks rather than technology: Write a formal letter, Make this message friendlier, Explain this simply, Organize my notes, and Summarize pasted text.

# Session and history behavior

- Create a new session without affecting existing conversations.

- Generate a short local title after the first exchange, with manual rename available.

- Persist messages locally after each completed user or assistant message.

- Retain an interrupted response only when doing so will not produce a misleading completed message.

- Delete one conversation or all conversation history after confirmation.

- Never use history from another session unless the user explicitly requests a future cross-session feature.

# Privacy and trust requirements

Privacy is a product requirement, not only a marketing statement. The application must make its network behavior testable and its data controls easy to find.

| **Requirement** | **MVP position**                                  | **Future improvement**                             |
|-----------------|---------------------------------------------------|----------------------------------------------------|
| Inference       | All prompts and responses are processed locally   | Continue to prohibit silent cloud fallback         |
| Telemetry       | Disabled and absent by default                    | Any future diagnostics must be explicit and opt in |
| History storage | Stored in the user's application data directory   | Optional encrypted database and app lock           |
| Network access  | Limited to setup downloads and update checks      | Network activity log readable by the user          |
| Deletion        | Delete one chat or all history                    | Secure deletion where the platform can support it  |
| Updates         | Signed packages from the official release channel | Automatic verified updates with rollback           |

## Required disclosures

- The AI may produce incorrect or fabricated information.

- Local processing means prompts are not sent for remote inference; it does not protect information from other software or people with access to the computer.

- Initial setup and software updates require an internet connection.

- Performance and response quality depend on the computer and the packaged model.

# Proposed implementation direction

The proposed MVP uses a static HTML, CSS and JavaScript interface inside Tauri 2. Tauri supplies the desktop window, installation package, native process control and access to local storage. A bundled LiteRT LM executable performs inference. The application reads its streamed output and can stop the process when requested. A later version may integrate LiteRT LM through its native C API.

| **Layer**     | **Initial choice**                  | **Reason**                                                          |
|---------------|-------------------------------------|---------------------------------------------------------------------|
| Interface     | Vanilla HTML, CSS and JavaScript    | Small dependency surface and adequate complexity for the planned UI |
| Desktop shell | Tauri 2                             | Lightweight Windows packaging and native capabilities               |
| Inference     | Bundled LiteRT LM native executable | No Python requirement and faster initial integration                |
| Model package | One curated LiteRT LM model         | Predictable support and no technical choice during setup            |
| History       | SQLite                              | Reliable local sessions, search and future migration support        |
| Landing page  | Static GitHub Pages site            | Simple discovery and low operating cost                             |
| Releases      | Signed Windows installer            | Familiar installation and reduced security warnings                 |

# Distribution experience

The public site should contain a short explanation, privacy statement, supported systems, approximate download requirements, screenshots, version number, release notes and one prominent Windows download action. The installer should add a Start menu entry, optionally add a desktop shortcut, launch the application after installation and support clean uninstallation.

An unsigned installer is unsuitable for the intended audience because Windows security warnings damage trust and create an unsafe habit of bypassing warnings. Public consumer distribution therefore depends on code signing or an appropriate store channel.

# Model delivery strategy

The application installer should not contain the model package. The application should download the model during first launch, verify its integrity, keep it across ordinary app updates and remove it only when the user chooses to reset or uninstall all application data. This prevents routine updates from becoming multi gigabyte downloads.

# Post MVP direction

| **Feature**        | **User benefit**                                                | **Dependency or concern**                              |
|--------------------|-----------------------------------------------------------------|--------------------------------------------------------|
| Multimodal input   | Ask questions about images, screenshots and supported documents | Model capability, preprocessing and clear file privacy |
| System prompts     | Choose a durable tone or role for a conversation                | Safe templates and understandable naming               |
| Response branching | Explore alternatives without losing the original thread         | Conversation tree data model and simple navigation     |
| Improved retry     | Regenerate, edit the previous prompt or compare alternatives    | Versioned messages and branch handling                 |
| Encrypted history  | Protect stored chats when the device is shared                  | Key management, recovery and Windows integration       |
| Export             | Save a conversation as text or PDF                              | Privacy warning and dependable formatting              |
| Additional models  | Offer different speed and quality profiles                      | Licensing, storage, compatibility and support burden   |
| Verified updates   | Receive fixes without manual reinstalls                         | Signing infrastructure and rollback                    |

# Success measures

The first evaluation should use a small set of nontechnical testers on supported Windows computers. The MVP succeeds when most testers can complete the following without spoken guidance.

- Find the official download and identify the basic system requirements.

- Install and open the application without adding separate runtimes.

- Complete the first model download and understand why it is required.

- Start a conversation, stop a response, retry it and copy useful text.

- Close the application, reopen it and find a previous conversation.

- Delete a conversation and locate the control that deletes all history.

- Correctly explain that chat runs locally but that generated information may be wrong.

## Quality targets to validate

| **Target**            | **Provisional measure**                                                                              |
|-----------------------|------------------------------------------------------------------------------------------------------|
| Setup completion      | At least 8 of 10 nontechnical testers complete setup without assistance                              |
| Time to first chat    | Measured separately for installation and model download; final threshold set after prototype testing |
| Crash recovery        | Interrupted model download resumes and an interrupted session does not corrupt history               |
| Privacy comprehension | Testers understand which actions require internet and where chat history is stored                   |
| Minimum usefulness    | Testers successfully complete at least three representative writing or explanation tasks             |

# Commercial and legal considerations

- Confirm that the chosen model license permits the planned distribution and commercial use, and reproduce required notices.

- Confirm that LiteRT LM and every bundled dependency can be redistributed under their licenses.

- Select a public name that does not create avoidable confusion with LM Studio or another product.

- Prepare a privacy policy that matches actual network and storage behavior.

- Obtain Windows code signing before marketing the product to ordinary users.

- Define support boundaries and disclaimers without making misleading security or accuracy claims.

# Key risks

| **Risk**                             | **Impact**                                          | **Initial response**                                                     |
|--------------------------------------|-----------------------------------------------------|--------------------------------------------------------------------------|
| Model quality is too weak            | Users lose trust after basic tasks fail             | Test representative tasks before fixing the default model                |
| Hardware fragmentation               | Some users see poor speed or startup failures       | Support a narrow Windows baseline and retain CPU compatibility mode      |
| Large first download                 | Users abandon setup                                 | Show size and progress clearly; support resume and checksum verification |
| Security warning                     | Users fear or cannot install the application        | Sign the installer before consumer release                               |
| Privacy claim exceeds implementation | Reputational and legal harm                         | Document every network request and phrase claims narrowly                |
| Feature growth                       | The product becomes another technical model manager | Keep advanced controls separate and defend the consumer workflow         |

# Questions for the future implementation proposal

A future implementation proposal should answer the following questions with a prototype, evidence, or a documented recommendation.

- Which LiteRT LM model gives the best acceptable balance of response quality, memory use, download size, license terms and speed on the supported hardware baseline?

- Should the MVP call a bundled executable or integrate the C API immediately?

- What exact Windows versions, processor features and minimum memory should be supported?

- Which accelerator paths work reliably enough to enable automatically, and how should failure fall back to CPU?

- How will downloads resume, verify integrity and recover from insufficient storage?

- How will cancellation and streaming be represented between LiteRT LM, Tauri and the interface?

- What SQLite schema supports sessions today and branching later without a disruptive migration?

- What network calls occur during setup and updates, and how can release tests prove that chat inference stays local?

- Which code signing and update channel is affordable and trustworthy for the first public release?

- What product name can be used publicly without confusion or trademark risk?

# Requested future deliverables

| **Deliverable**      | **Expected content**                                                  |
|----------------------|-----------------------------------------------------------------------|
| Technical proposal   | Architecture, alternatives considered, dependency list and rationale  |
| Prototype            | Installable Windows build demonstrating setup, local chat and history |
| Compatibility report | Test matrix covering supported hardware and fallback behavior         |
| Privacy review       | Data map, network map, storage locations and deletion behavior        |
| Release plan         | Signing, versioning, updates, rollback and public download process    |
| Test plan            | Functional, recovery, usability, security and performance checks      |
| Effort estimate      | Milestones, dependencies, risks and items intentionally deferred      |

# Provisional delivery stages

| **Stage**          | **Outcome**                                                  | **Exit condition**                                    |
|--------------------|--------------------------------------------------------------|-------------------------------------------------------|
| Proof of inference | LiteRT LM produces streamed text on one development computer | Start, stream, stop and unload work repeatedly        |
| Desktop prototype  | Vanilla interface controls inference through Tauri           | One local conversation works without a terminal       |
| MVP data layer     | Sessions and history persist locally                         | Create, reopen, rename, search and delete pass tests  |
| Installer alpha    | A clean Windows machine can install and prepare the AI       | No developer dependencies and recovery paths work     |
| Usability beta     | Nontechnical testers complete ordinary tasks                 | Major setup and comprehension failures are resolved   |
| Public candidate   | Signed build and clear website are available                 | Privacy, licensing, release and rollback reviews pass |

# Decision log

| **Decision**        | **Current position**                                           | **Status**          |
|---------------------|----------------------------------------------------------------|---------------------|
| Audience            | Nontechnical Windows users with ordinary private writing tasks | Committed for MVP   |
| Interface           | Vanilla HTML, CSS and JavaScript                               | Proposed            |
| Desktop shell       | Tauri 2                                                        | Proposed            |
| Inference framework | LiteRT LM                                                      | Committed direction |
| Default model       | One curated compatible model                                   | Selection pending   |
| MVP modalities      | Text only                                                      | Committed for MVP   |
| Storage             | Local SQLite history                                           | Proposed            |
| Distribution        | Static site and signed Windows installer                       | Committed direction |
| Public product name | LMAO Studio remains a working name                             | Decision pending    |

# Reference links

[LiteRT LM official repository](https://github.com/google-ai-edge/LiteRT-LM) provides platform, API and model support information.

[Tauri Windows installer documentation](https://v2.tauri.app/distribute/windows-installer/) describes Windows setup executable and MSI packaging.

[Tauri Windows code signing documentation](https://v2.tauri.app/distribute/sign/windows/) describes signing options for Windows releases.

[Gemma terms of use](https://ai.google.dev/gemma/terms) must be reviewed if a Gemma model is selected for distribution.

# Next planning action

When development time becomes available, begin with a short feasibility spike rather than the full interface. Run one candidate LiteRT LM model on the target Windows machine, measure load time, memory use, first response delay and generation speed, then confirm that streamed output and cancellation can be controlled from a minimal Tauri window. Use those results to settle the default model, native integration method and minimum hardware requirements before building the complete MVP.
