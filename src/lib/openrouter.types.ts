import { z } from "zod";

/**
 * Parameters for configuring the model's behavior
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Request payload structure for OpenRouter API
 */
export interface RequestPayload {
  messages: {
    role: "system" | "user";
    content: string;
  }[];
  model: string;
  response_format?: {
    type: "json_schema";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json_schema: any;
  };
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Response structure from OpenRouter API
 */
export interface ApiResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}

/**
 * Custom error class for OpenRouter-specific errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// Zod Schemas for validation
export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

export const messageSchema = z.object({
  role: z.enum(["system", "user"]),
  content: z.string().min(1),
});

export const requestPayloadSchema = z.object({
  messages: z.array(messageSchema).min(1),
  model: z.string().min(1),
  response_format: z
    .object({
      type: z.literal("json_schema"),
      json_schema: z.object({
        name: z.string(),
        schema: z.object({
          type: z.literal("object"),
          properties: z.record(z.unknown()),
          required: z.array(z.string()),
        }),
      }),
    })
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

export const apiResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string(),
      }),
    })
  ),
});
