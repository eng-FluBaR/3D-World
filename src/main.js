import { onReady, getPageName } from "./utils/dom.js";
import { initNav } from "./components/nav.js";
import { ensureSupabaseConfig } from "./services/supabase.js";
import { requireAuth, redirectIfAuthenticated } from "./utils/auth-guards.js";

onReady(async () => {
  const page = getPageName();
  if (page !== "dashboard") {
    initNav(page);
  }
  ensureSupabaseConfig();

  const protectedPages = ["dashboard", "upload", "requests", "profile", "admin"];
  const authPages = ["login", "register"];

  if (protectedPages.includes(page)) {
    await requireAuth();
  }

  if (authPages.includes(page)) {
    await redirectIfAuthenticated();
  }
});
