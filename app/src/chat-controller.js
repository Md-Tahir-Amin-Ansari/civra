import { createStreamBatcher } from "./stream-batcher.js";

export function createChatController({
  S,
  $,
  pickReply,
  persistChat,
  refreshThread,
  refreshHead,
  refreshList,
  announce,
  toast,
  invoke,
  tickText,
  appendNativeText,
}) {
  function startReply(opt) {
    if (invoke) {
      void startNativeReply();
      return;
    }
    opt = opt || {};
    const c = S.cur;
    const lastUser = [...c.messages].reverse().find((x) => x.role === "user");
    const words = pickReply(lastUser ? lastUser.text : "").split(" ");
    let i = opt.startAt || 0;
    const m = {
      role: "bot",
      text: words.slice(0, i).join(" "),
      status: "streaming",
    };
    c.messages.push(m);
    S.streaming = { m, timer: null };
    refreshThread(true);
    announce("Civra is writing a reply.");
    S.streaming.timer = setInterval(
      () => {
        i++;
        m.text = words.slice(0, i).join(" ");
        if (i >= words.length) {
          clearInterval(S.streaming.timer);
          m.status = "done";
          S.streaming = null;
          void persistChat(c).catch(() =>
            toast("Civra couldn't save this chat. Try again."),
          );
          refreshThread();
          announce("Reply finished.");
        } else tickText(m);
      },
      opt.slow ? 160 : 38,
    );
  }
  function stopStreaming(silent) {
    if (!S.streaming) return;
    if (S.streaming.requestId) {
      S.streaming.stopRequested = true;
      void invoke("cancel_native_reply").catch((error) => toast(String(error)));
      if (!silent) announce("Stopping reply.");
      return;
    }
    clearInterval(S.streaming.timer);
    S.streaming.m.status = "stopped";
    void persistChat(S.cur).catch(() =>
      toast("Civra couldn't save this chat. Try again."),
    );
    S.streaming = null;
    if (!silent) {
      refreshThread();
      announce("Reply stopped.");
      const ta = $("#msg");
      if (ta) ta.focus();
    }
  }
  function send(text) {
    const ta = $("#msg");
    text = (text !== undefined ? text : ta ? ta.value : "").trim();
    if (!text || S.streaming) return;
    if (invoke && !S.modelReady) {
      toast("The local model is not ready. Select it in setup first.");
      return;
    }
    const c = S.cur;
    if (c.id === null) {
      c.when = "Today";
      c.time = "Just now";
      c.title = text.length > 42 ? text.slice(0, 42).trimEnd() + "…" : text;
      S.chats.unshift(c);
      refreshHead();
      refreshList();
    }
    c.messages.push({ role: "user", text });
    void persistChat(c).catch(() =>
      toast("Civra couldn't save this chat. Try again."),
    );
    if (ta) {
      ta.value = "";
      ta.style.height = "auto";
    }
    startReply();
    const t = $("#msg");
    if (t) t.focus();
  }
  function retry() {
    if (S.streaming) return;
    const ms = S.cur.messages,
      last = ms[ms.length - 1];
    if (!last || last.role !== "bot") return;
    ms.pop();
    startReply();
  }
  function nativeText(chunk) {
    try {
      const response = JSON.parse(chunk);
      return (response.content || [])
        .filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("");
    } catch {
      return chunk;
    }
  }
  async function startNativeReply() {
    const chat = S.cur;
    const last = chat.messages[chat.messages.length - 1];
    if (!last || last.role !== "user") return;
    const history = chat.messages
      .slice(0, -1)
      .filter((message) => message.status === "done" || message.role === "user")
      .map((message) => ({
        role: message.role === "bot" ? "model" : "user",
        content: message.text,
      }));
    const message = { role: "user", content: last.text };
    const reply = {
      role: "bot",
      text: "",
      status: "streaming",
      native: true,
    };
    const requestId = crypto.randomUUID();
    chat.messages.push(reply);
    const active = { m: reply, chat, requestId };
    active.batcher = createStreamBatcher(
      (callback) => requestAnimationFrame(callback),
      (frameId) => cancelAnimationFrame(frameId),
      (delta) => appendNativeText(active, delta),
    );
    S.streaming = active;
    refreshThread(true);
    announce("Civra is writing a reply.");
    try {
      await invoke("stream_native_reply", {
        requestId,
        historyJson: JSON.stringify(history),
        messageJson: JSON.stringify(message),
      });
    } catch (error) {
      finishNativeReply(requestId, String(error));
    }
  }
  function finishNativeReply(requestId, error) {
    const active = S.streaming;
    if (!active || active.requestId !== requestId) return;
    active.batcher.flush();
    active.m.status =
      active.stopRequested || error?.includes("CANCELLED")
        ? "stopped"
        : error
          ? "error"
          : "done";
    S.streaming = null;
    void persistChat(active.chat).catch(() =>
      toast("Civra couldn't save this chat. Try again."),
    );
    if (S.cur === active.chat) refreshThread();
    if (error && !active.stopRequested) toast(error);
    announce(
      active.stopRequested
        ? "Reply stopped."
        : error
          ? "Reply failed."
          : "Reply finished.",
    );
  }
  return {
    startReply,
    stopStreaming,
    send,
    retry,
    nativeText,
    finishNativeReply,
  };
}
