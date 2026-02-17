const NAV_ITEMS = [
  { name: "Услуги", href: "/services.html", page: "services" },
  { name: "Материали", href: "/materials.html", page: "materials" },
  { name: "Как работи", href: "/how-it-works.html", page: "how-it-works" },
  { name: "Галерия", href: "/gallery.html", page: "gallery" },
  { name: "Контакти", href: "/contacts.html", page: "contacts" },
  { name: "Вход", href: "/login.html", page: "login" }
];

export function initNav(activePage) {
  const navHost = document.getElementById("app-nav");
  if (!navHost) return;

  navHost.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="/index.html">🖨️ 3D World</a>
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
