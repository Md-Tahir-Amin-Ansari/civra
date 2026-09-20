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

await import("../app/src/main.js");
await new Promise((resolve) => setTimeout(resolve, 0));

test("browser-preview controls remain isolated but functional", () => {
  document.querySelector('[data-jump="chatNew"]').click();
  document.querySelector('[data-jump="restore"]').click();
  assert.match(
    document.querySelector("#sidebar").textContent,
    /electricity bill/,
  );

  const theme = document.querySelector("#themeSel");
  theme.value = "dark";
  theme.dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(document.documentElement.getAttribute("data-theme"), "dark");
});

test.after(async () => {
  await window.happyDOM.abort();
  window.close();
});
