import { onReady } from "../utils/dom.js";
import { signOut } from "../services/auth.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireSuperAdmin } from "../utils/role-guards.js";

const PAGES = ["about", "how-it-works", "printing"];

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.add(isError ? "alert-danger" : "alert-success");
  element.classList.remove(isError ? "alert-success" : "alert-danger", "d-none");
}

function hideMessage(element) {
  if (!element) return;
  element.classList.add("d-none");
  element.textContent = "";
}

onReady(async () => {
  const pageSelect = document.getElementById("page-select");
  const form = document.getElementById("cms-form");
  const titleInput = document.getElementById("page-title");
  const contentInput = document.getElementById("page-content");
  const cmsError = document.getElementById("cms-error");
  const cmsSuccess = document.getElementById("cms-success");
  const cmsSubmit = document.getElementById("cms-submit");
  const cmsLoading = document.getElementById("cms-loading");
  const previewLink = document.getElementById("preview-link");
  const logoutButton = document.getElementById("admin-logout");

  const isSuperAdmin = await requireSuperAdmin();
  if (!isSuperAdmin) {
    return;
  }

  const client = createSupabaseClient();
  let currentPage = null;

  const loadPageContent = async (pageSlug) => {
    if (!pageSlug) {
      form.classList.add("d-none");
      cmsLoading.classList.remove("d-none");
      currentPage = null;
      return;
    }

    cmsLoading.classList.add("d-none");
    form.classList.remove("d-none");
    hideMessage(cmsError);
    hideMessage(cmsSuccess);

    const { data, error } = await client
      .from("cms_pages")
      .select("id, slug, title, content")
      .eq("slug", pageSlug)
      .single();

    if (error && error.code !== "PGRST116") {
      showMessage(cmsError, "Failed to load page: " + error.message, true);
      return;
    }

    if (!data) {
      // Create a new page entry
      currentPage = {
        slug: pageSlug,
        title: "",
        content: ""
      };
      titleInput.value = "";
      contentInput.value = "";
    } else {
      currentPage = data;
      titleInput.value = data.title || "";
      contentInput.value = data.content || "";
    }

    previewLink.href = `/${pageSlug}.html`;
  };

  if (pageSelect) {
    pageSelect.addEventListener("change", (event) => {
      loadPageContent(event.target.value);
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessage(cmsError);
      hideMessage(cmsSuccess);

      const title = titleInput?.value?.trim() || "";
      const content = contentInput?.value?.trim() || "";

      if (!title || !content) {
        showMessage(cmsError, "Title and content are required.", true);
        return;
      }

      if (cmsSubmit) cmsSubmit.disabled = true;

      const payload = {
        slug: currentPage.slug,
        title,
        content
      };

      let query;
      if (currentPage.id) {
        query = client.from("cms_pages").update(payload).eq("id", currentPage.id);
      } else {
        query = client.from("cms_pages").insert([payload]);
      }

      const { data, error } = await query.select();

      if (error) {
        showMessage(cmsError, error.message, true);
      } else {
        if (data && data[0]) {
          currentPage = {
            ...currentPage,
            ...data[0]
          };
        }
        showMessage(cmsSuccess, "Page saved successfully.");
      }

      if (cmsSubmit) cmsSubmit.disabled = false;
    });
  }

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
