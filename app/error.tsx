"use client";

import { useEffect } from "react";

/*
  Next's route-level error boundary - the last backstop. If anything escapes the
  per-tab boundaries or throws during a server render, this renders instead of a
  blank screen or the dev error overlay.
*/
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4 text-center">
      <h1 className="text-2xl font-black mb-3">Something broke</h1>
      <p className="text-sm text-muted-foreground mb-6 break-words">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="border border-border/60 rounded-lg px-4 py-2 bg-card/20 hover:bg-card/40 transition-colors"
      >
        Reload the page
      </button>
    </main>
  );
}
