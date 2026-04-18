"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Page failed to load</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button
        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
        onClick={reset}
        type="button"
      >
        Retry
      </button>
    </main>
  );
}
