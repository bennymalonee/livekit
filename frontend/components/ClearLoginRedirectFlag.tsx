"use client";

import { useEffect } from "react";

const LOGIN_REDIRECT_KEY = "login_redirect_pending";

export function ClearLoginRedirectFlag() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
    }
  }, []);
  return null;
}
