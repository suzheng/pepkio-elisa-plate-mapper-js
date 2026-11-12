// SPDX-License-Identifier: MIT
import { z } from "zod";

export const WELL_TYPES = ["standard", "blank", "control", "unknown", "empty"] as const;
export type WellType = (typeof WELL_TYPES)[number];

export const wellInputSchema = z.object({
  well: z.string().min(2),
  type: z.enum(WELL_TYPES),
  label: z.string().optional(),
  concentration: z.number().optional(),
  od: z.number().optional(),
  group_id: z.string().optional(),
  replicate: z.number().int().min(1).max(3).optional(),
});
export type WellInput = z.infer<typeof wellInputSchema>;

export const elisaPlateMapperInputSchema = z.object({
  wells: z.array(wellInputSchema).min(1),
});
export type ElisaPlateMapperInput = z.infer<typeof elisaPlateMapperInputSchema>;

export function parseRunInput(input: unknown): ElisaPlateMapperInput {
  return elisaPlateMapperInputSchema.parse(input);
}
