const BROWSER_USE_API_BASE = "https://api.browser-use.com/api/v4";
const BROWSER_USE_ACCOUNT_BASE = "https://api.browser-use.com/api/v2";

export type BrowserUseRunStatus =
  | "queued"
  | "dispatching"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type BrowserUseRunSummary = {
  id: string;
  task: string;
  title?: string | null;
  model?: string | null;
  status: BrowserUseRunStatus;
  result?: string | null;
  output?: unknown;
  error?: string | null;
  totalCostUsd?: string | null;
  sessionId?: string | null;
  workspaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BrowserUseStatusResponse = { status: BrowserUseRunStatus };

type BrowserUseError = { detail?: unknown; message?: string; error?: string };

function getApiKey() {
  const apiKey = process.env.BROWSER_USE_API_KEY?.trim();
  if (!apiKey)
    throw new Error(
      "Browser Use is not configured. Add the BROWSER_USE_API_KEY project secret before running an automation task."
    );
  return apiKey;
}

async function requestAt<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "X-Browser-Use-API-Key": getApiKey(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }
  if (!response.ok) {
    const error = payload as BrowserUseError;
    const detail =
      typeof error?.detail === "string"
        ? error.detail
        : typeof error?.message === "string"
          ? error.message
          : typeof error?.error === "string"
            ? error.error
            : raw || response.statusText;
    throw new Error(
      `Browser Use request failed (${response.status}): ${detail}`
    );
  }
  return payload as T;
}

async function request<T>(path: string, init: RequestInit = {}) {
  return requestAt<T>(BROWSER_USE_API_BASE, path, init);
}

export function browserUseReadiness() {
  return {
    configured: Boolean(process.env.BROWSER_USE_API_KEY?.trim()),
    apiBase: BROWSER_USE_API_BASE,
    provider: "Browser Use Cloud V4",
  };
}

export function getBrowserUseAccount() {
  return requestAt<Record<string, unknown>>(
    BROWSER_USE_ACCOUNT_BASE,
    "/billing/account"
  );
}

export async function createBrowserUseRun(input: {
  task: string;
  model?: string;
}) {
  return request<{
    id: string;
    status: BrowserUseRunStatus;
    model?: string | null;
  }>("/runs", {
    method: "POST",
    body: JSON.stringify({
      task: input.task,
      ...(input.model ? { model: input.model } : {}),
    }),
  });
}

export async function getBrowserUseRunStatus(runId: string) {
  return request<BrowserUseStatusResponse>(
    `/runs/${encodeURIComponent(runId)}/status`
  );
}

export async function getBrowserUseRun(runId: string) {
  return request<BrowserUseRunSummary>(`/runs/${encodeURIComponent(runId)}`);
}

export async function cancelBrowserUseRun(runId: string) {
  return request<BrowserUseRunSummary>(
    `/runs/${encodeURIComponent(runId)}/cancel`,
    { method: "POST" }
  );
}

export function isBrowserUseTerminalStatus(status: BrowserUseRunStatus) {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
}
