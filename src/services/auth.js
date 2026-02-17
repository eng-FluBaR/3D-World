import { createSupabaseClient } from "./supabase.js";

let supabaseClient;

function getClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

export async function signUpWithEmail(email, password) {
  const client = getClient();
  return client.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  const client = getClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const client = getClient();
  return client.auth.signOut();
}

export async function getSession() {
  const client = getClient();
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

export function onAuthStateChange(callback) {
  const client = getClient();
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
