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

const calls = [];
window.__TAURI__ = {
  core: {
    async invoke(command, args) {
      calls.push({ command, args });
      if (command === "load_chats")
        return [
          {
            id: 7,
            title: "Saved conversation",
            updatedAt: Math.floor(Date.now() / 1000),
            messages: [{ role: "user", text: "Earlier question" }],
          },
        ];
      if (command === "load_app_state")
        return { setupComplete: true, modelPath: "C:/approved/model.litertlm" };
      return null;
    },
  },
  event: {
    async listen() {
      return () => {};
    },
  },
};

await import("../app/src/main.js");
await new Promise((resolve) => setTimeout(resolve, 0));

test("saved model starts locally and opens a blank chat without losing history", () => {
  assert.ok(
    calls.some(
      ({ command, args }) =>
        command === "load_native_engine" &&
        args.firstUse === false &&
        args.modelPath === "C:/approved/model.litertlm",
    ),
  );
  assert.match(
    document.querySelector("#thread").textContent,
    /What would you like to talk about/,
  );
  assert.match(
    document.querySelector("#sidebar").textContent,
    /Saved conversation/,
  );
  document.querySelector('[data-act="openChat"][data-id="7"]').click();
  assert.match(
    document.querySelector("#thread").textContent,
    /Earlier question/,
  );
});

test.after(async () => {
  await window.happyDOM.abort();
  window.close();
});
