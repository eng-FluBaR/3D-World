import { onReady } from "../utils/dom.js";
import { getSession, signOut } from "../services/auth.js";

onReady(async () => {
  const session = await getSession();
  if (!session) {
    window.location.replace("/app/login.html");
    return;
  }

  const emailLabel = document.getElementById("user-email");
  if (emailLabel) {
    emailLabel.textContent = session.user?.email || "";
  }

  const logoutButton = document.getElementById("logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
      await signOut();
      window.location.replace("/app/login.html");
    } finally {
      logoutButton.disabled = false;
    }
  });
});

