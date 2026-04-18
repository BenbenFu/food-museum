"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { compressImage, mergeEntry } from "@/lib/client-utils";
import { formatEatenAt } from "@/lib/format";
import type { EntriesResponse, FoodEntry } from "@/lib/types";

type UploadState = {
  loading: boolean;
  progress: number;
  error: string | null;
};

const todayLocal = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
};

const fetchEntries = async (cursor?: string): Promise<EntriesResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/entries?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Failed to load entries");
  return (await response.json()) as EntriesResponse;
};

const uploadEntry = (formData: FormData, onProgress: (value: number) => void): Promise<FoodEntry> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/entries");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as FoodEntry);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const payload = JSON.parse(xhr.responseText) as { message?: string };
          reject(new Error(payload.message ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });

export function MuseumApp() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [eatenAt, setEatenAt] = useState(todayLocal);
  const [foodName, setFoodName] = useState("");
  const [placeBrand, setPlaceBrand] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<UploadState>({ loading: false, progress: 0, error: null });

  const [activeImage, setActiveImage] = useState<FoodEntry | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (cursor?: string, append = false) => {
    try {
      if (append) setIsLoadingMore(true);
      const payload = await fetchEntries(cursor);
      setEntries((current) => (append ? [...current, ...payload.data] : payload.data));
      setNextCursor(payload.nextCursor);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Load failed");
    } finally {
      setInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;

    const observer = new IntersectionObserver(
      (items) => {
        const target = items[0];
        if (target?.isIntersecting && !isLoadingMore) {
          void loadPage(nextCursor, true);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, loadPage, nextCursor]);

  const submitDisabled = upload.loading || !file || !foodName.trim() || !eatenAt;

  const onUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUpload({ loading: false, progress: 0, error: "Please choose an image" });
      return;
    }

    setUpload({ loading: true, progress: 0, error: null });

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.set("eatenAt", eatenAt);
      formData.set("foodName", foodName.trim());
      formData.set("placeBrand", placeBrand.trim());
      formData.set("price", price.trim());
      formData.set("width", String(compressed.width));
      formData.set("height", String(compressed.height));
      formData.set("image", compressed.file);

      const created = await uploadEntry(formData, (progress) => {
        setUpload((state) => ({ ...state, progress }));
      });

      setEntries((current) => mergeEntry(current, created));
      setFoodName("");
      setPlaceBrand("");
      setPrice("");
      setFile(null);
      setUpload({ loading: false, progress: 100, error: null });
    } catch (error) {
      setUpload({
        loading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed"
      });
    }
  };

  const onDelete = async (entry: FoodEntry) => {
    if (!window.confirm(`Delete entry: ${entry.food_name}?`)) return;

    const response = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      alert(payload.message ?? "Delete failed");
      return;
    }

    setEntries((current) => current.filter((item) => item.id !== entry.id));
  };

  const recordCountText = useMemo(() => `${entries.length} memories`, [entries.length]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-5 sm:px-6">
      <section className="rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Food Museum</h1>
        <p className="mt-2 text-sm text-slate-600">Capture meals and keep them in your personal timeline.</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <a className="rounded-full bg-slate-900 px-3 py-1.5 text-white" href="/api/export?format=json">
            Export JSON
          </a>
          <a className="rounded-full bg-slate-200 px-3 py-1.5 text-slate-800" href="/api/export?format=csv">
            Export CSV
          </a>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">{recordCountText}</span>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onUpload}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Date *</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400"
                onChange={(event) => setEatenAt(event.target.value)}
                required
                type="date"
                value={eatenAt}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Food Name *</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400"
                maxLength={80}
                onChange={(event) => setFoodName(event.target.value)}
                placeholder="Beef noodle soup"
                required
                value={foodName}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Place / Brand (optional)</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400"
                maxLength={80}
                onChange={(event) => setPlaceBrand(event.target.value)}
                placeholder="Local cafe"
                value={placeBrand}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Price (optional)</span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-slate-400"
                maxLength={24}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="28"
                value={price}
              />
            </label>
          </div>

          <label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
            <input
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
              type="file"
            />
            {file ? `Selected: ${file.name}` : "Tap to upload meal photo"}
          </label>

          <button
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitDisabled}
            type="submit"
          >
            {upload.loading ? `Uploading ${upload.progress}%` : "Save Entry"}
          </button>
          {upload.error ? <p className="text-xs text-rose-600">{upload.error}</p> : null}
        </form>
      </section>

      <section className="mt-5 rounded-3xl bg-white/80 p-4 shadow ring-1 ring-slate-200 sm:p-5">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Timeline Gallery</h2>
          {isLoadingMore ? <span className="text-xs text-slate-500">Loading...</span> : null}
        </header>

        {initialLoading ? <p className="text-sm text-slate-500">Loading entries...</p> : null}
        {loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}
        {loadError ? (
          <button
            className="mt-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white"
            onClick={() => void loadPage()}
            type="button"
          >
            Retry
          </button>
        ) : null}

        {!initialLoading && entries.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No entries yet. Add your first meal.</p>
        ) : null}

        <div className="columns-2 gap-3 sm:columns-3">
          {entries.map((entry) => (
            <article className="mb-3 break-inside-avoid rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100" key={entry.id}>
              <button className="block w-full" onClick={() => setActiveImage(entry)} type="button">
                <Image
                  alt={entry.food_name}
                  className="w-full rounded-xl object-cover"
                  height={entry.image_height}
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                  src={entry.image_url}
                  width={entry.image_width}
                />
              </button>
              <div className="px-1 pb-1 pt-2">
                <p className="text-sm font-medium text-slate-900">{entry.food_name}</p>
                <p className="mt-1 text-xs text-slate-500">{formatEatenAt(entry.eaten_at)}</p>
                {entry.place_brand ? <p className="mt-1 text-xs text-slate-600">{entry.place_brand}</p> : null}
                {entry.price ? <p className="mt-1 text-xs text-slate-600">$ {entry.price}</p> : null}
                <button
                  className="mt-2 rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-700"
                  onClick={() => void onDelete(entry)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="h-10" ref={sentinelRef} />
      </section>

      {activeImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <button aria-label="Close preview" className="absolute inset-0" onClick={() => setActiveImage(null)} type="button" />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white">
            <Image
              alt={activeImage.food_name}
              className="max-h-[72vh] w-full object-contain bg-black"
              height={activeImage.image_height}
              sizes="90vw"
              src={activeImage.image_url}
              width={activeImage.image_width}
            />
            <div className="p-3">
              <p className="text-sm font-semibold">{activeImage.food_name}</p>
              <p className="mt-1 text-xs text-slate-600">{activeImage.eaten_at}</p>
              <button
                className="mt-3 h-10 w-full rounded-xl bg-slate-900 text-sm text-white"
                onClick={() => setActiveImage(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
