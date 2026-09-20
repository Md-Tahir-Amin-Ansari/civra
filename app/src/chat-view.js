export function createChatView({
  S,
  $,
  esc,
  ic,
  mark,
  fmt,
  modeLabel,
  SUGGESTS,
}) {
  /* ---------- CHAT ---------- */
  function headHTML() {
    const c = S.cur;
    return `<button class="btn sm only-narrow" data-act="openDrawer">${ic("menu", 16)} Chats</button>
<h1>${esc(c.title)}</h1>
${c.id !== null ? `<button class="ibtn" data-act="rename" data-id="${c.id}" title="Rename chat" aria-label="Rename this chat">${ic("pencil", 16)}</button>` : ""}
<span class="grow"></span>
<span class="pill${S.online ? "" : " off"}"><i aria-hidden="true"></i>${S.online ? "Runs on this PC" : "Offline · chat works normally"}</span>
<button class="chip" data-act="goSettings" title="Change how Civra runs">${modeLabel()}</button>`;
  }
  function noticeHTML() {
    if (S.notice === "ready")
      return `<div class="notice ok" role="status">${ic("check", 20)}<span class="txt"><strong>Setup is complete.</strong> Civra now works without internet. You can go offline and keep chatting.</span><button class="btn sm" data-act="dismissNotice">Dismiss</button></div>`;
    if (S.notice === "gpu")
      return `<div class="notice warn" role="status">${ic("alert", 20)}<span class="txt"><strong>Graphics card mode stopped working.</strong> Civra switched back to Standard mode. Your chats are safe.</span><button class="btn sm" data-act="goSettings">Open settings</button><button class="btn sm" data-act="dismissNotice">Dismiss</button></div>`;
    return "";
  }
  function emptyHTML() {
    return `<div class="empty">${mark(44)}
<h2>What would you like to talk about?</h2>
<p>Ask a question, get help writing, or think something through. Civra doesn't send your messages over the internet.</p>
<div class="suggests" role="group" aria-label="Ways to start">${SUGGESTS.map((s) => `<button class="suggest" data-act="suggest" data-text="${esc(s)}">${esc(s)}</button>`).join("")}</div>
<p class="fine">Answers can be wrong. Check anything important before you act on it.</p></div>`;
  }
  function msgHTML(m, i, isLast) {
    if (m.role === "user")
      return `<div class="msg user"><div class="bubble"><span class="sr-only">You: </span>${fmt(m.text)}</div></div>`;
    let body;
    if (m.status === "error") {
      body = `<div class="alert danger" role="alert">${ic("alert", 20)}<div><strong>Civra couldn't finish this reply.</strong><p>The model stopped unexpectedly. This can happen when the PC is low on memory. Your message is saved. Close apps you aren't using, then try again. If it keeps happening, restart Civra.</p></div></div>`;
    } else {
      body =
        m.status === "streaming" && m.native
          ? `<div class="content native-stream">${esc(m.text)}<span class="caret" aria-hidden="true"></span></div>`
          : `<div class="content">${fmt(m.text)}${m.status === "streaming" ? '<span class="caret" aria-hidden="true"></span>' : ""}</div>`;
    }
    if (m.status === "streaming")
      body += `<p class="status live">Civra is writing…</p>`;
    if (m.status === "stopped")
      body += `<p class="status">Reply stopped. What you see above is only part of an answer.</p>`;
    let acts = "";
    if (m.status !== "streaming") {
      if (m.text)
        acts += `<button class="btn sm" data-act="copy" data-i="${i}" title="Copy this reply">${ic("copy", 16)} Copy</button>`;
      if (isLast)
        acts += `<button class="btn sm" data-act="retry" title="Ask again for the latest reply">${ic("retry", 16)} Retry</button>`;
    }
    return `<article class="msg bot" aria-label="Civra reply"><div class="who">Civra</div>${body}${acts ? `<div class="acts-row">${acts}</div>` : ""}</article>`;
  }
  function threadHTML() {
    const ms = S.cur.messages;
    if (!ms.length) return emptyHTML();
    return ms.map((m, i) => msgHTML(m, i, i === ms.length - 1)).join("");
  }
  function slotHTML() {
    return S.streaming
      ? `<button class="btn danger" data-act="stop" title="Stop this reply">${ic("stop", 16)} Stop</button>`
      : `<button class="btn primary" id="sendBtn" data-act="send" disabled>${ic("send", 16)} Send</button>`;
  }
  function chatHTML() {
    return `<header class="chat-head" id="chatHead">${headHTML()}</header>
<div id="noticeBox">${noticeHTML()}</div>
<div class="scroller" id="scroller"><div class="thread" id="thread">${threadHTML()}</div></div>
<footer class="composer">
<div class="compose-box">
<label class="sr-only" for="msg">Message Civra</label>
<textarea id="msg" rows="1" placeholder="Type a message"></textarea>
<span id="slot">${slotHTML()}</span>
</div>
<p class="hint">Answers can be wrong. Check anything important before you act on it.</p>
</footer>`;
  }
  function refreshHead() {
    const h = $("#chatHead");
    if (h) h.innerHTML = headHTML();
  }
  function refreshNotice() {
    const n = $("#noticeBox");
    if (n) n.innerHTML = noticeHTML();
  }
  function refreshSlot() {
    const s = $("#slot");
    if (!s) return;
    s.innerHTML = slotHTML();
    const ta = $("#msg"),
      b = $("#sendBtn");
    if (b && ta) b.disabled = !ta.value.trim();
  }
  function nearBottom() {
    const sc = $("#scroller");
    return sc ? sc.scrollHeight - sc.scrollTop - sc.clientHeight < 90 : false;
  }
  function scrollBottom() {
    const sc = $("#scroller");
    if (sc) sc.scrollTop = sc.scrollHeight;
  }
  function refreshThread(force) {
    const t = $("#thread");
    if (!t) return;
    const nb = nearBottom();
    t.innerHTML = threadHTML();
    if (nb || force) scrollBottom();
    refreshSlot();
  }
  function tickText(m) {
    const t = $("#thread");
    if (!t) return;
    const el =
      t.lastElementChild && t.lastElementChild.querySelector(".content");
    if (!el) return;
    const nb = nearBottom();
    el.innerHTML =
      fmt(m.text) + '<span class="caret" aria-hidden="true"></span>';
    if (nb) scrollBottom();
  }
  function appendNativeText(active, delta) {
    active.m.text += delta;
    if (S.cur !== active.chat) return;
    const content = $("#thread .msg.bot:last-child .content.native-stream");
    const caret = content?.querySelector(".caret");
    if (!caret) return;
    const nb = nearBottom();
    content.insertBefore(document.createTextNode(delta), caret);
    if (nb) scrollBottom();
  }
  return {
    chatHTML,
    refreshHead,
    refreshNotice,
    refreshSlot,
    nearBottom,
    scrollBottom,
    refreshThread,
    tickText,
    appendNativeText,
  };
}
