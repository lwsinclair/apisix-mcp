import { z } from "zod";
import { createNullablePatchSchema } from "../utils/helper.js";

export const PluginSchema = z.object({
  _meta: z.object({
    disable: z.boolean().default(false).describe("control whether the plugin is enabled"),
  }).optional(),
}).passthrough().describe("plugins configuration");

export const GetPluginSchemaSchema = z.object({
  name: z.string().describe("plugins name"),
  type: z.enum(["http", "stream"]).optional().describe("plugins type"),
});

export const GetPluginMetadataSchema = z.object({
  name: z.string().describe("plugins name"),
});

export const CreateOrUpdatePluginMetadataSchema = z.object({
  name: z.string().describe("plugins name"),
  metadata: PluginSchema,
});

export const DeletePluginMetadataSchema = z.object({
  name: z.string().describe("plugins name"),
});

export const UpdateGlobalRuleSchema = createNullablePatchSchema(z.object({
  id: z.string().describe("global rule ID"),
  plugins: PluginSchema,
}));

export const CreateGlobalRuleSchema = z.object({
  id: z.string().describe("global rule ID"),
  plugins: PluginSchema,
});

export const PluginConfigSchema = z.object({
  desc: z.string().describe("plugin config description"),
  labels: z.record(z.string(), z.string()).describe("plugin config labels"),
  plugins: PluginSchema,
});

export const CreatePluginConfigSchema = z.object({
  id: z.string().describe("plugin config ID"),
  plugins: PluginConfigSchema,
});

export const UpdatePluginConfigSchema = createNullablePatchSchema(z.object({
  id: z.string().describe("plugin config ID"),
  plugins: PluginConfigSchema,
}));
