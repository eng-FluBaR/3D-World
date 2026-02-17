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

function renderRow(request) {
  const badgeClass = STATUS_CLASSES[request.status] || "bg-secondary";
  const actionButtons =
    request.status === "quoted"
      ? `<div class="btn-group btn-group-sm" role="group">
           <button class="btn btn-success" data-action="accept" data-id="${request.id}">Accept</button>
           <button class="btn btn-outline-danger" data-action="reject" data-id="${request.id}">Reject</button>
         </div>`
      : "-";

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

function renderEmptyState(body) {
  body.innerHTML = `
    <tr>
      <td colspan="5" class="text-muted">No requests yet.</td>
    </tr>
  `;
}

onReady(() => {
  const body = document.getElementById("requests-body");

  if (!body) return;

  const client = createSupabaseClient();

  const loadRequests = async () => {
    const session = await getSession();
    if (!session) {
      window.location.replace("/login.html");
      return;
    }

    const { data, error } = await client
      .from("requests")
      .select("id, file_name, file_path, status, price, deadline")
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
      renderEmptyState(body);
      return;
    }

    body.innerHTML = data.map(renderRow).join("");
  };

  body.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    if (!id || !action) return;

    const nextStatus = action === "accept" ? "accepted" : "rejected";
    button.disabled = true;

    const { error } = await client.from("requests").update({ status: nextStatus }).eq("id", id);

    if (error) {
      button.disabled = false;
      alert(error.message);
      return;
    }

    await loadRequests();
  });

  loadRequests();
});
