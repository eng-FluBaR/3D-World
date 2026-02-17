import { onReady } from "../utils/dom.js";
import { signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

const STATUS_OPTIONS = ["pending", "quoted", "accepted", "rejected", "completed"];
const STATUS_COLORS = {
  pending: "secondary",
  quoted: "warning",
  accepted: "primary",
  rejected: "danger",
  completed: "success"
};

function renderRow(order) {
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
        profiles:user_id(*)
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
