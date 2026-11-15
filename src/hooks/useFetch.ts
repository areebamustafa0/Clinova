"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { http, errorMessage } from "@/lib/http";

/**
 * Small data-fetching hook on top of axios.
 * Pass `null` as the url to skip the request (e.g. while waiting for a selection).
 */
export function useFetch<T, M = Record<string, unknown>>(url: string | null, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<M | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const key = url ? `${url}?${JSON.stringify(params ?? {})}` : null;

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    http
      .get(url, { params: paramsRef.current })
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data as T);
        setMeta((res.data.meta ?? null) as M | null);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, meta, loading, error, refetch, setData };
}
