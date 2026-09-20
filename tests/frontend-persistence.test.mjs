import assert from "node:assert/strict";
import { test } from "node:test";

const writes = [];
globalThis.window = {
  __TAURI__: {
    core: {
      invoke(command, args) {
        assert.equal(command, "save_chat");
        return new Promise((resolve) =>
          writes.push({ input: args.chat, resolve }),
        );
      },
    },
  },
};
const { createPersistence } = await import("../app/src/tauri-bridge.js");
const S = { screen: "chat", cur: null };
let headRefreshes = 0;
let listRefreshes = 0;
const { persistChat } = createPersistence({
  S,
  newDraft: () => ({}),
  refreshHead: () => headRefreshes++,
  refreshList: () => listRefreshes++,
});

test("writes for one chat stay ordered and keep the assigned database id", async () => {
  const chat = { id: null, title: "Original", messages: [] };
  S.cur = chat;
  const first = persistChat(chat);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].input.title, "Original");

  chat.title = "Renamed";
  const second = persistChat(chat);
  assert.equal(writes.length, 1, "second save waits for the first");
  writes[0].resolve({ id: 42, updatedAt: Math.floor(Date.now() / 1000) });
  await first;
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(writes.length, 2);
  assert.equal(writes[1].input.id, 42);
  assert.equal(writes[1].input.title, "Renamed");

  writes[1].resolve({ id: 42, updatedAt: Math.floor(Date.now() / 1000) });
  await second;
  assert.equal(chat.id, 42);
  assert.equal(headRefreshes, 2);
  assert.equal(listRefreshes, 2);
});
