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

const parseErrorText = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const payload = JSON.parse(text) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return text.slice(0, 180);
  }
};

const fetchEntries = async (cursor?: string): Promise<EntriesResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/entries?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(await parseErrorText(response, "加载记录失败"));
  }

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
          reject(new Error("服务端返回格式异常"));
        }
        return;
      }

      const raw = xhr.responseText?.trim();
      if (!raw) {
        reject(new Error("上传失败"));
        return;
      }

      try {
        const payload = JSON.parse(raw) as { message?: string };
        reject(new Error(payload.message ?? "上传失败"));
      } catch {
        reject(new Error(raw.slice(0, 180)));
      }
    };

    xhr.onerror = () => reject(new Error("网络异常，请重试"));
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
      setLoadError(error instanceof Error ? error.message : "加载失败");
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
      { rootMargin: "280px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, loadPage, nextCursor]);

  const submitDisabled = upload.loading || !file || !foodName.trim() || !eatenAt;

  const onUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUpload({ loading: false, progress: 0, error: "请选择一张照片" });
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
        error: error instanceof Error ? error.message : "上传失败"
      });
    }
  };

  const onDelete = async (entry: FoodEntry) => {
    if (!window.confirm(`确定删除「${entry.food_name}」吗？`)) return;

    const response = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (!response.ok) {
      alert(await parseErrorText(response, "删除失败"));
      return;
    }

    setEntries((current) => current.filter((item) => item.id !== entry.id));
  };

  const recordCountText = useMemo(() => `馆藏 ${entries.length} 份`, [entries.length]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
      <section className="museum-panel rounded-3xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="museum-dot" />
              PERSONAL FOOD MUSEUM
            </p>
            <h1 className="museum-title text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
              我的食物博物馆
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              记录每日一餐，收藏生活细节。上传你的食物照片，沉淀成专属时间画廊。
            </p>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs text-[var(--muted)]">
            {recordCountText}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a
            className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-white transition hover:brightness-95"
            href="/api/export?format=json"
          >
            导出 JSON
          </a>
          <a
            className="rounded-full bg-[var(--accent-2)] px-3 py-1.5 text-white transition hover:brightness-95"
            href="/api/export?format=csv"
          >
            导出 CSV
          </a>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={onUpload}>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">日期 *</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              onChange={(event) => setEatenAt(event.target.value)}
              required
              type="date"
              value={eatenAt}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">食物名 *</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              maxLength={80}
              onChange={(event) => setFoodName(event.target.value)}
              placeholder="例：牛肉拉面"
              required
              value={foodName}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">地点/品牌（可选）</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              maxLength={80}
              onChange={(event) => setPlaceBrand(event.target.value)}
              placeholder="例：楼下小馆"
              value={placeBrand}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">价格（可选）</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              maxLength={24}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="例：28"
              value={price}
            />
          </label>

          <label className="sm:col-span-2 flex h-28 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white/70 text-sm text-[var(--muted)]">
            <input
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
              type="file"
            />
            {file ? `已选择：${file.name}` : "点击上传食物照片（可直接拍照）"}
          </label>

          <button
            className="sm:col-span-2 h-12 rounded-2xl bg-[var(--ink)] text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitDisabled}
            type="submit"
          >
            {upload.loading ? `上传中 ${upload.progress}%` : "保存到博物馆"}
          </button>
          {upload.error ? (
            <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {upload.error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="museum-panel mt-5 rounded-3xl p-4 sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="museum-title text-2xl text-[var(--ink)]">时间轴画廊</h2>
          {isLoadingMore ? <span className="text-xs text-[var(--muted)]">加载更多中...</span> : null}
        </header>

        {initialLoading ? <p className="text-sm text-[var(--muted)]">正在加载记录...</p> : null}
        {loadError ? (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm text-rose-700">{loadError}</p>
            <button
              className="rounded-full bg-rose-600 px-3 py-1.5 text-xs text-white"
              onClick={() => void loadPage()}
              type="button"
            >
              重新加载
            </button>
          </div>
        ) : null}

        {!initialLoading && !entries.length ? (
          <p className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]">
            还没有记录，先上传今天的第一餐吧。
          </p>
        ) : null}

        <div className="columns-2 gap-3 sm:columns-3">
          {entries.map((entry) => (
            <article
              className="mb-3 break-inside-avoid rounded-2xl border border-[var(--line)] bg-white/85 p-2 shadow-sm"
              key={entry.id}
            >
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
                <p className="text-sm font-semibold text-[var(--ink)]">{entry.food_name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatEatenAt(entry.eaten_at)}</p>
                {entry.place_brand ? <p className="mt-1 text-xs text-[var(--muted)]">{entry.place_brand}</p> : null}
                {entry.price ? <p className="mt-1 text-xs text-[var(--muted)]">¥{entry.price}</p> : null}
                <button
                  className="mt-2 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700"
                  onClick={() => void onDelete(entry)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="h-10" ref={sentinelRef} />
      </section>

      {activeImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <button
            aria-label="Close preview"
            className="absolute inset-0"
            onClick={() => setActiveImage(null)}
            type="button"
          />
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
              <p className="text-sm font-semibold text-[var(--ink)]">{activeImage.food_name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{activeImage.eaten_at}</p>
              <button
                className="mt-3 h-10 w-full rounded-xl bg-[var(--ink)] text-sm text-white"
                onClick={() => setActiveImage(null)}
                type="button"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
