export function createDialogs({
  S,
  $,
  win,
  esc,
  persistChat,
  toast,
  refreshList,
  refreshHead,
}) {
  let lastFocus = null;
  let pending = null;
  /* ---------- dialogs ---------- */
  function openModal(html, opener) {
    closeModal(true);
    lastFocus = opener || document.activeElement;
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.id = "overlay";
    ov.innerHTML = html;
    win.appendChild(ov);
    const f =
      ov.querySelector("[data-autofocus]") || ov.querySelector("button,input");
    if (f) {
      f.focus();
      if (f.select) f.select();
    }
  }
  function closeModal(quiet) {
    const ov = $("#overlay");
    if (!ov) return;
    ov.remove();
    pending = null;
    if (quiet) return;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else {
      const f = $("#msg") || $("#q") || $("#main h1");
      if (f) f.focus();
    }
  }
  function renameDialog(id, opener) {
    const c = S.chats.find((x) => x.id === id);
    if (!c) return;
    pending = id;
    openModal(
      `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
<h2 id="dlg-t">Rename chat</h2>
<label class="sr-only" for="renameInput">Chat name</label>
<input class="text" id="renameInput" maxlength="80" value="${esc(c.title)}" data-autofocus>
<p class="err" id="renameErr" hidden>Enter a name for this chat.</p>
<div class="btn-row"><button class="btn" data-act="mCancel">Cancel</button><button class="btn primary" data-act="mRename">Save name</button></div></div>`,
      opener,
    );
  }
  function saveRename() {
    const inp = $("#renameInput");
    if (!inp) return;
    const v = inp.value.trim();
    if (!v) {
      $("#renameErr").hidden = false;
      inp.focus();
      return;
    }
    const c = S.chats.find((x) => x.id === pending);
    if (c) c.title = v;
    if (c)
      void persistChat(c).catch(() =>
        toast("Civra couldn't save the new name. Try again."),
      );
    closeModal();
    refreshList();
    if (S.screen === "chat" && S.cur === c) refreshHead();
    toast("Chat renamed");
  }
  function deleteDialog(id, opener) {
    const c = S.chats.find((x) => x.id === id);
    if (!c) return;
    pending = id;
    openModal(
      `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
<h2 id="dlg-t">Delete this chat?</h2>
<p id="dlg-d">“${esc(c.title)}” will be removed from this PC. This can't be undone.</p>
<div class="btn-row"><button class="btn" data-act="mCancel" data-autofocus>Cancel</button><button class="btn danger" data-act="mDelete">Delete chat</button></div></div>`,
      opener,
    );
  }
  function deleteAllDialog(opener) {
    openModal(
      `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
<h2 id="dlg-t">Delete all chats?</h2>
<p id="dlg-d">This permanently removes all ${S.chats.length} saved ${S.chats.length === 1 ? "chat" : "chats"} from this PC. This can't be undone. Your settings and the model aren't affected.</p>
<div class="btn-row"><button class="btn" data-act="mCancel" data-autofocus>Cancel</button><button class="btn danger" data-act="mDeleteAll">Delete all chats</button></div></div>`,
      opener,
    );
  }

  return {
    closeModal,
    renameDialog,
    saveRename,
    deleteDialog,
    deleteAllDialog,
    getPending: () => pending,
  };
}
