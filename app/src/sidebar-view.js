export function createSidebarView({
  S,
  $,
  esc,
  ic,
  mark,
  hl,
  snippet,
  GROUPS,
}) {
  /* ---------- SIDEBAR ---------- */
  function sidebarHTML() {
    return `<aside class="sidebar" id="sidebar" aria-label="Chat history">
<div class="side-top">
<div class="row"><div class="brand sm">${mark(26)}<span>Civra</span></div>
  <button class="ibtn only-narrow" data-act="closeDrawer" title="Close chat list" aria-label="Close chat list">${ic("x", 18)}</button></div>
<button class="btn primary block" data-act="newChat">${ic("plus", 18)} New chat</button>
<div class="search"><span class="s-ic">${ic("search", 16)}</span>
  <input id="q" class="search-input" type="search" placeholder="Search chats" aria-label="Search chats" autocomplete="off" value="${esc(S.query)}">
  <button class="ibtn clear" data-act="clearSearch" title="Clear search" aria-label="Clear search"${S.query ? "" : " hidden"}>${ic("x", 14)}</button></div>
</div>
<div class="list-wrap" id="list">${listHTML()}</div>
<div class="side-bottom"><button class="btn block" data-act="goSettings"${S.screen === "settings" ? ' aria-current="page"' : ""}>${ic("sliders", 18)} Settings</button></div>
</aside>`;
  }
  function itemHTML(c, q, snip) {
    const cur = S.screen === "chat" && c.id === S.cur.id;
    return `<li class="item" data-active="${cur}"><button class="open" data-act="openChat" data-id="${c.id}"${cur ? ' aria-current="true"' : ""}><span class="t">${hl(c.title, q)}</span><span class="s">${snip ? hl(snip, q) : esc(c.time)}</span></button><span class="acts"><button class="ibtn" data-act="rename" data-id="${c.id}" title="Rename chat" aria-label="Rename “${esc(c.title)}”">${ic("pencil", 16)}</button><button class="ibtn" data-act="del" data-id="${c.id}" title="Delete chat" aria-label="Delete “${esc(c.title)}”">${ic("trash", 16)}</button></span></li>`;
  }
  function listHTML() {
    if (!S.chats.length)
      return `<div class="empty-side"><strong>No saved chats yet</strong>Chats you have with Civra are saved on this PC and appear here.</div>`;
    const q = S.query.trim().toLowerCase();
    if (q) {
      const hits = S.chats.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q)),
      );
      if (!hits.length)
        return `<div class="empty-side"><strong>No chats match “${esc(S.query.trim())}”</strong>Try a different word, or clear the search to see all chats.</div>`;
      return `<p class="res-head">${hits.length} ${hits.length === 1 ? "chat matches" : "chats match"} “${esc(S.query.trim())}”</p><ul>${hits.map((c) => itemHTML(c, q, c.title.toLowerCase().includes(q) ? "" : snippet(c, q))).join("")}</ul>`;
    }
    return GROUPS.map((g) => {
      const it = S.chats.filter((c) => c.when === g);
      if (!it.length) return "";
      return `<h3 class="group-label">${g}</h3><ul>${it.map((c) => itemHTML(c, "", "")).join("")}</ul>`;
    }).join("");
  }
  function refreshList() {
    const l = $("#list");
    if (l) l.innerHTML = listHTML();
  }

  return { sidebarHTML, refreshList };
}
