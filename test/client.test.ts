// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "ELISA Plate Mapper",
  description:
    "Visual 96-well ELISA plate layout planner with standard-curve auto-fill, batch unknown assignment, layout validation, and bench-ready exports.",
  examples: [
    {
      name: "example_sandwich_elisa",
      description: "Standard sandwich ELISA layout with blank and standards in duplicate",
      input: {
        wells: [
          { well: "A1", type: "blank", label: "Blank", group_id: "Blank" },
          {
            well: "A2",
            type: "standard",
            label: "Std-1-1",
            concentration: 1000,
            group_id: "Std-1",
            replicate: 1,
          },
          {
            well: "A3",
            type: "standard",
            label: "Std-1-2",
            concentration: 1000,
            group_id: "Std-1",
            replicate: 2,
          },
        ],
      },
      output: { blank_count: 1, standard_point_count: 1 },
    },
    {
      name: "missing_blank_warns",
      description: "Standards without blanks",
      input: {
        wells: [
          {
            well: "A2",
            type: "standard",
            label: "Std-1",
            concentration: 1000,
            group_id: "Std-1",
          },
        ],
      },
      output: { blank_count: 0, standard_point_count: 1 },
    },
  ],
};

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("resolves default production base URL", () => {
    delete process.env.PEPKIO_API_BASE_URL;
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("resolves base URL override parameter over env", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com";
    expect(resolveBaseUrl("https://override.pepkio.com/")).toBe(
      "https://override.pepkio.com",
    );
  });

  it("resolves base URL from env if no override", () => {
    process.env.PEPKIO_API_BASE_URL = "https://tools.localtest.me/";
    expect(resolveBaseUrl()).toBe("https://tools.localtest.me");
  });

  it("resolves API key for production", () => {
    process.env.PEPKIO_API_KEY = "prod-key";
    delete process.env.LOCAL_PEPKIO_API_KEY;
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
  });

  it("resolves local API key for localtest.me", () => {
    process.env.PEPKIO_API_KEY = "prod-key";
    process.env.LOCAL_PEPKIO_API_KEY = "local-key";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
  });

  it("falls back to PEPKIO_API_KEY for localtest.me if LOCAL_PEPKIO_API_KEY is unset", () => {
    process.env.PEPKIO_API_KEY = "fallback-key";
    delete process.env.LOCAL_PEPKIO_API_KEY;
    expect(resolveApiKey("https://tools.localtest.me")).toBe("fallback-key");
  });

  it("builds correct API path", () => {
    expect(apiPath("https://tools.pepkio.com", "/tools/elisa-plate-mapper/manifest")).toBe(
      "https://tools.pepkio.com/api/tools/v1/tools/elisa-plate-mapper/manifest",
    );
    expect(apiPath("https://tools.pepkio.com", "runs/run-123")).toBe(
      "https://tools.pepkio.com/api/tools/v1/runs/run-123",
    );
  });
});

describe("schemas", () => {
  it("parses valid ELISA plate wells input", () => {
    const parsed = parseRunInput({
      wells: [
        { well: "A1", type: "blank", label: "Blank" },
        { well: "A2", type: "standard", concentration: 100, replicate: 1 },
      ],
    });
    expect(parsed.wells).toHaveLength(2);
    expect(parsed.wells[0].type).toBe("blank");
    expect(parsed.wells[1].concentration).toBe(100);
  });

  it("rejects empty wells array", () => {
    expect(() =>
      parseRunInput({
        wells: [],
      }),
    ).toThrow();
  });

  it("rejects invalid well type", () => {
    expect(() =>
      parseRunInput({
        wells: [{ well: "A1", type: "invalid_type" }],
      }),
    ).toThrow();
  });
});

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches and caches manifest", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ baseUrl: "https://tools.pepkio.com" });
    const manifest = await client.getManifest();
    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://tools.pepkio.com/api/tools/v1/tools/elisa-plate-mapper/manifest",
    );

    // Second call should use cache
    const cached = await client.getManifest();
    expect(cached.tool_id).toBe(TOOL_ID);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("lists examples", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient();
    const examples = await client.getExamples();
    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("example_sandwich_elisa");
  });

  it("gets example input", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient();
    const input = await client.getExampleInput("example_sandwich_elisa");
    expect(input.wells).toHaveLength(3);
    expect(input.wells[0].well).toBe("A1");
    expect(input.wells[0].type).toBe("blank");
  });

  it("throws for unknown example name", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient();
    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      'Example "non_existent" not found',
    );
  });

  it("throws PepkioAPIError when API key is missing for run", async () => {
    delete process.env.PEPKIO_API_KEY;
    delete process.env.LOCAL_PEPKIO_API_KEY;
    const client = new PepkioClient({ baseUrl: "https://tools.pepkio.com" });

    await expect(
      client.run({
        wells: [{ well: "A1", type: "blank" }],
      }),
    ).rejects.toThrow("API key required");
  });

  it("sends authenticated run request and returns RunResult", async () => {
    const mockResponse = {
      run_id: "run-123",
      status: "completed",
      result: {
        warnings: [],
        cv_groups: [],
        standard_point_count: 2,
        blank_count: 1,
        perimeter_standard_fraction: 0.5,
      },
      error: null,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.run({
      wells: [
        { well: "A1", type: "blank" },
        { well: "A2", type: "standard", concentration: 100 },
      ],
    });

    expect(res.run_id).toBe("run-123");
    expect(res.result?.standard_point_count).toBe(2);
    expect(res.result?.blank_count).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://tools.pepkio.com/api/tools/v1/tools/elisa-plate-mapper/run");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("convenience validatePlate formats input correctly", async () => {
    const mockResponse = {
      run_id: "run-val",
      status: "completed",
      result: { blank_count: 1 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await client.validatePlate([
      { well: "A1", type: "blank", label: "Blank" },
      { well: "B1", type: "unknown", label: "Sample 1" },
    ]);

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.input.wells).toHaveLength(2);
    expect(body.input.wells[0].well).toBe("A1");
  });

  it("fetches run by ID via getRun", async () => {
    const mockResponse = {
      run_id: "run-456",
      status: "completed",
      result: { standard_point_count: 3 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.getRun("run-456");
    expect(res.run_id).toBe("run-456");
    expect(res.status).toBe("completed");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://tools.pepkio.com/api/tools/v1/runs/run-456");
  });

  it("throws PepkioAPIError on HTTP 400 with API error details", async () => {
    const errorBody = {
      error: {
        code: "INVALID_INPUT",
        message: "wells must not be empty",
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify(errorBody),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.run({
        wells: [{ well: "A1", type: "blank" }],
      }),
    ).rejects.toThrow("wells must not be empty");
  });

  it("throws PepkioAPIError when run result contains error field", async () => {
    const mockResponse = {
      run_id: "run-failed",
      status: "failed",
      error: {
        code: "LAYOUT_ERROR",
        message: "Duplicate well assignments detected",
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.run({
        wells: [{ well: "A1", type: "blank" }],
      }),
    ).rejects.toThrow("Duplicate well assignments detected");
  });

  it("waitForRun polls until completed", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          text: async () => JSON.stringify({ run_id: "run-async", status: "running" }),
        };
      }
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            run_id: "run-async",
            status: "completed",
            result: { blank_count: 1 },
          }),
      };
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.waitForRun("run-async", { intervalMs: 10, timeoutMs: 1000 });
    expect(res.status).toBe("completed");
    expect(callCount).toBe(2);
  });
});
