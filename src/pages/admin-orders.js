import { onReady } from "../utils/dom.js";
import { getSession, signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

const STATUS_OPTIONS = ["pending", "quoted", "accepted", "rejected", "completed"];
const STATUS_LABELS = {
  pending: "Pending",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed"
};
const GALLERY_BUCKET = "gallery";
const UPLOADS_BUCKET = "uploads";

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

function getStatusMeta(status) {
  const normalizedStatus = STATUS_OPTIONS.includes(status) ? status : "pending";

  const badgeClassMap = {
    pending: "text-bg-warning",
    quoted: "text-bg-primary",
    accepted: "text-bg-success",
    rejected: "text-bg-danger",
    completed: "text-bg-info"
  };

  return {
    status: normalizedStatus,
    label: STATUS_LABELS[normalizedStatus] || normalizedStatus,
    badgeClass: badgeClassMap[normalizedStatus] || "text-bg-secondary"
  };
}

async function downloadOrderFile(client, order) {
  if (!order) return;

  if (!order.file_path) {
    if (order.file_url) {
      window.open(order.file_url, "_blank", "noopener,noreferrer");
      return;
    }

    alert("Няма прикачен файл за сваляне.");
    return;
  }

  const { data, error } = await client.storage.from(UPLOADS_BUCKET).download(order.file_path);

  if (error || !data) {
    alert(error?.message || "Неуспешно сваляне на файла.");
    return;
  }

  const blobUrl = URL.createObjectURL(data);
  const tempLink = document.createElement("a");
  tempLink.href = blobUrl;
  tempLink.download = order.file_name || order.file_path.split("/").pop() || "order-file";
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();
  URL.revokeObjectURL(blobUrl);
}

function renderRow(order) {
  const statusMeta = getStatusMeta(order.status);
  const fileLabel = order.file_name || order.file_path || "-";

  return `
    <article class="order-card status-${statusMeta.status}" data-id="${order.id}">
      <div class="order-card-top mb-0">
        <button class="order-toggle-btn" data-id="${order.id}" type="button" aria-label="Open order details">
          <div>
            <div class="order-user">${order.user_email || "-"}</div>
            <div class="order-file"><small class="text-muted text-truncate d-block">${fileLabel}</small></div>
            <small class="text-muted d-block mt-1">Материал: ${order.material || "-"} · Количество: ${order.quantity || 1}</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${statusMeta.badgeClass}">${statusMeta.label}</span>
            <span class="order-toggle-icon" aria-hidden="true">›</span>
          </div>
        </button>
      </div>
    </article>
  `;
}

function renderOrderModalContent(order) {
  const galleryProject = getGalleryProject(order);
  const isCompleted = order.status === "completed";
  const hasAttachment = Boolean(order.file_url || order.file_path);
  const statusSelect = STATUS_OPTIONS.map(
    (status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${STATUS_LABELS[status] || status}</option>`
  ).join("");

  return `
    <div class="order-fields mt-2">
      <div class="order-field">
        <label>Material</label>
        <input type="text" class="form-control form-control-sm" value="${order.material || "-"}" disabled />
      </div>

      <div class="order-field">
        <label>Quantity</label>
        <input type="number" class="form-control form-control-sm" value="${order.quantity || 1}" disabled />
      </div>

      <div class="order-field">
        <label>Status</label>
        <select class="form-select form-select-sm status-select status-${order.status}" data-id="${order.id}">
          ${statusSelect}
        </select>
      </div>

      <div class="order-field">
        <label>Price</label>
        <input type="number" class="form-control form-control-sm price-input" value="${order.price || ""}" placeholder="0.00" data-id="${order.id}" />
      </div>

      <div class="order-field order-field-full">
        <label>Deadline</label>
        <input type="date" class="form-control form-control-sm deadline-input" value="${order.deadline || ""}" data-id="${order.id}" />
      </div>

      <div class="order-field order-field-full">
        <label>Описание / Бележки</label>
        <textarea class="form-control form-control-sm" rows="3" disabled>${order.notes || "-"}</textarea>
      </div>
    </div>

    <div class="order-actions mt-3">
      <button class="btn btn-sm btn-outline-primary download-order" data-id="${order.id}" ${hasAttachment ? "" : "disabled"}>
        Свали файл
      </button>
      <button class="btn btn-sm btn-primary save-order" data-id="${order.id}">Save</button>
      <button class="btn btn-sm btn-outline-danger delete-order" data-id="${order.id}">Delete</button>
      <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${order.id}" ${isCompleted ? "" : "disabled"}>
        ${galleryProject ? "Update Gallery" : "Add Gallery"}
      </button>
      <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${order.id}" ${galleryProject ? "" : "disabled"}>
        Remove Gallery
      </button>
    </div>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <div class="orders-empty text-muted">No orders found.</div>
  `;
}

onReady(async () => {
  const body = document.getElementById("orders-body");
  const filterSelect = document.getElementById("status-filter");
  const errorBox = document.getElementById("orders-error");
  const logoutButton = document.getElementById("admin-logout");
  const orderModalElement = document.getElementById("orderDetailsModal");
  const orderModalTitle = document.getElementById("order-modal-title");
  const orderModalBody = document.getElementById("order-modal-body");

  const role = await requireAdminRole();
  if (!role) {
    return;
  }

  const session = await getSession();
  const adminUserId = session?.user?.id || null;

  const client = createSupabaseClient();
  let allOrders = [];
  const modalInstance = orderModalElement && window.bootstrap
    ? new window.bootstrap.Modal(orderModalElement)
    : null;

  const bindModalActionEvents = () => {
    if (!orderModalBody) return;

    orderModalBody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", () => {
        STATUS_OPTIONS.forEach((status) => select.classList.remove(`status-${status}`));
        select.classList.add(`status-${select.value}`);
      });
    });

    orderModalBody.querySelectorAll(".download-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        const order = allOrders.find((item) => item.id === orderId);
        if (!order) return;

        btn.disabled = true;
        await downloadOrderFile(client, order);
        btn.disabled = false;
      });
    });

    orderModalBody.querySelectorAll(".save-order").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = btn.getAttribute("data-id");
        const status = orderModalBody.querySelector(".status-select")?.value || "";
        const price = orderModalBody.querySelector(".price-input")?.value || null;
        const deadline = orderModalBody.querySelector(".deadline-input")?.value || null;

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
          btn.disabled = false;
          return;
        }

        allOrders = allOrders.map((order) =>
          order.id === orderId
            ? { ...order, ...updatePayload }
            : order
        );

        applyFilter();
        openOrderModal(orderId, false);
        btn.disabled = false;
      });
    });

    orderModalBody.querySelectorAll(".delete-order").forEach((btn) => {
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
        modalInstance?.hide();
      });
    });

    orderModalBody.querySelectorAll(".gallery-order").forEach((btn) => {
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
        openOrderModal(orderId, false);
        btn.disabled = false;
      });
    });

    orderModalBody.querySelectorAll(".remove-gallery-order").forEach((btn) => {
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
        openOrderModal(orderId, false);
      });
    });
  };

  const openOrderModal = (orderId, showModal = true) => {
    if (!orderModalBody) return;

    const order = allOrders.find((item) => item.id === orderId);
    if (!order) return;

    if (orderModalTitle) {
      orderModalTitle.textContent = `Поръчка · ${order.user_email || "-"}`;
    }

    orderModalBody.innerHTML = renderOrderModalContent(order);
    bindModalActionEvents();

    if (showModal) {
      modalInstance?.show();
    }
  };

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
        material,
        quantity,
        notes,
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
    body.querySelectorAll(".order-toggle-btn").forEach((toggleButton) => {
      toggleButton.addEventListener("click", () => {
        const orderId = toggleButton.getAttribute("data-id");
        if (!orderId) return;
        openOrderModal(orderId, true);
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
