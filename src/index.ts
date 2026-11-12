// SPDX-License-Identifier: MIT

export {
  PepkioClient,
  type PepkioClientOptions,
  type ValidatePlateParams,
} from "./client.js";

export {
  TOOL_ID,
  DEFAULT_API_BASE_URL,
  resolveBaseUrl,
  resolveApiKey,
  apiPath,
} from "./config.js";

export {
  WELL_TYPES,
  wellInputSchema,
  elisaPlateMapperInputSchema,
  parseRunInput,
  type WellType,
  type WellInput,
  type ElisaPlateMapperInput,
} from "./schemas.js";

export {
  PepkioAPIError,
  type RunStatus,
  type RunOptions,
  type RunResult,
  type ManifestExample,
  type ToolManifest,
  type ExampleMeta,
  type ValidationLevel,
  type ValidationWarning,
  type CvGroup,
  type ElisaPlateResult,
} from "./types.js";
