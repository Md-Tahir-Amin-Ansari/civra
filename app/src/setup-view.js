export function createSetupView({ S, esc, ic, mark, invoke }) {
  /* ---------- SETUP ---------- */
  function stepper(cur) {
    return `<ol class="steps" aria-label="Setup progress">${[
      "Download",
      "Check",
      "Ready",
    ]
      .map((l, i) => {
        const n = i + 1,
          st = cur > n ? "done" : cur === n ? "current" : "todo";
        return `<li class="${st}"${st === "current" ? ' aria-current="step"' : ""}><span class="dot">${st === "done" ? ic("check", 14) : n}</span><span>${l}${st === "done" ? '<span class="sr-only"> (done)</span>' : ""}</span></li>`;
      })
      .join("")}</ol>`;
  }
  function detailsBlock(extra) {
    if (invoke)
      return `<button class="link" data-act="toggleDetails" aria-expanded="${S.detailsOpen}" aria-controls="tech">${ic("chevron", 16)} Details</button><div id="tech" class="tech"${S.detailsOpen ? "" : " hidden"}><dl><div><dt>Approved file</dt><dd>gemma-4-E2B-it.litertlm</dd></div><div><dt>Size</dt><dd>About 2.4 GB</dd></div><div><dt>File check</dt><dd>SHA-256 checksum</dd></div><div><dt>Runs on</dt><dd>CPU</dd></div>${S.modelPath ? `<div><dt>Location</dt><dd>${esc(S.modelPath)}</dd></div>` : ""}${extra || ""}</dl></div>`;
    return `<button class="link" data-act="toggleDetails" aria-expanded="${S.detailsOpen}" aria-controls="tech">${ic("chevron", 16)} Details</button>
<div id="tech" class="tech"${S.detailsOpen ? "" : " hidden"}><dl>
<div><dt>Model file</dt><dd>civra-model.litertlm</dd></div>
<div><dt>Size</dt><dd>About 2.4 GB (2,412 MB)</dd></div>
<div><dt>Precision</dt><dd>4-bit quantized</dd></div>
<div><dt>File check</dt><dd>SHA-256 checksum</dd></div>
<div><dt>Runs on</dt><dd>CPU by default. GPU is optional and experimental.</dd></div>
<div><dt>Saved to</dt><dd>C:\\Users\\you\\AppData\\Local\\Civra\\model</dd></div>
${extra || ""}
</dl></div>`;
  }
  function setupCard() {
    const st = S.setup;
    if (invoke) {
      if (st === "verifying" || st === "loading")
        return `<div class="model-spinner" role="status" aria-label="${st === "verifying" ? "Verifying and loading model" : "Loading model"}"></div><h2>${st === "verifying" ? "Checking and starting your model" : "Starting your private AI"}</h2><p class="muted">${st === "verifying" ? "Civra is verifying this model once, then loading it on this PC." : "Civra is loading your saved model. It is not downloading or checking the full file again."} This may take a minute.</p>`;
      if (st === "ready")
        return `<h2>Civra is ready</h2><div class="alert ok" role="status">${ic("check", 20)}<div><strong>Your model is verified and running locally.</strong></div></div><button class="btn primary lg block" data-act="startChat">Start chatting</button>`;
      return `<h2>Set up Civra</h2><p class="muted">Choose the approved Gemma 4 E2B model file already saved on this PC. Civra will check it before use.</p><p class="muted">No account or network connection is needed for this step.</p>${S.setupError ? `<div class="alert danger" role="alert">${ic("alert", 20)}<div>${esc(S.setupError)}</div></div>` : ""}<button class="btn primary lg block" data-act="chooseModel">${ic("folder", 20)} Choose model file</button>${detailsBlock()}`;
    }
    if (st === "consent") {
      return `${stepper(1)}
<h2>Set up Civra</h2>
<p class="muted">Civra needs to download its language model once before you can chat.</p>
<dl class="kv">
<div><dt>Download size</dt><dd>About 2.4 GB</dd></div>
<div><dt>Space needed</dt><dd>About 2.4 GB free<span class="sub ok-txt">You have 118 GB free</span></dd></div>
<div><dt>Internet</dt><dd>Needed for this download only. After setup, chatting works without a connection.</dd></div>
</dl>
${detailsBlock()}
${S.online ? "" : `<div class="alert warn" role="status">${ic("alert", 20)}<div><strong>This PC isn't connected to the internet.</strong><p>Connect to the internet, then start the download.</p></div></div>`}
<p class="consent">When you select Download, Civra downloads the model over your internet connection. Nothing downloads before then.</p>
<button class="btn primary lg block" data-act="startDownload"${S.online ? "" : " disabled"}>${ic("download", 20)} Download model (2.4 GB)</button>`;
    }
    if (st === "downloading") {
      const p = Math.round(S.progress);
      return `${stepper(1)}
<h2>Downloading the model</h2>
<div class="bar" id="dlBar" role="progressbar" aria-label="Download progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>
<div class="prog-row"><span id="dlTxt"><strong>${p}%</strong> — ${((2.4 * S.progress) / 100).toFixed(1)} GB of 2.4 GB</span><span class="muted" id="dlEta"></span></div>
<p class="muted">Keep Civra open until this finishes. You can use other apps in the meantime.</p>
${detailsBlock()}
<div class="btn-row"><button class="btn" data-act="cancelDownload">Cancel download</button></div>`;
    }
    if (st === "failed") {
      return `${stepper(1)}
<h2>Download stopped</h2>
<div class="alert danger" role="alert">${ic("alert", 20)}<div><strong>The download stopped at ${Math.round(S.progress)}%.</strong><p>The internet connection was lost. Nothing is damaged, and Civra will start a clean download when you try again.</p></div></div>
<p><strong>What to do next</strong></p>
<ol class="todo"><li>Check that this PC is connected to the internet.</li><li>Select Try again to restart the download.</li></ol>
${detailsBlock("<div><dt>Error</dt><dd>Network connection interrupted (NET-104)</dd></div>")}
<div class="btn-row"><button class="btn primary lg" data-act="retryDownload">${ic("retry", 18)} Try again</button></div>`;
    }
    if (st === "verifying") {
      const p = Math.round(S.verifyPct);
      return `${stepper(2)}
<h2>Checking the download</h2>
<p class="muted">Civra is making sure the file is complete and hasn't been changed. This usually takes about a minute.</p>
<div class="bar" id="verBar" role="progressbar" aria-label="File check progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>
<div class="prog-row"><span id="verTxt"><strong>${p}%</strong> checked</span></div>
<p class="muted">Please keep Civra open.</p>
${detailsBlock()}`;
    }
    if (st === "verifyFailed") {
      return `${stepper(2)}
<h2>The file didn't pass the check</h2>
<div class="alert danger" role="alert">${ic("alert", 20)}<div><strong>Civra won't use this file.</strong><p>It may be incomplete or damaged. Nothing else on your PC was changed, and your saved chats are safe.</p></div></div>
<p><strong>What to do next</strong></p>
<ol class="todo"><li>Delete the file and download it again.</li><li>You'll need an internet connection for the new download.</li></ol>
${detailsBlock("<div><dt>Error</dt><dd>File check mismatch (VER-201)</dd></div>")}
<div class="btn-row"><button class="btn primary lg" data-act="redownload">${ic("download", 18)} Delete file and download again (2.4 GB)</button></div>`;
    }
    return `${stepper(4)}
<h2>Civra is ready</h2>
<div class="alert ok" role="status">${ic("check", 20)}<div><strong>The model is installed and checked.</strong><p>From now on, chatting works without an internet connection. You can go offline and Civra will still answer.</p></div></div>
<dl class="kv">
<div><dt>Stored on this PC</dt><dd>About 2.4 GB</dd></div>
<div><dt>How it runs</dt><dd>Standard mode, which works on most PCs. You can change this in Settings.</dd></div>
</dl>
<button class="btn primary lg block" data-act="startChat">Start chatting</button>`;
  }
  function setupHTML() {
    return `<div class="setup">
<section class="setup-left" aria-labelledby="hero-h">
<div class="brand">${mark(34)}<span>Civra</span></div>
<h1 id="hero-h">Chat with an AI that stays on your PC.</h1>
<p class="lead">Civra runs its language model on this computer. There is no account to create, and after setup you don't need an internet connection.</p>
<ul class="facts">
  <li>${ic("monitor", 22)}<div><strong>Chats are processed on this PC.</strong><p>Your messages go to a model stored on this computer, not to an online service.</p></div></li>
  <li>${ic("folder", 22)}<div><strong>History is saved here, not in an account.</strong><p>There is no sign-in. You can delete chats at any time. Anyone who can use your Windows account may be able to read them.</p></div></li>
  <li>${ic("alert", 22)}<div><strong>Answers can be wrong.</strong><p>Civra can sound sure and still be mistaken. Don't rely on it alone for medical, legal, financial or safety decisions.</p></div></li>
</ul>
</section>
<section class="setup-right" aria-label="Set up Civra"><div class="setup-card" id="card">${setupCard()}</div></section>
</div>`;
  }
  return { setupHTML, detailsBlock };
}
