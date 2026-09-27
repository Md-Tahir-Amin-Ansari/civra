export function bindMockupControls({
  S,
  T,
  $,
  win,
  render,
  stopStreaming,
  clearTimers,
  closeModal,
  newDraft,
  sampleChats,
  toast,
  applyTheme,
  REPLIES,
  MEAL_Q,
  startReply,
  refreshThread,
  syncSel,
  refreshHead,
}) {
  /* ---------- mockup controls ---------- */
  function seedConversation(status) {
    const c = {
      id: S.nextId++,
      title: "Simple weekly meal plan",
      when: "Today",
      time: "Just now",
      messages: [{ role: "user", text: MEAL_Q }],
    };
    S.chats.unshift(c);
    S.cur = c;
    S.screen = "chat";
    S.notice = null;
    render();
    if (status === "streaming") startReply({ slow: true, startAt: 24 });
    else if (status === "stopped") {
      const words = REPLIES.meal.split(" ");
      c.messages.push({
        role: "bot",
        text: words.slice(0, 36).join(" "),
        status: "stopped",
      });
      refreshThread(true);
    } else if (status === "error") {
      c.messages.push({ role: "bot", text: "", status: "error" });
      refreshThread(true);
    }
  }
  function jump(n) {
    stopStreaming(true);
    clearTimers();
    closeModal(true);
    S.drawer = false;
    S.notice = null;
    S.query = "";
    const dropSeed = () => {
      S.chats = S.chats.filter((c) => c.title !== "Simple weekly meal plan");
    };
    switch (n) {
      case "consent":
        S.screen = "setup";
        S.setup = "consent";
        S.progress = 0;
        render();
        break;
      case "downloading":
        S.screen = "setup";
        S.setup = "downloading";
        S.progress = 46;
        render();
        break;
      case "failed":
        S.screen = "setup";
        S.setup = "failed";
        S.progress = 46;
        render();
        break;
      case "verifying":
        S.screen = "setup";
        S.setup = "verifying";
        S.verifyPct = 62;
        render();
        break;
      case "verifyFailed":
        S.screen = "setup";
        S.setup = "verifyFailed";
        render();
        break;
      case "ready":
        S.screen = "setup";
        S.setup = "ready";
        render();
        break;
      case "chatNew":
        S.screen = "chat";
        S.cur = newDraft();
        render();
        break;
      case "chatStreaming":
        dropSeed();
        seedConversation("streaming");
        break;
      case "chatStopped":
        dropSeed();
        seedConversation("stopped");
        break;
      case "chatError":
        dropSeed();
        seedConversation("error");
        break;
      case "offline":
        S.online = false;
        syncSel();
        S.screen = "chat";
        S.cur = S.chats[0] || newDraft();
        S.notice = "ready";
        render();
        break;
      case "history":
        S.screen = "chat";
        S.cur = S.chats[0] || newDraft();
        S.drawer = true;
        render();
        break;
      case "search":
        S.screen = "chat";
        S.cur = S.chats[0] || newDraft();
        S.query = "leak";
        S.drawer = true;
        render();
        break;
      case "settings":
        S.screen = "settings";
        render();
        break;
      case "gpuFallback":
        S.mode = "cpu";
        S.gpuState = "fallback";
        S.screen = "chat";
        S.cur = S.chats[0] || newDraft();
        S.notice = "gpu";
        render();
        break;
      case "restore":
        S.chats = sampleChats();
        S.cur = newDraft();
        if (S.screen !== "setup") S.screen = "chat";
        render();
        toast("Sample chats restored");
        break;
    }
    if (n === "history" || n === "search") {
      /* drawer state only matters in narrow windows */
    }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-jump]");
    if (b) jump(b.dataset.jump);
  });
  $("#themeSel").addEventListener("change", (e) => {
    S.theme = e.target.value;
    applyTheme();
  });
  $("#sizeSel").addEventListener("change", (e) => {
    S.size = e.target.value;
    win.dataset.size = S.size;
  });
  $("#netSel").addEventListener("change", (e) => {
    S.online = e.target.value === "on";
    if (S.screen === "setup" && S.setup === "consent") render();
    else if (S.screen === "chat") {
      refreshHead();
      toast(S.online ? "Back online" : "You're offline. Chatting still works.");
    }
  });
  $("#outSel").addEventListener("change", (e) => {
    S.outcome = e.target.value;
  });
  $("#gpuSel").addEventListener("change", (e) => {
    S.gpuSim = e.target.value;
    if (S.screen === "settings") {
      clearTimeout(T.gpu);
      S.gpuState = null;
      S.mode = "cpu";
      render();
    }
  });
}
