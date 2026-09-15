"use client";

const SESSION_KEY = "zsgc-session-id";

/** Anonymous browser session id, persisted in localStorage. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("zsgc-admin-key") === "zsgc-admin";
}

export function unlockAdmin(key: string): boolean {
  if (key === "zsgc-admin") {
    window.localStorage.setItem("zsgc-admin-key", key);
    return true;
  }
  return false;
}

export function lockAdmin() {
  window.localStorage.removeItem("zsgc-admin-key");
}

export function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("x-admin-key", "zsgc-admin");
  return fetch(input, { ...init, headers });
}
