// SPDX-License-Identifier: MIT
import type {
  ElisaPlateMapperInput,
  WellInput,
  WellType,
} from "./schemas.js";

export type {
  ElisaPlateMapperInput,
  WellInput,
  WellType,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = ElisaPlateResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type ValidationLevel = "yellow" | "orange" | (string & {});

export interface ValidationWarning {
  code: string;
  level: ValidationLevel;
  message: string;
}

export interface CvGroup {
  group_id: string;
  mean: number;
  sd: number;
  cv_pct: number;
  n: number;
  high_cv: boolean;
}

export interface ElisaPlateResult {
  warnings: ValidationWarning[];
  cv_groups: CvGroup[];
  standard_point_count: number;
  blank_count: number;
  perimeter_standard_fraction: number;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
