import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { requireAdminRole } from "../utils/role-guards.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function sanitizeHtml(value) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderCard(inquiry) {
  const statusBadge = inquiry.is_read
    ? '<span class="badge text-bg-secondary">Прочетено</span>'
    : '<span class="badge text-bg-warning">Непрочетено</span>';

  const message = sanitizeHtml(inquiry.message);
  const name = sanitizeHtml(inquiry.name);
  const email = sanitizeHtml(inquiry.email);

  return `
    <article class="inquiry-card" data-id="${inquiry.id}">
      <div class="inquiry-card-head">
        <div>
          <h6 class="mb-1">${name || "-"}</h6>
          <a href="mailto:${email}" class="small">${email || "-"}</a>
        </div>
        <div>${statusBadge}</div>
      </div>
      <p class="inquiry-message">${message}</p>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <small class="text-muted">${formatDate(inquiry.created_at)}</small>
        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${inquiry.id}" ${inquiry.is_read ? "disabled" : ""}>
          Маркирай като прочетено
        </button>
      </div>
    </article>
  `;
}

function renderEmpty(body) {
  body.innerHTML = '<div class="text-muted">Няма контактни запитвания.</div>';
}

onReady(async () => {
  const role = await requireAdminRole();
  if (!role) return;

  const body = document.getElementById("inquiries-body");
  const errorBox = document.getElementById("inquiries-error");
  const unreadBadge = document.getElementById("inquiries-unread-count");

  if (!body) return;

  const client = createSupabaseClient();
  let inquiries = [];

  const refreshUnreadBadge = () => {
    const unreadCount = inquiries.filter((item) => !item.is_read).length;
    if (unreadBadge) {
      unreadBadge.textContent = `Непрочетени: ${unreadCount}`;
    }
  };

  const attachEvents = () => {
    body.querySelectorAll(".mark-read-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const inquiryId = button.getAttribute("data-id");
        if (!inquiryId) return;

        button.disabled = true;

        const { error } = await client
          .from("contact_inquiries")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", inquiryId);

        if (error) {
          alert(error.message || "Неуспешно обновяване.");
          button.disabled = false;
          return;
        }

        inquiries = inquiries.map((item) =>
          item.id === inquiryId
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        );

        if (inquiries.length === 0) {
          renderEmpty(body);
        } else {
          body.innerHTML = inquiries.map(renderCard).join("");
          attachEvents();
        }

        refreshUnreadBadge();
      });
    });
  };

  const loadInquiries = async () => {
    const { data, error } = await client
      .from("contact_inquiries")
      .select("id, name, email, message, is_read, read_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (errorBox) {
        errorBox.textContent = error.message;
        errorBox.classList.remove("d-none");
      }
      renderEmpty(body);
      return;
    }

    inquiries = data || [];

    if (inquiries.length === 0) {
      renderEmpty(body);
      refreshUnreadBadge();
      return;
    }

    body.innerHTML = inquiries.map(renderCard).join("");
    refreshUnreadBadge();
    attachEvents();
  };

  await loadInquiries();
});
