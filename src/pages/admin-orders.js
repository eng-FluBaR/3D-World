import { onReady } from "../utils/dom.js";
import { getSession, signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

const STATUS_OPTIONS = ["pending", "quoted", "accepted", "rejected", "completed"];
const GALLERY_BUCKET = "gallery";

function sanitizeFileName(name) {
  return (name || "project").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(name) {
  const lowerName = (name || "").toLowerCase();
  if (lowerName.endsWith(".stl")) return "stl";
  if (lowerName.endsWith(".obj")) return "obj";
  if (lowerName.endsWith(".svg")) return "svg";
  return "other";
}

async function publishOrderAssetToGallery(client, order) {
  if (!order?.file_path) {
    return {
      fileUrl: order?.file_url || null,
      storageBucket: null,
      storagePath: null
    };
  }

  const sourcePath = order.file_path;
  const originalName = order.file_name || sourcePath.split("/").pop() || "project";
  const safeName = sanitizeFileName(originalName);
  const targetPath = `projects/${order.id}-${Date.now()}-${safeName}`;

  const { data: sourceFile, error: downloadError } = await client.storage
    .from("uploads")
    .download(sourcePath);

  if (downloadError) {
    throw downloadError;
  }

  const { error: uploadError } = await client.storage
    .from(GALLERY_BUCKET)
    .upload(targetPath, sourceFile, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = client.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(targetPath);

  return {
    fileUrl: publicData?.publicUrl || null,
    storageBucket: GALLERY_BUCKET,
    storagePath: targetPath
  };
}
function getGalleryProject(order) {
  if (!order?.gallery_projects) return null;
  if (Array.isArray(order.gallery_projects)) {
    return order.gallery_projects[0] || null;
  }
  return order.gallery_projects;
}

function renderRow(order) {
  const galleryProject = getGalleryProject(order);
  const isCompleted = order.status === "completed";
  const statusSelect = STATUS_OPTIONS.map(
    (s) => `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`
  ).join("");

  const fileLink = order.file_url
    ? `<a href="${order.file_url}" target="_blank" class="text-truncate d-block">${order.file_name || order.file_path}</a>`
    : `<small class="text-muted">${order.file_name || order.file_path || "-"}</small>`;

  return `
    <tr data-id="${order.id}">
      <td>${order.user_email || "-"}</td>
      <td>${fileLink}</td>
      <td>
        <select class="form-select form-select-sm status-select" data-id="${order.id}">
          ${statusSelect}
        </select>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm price-input" value="${order.price || ""}" placeholder="0.00" data-id="${order.id}" />
      </td>
      <td>
        <input type="date" class="form-control form-control-sm deadline-input" value="${order.deadline || ""}" data-id="${order.id}" />
      </td>
      <td class="text-end">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-primary save-order" data-id="${order.id}">Save</button>
          <button class="btn btn-sm btn-outline-danger delete-order" data-id="${order.id}">Delete</button>
          <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${order.id}" ${isCompleted ? "" : "disabled"}>
            ${galleryProject ? "Update Gallery" : "Add Gallery"}
          </button>
          <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${order.id}" ${galleryProject ? "" : "disabled"}>
            Remove Gallery
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <tr>
      <td colspan="6" class="text-muted">No orders found.</td>
    </tr>
  `;
}

onReady(async () => {
  const body = document.getElementById("orders-body");
  const filterSelect = document.getElementById("status-filter");
  const errorBox = document.getElementById("orders-error");
  const logoutButton = document.getElementById("admin-logout");

  const role = await requireAdminRole();
  if (!role) {
    return;
  }

  const session = await getSession();
  const adminUserId = session?.user?.id || null;

  const client = createSupabaseClient();
  let allOrders = [];

  const loadOrders = async () => {
    const { data, error } = await client
      .from("requests")
      .select(
        `
        id,
        user_id,
        file_name,
        file_path,
        file_url,
        status,
        price,
        deadline,
        profiles:user_id(*),
        gallery_projects(id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("d-none");
      renderEmptyState(body);
      return;
    }

    if (!data) {
      renderEmptyState(body);
      return;
    }

    allOrders = data.map((order) => ({
      ...order,
      user_email: order.profiles?.email || "-"
    }));

    applyFilter();
  };

  const applyFilter = () => {
    const filterValue = filterSelect?.value || "";
    const filtered = filterValue
      ? allOrders.filter((o) => o.status === filterValue)
      : allOrders;

    if (filtered.length === 0) {
      renderEmptyState(body);
      return;
    }

    body.innerHTML = filtered.map(renderRow).join("");
    attachEventListeners();
  };

  const attachEventListeners = () => {
    body.querySelectorAll(".save-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        const row = body.querySelector(`tr[data-id="${orderId}"]`);

        const status = row.querySelector(".status-select")?.value || "";
        const price = row.querySelector(".price-input")?.value || null;
        const deadline = row.querySelector(".deadline-input")?.value || null;

        if (!status) {
          alert("Status is required.");
          return;
        }

        btn.disabled = true;

        const updatePayload = { status };
        if (price !== "" && price !== null) updatePayload.price = Number(price);
        if (deadline !== "" && deadline !== null) updatePayload.deadline = deadline;

        const { error } = await client.from("requests").update(updatePayload).eq("id", orderId);

        if (error) {
          alert(error.message);
        } else {
          const orderIndex = allOrders.findIndex((o) => o.id === orderId);
          if (orderIndex !== -1) {
            allOrders[orderIndex] = {
              ...allOrders[orderIndex],
              ...updatePayload
            };
          }
          applyFilter();
        }

        btn.disabled = false;
      });
    });

    body.querySelectorAll(".delete-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        if (!orderId) return;

        const shouldDelete = window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?");
        if (!shouldDelete) {
          return;
        }

        btn.disabled = true;

        const { error } = await client.from("requests").delete().eq("id", orderId);

        if (error) {
          btn.disabled = false;
          alert(error.message);
          return;
        }

        allOrders = allOrders.filter((order) => order.id !== orderId);
        applyFilter();
      });
    });

    body.querySelectorAll(".gallery-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        if (!orderId) return;

        const order = allOrders.find((item) => item.id === orderId);
        if (!order) return;

        if (order.status !== "completed") {
          alert("Само завършени проекти могат да се показват в галерията.");
          return;
        }

        const existingGalleryProject = getGalleryProject(order);
        const categoryInput = window.prompt("Категория на проекта:", existingGalleryProject?.category || "");
        if (categoryInput === null) return;

        const descriptionInput = window.prompt(
          "Кратко описание на проекта:",
          existingGalleryProject?.short_description || ""
        );
        if (descriptionInput === null) return;

        btn.disabled = true;

        let publishedAsset;

        try {
          publishedAsset = await publishOrderAssetToGallery(client, order);
        } catch (publishError) {
          btn.disabled = false;
          alert(publishError?.message || "Неуспешно публикуване на файла в галерията.");
          return;
        }

        const payload = {
          request_id: order.id,
          file_name: order.file_name || order.file_path || "Проект",
          file_url: publishedAsset?.fileUrl || order.file_url || null,
          category: categoryInput.trim() || "Общи",
          short_description: descriptionInput.trim() || "",
          is_visible: true,
          created_by: adminUserId,
          storage_bucket: publishedAsset?.storageBucket || null,
          storage_path: publishedAsset?.storagePath || null,
          model_type: getFileExtension(order.file_name || order.file_path || "")
        };

        const { data, error } = await client
          .from("gallery_projects")
          .upsert(payload, { onConflict: "request_id" })
          .select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type")
          .single();

        if (error) {
          btn.disabled = false;
          alert(error.message);
          return;
        }

        allOrders = allOrders.map((item) =>
          item.id === order.id
            ? { ...item, gallery_projects: data ? [data] : [] }
            : item
        );

        applyFilter();
      });
    });

    body.querySelectorAll(".remove-gallery-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        if (!orderId) return;

        const order = allOrders.find((item) => item.id === orderId);
        const existingGalleryProject = getGalleryProject(order);

        if (!existingGalleryProject?.id) {
          return;
        }

        const shouldRemove = window.confirm("Да премахна ли проекта от галерията?");
        if (!shouldRemove) {
          return;
        }

        btn.disabled = true;

        if (existingGalleryProject.storage_bucket && existingGalleryProject.storage_path) {
          await client.storage
            .from(existingGalleryProject.storage_bucket)
            .remove([existingGalleryProject.storage_path]);
        }

        const { error } = await client
          .from("gallery_projects")
          .delete()
          .eq("id", existingGalleryProject.id);

        if (error) {
          btn.disabled = false;
          alert(error.message);
          return;
        }

        allOrders = allOrders.map((item) =>
          item.id === order.id
            ? { ...item, gallery_projects: [] }
            : item
        );

        applyFilter();
      });
    });
  };

  if (filterSelect) {
    filterSelect.addEventListener("change", applyFilter);
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      try {
        await signOut();
        window.location.replace("/login.html");
      } finally {
        logoutButton.disabled = false;
      }
    });
  }

  await loadOrders();
});
