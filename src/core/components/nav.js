import { getSession } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";

const PUBLIC_NAV_ITEMS = [
  { name: "Начало", href: "/pages/index.html", page: "index" },
  { name: "Услуги", href: "/pages/services.html", page: "services" },
  { name: "Материали", href: "/pages/materials.html", page: "materials" },
  { name: "Как работи", href: "/pages/how-it-works.html", page: "how-it-works" },
  { name: "Галерия", href: "/pages/gallery.html", page: "gallery" },
  { name: "Контакти", href: "/pages/contacts.html", page: "contacts" }
];

const USER_NAV_ITEMS = [
  { name: "Качване", href: "/upload.html", page: "upload" },
  { name: "Заявки", href: "/requests.html", page: "requests" },
  { name: "Профил", href: "/profile.html", page: "profile" }
];

const ADMIN_NAV_ITEMS = [
  { name: "Админ панел", href: "/admin.html", page: "admin" },
  { name: "Потребители", href: "/admin-users.html", page: "admin-users" },
  { name: "Поръчки", href: "/admin-orders.html", page: "admin-orders" }
];

async function getUserRole() {
  try {
    const session = await getSession();
    console.log('[NAV] Session:', session ? 'exists' : 'null');

    if (!session?.user?.id) {
      console.log('[NAV] No valid session');
      return null;
    }

    const client = createSupabaseClient();
    const { data, error } = await client
      .from("profiles")
      .select("role, display_name, email")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error('[NAV] Error fetching profile:', error);
      return null;
    }

    if (!data) {
      console.log('[NAV] No profile found for user:', session.user.id);
      return null;
    }

    const displayName = data.display_name || data.email?.split('@')[0] || 'User';
    console.log('[NAV] Found user:', displayName, 'role:', data.role);
    return { role: data.role, name: displayName };
  } catch (err) {
    console.error('[NAV] Exception in getUserRole:', err);
    return null;
  }
}

export async function initNav(activePage) {
  const navHost = document.getElementById("app-nav");
  if (!navHost) {
    console.warn('[NAV] Navigation host element not found');
    return;
  }

  console.log('[NAV] Initializing navigation for page:', activePage);
  const userInfo = await getUserRole();
  console.log('[NAV] User info:', userInfo);

  const isAuthenticated = userInfo !== null;
  const isAdmin = userInfo?.role === "super_admin" || userInfo?.role === "moderator";

  console.log('[NAV] Is authenticated:', isAuthenticated);
  console.log('[NAV] Is admin:', isAdmin);

  let navItems = [...PUBLIC_NAV_ITEMS];

  if (isAuthenticated) {
    navItems = [...PUBLIC_NAV_ITEMS];
    if (isAdmin) {
      navItems = [...navItems, ...ADMIN_NAV_ITEMS];
    }
  }

  const userMenuItems = USER_NAV_ITEMS.map(
    (item) => `<li><a class="dropdown-item" href="${item.href}">${item.name}</a></li>`
  ).join("");

  const desktopAuthButtons = isAuthenticated
    ? `<li class="nav-item dropdown">
         <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
           👤 ${userInfo.name}
         </a>
         <ul class="dropdown-menu dropdown-menu-end">
           ${userMenuItems}
           ${isAdmin ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="/admin.html">Админ панел</a></li>' : ''}
           <li><hr class="dropdown-divider"></li>
           <li><a class="dropdown-item" href="#" id="logout-btn-desktop">Изход</a></li>
         </ul>
       </li>`
    : `<li class="nav-item"><a class="nav-link" href="/login.html">Вход</a></li>
       <li class="nav-item"><a class="btn btn-outline-light ms-2" href="/register.html">Регистрация</a></li>`;

  const mobileProfile = isAuthenticated
    ? `<div class="mobile-profile-slot d-lg-none">
         <div class="dropdown">
           <a class="nav-link dropdown-toggle mobile-profile-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
             👤 ${userInfo.name}
           </a>
           <ul class="dropdown-menu dropdown-menu-end">
             ${userMenuItems}
             ${isAdmin ? '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="/admin.html">Админ панел</a></li>' : ''}
             <li><hr class="dropdown-divider"></li>
             <li><a class="dropdown-item" href="#" id="logout-btn-mobile">Изход</a></li>
           </ul>
         </div>
       </div>`
    : "";

  navHost.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <div class="container-fluid nav-shell position-relative">
        <a class="navbar-brand fw-bold" href="/pages/index.html" style="font-size: 1.5rem;">🖨️ 3D World</a>
        ${mobileProfile}
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navItems.map((item) => {
              const activeClass = item.page === activePage ? "active fw-bold" : "";
              return `<li class="nav-item"><a class="nav-link ${activeClass}" href="${item.href}">${item.name}</a></li>`;
            }).join("")}
          </ul>
          <ul class="navbar-nav ms-auto d-none d-lg-flex">
            ${desktopAuthButtons}
          </ul>
        </div>
      </div>
    </nav>
  `;

  if (isAuthenticated) {
    const handleLogout = async (event) => {
      event.preventDefault();
      const { signOut } = await import("../services/auth.js");
      await signOut();
      window.location.href = "/index.html";
    };

    const desktopLogoutBtn = document.getElementById("logout-btn-desktop");
    if (desktopLogoutBtn) {
      desktopLogoutBtn.addEventListener("click", handleLogout);
    }

    const mobileLogoutBtn = document.getElementById("logout-btn-mobile");
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener("click", handleLogout);
    }
  }
}
