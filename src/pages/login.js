import { onReady } from "../utils/dom.js";
import { signInWithEmail } from "../services/auth.js";

onReady(() => {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const submitButton = document.getElementById("login-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (errorBox) {
      errorBox.classList.add("d-none");
      errorBox.textContent = "";
    }

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      if (errorBox) {
        errorBox.textContent = "Моля въведете имейл и парола.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    if (submitButton) submitButton.disabled = true;

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        throw error;
      }
      window.location.replace("/app/dashboard.html");
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err?.message || "Входът се провали. Моля опитайте отново.";
        errorBox.classList.remove("d-none");
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

