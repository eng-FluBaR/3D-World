import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { getSession } from "../services/auth.js";

const STORAGE_BUCKET = "uploads";

function showMessage(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("d-none");
}

function hideMessage(element) {
  if (!element) return;
  element.classList.add("d-none");
  element.textContent = "";
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

onReady(() => {
  const form = document.getElementById("upload-form");
  const errorBox = document.getElementById("upload-error");
  const successBox = document.getElementById("upload-success");
  const submitButton = document.getElementById("upload-submit");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage(errorBox);
    hideMessage(successBox);

    const session = await getSession();
    if (!session) {
      window.location.replace("/login.html");
      return;
    }

    const fileInput = document.getElementById("model-file");
    const materialSelect = document.getElementById("material");
    const quantityInput = document.getElementById("quantity");
    const notesInput = document.getElementById("notes");

    const file = fileInput?.files?.[0];
    const material = materialSelect?.value || "";
    const quantity = Number.parseInt(quantityInput?.value, 10);
    const notes = notesInput?.value?.trim() || "";

    if (!file) {
      showMessage(errorBox, "Please select an STL or OBJ file.");
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".stl") && !lowerName.endsWith(".obj")) {
      showMessage(errorBox, "Only STL or OBJ files are allowed.");
      return;
    }

    if (!material) {
      showMessage(errorBox, "Please select a material.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      showMessage(errorBox, "Please enter a valid quantity.");
      return;
    }

    if (submitButton) submitButton.disabled = true;

    try {
      const client = createSupabaseClient();
      const userId = session.user?.id;
      const safeName = sanitizeFileName(file.name);
      const filePath = `requests/${userId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const publicData = client.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      const fileUrl = publicData?.data?.publicUrl || null;

      const payload = {
        user_id: userId,
        file_path: filePath,
        file_name: file.name,
        file_url: fileUrl,
        material,
        quantity,
        notes,
        status: "pending"
      };

      const { error: insertError } = await client.from("requests").insert(payload);
      if (insertError) {
        throw insertError;
      }

      showMessage(successBox, "Request submitted successfully.");
      form.reset();
    } catch (err) {
      showMessage(errorBox, err?.message || "Upload failed. Please try again.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
