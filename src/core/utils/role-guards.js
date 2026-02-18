import { getSession, refreshSession } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";

const ALLOWED_ROLES = ["super_admin", "moderator"];

export async function requireAdminRole() {
  const session = await getSession();
  if (!session) {
    window.location.replace("/app/login.html");
    return null;
  }

  const client = createSupabaseClient();
  const userId = session.user?.id;

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.warn("Could not load user role:", error?.message);
    window.location.replace("/app/dashboard.html");
    return null;
  }

  if (!ALLOWED_ROLES.includes(data.role)) {
    window.location.replace("/app/dashboard.html");
    return null;
  }

  await refreshSession();

  return data.role;
}

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) {
    window.location.replace("/app/login.html");
    return false;
  }

  const client = createSupabaseClient();
  const userId = session.user?.id;

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.warn("Could not load user role:", error?.message);
    window.location.replace("/app/dashboard.html");
    return false;
  }

  if (data.role !== "super_admin") {
    window.location.replace("/app/dashboard.html");
    return false;
  }

  await refreshSession();

  return true;
}

