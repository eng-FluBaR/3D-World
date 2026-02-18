import { createSupabaseClient } from "./supabase.js";

let supabaseClient;

function getClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

export async function signUpWithEmail(email, password, displayName = null) {
  const client = getClient();
  const options = { email, password };

  if (displayName) {
    options.options = {
      data: {
        display_name: displayName
      }
    };
  }

  return client.auth.signUp(options);
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
  try {
    const client = getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      console.error('[AUTH] Error getting session:', error);
      return null;
    }

    const session = data?.session || null;
    console.log('[AUTH] Session status:', session ? 'active' : 'no session', session?.user?.id);
    return session;
  } catch (err) {
    console.error('[AUTH] Exception in getSession:', err);
    return null;
  }
}

export async function refreshSession() {
  try {
    const client = getClient();
    const { data, error } = await client.auth.refreshSession();

    if (error) {
      console.warn('[AUTH] Error refreshing session:', error);
      return null;
    }

    return data?.session || null;
  } catch (err) {
    console.warn('[AUTH] Exception in refreshSession:', err);
    return null;
  }
}

export function onAuthStateChange(callback) {
  const client = getClient();
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
