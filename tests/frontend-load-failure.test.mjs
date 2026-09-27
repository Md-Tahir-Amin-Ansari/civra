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

window.__TAURI__ = {
  core: {
    async invoke(command) {
      if (command === "load_chats") return [];
      if (command === "load_app_state")
        return { setupComplete: true, modelPath: "C:/missing/model.litertlm" };
      if (command === "load_native_engine")
        throw new Error("The saved model file was not found. Select it again.");
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

test("a failed saved-model load returns to setup with a recovery action", () => {
  assert.match(
    document.querySelector("#body").textContent,
    /saved model file was not found/,
  );
  assert.ok(document.querySelector('[data-act="chooseModel"]'));
});

test.after(async () => {
  await window.happyDOM.abort();
  window.close();
});
