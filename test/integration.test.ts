// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("ELISA Plate Mapper");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("example_sandwich_elisa");
      expect(names).toContain("missing_blank_warns");
      expect(names).toContain("high_cv_od");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs example_sandwich_elisa example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("example_sandwich_elisa");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.standard_point_count).toBe(2);
      expect(result.result?.perimeter_standard_fraction).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs missing_blank_warns example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("missing_blank_warns");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(0);
      expect(result.result?.standard_point_count).toBe(2);
      expect(result.result?.warnings.some((w) => w.code.includes("blank"))).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs high_cv_od example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("high_cv_od");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.cv_groups.length).toBeGreaterThan(0);
      expect(result.result?.cv_groups.some((g) => g.high_cv)).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs convenience validatePlate helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.validatePlate([
        { well: "A1", type: "blank", label: "Blank" },
        { well: "B2", type: "standard", concentration: 100, group_id: "Std-1" },
        { well: "B3", type: "standard", concentration: 50, group_id: "Std-2" },
      ]);

      expect(result.status).toBe("completed");
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.standard_point_count).toBe(2);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("example_sandwich_elisa");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.blank_count).toBe(1);
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("ELISA Plate Mapper");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("example_sandwich_elisa");
      expect(names).toContain("missing_blank_warns");
      expect(names).toContain("high_cv_od");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs example_sandwich_elisa example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("example_sandwich_elisa");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.standard_point_count).toBe(2);
      expect(result.result?.perimeter_standard_fraction).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs missing_blank_warns example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("missing_blank_warns");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(0);
      expect(result.result?.standard_point_count).toBe(2);
      expect(result.result?.warnings.some((w) => w.code.includes("blank"))).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs high_cv_od example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("high_cv_od");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.cv_groups.length).toBeGreaterThan(0);
      expect(result.result?.cv_groups.some((g) => g.high_cv)).toBe(true);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs convenience validatePlate helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.validatePlate([
        { well: "A1", type: "blank", label: "Blank" },
        { well: "B2", type: "standard", concentration: 100, group_id: "Std-1" },
        { well: "B3", type: "standard", concentration: 50, group_id: "Std-2" },
      ]);

      expect(result.status).toBe("completed");
      expect(result.result?.blank_count).toBe(1);
      expect(result.result?.standard_point_count).toBe(2);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("example_sandwich_elisa");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.blank_count).toBe(1);
    },
    60_000,
  );
});

describe("integration: config defaults", () => {
  it("uses production base URL by default", () => {
    expect(DEFAULT_API_BASE_URL).toBe("https://tools.pepkio.com");
  });
});
