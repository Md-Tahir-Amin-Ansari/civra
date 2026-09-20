import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../app/src/stream-batcher.js", import.meta.url),
  "utf8",
);
const scope = {};
runInNewContext(source, scope);
const createStreamBatcher = scope.CivraStreamBatcher;

function frameClock() {
  let nextId = 0;
  const callbacks = new Map();
  return {
    schedule(callback) {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
    runFrame() {
      const current = [...callbacks.values()];
      callbacks.clear();
      for (const callback of current) callback();
    },
    get pending() {
      return callbacks.size;
    },
  };
}

test("a long token-sized stream appends once per frame, not once per token", () => {
  const clock = frameClock();
  const renderedDeltas = [];
  const batcher = createStreamBatcher(clock.schedule, clock.cancel, (delta) =>
    renderedDeltas.push(delta),
  );
  const tokenCount = 16_000;
  const tokensPerFrame = 80;

  for (let i = 0; i < tokenCount; i += 1) {
    batcher.push("x");
    assert.equal(clock.pending, 1);
    if ((i + 1) % tokensPerFrame === 0) clock.runFrame();
  }

  assert.equal(renderedDeltas.length, tokenCount / tokensPerFrame);
  assert.ok(renderedDeltas.every((delta) => delta.length === tokensPerFrame));
  assert.equal(renderedDeltas.join(""), "x".repeat(tokenCount));
});

test("finishing flushes the pending tail without duplicating it", () => {
  const clock = frameClock();
  const deltas = [];
  const batcher = createStreamBatcher(clock.schedule, clock.cancel, (delta) =>
    deltas.push(delta),
  );
  batcher.push("last ");
  batcher.push("tokens");
  batcher.flush();
  clock.runFrame();

  assert.deepEqual(deltas, ["last tokens"]);
  assert.equal(clock.pending, 0);
});

test("native chunk wiring stays append-only rather than redrawing each chunk", () => {
  const page = readFileSync(
    new URL("../app/src/index.html", import.meta.url),
    "utf8",
  );
  const listener = page.match(
    /await listen\("inference-chunk", \(\{ payload \}\) => \{([\s\S]*?)\n\s*\}\);/,
  )?.[1];
  const appender = page.match(
    /function appendNativeText\(active, delta\) \{([\s\S]*?)\n\s*\}\n\s*function startReply/,
  )?.[1];

  assert.ok(listener, "native chunk listener must be present");
  assert.match(
    listener,
    /active\.batcher\.push\(nativeText\(payload\.chunk\)\)/,
  );
  assert.doesNotMatch(listener, /tickText|innerHTML|refreshThread/);
  assert.ok(appender, "append-only native renderer must be present");
  assert.match(
    appender,
    /insertBefore\(document\.createTextNode\(delta\), caret\)/,
  );
  assert.doesNotMatch(appender, /innerHTML/);
});
