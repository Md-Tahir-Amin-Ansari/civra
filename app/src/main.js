const body = document.body;
const setupScreen = document.querySelector("#setup-screen");
const chatScreen = document.querySelector("#chat-screen");
const screenTitle = document.querySelector("#screen-title");
function showChatLayout() {
  setupScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  screenTitle.textContent = "Getting started";
}
document.querySelector("#try-shell").addEventListener("click", showChatLayout);
document.querySelector(".new-chat").addEventListener("click", showChatLayout);
document
  .querySelector("#continue-setup")
  .addEventListener("click", () =>
    document.querySelector("#details-dialog").showModal(),
  );
document
  .querySelector("#show-details")
  .addEventListener("click", () =>
    document.querySelector("#details-dialog").showModal(),
  );
document
  .querySelector("#close-details")
  .addEventListener("click", () =>
    document.querySelector("#details-dialog").close(),
  );
document
  .querySelector("#open-settings")
  .addEventListener("click", () =>
    document.querySelector("#settings-dialog").showModal(),
  );
document
  .querySelector("#close-settings")
  .addEventListener("click", () =>
    document.querySelector("#settings-dialog").close(),
  );
document.querySelector("#theme-toggle").addEventListener("click", (event) => {
  const isDark = body.classList.toggle("dark-theme");
  event.currentTarget.setAttribute("aria-pressed", String(isDark));
  event.currentTarget.textContent = isDark
    ? "Use light theme"
    : "Use dark theme";
});
