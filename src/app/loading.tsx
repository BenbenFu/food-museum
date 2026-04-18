export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-36 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 columns-2 gap-3 sm:columns-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="mb-3 h-40 w-full animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </main>
  );
}