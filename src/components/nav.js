const NAV_ITEMS = [
  { name: "Home", href: "/index.html", page: "index" },
  { name: "Login", href: "/login.html", page: "login" },
  { name: "Register", href: "/register.html", page: "register" },
  { name: "Dashboard", href: "/dashboard.html", page: "dashboard" },
  { name: "Upload", href: "/upload.html", page: "upload" },
  { name: "Requests", href: "/requests.html", page: "requests" },
  { name: "Profile", href: "/profile.html", page: "profile" },
  { name: "Admin", href: "/admin.html", page: "admin" }
];

export function initNav(activePage) {
  const navHost = document.getElementById("app-nav");
  if (!navHost) return;

  navHost.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="/index.html">3D World</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav ms-auto">
            ${NAV_ITEMS.map((item) => {
              const activeClass = item.page === activePage ? "active" : "";
              return `<li class="nav-item"><a class="nav-link ${activeClass}" href="${item.href}">${item.name}</a></li>`;
            }).join("")}
          </ul>
        </div>
      </div>
    </nav>
  `;
}
