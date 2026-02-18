import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { getSession } from "../services/auth.js";

const STATUS_CLASSES = {
  pending: "bg-secondary",
  quoted: "bg-warning text-dark",
  accepted: "bg-primary",
  rejected: "bg-danger",
  completed: "bg-success"
};

function formatPrice(value) {
  if (value === null || value === undefined) return "-";
  if (Number.isNaN(Number(value))) return String(value);
  return `€${Number(value).toFixed(2)}`;
}

function formatDeadline(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

function canModifyRequest(request) {
  return request.status !== "completed";
}

function renderRow(request) {
  const badgeClass = STATUS_CLASSES[request.status] || "bg-secondary";
  const actionButtons = `<button class="btn btn-sm btn-outline-primary" data-action="open" data-id="${request.id}">Open</button>`;

  return `
    <tr>
      <td>${request.file_name || request.file_path || "-"}</td>
      <td><span class="badge ${badgeClass}">${request.status}</span></td>
      <td>${formatPrice(request.price)}</td>
      <td>${formatDeadline(request.deadline)}</td>
      <td class="text-end">${actionButtons}</td>
    </tr>
  `;
}

function renderRequestModalContent(request) {
  const isModifiable = canModifyRequest(request);
  const isQuoted = request.status === "quoted";
  const badgeClass = STATUS_CLASSES[request.status] || "bg-secondary";

  return `
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">File</label>
        <input type="text" class="form-control" value="${request.file_name || request.file_path || "-"}" disabled />
      </div>

      <div class="col-md-6">
        <label class="form-label">Material</label>
        <input type="text" class="form-control request-material" value="${request.material || ""}" ${isModifiable ? "" : "disabled"} />
      </div>

      <div class="col-md-6">
        <label class="form-label">Quantity</label>
        <input type="number" min="1" class="form-control request-quantity" value="${request.quantity || 1}" ${isModifiable ? "" : "disabled"} />
      </div>

      <div class="col-12">
        <label class="form-label">Notes</label>
        <textarea class="form-control request-notes" rows="4" ${isModifiable ? "" : "disabled"}>${request.notes || ""}</textarea>
      </div>

      <div class="col-md-4">
        <label class="form-label">Status</label>
        <div><span class="badge ${badgeClass}">${request.status}</span></div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Price</label>
        <input type="text" class="form-control" value="${formatPrice(request.price)}" disabled />
      </div>

      <div class="col-md-4">
        <label class="form-label">Deadline</label>
        <input type="text" class="form-control" value="${formatDeadline(request.deadline)}" disabled />
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2 mt-4">
      ${isModifiable ? `<button class="btn btn-primary" data-action="save" data-id="${request.id}">Save Changes</button>` : ""}
      ${isModifiable ? `<button class="btn btn-outline-danger" data-action="delete" data-id="${request.id}">Delete Request</button>` : ""}
      ${isQuoted ? `<button class="btn btn-success" data-action="accept" data-id="${request.id}">Accept Quote</button>` : ""}
      ${isQuoted ? `<button class="btn btn-outline-danger" data-action="reject" data-id="${request.id}">Reject Quote</button>` : ""}
    </div>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <tr>
      <td colspan="5" class="text-muted">No requests yet.</td>
    </tr>
  `;
}

onReady(() => {
  const body = document.getElementById("requests-body");
  const modalElement = document.getElementById("requestDetailsModal");
  const modalTitle = document.getElementById("request-modal-title");
  const modalBody = document.getElementById("request-modal-body");

  if (!body) return;

  const client = createSupabaseClient();
  let currentRequests = [];
  const requestModal = modalElement && window.bootstrap
    ? new window.bootstrap.Modal(modalElement)
    : null;

  const openRequestModal = (requestId) => {
    if (!modalBody) return;

    const request = currentRequests.find((item) => item.id === requestId);
    if (!request) return;

    if (modalTitle) {
      modalTitle.textContent = `Request · ${request.file_name || request.file_path || request.id}`;
    }

    modalBody.innerHTML = renderRequestModalContent(request);
    requestModal?.show();
  };

  const loadRequests = async () => {
    const session = await getSession();
    if (!session) {
      window.location.replace("/login.html");
      return;
    }

    const { data, error } = await client
      .from("requests")
      .select("id, file_name, file_path, material, quantity, notes, status, price, deadline")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      body.innerHTML = `
        <tr>
          <td colspan="5" class="text-danger">${error.message}</td>
        </tr>
      `;
      return;
    }

    if (!data || data.length === 0) {
      currentRequests = [];
      renderEmptyState(body);
      return;
    }

    currentRequests = data;
    body.innerHTML = currentRequests.map(renderRow).join("");
  };

  body.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    if (!id || !action) return;

    if (action === "open") {
      openRequestModal(id);
      return;
    }
  });

  modalBody?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");
    if (!id || !action) return;

    if (action === "accept" || action === "reject") {
      const nextStatus = action === "accept" ? "accepted" : "rejected";
      button.disabled = true;

      const { error } = await client.from("requests").update({ status: nextStatus }).eq("id", id);

      if (error) {
        button.disabled = false;
        alert(error.message);
        return;
      }

      await loadRequests();
      openRequestModal(id);
      return;
    }

    if (action === "delete") {
      const shouldDelete = window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?");
      if (!shouldDelete) return;

      button.disabled = true;
      const { error } = await client.from("requests").delete().eq("id", id);

      if (error) {
        button.disabled = false;
        alert(error.message);
        return;
      }

      await loadRequests();
      requestModal?.hide();
      return;
    }

    if (action === "save") {
      const request = currentRequests.find((item) => item.id === id);
      if (!request) return;

      const nextMaterial = modalBody.querySelector(".request-material")?.value || "";
      const nextQuantityRaw = modalBody.querySelector(".request-quantity")?.value || "1";
      const nextNotes = modalBody.querySelector(".request-notes")?.value || "";
      const nextQuantity = Number.parseInt(nextQuantityRaw, 10);

      if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        alert("Моля въведете валидно количество.");
        return;
      }

      button.disabled = true;

      const { error } = await client
        .from("requests")
        .update({
          material: nextMaterial.trim() || null,
          quantity: nextQuantity,
          notes: nextNotes.trim() || null
        })
        .eq("id", id);

      if (error) {
        button.disabled = false;
        alert(error.message);
        return;
      }

      await loadRequests();
      openRequestModal(id);
    }
  });

  loadRequests();
});
