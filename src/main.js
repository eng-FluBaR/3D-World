import { onReady, getPageName } from "./core/utils/dom.js";
import { initNav } from "./core/components/nav.js";
import { ensureSupabaseConfig } from "./core/services/supabase.js";
import { requireAuth, redirectIfAuthenticated } from "./core/utils/auth-guards.js";
import { requireAdminRole } from "./core/utils/role-guards.js";

onReady(async () => {
  const page = getPageName();
  
  // Initialize navigation for all pages
  await initNav(page);
  
  ensureSupabaseConfig();

  const protectedPages = ["dashboard", "upload", "requests", "profile"];
  const adminPages = ["admin", "admin-users", "admin-orders", "admin-materials", "admin-cms"];
  const authPages = ["login", "register"];

  // Check authentication for protected pages
  if (protectedPages.includes(page)) {
    await requireAuth();
  }

  // Check admin role for admin pages
  if (adminPages.includes(page)) {
    await requireAuth();
    await requireAdminRole();
  }

  // Redirect authenticated users away from auth pages
  if (authPages.includes(page)) {
    await redirectIfAuthenticated();
  }
});
