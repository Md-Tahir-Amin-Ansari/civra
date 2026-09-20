export const invoke = window.__TAURI__?.core?.invoke;
export const listen = window.__TAURI__?.event?.listen;

export function createPersistence({ S, newDraft, refreshHead, refreshList }) {
  const queuedSaves = new WeakMap();
  const pendingWrites = new Set();

  function trackWrite(promise) {
    pendingWrites.add(promise);
    void promise.then(
      () => pendingWrites.delete(promise),
      () => pendingWrites.delete(promise),
    );
    return promise;
  }

  function relativeChatDate(unixSeconds) {
    const date = new Date(unixSeconds * 1000);
    const today = new Date();
    const days = Math.floor(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()) -
        new Date(date.getFullYear(), date.getMonth(), date.getDate())) /
        86400000,
    );
    const when =
      days <= 0
        ? "Today"
        : days === 1
          ? "Yesterday"
          : days <= 7
            ? "Previous 7 days"
            : "Older";
    const time =
      days <= 0
        ? date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : date.toLocaleDateString([], { day: "numeric", month: "short" });
    return { when, time };
  }
  function fromStoredChat(chat) {
    const timestamp = Number(chat.updatedAt ?? chat.updated_at);
    return {
      id: chat.id,
      title: chat.title,
      ...relativeChatDate(
        Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000),
      ),
      messages: Array.isArray(chat.messages) ? chat.messages : [],
    };
  }
  function storageChat(chat) {
    return {
      id: chat.id,
      title: chat.title,
      messages: chat.messages.map((message) => ({
        role: message.role,
        text: message.text,
        status: message.status || null,
      })),
    };
  }
  async function loadSavedChats() {
    if (!invoke) return;
    const [chats, appState] = await Promise.all([
      invoke("load_chats"),
      invoke("load_app_state"),
    ]);
    S.chats = chats.map(fromStoredChat);
    S.modelPath = appState.modelPath || null;
    if (appState.setupComplete && S.modelPath) {
      S.screen = "chat";
      S.cur = newDraft();
      S.notice = null;
    } else {
      S.screen = "setup";
      S.setup = "consent";
    }
  }
  function persistChat(chat) {
    if (!invoke) return Promise.resolve();
    const previous = queuedSaves.get(chat) || Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => invoke("save_chat", { chat: storageChat(chat) }))
      .then((stored) => {
        chat.id = stored.id;
        Object.assign(chat, relativeChatDate(stored.updatedAt));
        if (S.screen === "chat" && S.cur === chat) refreshHead();
        refreshList();
      });
    const tracked = trackWrite(next);
    queuedSaves.set(chat, tracked);
    return tracked;
  }
  function removeStoredChat(id) {
    if (!invoke || id === null) return Promise.resolve();
    return trackWrite(invoke("delete_chat", { id }));
  }
  function removeAllStoredChats() {
    if (!invoke) return Promise.resolve();
    return trackWrite(invoke("delete_all_chats"));
  }

  return {
    trackWrite,
    loadSavedChats,
    persistChat,
    removeStoredChat,
    removeAllStoredChats,
  };
}
