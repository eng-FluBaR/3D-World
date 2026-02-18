import { getSession } from "../services/auth.js";

export async function redirectIfAuthenticated() {
  const session = await getSession();
  if (session) {
    window.location.replace("/app/dashboard.html");
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.replace("/app/login.html");
  }
}

