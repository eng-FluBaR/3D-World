import { onReady } from "../utils/dom.js";
import { getSession, signOut } from "../services/auth.js";
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
  const userKey = user.user_id;

  return `
    <article class="user-card" data-id="${userKey}">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <div class="user-email">${user.email || "-"}</div>
          <small class="text-muted">Created: ${formatDate(user.created_at)}</small>
        </div>
        <div class="user-status-slot">${getStatusBadge(user.is_disabled)}</div>
      </div>

      <div class="mb-3">
        <label class="form-label mb-1">Role</label>
        <select class="form-select form-select-sm role-select" data-id="${userKey}">
          ${roleSelect}
        </select>
      </div>

      <div class="user-actions">
        <button class="btn btn-sm ${toggleButtonClass} toggle-user" data-id="${userKey}">
          ${toggleButtonText}
        </button>
        <button class="btn btn-sm btn-outline-danger delete-user" data-id="${userKey}">Delete</button>
        <button class="btn btn-sm btn-primary save-user" data-id="${userKey}">Save</button>
      </div>
    </article>
  `;
}

function renderEmptyState(body) {
  body.innerHTML = `
    <div class="users-empty text-muted">No users found.</div>
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

  const session = await getSession();
  const currentUserId = session?.user?.id || null;

  const client = createSupabaseClient();
  let allUsers = [];
  const userStates = {}; // Track pending changes

  const loadUsers = async () => {
    const { data, error } = await client
      .from("profiles")
      .select("user_id, email, role, is_disabled, created_at")
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
        const row = body.querySelector(`[data-id="${userId}"]`);
        const user = allUsers.find((u) => u.user_id === userId);

        if (currentUserId && userId === currentUserId) {
          alert("Не можете да блокирате собствения си профил.");
          return;
        }

        if (!userStates[userId]) {
          userStates[userId] = { ...user };
        }

        userStates[userId].is_disabled = !userStates[userId].is_disabled;

        const newText = userStates[userId].is_disabled ? "Enable" : "Disable";
        const newClass = userStates[userId].is_disabled ? "btn-warning" : "btn-outline-danger";
        btn.textContent = newText;
        btn.className = `btn btn-sm ${newClass} toggle-user`;
        btn.setAttribute("data-id", userId);

        const statusTd = row.querySelector(".user-status-slot");
        statusTd.innerHTML = getStatusBadge(userStates[userId].is_disabled);
      });
    });

    body.querySelectorAll(".save-user").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-id");
        const row = body.querySelector(`[data-id="${userId}"]`);
        const role = row.querySelector(".role-select")?.value || "";

        if (!role) {
          alert("Role is required.");
          return;
        }

        const state = userStates[userId] || allUsers.find((u) => u.user_id === userId);
        const updatePayload = {
          role,
          is_disabled: state.is_disabled || false
        };

        if (currentUserId && userId === currentUserId && updatePayload.is_disabled) {
          alert("Не можете да блокирате собствения си профил.");
          return;
        }

        btn.disabled = true;

        const { error } = await client
          .from("profiles")
          .update(updatePayload)
          .eq("user_id", userId);

        if (error) {
          alert(error.message);
        } else {
          const userIndex = allUsers.findIndex((u) => u.user_id === userId);
          if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...updatePayload };
            userStates[userId] = { ...allUsers[userIndex] };
          }
        }

        btn.disabled = false;
      });
    });

    body.querySelectorAll(".delete-user").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-id");
        if (!userId) return;

        if (currentUserId && userId === currentUserId) {
          alert("Не можете да изтриете собствения си профил.");
          return;
        }

        const shouldDelete = window.confirm("Сигурни ли сте, че искате да изтриете този профил?");
        if (!shouldDelete) {
          return;
        }

        btn.disabled = true;

        const { error } = await client
          .from("profiles")
          .delete()
          .eq("user_id", userId);

        if (error) {
          btn.disabled = false;
          alert(error.message);
          return;
        }

        allUsers = allUsers.filter((user) => user.user_id !== userId);
        delete userStates[userId];

        if (allUsers.length === 0) {
          renderEmptyState(body);
        } else {
          body.innerHTML = allUsers.map(renderRow).join("");
          attachEventListeners();
        }
      });
    });
  };

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

  await loadUsers();
});

