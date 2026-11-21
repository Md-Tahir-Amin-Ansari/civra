Before we build the app UI, we should prove the engine behaves reliably. I’d run these in order.

## 1. Baseline environment

* [ ] Record OS, LiteRT-LM API version, Python version, model filename/hash, CPU, RAM and backend.
* [ ] Confirm E2B runs fully offline after the model is downloaded.
* [ ] Confirm a fresh process can load and unload the model repeatedly.

## 2. E2B performance

* [ ] Cold model-load time after reboot.
* [ ] Warm model-load time on a second launch.
* [ ] Time to first token.
* [ ] Thinking-token speed.
* [ ] Final-answer-token speed.
* [ ] RAM use after loading, after one response, and after ten turns.
* [ ] CPU temperature/throttling during a 10-minute chat.

Run the same short prompt three times, then compare E2B with E4B once. We only need to know whether E4B’s quality is worth its speed cost.

## 3. Thinking mode

* [ ] Verify the LiteRT model actually responds to the thinking token correctly.
* [ ] Identify the exact markers separating thought from final answer.
* [ ] Stream thought and final answer separately.
* [ ] Stop generation during thinking.
* [ ] Stop generation during the final answer.
* [ ] Confirm hiding the thinking panel does not stop generation.
* [ ] Confirm only the final answer is inserted into the next turn’s history.

That last one matters a lot: old thoughts must not keep consuming context.

## 4. Context-limit R&D

Run a controlled prompt-size sweep, recording the first failure:

* [ ] 1K tokens
* [ ] 2K
* [ ] 3K
* [ ] 3.5K
* [ ] 3.8K
* [ ] 4K

For each size, test with thinking off and on. Reserve output tokens too—an input that fits alone may still crash once the model begins generating.

Then test:

* [ ] Default model settings
* [ ] Explicit `max_num_tokens=4096`
* [ ] A 32K community-converted artifact with no runtime override
* [ ] The same artifact with a runtime override

Also compare CLI versus Python. If CLI survives but Python crashes, the wrapper path is suspect. If both fail, it is probably native runtime/XNNPACK/backend behavior.

## 5. Conversation reliability

* [ ] Ten-turn ordinary chat with thinking enabled.
* [ ] Conversation with long answers.
* [ ] Conversation where old turns are summarized.
* [ ] Ensure the app never sends more than its safe token budget.
* [ ] Confirm a too-long pasted message is rejected gracefully, never crashes the engine.
* [ ] Confirm retry produces a new answer without corrupting the session.

## 6. Persistence and privacy

* [ ] Close and reopen: sessions survive.
* [ ] Rename, search and delete chats.
* [ ] Delete all history.
* [ ] Confirm the stored database contains local text only.
* [ ] Monitor network access: no network requests during normal inference.
* [ ] Confirm model downloads/updates are the only expected online actions.

## 7. Failure handling

* [ ] Model missing or corrupted.
* [ ] Insufficient disk space.
* [ ] Out-of-memory/failed tensor allocation.
* [ ] User presses Stop repeatedly.
* [ ] App closes during generation.
* [ ] Interrupted model download resumes safely.
* [ ] A native engine crash produces a readable recovery message, not a dead app.

## MVP go/no-go gate

I would only start the actual desktop UI once these are true:

* E2B starts reliably on your Linux i3 machine.
* Thinking streams and parses correctly.
* Ten-turn chat does not leak thought text into future context.
* The app can enforce a conservative safe context ceiling.
* Oversized input fails politely instead of triggering the LiteRT crash.
* Offline inference makes zero network calls.

That gives us a stable core to wrap in the pretty desktop experience.
