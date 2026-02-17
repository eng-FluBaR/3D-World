import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";

function renderEmpty(host) {
  host.innerHTML = `
    <div class="col-12">
      <div class="alert alert-secondary mb-0">Все още няма публикувани завършени проекти.</div>
    </div>
  `;
}

function renderError(host, message) {
  host.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger mb-0">${message}</div>
    </div>
  `;
}

function renderProjectCard(project) {
  const category = project.category || "Общи";
  const description = project.short_description || "Няма добавено описание.";
  const fileName = project.file_name || "Завършен проект";
  const detailsLink = project.file_url
    ? `<a class="btn btn-sm btn-outline-primary mt-3" href="${project.file_url}" target="_blank" rel="noopener noreferrer">Преглед на файл</a>`
    : "";

  return `
    <div class="col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0 text-break">${fileName}</h6>
            <span class="badge bg-primary ms-2">${category}</span>
          </div>
          <p class="text-muted mb-0">${description}</p>
          ${detailsLink}
        </div>
      </div>
    </div>
  `;
}

onReady(async () => {
  const host = document.getElementById("gallery-projects");
  if (!host) return;

  const client = createSupabaseClient();

  const { data, error } = await client
    .from("gallery_projects")
    .select("id, file_name, file_url, category, short_description, is_visible, created_at")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    renderError(host, "Неуспешно зареждане на галерията.");
    return;
  }

  if (!data || data.length === 0) {
    renderEmpty(host);
    return;
  }

  host.innerHTML = data.map(renderProjectCard).join("");
});
