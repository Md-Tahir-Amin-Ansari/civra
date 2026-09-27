export function createSetupController({
  S,
  T,
  $,
  clearTimers,
  render,
  updateDL,
  syncSel,
  announce,
  invoke,
}) {
  function runDownload(from) {
    clearTimers();
    S.screen = "setup";
    S.setup = "downloading";
    S.progress = from;
    render();
    updateDL();
    T.dl = setInterval(() => {
      S.progress = Math.min(100, S.progress + 1.2);
      if (S.outcome === "net" && S.progress >= 46) {
        clearInterval(T.dl);
        S.outcome = "ok";
        syncSel();
        S.progress = 46;
        S.setup = "failed";
        render();
        announce(
          "The download stopped at 46 percent. Select Try again to continue.",
        );
        return;
      }
      if (S.progress >= 100) {
        clearInterval(T.dl);
        runVerify();
        return;
      }
      updateDL();
    }, 110);
  }
  function runVerify() {
    clearTimers();
    S.setup = "verifying";
    S.verifyPct = 0;
    render();
    announce("Download finished. Checking the file.");
    T.ver = setInterval(() => {
      S.verifyPct = Math.min(100, S.verifyPct + 2.5);
      const b = $("#verBar");
      if (b) {
        const p = Math.round(S.verifyPct);
        b.setAttribute("aria-valuenow", p);
        b.firstElementChild.style.width = p + "%";
        $("#verTxt").innerHTML = `<strong>${p}%</strong> checked`;
      }
      if (S.verifyPct >= 100) {
        clearInterval(T.ver);
        if (S.outcome === "verify") {
          S.outcome = "ok";
          syncSel();
          S.setup = "verifyFailed";
          render();
          announce("The downloaded file didn't pass the check.");
        } else {
          S.setup = "ready";
          render();
          announce("Civra is ready. Chatting now works without internet.");
        }
      }
    }, 80);
  }

  async function chooseModel() {
    if (!invoke) return;
    S.setupError = null;
    const path = await invoke("choose_approved_model");
    if (!path) return;
    S.setup = "verifying";
    render();
    try {
      await invoke("load_native_engine", {
        modelPath: path,
        firstUse: true,
      });
      await invoke("set_setup_complete", { complete: true });
      S.modelPath = path;
      S.modelReady = true;
      S.setup = "ready";
      render();
    } catch (error) {
      S.setupError = String(error);
      S.setup = "consent";
      render();
    }
  }
  return { runDownload, chooseModel };
}
