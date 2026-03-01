"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SHORTCUTS: { keys: string; label: string; path: string }[] = [
  { keys: "G then D", label: "Dashboard", path: "/dashboard" },
  { keys: "G then S", label: "Sessions", path: "/sessions" },
  { keys: "?", label: "Show this help", path: "" },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const gPressed = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!e.repeat) gPressed.current = true;
        return;
      }
      if (gPressed.current && e.key.toLowerCase() === "d") {
        e.preventDefault();
        gPressed.current = false;
        router.push("/dashboard");
        return;
      }
      if (gPressed.current && e.key.toLowerCase() === "s") {
        e.preventDefault();
        gPressed.current = false;
        router.push("/sessions");
        return;
      }
      gPressed.current = false;
    },
    [router]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "g") gPressed.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { showHelp, setShowHelp, shortcuts: SHORTCUTS };
}
