const body = document.body;
const settingsDialog = document.querySelector("#settings-dialog");
const title = document.querySelector("#chat-title");
const subtitle = document.querySelector("#chat-subtitle");

function setTheme(isDark) {
  body.classList.toggle("dark-theme", isDark);
  const toggle = document.querySelector("#theme-toggle");
  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.textContent = isDark ? "Light theme" : "Dark theme";
}

document.querySelector("#theme-toggle").addEventListener("click", () => {
  setTheme(!body.classList.contains("dark-theme"));
});

document.querySelector("#open-settings").addEventListener("click", () => {
  settingsDialog.showModal();
});

document.querySelector("#close-settings").addEventListener("click", () => {
  settingsDialog.close();
});

document.querySelector("#new-chat").addEventListener("click", () => {
  title.textContent = "New chat";
  subtitle.textContent = "Local · nothing leaves this device";
  document.querySelectorAll(".history-item").forEach((item) => {
    item.classList.remove("active");
  });
});

document.querySelectorAll(".suggestions button").forEach((button) => {
  button.addEventListener("click", () => {
    title.textContent = "New chat";
    subtitle.textContent =
      "Model setup is required before you can send a message";
  });
});
