import { afterEach, describe, expect, it, vi } from "vitest";
import {
  browserUseReadiness,
  cancelBrowserUseRun,
  createBrowserUseRun,
  getBrowserUseAccount,
  getBrowserUseRunStatus,
} from "./browserUse";

const configuredApiKey = process.env.BROWSER_USE_API_KEY;

afterEach(() => {
  if (configuredApiKey) process.env.BROWSER_USE_API_KEY = configuredApiKey;
  else delete process.env.BROWSER_USE_API_KEY;
  vi.unstubAllGlobals();
});

describe("Browser Use Cloud V4 client", () => {
  it("reports that the integration is disabled until the project secret exists", () => {
    delete process.env.BROWSER_USE_API_KEY;
    expect(browserUseReadiness()).toMatchObject({
      configured: false,
      provider: "Browser Use Cloud V4",
    });
    return expect(
      createBrowserUseRun({ task: "Open the PBA website" })
    ).rejects.toThrow("BROWSER_USE_API_KEY");
  });

  it("reports the integration as configured when the server secret is present", () => {
    process.env.BROWSER_USE_API_KEY = "test-browser-use-key";
    expect(browserUseReadiness()).toMatchObject({
      configured: true,
      apiBase: "https://api.browser-use.com/api/v4",
    });
  });

  it("authenticates the configured key against the lightweight account endpoint", async () => {
    if (!process.env.BROWSER_USE_API_KEY) return;
    await expect(getBrowserUseAccount()).resolves.toBeDefined();
  });

  it("creates a run with the documented API-key header", async () => {
    process.env.BROWSER_USE_API_KEY = "test-browser-use-key";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "run-1",
          status: "queued",
          model: "gpt-6-luna",
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createBrowserUseRun({
        task: "Find the latest PBA hiring post",
        model: "gpt-6-luna",
      })
    ).resolves.toMatchObject({ id: "run-1", status: "queued" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.browser-use.com/api/v4/runs",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Browser-Use-API-Key": "test-browser-use-key",
        }),
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      task: "Find the latest PBA hiring post",
      model: "gpt-6-luna",
    });
  });

  it("uses the minimal status endpoint and supports cancellation", async () => {
    process.env.BROWSER_USE_API_KEY = "test-browser-use-key";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "running" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "run-1", status: "cancelled", result: null }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getBrowserUseRunStatus("run-1")).resolves.toEqual({
      status: "running",
    });
    await expect(cancelBrowserUseRun("run-1")).resolves.toMatchObject({
      id: "run-1",
      status: "cancelled",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.browser-use.com/api/v4/runs/run-1/status"
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.browser-use.com/api/v4/runs/run-1/cancel"
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "POST" });
  });
});
