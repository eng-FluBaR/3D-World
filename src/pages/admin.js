import { onReady } from "../utils/dom.js";
import { signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

function formatCurrency(value) {
  if (value === null || value === undefined) return "€0.00";
  if (Number.isNaN(Number(value))) return "€0.00";
  return `€${Number(value).toFixed(2)}`;
}

onReady(async () => {
  const roleLabel = document.getElementById("admin-role");
  const totalRequestsEl = document.getElementById("total-requests");
  const pendingRequestsEl = document.getElementById("pending-requests");
  const completedRequestsEl = document.getElementById("completed-requests");
  const totalRevenueEl = document.getElementById("total-revenue");
  const logoutButton = document.getElementById("admin-logout");
  const loginLink = document.getElementById("admin-login-link");
  const userViewLink = document.getElementById("admin-user-view");
  const publicViewLink = document.getElementById("admin-public-view");

  const role = await requireAdminRole();
  if (!role) {
    return;
  }

  if (roleLabel) {
    roleLabel.textContent = role.toUpperCase();
  }

  const client = createSupabaseClient();

  if (loginLink) {
    loginLink.addEventListener("click", async (event) => {
      event.preventDefault();
      window.location.href = "/login.html";
    });
  }

  if (userViewLink) {
    userViewLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/dashboard.html";
    });
  }

  if (publicViewLink) {
    publicViewLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/index.html";
    });
  }

  const loadStats = async () => {
    const { data, error } = await client.from("requests").select("id, status, price");

    if (error) {
      console.warn("Failed to load stats:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      if (totalRequestsEl) totalRequestsEl.textContent = "0";
      if (pendingRequestsEl) pendingRequestsEl.textContent = "0";
      if (completedRequestsEl) completedRequestsEl.textContent = "0";
      if (totalRevenueEl) totalRevenueEl.textContent = "€0.00";
      return;
    }

    const totalCount = data.length;
    const pendingCount = data.filter((r) => r.status === "pending").length;
    const completedCount = data.filter((r) => r.status === "completed").length;
    const totalRev = data.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    if (totalRequestsEl) totalRequestsEl.textContent = totalCount;
    if (pendingRequestsEl) pendingRequestsEl.textContent = pendingCount;
    if (completedRequestsEl) completedRequestsEl.textContent = completedCount;
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRev);
  };

  await loadStats();

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
});
