"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="errorFallback">
      <h1>Não foi possível abrir esta tela</h1>
      <p>Seus dados continuam preservados. Tente carregar novamente.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
