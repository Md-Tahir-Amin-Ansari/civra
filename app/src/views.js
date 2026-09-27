import { createSetupView } from "./setup-view.js";
import { createSidebarView } from "./sidebar-view.js";
import { createChatView } from "./chat-view.js";
import { createSettingsView } from "./settings-view.js";

export function createViews({
  S,
  $,
  esc,
  ic,
  mark,
  fmt,
  hl,
  snippet,
  modeLabel,
  invoke,
  GROUPS,
  SUGGESTS,
  updateDL,
}) {
  const { setupHTML, detailsBlock } = createSetupView({
    S,
    esc,
    ic,
    mark,
    invoke,
  });
  const { sidebarHTML, refreshList } = createSidebarView({
    S,
    $,
    esc,
    ic,
    mark,
    hl,
    snippet,
    GROUPS,
  });
  const {
    chatHTML,
    refreshHead,
    refreshNotice,
    refreshSlot,
    nearBottom,
    scrollBottom,
    refreshThread,
    tickText,
    appendNativeText,
  } = createChatView({ S, $, esc, ic, mark, fmt, modeLabel, SUGGESTS });
  const { settingsHTML, gpuStatusHTML } = createSettingsView({
    S,
    ic,
    modeLabel,
    invoke,
    detailsBlock,
  });

  function render() {
    const b = $("#body");
    b.dataset.drawer = S.drawer ? "open" : "closed";
    if (S.screen === "setup") {
      b.innerHTML = setupHTML();
      if (S.setup === "downloading") updateDL();
    } else {
      b.innerHTML =
        sidebarHTML() +
        `<main class="main" id="main">${S.screen === "chat" ? chatHTML() : settingsHTML()}</main><div class="scrim" data-act="closeDrawer"></div>`;
      if (S.screen === "chat") scrollBottom();
    }
  }
  return {
    render,
    refreshList,
    refreshHead,
    refreshNotice,
    refreshSlot,
    nearBottom,
    scrollBottom,
    refreshThread,
    tickText,
    appendNativeText,
    gpuStatusHTML,
  };
}
