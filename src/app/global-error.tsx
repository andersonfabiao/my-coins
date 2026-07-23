"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="errorFallback">
          <h1>O aplicativo encontrou um erro</h1>
          <p>Seus dados continuam preservados. Tente iniciar novamente.</p>
          <button onClick={reset}>Reabrir aplicativo</button>
        </main>
      </body>
    </html>
  );
}
