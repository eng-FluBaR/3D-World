import { onReady } from "../utils/dom.js";
import { signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.add(isError ? "alert-danger" : "alert-success");
  element.classList.remove(isError ? "alert-success" : "alert-danger", "d-none");
}

function hideMessage(element) {
  if (!element) return;
  element.classList.add("d-none");
  element.textContent = "";
}

function renderRow(material) {
  return `
    <article class="material-card" data-id="${material.id}">
      <div class="material-name mb-2">${material.name || "-"}</div>
      <div class="mb-3">
        <label class="form-label mb-1">Base Price (€)</label>
        <input type="number" class="form-control form-control-sm price-input" value="${material.base_price || ""}" step="0.01" data-id="${material.id}" />
      </div>
      <div class="material-actions">
        <button class="btn btn-sm btn-primary save-price" data-id="${material.id}">Save</button>
        <button class="btn btn-sm btn-outline-danger delete-material" data-id="${material.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <div class="materials-empty text-muted">No materials yet.</div>
  `;
}

onReady(async () => {
  const form = document.getElementById("add-material-form");
  const nameInput = document.getElementById("material-name");
  const priceInput = document.getElementById("material-price");
  const formError = document.getElementById("form-error");
  const formSuccess = document.getElementById("form-success");
  const formSubmit = document.getElementById("form-submit");

  const body = document.getElementById("materials-body");
  const materialsError = document.getElementById("materials-error");
  const logoutButton = document.getElementById("admin-logout");

  const role = await requireAdminRole();
  if (!role) {
    return;
  }

  const client = createSupabaseClient();
  let allMaterials = [];

  const loadMaterials = async () => {
    const { data, error } = await client
      .from("materials")
      .select("id, name, base_price")
      .order("name", { ascending: true });

    if (error) {
      materialsError.textContent = error.message;
      materialsError.classList.remove("d-none");
      renderEmptyState(body);
      return;
    }

    if (!data || data.length === 0) {
      renderEmptyState(body);
      return;
    }

    allMaterials = data;
    body.innerHTML = allMaterials.map(renderRow).join("");
    attachEventListeners();
  };

  const attachEventListeners = () => {
    body.querySelectorAll(".save-price").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const materialId = btn.getAttribute("data-id");
        const row = body.querySelector(`[data-id="${materialId}"]`);
        const price = row.querySelector(".price-input")?.value || "";

        if (price === "" || Number.isNaN(Number(price))) {
          alert("Please enter a valid price.");
          return;
        }

        btn.disabled = true;

        const { error } = await client
          .from("materials")
          .update({ base_price: Number(price) })
          .eq("id", materialId);

        if (error) {
          alert(error.message);
        } else {
          const matIndex = allMaterials.findIndex((m) => m.id === materialId);
          if (matIndex !== -1) {
            allMaterials[matIndex].base_price = Number(price);
          }
        }

        btn.disabled = false;
      });
    });

    body.querySelectorAll(".delete-material").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const materialId = btn.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this material?")) {
          return;
        }

        btn.disabled = true;

        const { error } = await client.from("materials").delete().eq("id", materialId);

        if (error) {
          alert(error.message);
          btn.disabled = false;
        } else {
          allMaterials = allMaterials.filter((m) => m.id !== materialId);
          if (allMaterials.length === 0) {
            renderEmptyState(body);
          } else {
            body.querySelector(`[data-id="${materialId}"]`).remove();
          }
        }
      });
    });
  };

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessage(formError);
      hideMessage(formSuccess);

      const name = nameInput?.value?.trim() || "";
      const price = priceInput?.value || "";

      if (!name) {
        showMessage(formError, "Material name is required.", true);
        return;
      }

      if (price === "" || Number.isNaN(Number(price))) {
        showMessage(formError, "Please enter a valid price.", true);
        return;
      }

      if (formSubmit) formSubmit.disabled = true;

      const { data, error } = await client
        .from("materials")
        .insert([{ name, base_price: Number(price) }])
        .select();

      if (error) {
        showMessage(formError, error.message, true);
      } else {
        const newMaterial = data?.[0];
        if (newMaterial) {
          allMaterials.push(newMaterial);
          if (body.querySelector(".materials-empty")) {
            body.innerHTML = allMaterials.map(renderRow).join("");
          } else {
            body.innerHTML += renderRow(newMaterial);
          }
          attachEventListeners();
        }

        showMessage(formSuccess, "Material added successfully.");
        form.reset();
      }

      if (formSubmit) formSubmit.disabled = false;
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      try {
        await signOut();
        window.location.replace("/app/login.html");
      } finally {
        logoutButton.disabled = false;
      }
    });
  }

  await loadMaterials();
});

