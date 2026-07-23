"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      void navigator.serviceWorker.register(`${basePath}/sw.js`, {
        scope: `${basePath}/`,
        updateViaCache: "none",
      }).then((registration) => registration.update()).catch((error) => {
        if (process.env.NODE_ENV === "development") console.error("[service-worker] Falha no registro.", error);
      });
    }
  }, []);

  return null;
}
