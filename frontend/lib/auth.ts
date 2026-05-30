"use client";

import { useEffect, useState } from "react";
import { AuthSession, AuthUser } from "@/lib/types";

const STORAGE_KEY = "naviax.auth.session";
const AUTH_EVENT = "naviax-auth-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function emitAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function readStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitAuthChange();
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  emitAuthChange();
}

export function getAccessToken() {
  return readStoredSession()?.accessToken ?? "";
}

export function isAdminUser(user: AuthUser | null) {
  return user?.role === "admin";
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const sync = () => {
      setSession(readStoredSession());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
  };
}
