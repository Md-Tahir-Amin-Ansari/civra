import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Window } from "happy-dom";

const window = new Window({ url: "http://localhost/" });
const document = window.document;
const html = readFileSync(
  new URL("../app/src/index.html", import.meta.url),
  "utf8",
);
document.body.innerHTML = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] || "";
globalThis.window = window;
globalThis.document = document;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: window.navigator,
});

const frames = new Map();
let nextFrame = 0;
globalThis.requestAnimationFrame = (callback) => {
  const id = ++nextFrame;
  frames.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
function flushFrames() {
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback();
}

const calls = [];
const events = new Map();
let nextChatId = 1;
window.__TAURI__ = {
  core: {
    async invoke(command, args) {
      calls.push({ command, args });
      if (command === "load_chats") return [];
      if (command === "load_app_state")
        return { setupComplete: false, modelPath: null };
      if (command === "choose_approved_model")
        return "C:/approved/model.litertlm";
      if (command === "save_chat")
        return {
          ...args.chat,
          id: args.chat.id ?? nextChatId++,
          updatedAt: Math.floor(Date.now() / 1000),
        };
      return null;
    },
  },
  event: {
    async listen(name, callback) {
      events.set(name, callback);
      return () => events.delete(name);
    },
  },
};

await import("../app/src/main.js");
const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
await wait();

test("setup leads to a blank chat with the verified local model", async () => {
  assert.match(document.body.textContent, /Set up Civra/);
  document.querySelector('[data-act="chooseModel"]').click();
  await wait();
  assert.match(document.body.textContent, /Civra is ready/);
  document.querySelector('[data-act="startChat"]').click();
  await wait();
  assert.match(document.body.textContent, /What would you like to talk about/);
  assert.ok(calls.some(({ command }) => command === "load_native_engine"));
});

test("native chunks append in one frame and the completed chat is saved", async () => {
  const input = document.querySelector("#msg");
  input.value = "Say hello";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector('[data-act="send"]').click();
  await wait();
  const request = calls.findLast(
    ({ command }) => command === "stream_native_reply",
  );
  assert.ok(request);
  for (const text of ["Hel", "lo", " world"]) {
    events.get("inference-chunk")({
      payload: {
        requestId: request.args.requestId,
        chunk: JSON.stringify({ content: [{ type: "text", text }] }),
      },
    });
  }
  assert.equal(frames.size, 1);
  flushFrames();
  assert.match(
    document.querySelector(".content.native-stream").textContent,
    /Hello world/,
  );
  events.get("inference-finished")({
    payload: { requestId: request.args.requestId, error: null },
  });
  await wait();
  assert.match(
    document.querySelector(".msg.bot .content").textContent,
    /Hello world/,
  );
  assert.ok(
    calls.some(
      ({ command, args }) =>
        command === "save_chat" &&
        args.chat.messages.some((message) => message.text === "Hello world"),
    ),
  );
});

test("Stop cancels the current stream and permits the next prompt", async () => {
  const input = document.querySelector("#msg");
  input.value = "A longer answer";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector('[data-act="send"]').click();
  await wait();
  const request = calls.findLast(
    ({ command }) => command === "stream_native_reply",
  );
  document.querySelector('[data-act="stop"]').click();
  assert.ok(calls.some(({ command }) => command === "cancel_native_reply"));
  events.get("inference-finished")({
    payload: { requestId: request.args.requestId, error: "CANCELLED" },
  });
  await wait();
  assert.match(document.body.textContent, /Reply stopped/);

  document.querySelector("#msg").value = "Next question";
  document
    .querySelector("#msg")
    .dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector('[data-act="send"]').click();
  await wait();
  assert.equal(
    calls.filter(({ command }) => command === "stream_native_reply").length,
    3,
  );
});

test.after(async () => {
  await window.happyDOM.abort();
  window.close();
});
