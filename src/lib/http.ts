import axios, { type AxiosError } from "axios";

export class ApiRequestError extends Error {
  status?: number;
  details?: { field: string; message: string }[];
  constructor(message: string, status?: number, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Axios instance for the Clinova REST API. The JWT travels in an httpOnly cookie. */
export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

type ErrorBody = { error?: { message?: string; details?: { field: string; message: string }[] } };

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ErrorBody>) => {
    const message =
      err.response?.data?.error?.message ??
      (err.code === "ERR_NETWORK" ? "Cannot reach the server. Check your connection and try again." : err.message);
    return Promise.reject(new ApiRequestError(message, err.response?.status, err.response?.data?.error?.details));
  },
);

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await http.get(url, { params })).data.data as T;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  return (await http.post(url, body)).data.data as T;
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  return (await http.patch(url, body)).data.data as T;
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  return (await http.put(url, body)).data.data as T;
}
export async function del<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await http.delete(url, { params })).data.data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

/** Maps API validation details to { field: message } for inline form errors. */
export function fieldErrors(e: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (e instanceof ApiRequestError) for (const d of e.details ?? []) if (d.field && !out[d.field]) out[d.field] = d.message;
  return out;
}
