import { onReady } from "../utils/dom.js";
import { signUpWithEmail } from "../services/auth.js";

onReady(() => {
  const form = document.getElementById("register-form");
  const errorBox = document.getElementById("register-error");
  const successBox = document.getElementById("register-success");
  const submitButton = document.getElementById("register-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (errorBox) {
      errorBox.classList.add("d-none");
      errorBox.textContent = "";
    }

    if (successBox) {
      successBox.classList.add("d-none");
      successBox.textContent = "";
    }

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      if (errorBox) {
        errorBox.textContent = "Please enter email and password.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    if (submitButton) submitButton.disabled = true;

    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) {
        throw error;
      }
      if (successBox) {
        successBox.textContent = "Registration successful. Check your email to confirm.";
        successBox.classList.remove("d-none");
      }
      form.reset();
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = err?.message || "Registration failed. Please try again.";
        errorBox.classList.remove("d-none");
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
