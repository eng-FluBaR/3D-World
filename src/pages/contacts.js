import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { getSession } from "../services/auth.js";

function showSuccess(messageHost, text) {
  if (!messageHost) return;
  messageHost.textContent = text;
  messageHost.classList.remove("d-none");
}

function hideSuccess(messageHost) {
  if (!messageHost) return;
  messageHost.classList.add("d-none");
}

onReady(async () => {
  const form = document.getElementById("contact-form");
  const successMessage = document.getElementById("form-success");

  if (!form) return;

  const client = createSupabaseClient();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideSuccess(successMessage);

    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");

    const session = await getSession();

    const payload = {
      name: (nameInput?.value || "").trim(),
      email: (emailInput?.value || "").trim(),
      message: (messageInput?.value || "").trim(),
      user_id: session?.user?.id || null
    };

    const { error } = await client.from("contact_inquiries").insert(payload);

    if (error) {
      alert(error.message || "Неуспешно изпращане. Моля опитайте отново.");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    form.classList.add("was-validated");
    showSuccess(successMessage, "Благодарим! Запитването е изпратено успешно.");
    form.reset();

    if (submitButton) submitButton.disabled = false;
  });
});
