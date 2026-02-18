import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { getSession } from "../services/auth.js";

const STORAGE_BUCKET = "uploads";
const SERVICE_OPTIONS = ["scan", "model", "print"];

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

async function ensureProfileExists(client, session) {
  const userId = session?.user?.id;
  const email = session?.user?.email || null;
  const displayName = session?.user?.user_metadata?.display_name || null;

  if (!userId) {
    throw new Error("Невалидна потребителска сесия.");
  }

  const { data: existingProfile, error: profileReadError } = await client
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileReadError) {
    throw profileReadError;
  }

  if (existingProfile) {
    return;
  }

  const { error: profileInsertError } = await client
    .from("profiles")
    .insert({
      user_id: userId,
      email,
      display_name: displayName,
      role: "user"
    });

  if (profileInsertError) {
    throw profileInsertError;
  }
}

async function loadMaterials() {
  try {
    const client = createSupabaseClient();
    const { data, error } = await client
      .from("materials")
      .select("id, name, base_price")
      .order("name", { ascending: true });

    if (error) throw error;

    const materialSelect = document.getElementById("material");
    if (!materialSelect) return;

    // Keep the default option
    materialSelect.innerHTML = '<option value="" selected disabled>Изберете материал</option>';

    // Add materials from database
    if (data && data.length > 0) {
      data.forEach(material => {
        const option = document.createElement("option");
        option.value = material.name;
        option.textContent = `${material.name} - ${material.base_price} лв/час`;
        materialSelect.appendChild(option);
      });
    } else {
      // Fallback to default materials if none in database
      const defaultMaterials = [
        { name: "PLA", label: "PLA - Полилактид (стандартен)" },
        { name: "PETG", label: "PETG - Издръжлив и гъвкав" },
        { name: "ABS", label: "ABS - Висока якост" }
      ];
      
      defaultMaterials.forEach(material => {
        const option = document.createElement("option");
        option.value = material.name;
        option.textContent = material.label;
        materialSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('[UPLOAD] Error loading materials:', err);
    // Keep default HTML materials on error
  }
}

onReady(() => {
  // Load materials from database
  loadMaterials();

  const form = document.getElementById("upload-form");
  const errorBox = document.getElementById("upload-error");
  const successBox = document.getElementById("upload-success");
  const submitButton = document.getElementById("upload-submit");
  const serviceOptionsHost = document.getElementById("service-options");

  const selectedServices = new Set();

  const refreshServiceButtons = () => {
    if (!serviceOptionsHost) return;

    serviceOptionsHost.querySelectorAll(".task-toggle-btn").forEach((button) => {
      const serviceKey = button.getAttribute("data-service") || "";
      const isActive = selectedServices.has(serviceKey);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  serviceOptionsHost?.addEventListener("click", (event) => {
    const button = event.target.closest(".task-toggle-btn");
    if (!button) return;

    const serviceKey = button.getAttribute("data-service") || "";
    if (!SERVICE_OPTIONS.includes(serviceKey)) return;

    if (selectedServices.has(serviceKey)) {
      selectedServices.delete(serviceKey);
    } else {
      selectedServices.add(serviceKey);
    }

    refreshServiceButtons();
  });

  refreshServiceButtons();

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
    const serviceOptions = Array.from(selectedServices);

    if (!file) {
      showMessage(errorBox, "Моля изберете STL, OBJ или SVG файл.");
      return;
    }

    const lowerName = file.name.toLowerCase();
    const allowedExtensions = [".stl", ".obj", ".svg"];
    const isValidFile = allowedExtensions.some(ext => lowerName.endsWith(ext));
    
    if (!isValidFile) {
      showMessage(errorBox, "Позволени са само STL, OBJ и SVG файлове.");
      return;
    }

    if (!material) {
      showMessage(errorBox, "Моля изберете материал.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      showMessage(errorBox, "Моля въведете валидно количество.");
      return;
    }

    if (submitButton) submitButton.disabled = true;

    try {
      const client = createSupabaseClient();
      const userId = session.user?.id;
      await ensureProfileExists(client, session);
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
        service_options: serviceOptions,
        status: "pending"
      };

      const { error: insertError } = await client.from("requests").insert(payload);
      if (insertError) {
        throw insertError;
      }

      showMessage(successBox, "Заявката е изпратена успешно.");
      form.reset();
      selectedServices.clear();
      refreshServiceButtons();
    } catch (err) {
      console.error('[UPLOAD] Upload error:', err);
      console.error('[UPLOAD] Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
      
      let errorMessage = "Качването се провали. Моля опитайте отново.";
      
      if (err?.message) {
        errorMessage = err.message;
      }
      
      if (err?.code === '42P17') {
        errorMessage = "Грешка в базата данни. Моля влезте отново в акаунта си.";
      }
      
      if (err?.message?.includes('row-level security')) {
        errorMessage = "Нямате права за качване на файлове. Моля влезте в акаунта си.";
      }
      
      showMessage(errorBox, errorMessage);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
