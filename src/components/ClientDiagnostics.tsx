"use client";

import { useEffect } from "react";

export function ClientDiagnostics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const onError = (event: ErrorEvent) => console.error("[window.error]", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => console.error("[unhandledrejection]", event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
