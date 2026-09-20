export function createSettingsView({ S, ic, modeLabel, invoke, detailsBlock }) {
  /* ---------- SETTINGS ---------- */
  function gpuStatusHTML() {
    const g = S.gpuState;
    if (g === "checking")
      return `<div class="alert info">${ic("info", 20)}<div><strong>Checking your graphics card…</strong><p>This takes a few seconds. Civra is still using Standard mode.</p></div></div>`;
    if (g === "failed")
      return `<div class="alert danger" role="alert">${ic("alert", 20)}<div><strong>Graphics card mode couldn't start.</strong><p>Civra is still using Standard mode, so nothing has changed and your chats are safe. You can try again, or keep using Standard.</p><div class="btn-row"><button class="btn sm" data-act="tryGpu">Try again</button></div></div></div>`;
    if (g === "fallback")
      return `<div class="alert warn">${ic("alert", 20)}<div><strong>Graphics card mode stopped working while you were chatting.</strong><p>Civra switched back to Standard mode automatically. You can try graphics card mode again at any time.</p></div></div>`;
    if (g === "on")
      return `<div class="alert ok">${ic("check", 20)}<div><strong>Now using your graphics card (experimental).</strong><p>If replies become slow or stop, switch back to Standard.</p></div></div>`;
    return `<p class="muted">Currently using: <strong>${modeLabel()}</strong></p>`;
  }
  function settingsHTML() {
    const none = Boolean(invoke) || S.gpuSim === "none",
      n = S.chats.length;
    return `<div class="settings"><div class="settings-inner">
<button class="btn sm" data-act="backToChat">${ic("back", 16)} Back to chat</button>
<h1 tabindex="-1">Settings</h1>
<section class="set" aria-labelledby="s-look"><h2 id="s-look">Appearance</h2>
<fieldset><legend>Theme</legend><div class="seg">
  ${[
    ["light", "Light"],
    ["dark", "Dark"],
    ["system", "Match Windows"],
  ]
    .map(
      ([v, l]) =>
        `<label class="choice"><input type="radio" name="theme" value="${v}"${S.theme === v ? " checked" : ""}><span><strong>${l}</strong></span></label>`,
    )
    .join("")}
</div></fieldset></section>
<section class="set" aria-labelledby="s-run"><h2 id="s-run">How Civra runs</h2>
<p class="muted">Choose how the model runs on this PC. You can change this at any time.</p>
<fieldset><legend class="sr-only">Run mode</legend><div class="stack">
  <label class="choice"><input type="radio" name="mode" value="cpu"${S.mode === "cpu" ? " checked" : ""}><span><strong>Standard<span class="tag">Recommended</span></strong><span class="d">Works reliably on most PCs. Uses your computer's processor.</span></span></label>
  <label class="choice${none ? " disabled" : ""}"><input type="radio" name="mode" value="gpu"${S.mode === "gpu" ? " checked" : ""}${none ? " disabled" : ""}><span><strong>Use graphics card<span class="tag w">Experimental</span></strong><span class="d">May be faster on some PCs, but it can be less stable.</span>${none ? `<span class="d w">${invoke ? "Coming after the CPU release." : "Not available on this PC."}</span>` : ""}</span></label>
</div></fieldset>
<div id="gpuStatus" aria-live="polite">${gpuStatusHTML()}</div></section>
<section class="set" aria-labelledby="s-hist"><h2 id="s-hist">Chat history</h2>
<p>${n ? `${n} ${n === 1 ? "chat is" : "chats are"} saved on this PC. Civra doesn't upload them.` : "No chats are saved on this PC."}</p>
<button class="btn danger-o" data-act="delAll"${n ? "" : " disabled"}>${ic("trash", 16)} Delete all chats…</button></section>
<section class="set" aria-labelledby="s-model"><h2 id="s-model">Model</h2>
<p>${S.modelReady ? "Approved model verified and running on this PC." : "No verified model is running."}</p>
<div class="row"><button class="btn" data-act="checkModel">Check model file</button><span id="modelCheck" role="status" class="muted"></span></div>
${detailsBlock()}</section>
<section class="set" aria-labelledby="s-priv"><h2 id="s-priv">Privacy and safety</h2>
<p>Chats are processed on this PC and saved here. Civra has no account and doesn't send your chats to a cloud service. Anyone who can use your Windows account may be able to see saved chats, so delete anything you don't want kept.</p>
<p>Civra can be wrong and can sound confident when it is. Don't rely on it alone for medical, legal, financial or safety decisions.</p></section>
<section class="set" aria-labelledby="s-keys"><h2 id="s-keys">Keyboard shortcuts</h2>
<dl class="shortcuts">
  <div><dt><kbd>Enter</kbd></dt><dd>Send your message</dd></div>
  <div><dt><kbd>Shift</kbd> + <kbd>Enter</kbd></dt><dd>Start a new line</dd></div>
  <div><dt><kbd>Ctrl</kbd> + <kbd>N</kbd></dt><dd>Start a new chat</dd></div>
  <div><dt><kbd>Esc</kbd></dt><dd>Close a dialog or the chat list</dd></div>
</dl></section>
</div></div>`;
  }
  return { settingsHTML, gpuStatusHTML };
}
