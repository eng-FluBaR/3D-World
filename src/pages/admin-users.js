import { onReady } from "../utils/dom.js";
import { signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireSuperAdmin } from "../utils/role-guards.js";

const ROLE_OPTIONS = ["user", "moderator", "super_admin"];

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

function getStatusBadge(isDisabled) {
  if (isDisabled) {
    return '<span class="badge bg-danger">Disabled</span>';
  }
  return '<span class="badge bg-success">Active</span>';
}

function renderRow(user) {
  const roleSelect = ROLE_OPTIONS.map(
    (role) => `<option value="${role}" ${user.role === role ? "selected" : ""}>${role}</option>`
  ).join("");

  const toggleButtonText = user.is_disabled ? "Enable" : "Disable";
  const toggleButtonClass = user.is_disabled ? "btn-warning" : "btn-outline-danger";

  return `
    <tr data-id="${user.id}">
      <td>${user.email || "-"}</td>
      <td>
        <select class="form-select form-select-sm role-select" data-id="${user.id}">
          ${roleSelect}
        </select>
      </td>
      <td>${getStatusBadge(user.is_disabled)}</td>
      <td>${formatDate(user.created_at)}</td>
      <td class="text-end">
        <button class="btn btn-sm ${toggleButtonClass} toggle-user" data-id="${user.id}">
          ${toggleButtonText}
        </button>
        <button class="btn btn-sm btn-primary save-user" data-id="${user.id}">Save</button>
      </td>
    </tr>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <tr>
      <td colspan="5" class="text-muted">No users found.</td>
    </tr>
  `;
}

onReady(async () => {
  const body = document.getElementById("users-body");
  const errorBox = document.getElementById("users-error");
  const logoutButton = document.getElementById("admin-logout");

  const isSuperAdmin = await requireSuperAdmin();
  if (!isSuperAdmin) {
    return;
  }

  const client = createSupabaseClient();
  let allUsers = [];
  const userStates = {}; // Track pending changes

  const loadUsers = async () => {
    const { data, error } = await client
      .from("profiles")
      .select("id, email, role, is_disabled, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("d-none");
      renderEmptyState(body);
      return;
    }

    if (!data || data.length === 0) {
      renderEmptyState(body);
      return;
    }

    allUsers = data;
    body.innerHTML = allUsers.map(renderRow).join("");
    attachEventListeners();
  };

  const attachEventListeners = () => {
    body.querySelectorAll(".toggle-user").forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.getAttribute("data-id");
        const row = body.querySelector(`tr[data-id="${userId}"]`);
        const user = allUsers.find((u) => u.id === userId);

        if (!userStates[userId]) {
          userStates[userId] = { ...user };
        }

        userStates[userId].is_disabled = !userStates[userId].is_disabled;

        const newText = userStates[userId].is_disabled ? "Enable" : "Disable";
        const newClass = userStates[userId].is_disabled ? "btn-warning" : "btn-outline-danger";
        btn.textContent = newText;
        btn.className = `btn btn-sm ${newClass} toggle-user`;
        btn.setAttribute("data-id", userId);

        const statusTd = row.querySelector("td:nth-child(3)");
        statusTd.innerHTML = getStatusBadge(userStates[userId].is_disabled);
      });
    });

    body.querySelectorAll(".save-user").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-id");
        const row = body.querySelector(`tr[data-id="${userId}"]`);
        const role = row.querySelector(".role-select")?.value || "";

        if (!role) {
          alert("Role is required.");
          return;
        }

        const state = userStates[userId] || allUsers.find((u) => u.id === userId);
        const updatePayload = {
          role,
          is_disabled: state.is_disabled || false
        };

        btn.disabled = true;

        const { error } = await client
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);

        if (error) {
          alert(error.message);
        } else {
          const userIndex = allUsers.findIndex((u) => u.id === userId);
          if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...updatePayload };
            userStates[userId] = { ...allUsers[userIndex] };
          }
        }

        btn.disabled = false;
      });
    });
  };

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

  await loadUsers();
});
