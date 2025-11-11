import { z } from "zod";
import type { ModelParameters, RequestPayload, ApiResponse } from "./openrouter.types.js";
import { OpenRouterError, requestPayloadSchema, apiResponseSchema } from "./openrouter.types.js";
import { Logger } from "./logger";

// Validation schemas
const configSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  apiUrl: z.string().url().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().positive().optional(),
});

export class OpenRouterService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;
  private readonly logger: Logger;

  private currentSystemMessage = "";
  private currentUserMessage = "";
  private currentResponseFormat?: Record<string, unknown>;
  private currentModelName = "openai/gpt-4o-mini";
  private currentModelParameters: ModelParameters = {
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  constructor(config: { apiKey: string; apiUrl?: string; timeout?: number; maxRetries?: number }) {
    this.logger = new Logger("OpenRouterService");

    try {
      // Validate configuration using Zod
      const validatedConfig = configSchema.parse(config);

      this.apiKey = validatedConfig.apiKey;
      this.apiUrl = validatedConfig.apiUrl || "https://openrouter.ai/api/v1";
      this.defaultTimeout = validatedConfig.timeout || 30000;
      this.maxRetries = validatedConfig.maxRetries || 3;
    } catch (error) {
      this.logger.error(error as Error, {
        config: {
          ...config,
          apiKey: "[REDACTED]",
        },
      });
      throw error;
    }
  }

  /**
   * Sets the system message that provides context for the model
   */
  public setSystemMessage(message: string): void {
    try {
      if (!message.trim()) {
        throw new OpenRouterError("System message cannot be empty", "INVALID_SYSTEM_MESSAGE");
      }
      this.currentSystemMessage = message;
    } catch (error) {
      this.logger.error(error as Error, { messageLength: message.length });
      throw error;
    }
  }

  /**
   * Sets the user message to be processed by the model
   */
  public setUserMessage(message: string): void {
    try {
      if (!message.trim()) {
        throw new OpenRouterError("User message cannot be empty", "INVALID_USER_MESSAGE");
      }
      this.currentUserMessage = message;
    } catch (error) {
      this.logger.error(error as Error, { messageLength: message.length });
      throw error;
    }
  }

  /**
   * Sets the JSON schema for structured responses
   */
  public setResponseFormat(schema: Record<string, unknown>): void {
    try {
      this.currentResponseFormat = schema;
    } catch (error) {
      this.logger.error(error as Error, { schemaKeys: Object.keys(schema) });
      throw new OpenRouterError("Invalid JSON schema provided", "INVALID_RESPONSE_FORMAT");
    }
  }

  /**
   * Sets the model and its parameters
   */
  public setModel(name: string, parameters?: ModelParameters): void {
    try {
      if (!name.trim()) {
        throw new OpenRouterError("Model name cannot be empty", "INVALID_MODEL_NAME");
      }

      this.currentModelName = name;
      if (parameters) {
        this.currentModelParameters = {
          ...this.currentModelParameters,
          ...parameters,
        };
      }
    } catch (error) {
      this.logger.error(error as Error, {
        modelName: name,
        parameters,
      });
      throw error;
    }
  }

  /**
   * Sends a chat message to the OpenRouter API and returns the response
   * @throws {OpenRouterError} If the request fails or validation fails
   */
  public async sendChatMessage(): Promise<string> {
    try {
      // Build and validate the request payload
      const payload = this.buildRequestPayload();

      // Validate payload
      try {
        requestPayloadSchema.parse(payload);
      } catch (validationError) {
        const error = validationError as Error;
        this.logger.error(error, {
          validationDetails: validationError instanceof z.ZodError ? validationError.errors : undefined,
          payload: {
            ...payload,
            messages: payload.messages.map((m) => ({
              role: m.role,
              contentLength: m.content.length,
            })),
          },
        });
        throw validationError;
      }

      // Execute the request
      const response = await this.executeRequest(payload);

      // Validate the response
      try {
        apiResponseSchema.parse(response);
      } catch (validationError) {
        const error = validationError as Error;
        this.logger.error(error, {
          validationDetails: validationError instanceof z.ZodError ? validationError.errors : undefined,
          response: {
            choicesCount: response.choices?.length,
            firstChoice: response.choices?.[0]
              ? {
                  hasMessage: Boolean(response.choices[0].message),
                  messageKeys: response.choices[0].message ? Object.keys(response.choices[0].message) : [],
                }
              : null,
          },
        });
        throw validationError;
      }

      // Check if we have any choices in the response
      if (!response.choices.length) {
        throw new OpenRouterError("No response received from the model", "EMPTY_RESPONSE");
      }

      // Return the first choice's content
      return response.choices[0].message.content;
    } catch (error) {
      // Log the error with relevant metadata
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error(errorObj, {
        errorDetails:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                code: error instanceof OpenRouterError ? error.code : undefined,
                validationErrors: error instanceof z.ZodError ? error.errors : undefined,
              }
            : undefined,
        context: {
          modelName: this.currentModelName,
          hasSystemMessage: Boolean(this.currentSystemMessage),
          userMessageLength: this.currentUserMessage.length,
          hasResponseFormat: Boolean(this.currentResponseFormat),
        },
      });

      // Handle validation errors
      if (error instanceof z.ZodError) {
        throw new OpenRouterError(`Validation error: ${error.errors[0].message}`, "VALIDATION_ERROR");
      }

      // Re-throw OpenRouterError instances
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Handle unexpected errors
      throw new OpenRouterError("An unexpected error occurred", "UNEXPECTED_ERROR");
    }
  }

  /**
   * Builds the request payload for the OpenRouter API
   */
  private buildRequestPayload(): RequestPayload {
    try {
      const messages = [];

      if (this.currentSystemMessage) {
        messages.push({
          role: "system" as const,
          content: this.currentSystemMessage,
        });
      }

      if (!this.currentUserMessage) {
        throw new OpenRouterError("User message is required", "MISSING_USER_MESSAGE");
      }

      messages.push({
        role: "user" as const,
        content: this.currentUserMessage,
      });

      const payload: RequestPayload = {
        messages,
        model: this.currentModelName,
        ...this.currentModelParameters,
      };

      if (this.currentResponseFormat) {
        payload.response_format = {
          type: "json_schema",
          json_schema: this.currentResponseFormat,
        };
      }

      return payload;
    } catch (error) {
      this.logger.error(error as Error, {
        hasSystemMessage: Boolean(this.currentSystemMessage),
        hasUserMessage: Boolean(this.currentUserMessage),
        modelName: this.currentModelName,
      });
      throw error;
    }
  }

  /**
   * Executes a request to the OpenRouter API with retry logic
   */
  private async executeRequest(requestPayload: RequestPayload): Promise<ApiResponse> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await fetch(`${this.apiUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(this.defaultTimeout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new OpenRouterError(errorData.message || `HTTP error ${response.status}`, "API_ERROR", response.status);
        }

        const data = await response.json();
        return data as ApiResponse;
      } catch (error) {
        lastError = error as Error;

        // Log retry attempts
        this.logger.warn(`Request failed, attempt ${attempt + 1} of ${this.maxRetries}`, {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          errorCode: error instanceof OpenRouterError ? error.code : undefined,
          status: error instanceof OpenRouterError ? error.status : undefined,
        });

        // Don't retry on authentication errors or invalid requests
        if (error instanceof OpenRouterError && (error.status === 401 || error.status === 400)) {
          this.logger.error(error, {
            status: error.status,
            code: error.code,
          });
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        attempt++;
      }
    }

    const maxRetriesError = lastError || new OpenRouterError("Maximum retry attempts exceeded", "MAX_RETRIES_EXCEEDED");

    this.logger.error(maxRetriesError, {
      attempts: attempt,
      maxRetries: this.maxRetries,
    });

    throw maxRetriesError;
  }
}
