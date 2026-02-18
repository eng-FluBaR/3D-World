import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import { getSession, signOut } from "../services/auth.js";

function showMessage(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("d-none");
}

function hideMessage(element) {
  if (!element) return;
  element.classList.add("d-none");
  element.textContent = "";
}

onReady(async () => {
  const form = document.getElementById("profile-form");
  const emailInput = document.getElementById("email");
  const displayNameInput = document.getElementById("displayName");
  const errorBox = document.getElementById("profile-error");
  const successBox = document.getElementById("profile-success");
  const submitButton = document.getElementById("profile-submit");
  const logoutButton = document.getElementById("logout-button");
  const totalProjectsEl = document.getElementById("stat-total-projects");
  const completedProjectsEl = document.getElementById("stat-completed-projects");

  const session = await getSession();
  if (!session) {
    window.location.replace("/app/login.html");
    return;
  }

  if (emailInput) {
    emailInput.value = session.user?.email || "";
  }

  const client = createSupabaseClient();
  const userId = session.user?.id;

  const loadProfile = async () => {
    const { data, error } = await client
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Could not load profile:", error.message);
      return;
    }

    if (data && displayNameInput) {
      displayNameInput.value = data.display_name || "";
    }
  };

  await loadProfile();

  const loadStats = async () => {
    const { data, error } = await client
      .from("requests")
      .select("status")
      .eq("user_id", userId);

    if (error) {
      console.warn("Could not load project stats:", error.message);
      return;
    }

    const totalProjects = data?.length || 0;
    const completedProjects = (data || []).filter((item) => item.status === "completed").length;

    if (totalProjectsEl) {
      totalProjectsEl.textContent = String(totalProjects);
    }

    if (completedProjectsEl) {
      completedProjectsEl.textContent = String(completedProjects);
    }
  };

  await loadStats();

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessage(errorBox);
      hideMessage(successBox);

      const displayName = displayNameInput?.value?.trim() || "";

      if (submitButton) submitButton.disabled = true;

      try {
        const { error } = await client.from("profiles").upsert(
          {
            user_id: userId,
            email: session.user?.email || "",
            display_name: displayName
          },
          { onConflict: "user_id" }
        );

        if (error) {
          throw error;
        }

        showMessage(successBox, "Профилът е актуализиран успешно.");
      } catch (err) {
        showMessage(errorBox, err?.message || "Неуспешна актуализация на профила.");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      try {
        await signOut();
        window.location.replace("/app/login.html");
      } finally {
        logoutButton.disabled = false;
      }
    });
  }
});

