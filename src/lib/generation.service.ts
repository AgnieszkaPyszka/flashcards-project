import crypto from "crypto";
import type { FlashcardProposalDto, GenerationCreateResponseDto } from "../types";
import type { SupabaseClient } from "../db/supabase.client";
import { DEFAULT_USER_ID } from "../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import { OpenRouterError } from "./openrouter.types";
import { logger } from "./logger";

export class GenerationService {
  private readonly openRouter: OpenRouterService;
  private readonly model = "openai/gpt-4o-mini";

  constructor(
    private readonly supabase: SupabaseClient,
    openRouterConfig?: { apiKey: string }
  ) {
    if (!openRouterConfig?.apiKey) {
      logger.error("OpenRouter API key is missing. Flashcard generation will fail.");
      throw new Error("OpenRouter API key is required");
    }
    this.openRouter = new OpenRouterService({
      apiKey: openRouterConfig.apiKey,
      timeout: 60000, // 60 seconds timeout for longer generations
    });

    this.openRouter.setModel(this.model, {
      temperature: 0.7,
      top_p: 1,
    });

    this.openRouter
      .setSystemMessage(`You are an AI assistant specialized in creating high-quality flashcards from provided text.
Generate concise, clear, and effective flashcards that capture key concepts and knowledge.
Each flashcard should have a front (question/prompt) and back (answer/explanation).
Focus on important facts, definitions, concepts, and relationships.`);

    this.openRouter.setResponseFormat({
      name: "flashcards",
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["flashcards"],
      },
    });
  }

  async generateFlashcards(sourceText: string): Promise<GenerationCreateResponseDto> {
    try {
      // 1. Calculate metadata
      const startTime = Date.now();
      const sourceTextHash = await this.calculateHash(sourceText);

      // 2. Call AI service through OpenRouter
      const proposals = await this.callAIService(sourceText);

      // 3. Save generation metadata
      const generationId = await this.saveGenerationMetadata({
        sourceText,
        sourceTextHash,
        generatedCount: proposals.length,
        durationMs: Date.now() - startTime,
      });

      return {
        generation_id: generationId,
        flashcards_proposals: proposals,
        generated_count: proposals.length,
      };
    } catch (error) {
      // Log error and save to generation_error_logs
      await this.logGenerationError(error, {
        sourceTextHash: await this.calculateHash(sourceText),
        sourceTextLength: sourceText.length,
      });
      throw error;
    }
  }

  private async calculateHash(text: string): Promise<string> {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  private async callAIService(text: string): Promise<FlashcardProposalDto[]> {
    try {
      // Set the user message with the source text
      this.openRouter.setUserMessage(`Generate flashcards from the following text:\n\n${text}`);

      // Get response from OpenRouter
      const response = await this.openRouter.sendChatMessage();

      // Parse the JSON response
      const data = JSON.parse(response);

      // Validate response structure
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error("Invalid response format: missing flashcards array");
      }

      // Convert to FlashcardProposalDto format
      return data.flashcards.map((card: { front: string; back: string }) => ({
        front: card.front,
        back: card.back,
        source: "ai-full" as const,
      }));
    } catch (error) {
      if (error instanceof OpenRouterError) {
        logger.error(`AI Service error: ${error.message} (Code: ${error.code}, Status: ${error.status})`);
        throw new Error(`AI Service error: ${error.message} (${error.code})`);
      }
      logger.error("Unknown error in callAIService:", error);
      throw error;
    }
  }

  private async saveGenerationMetadata(data: {
    sourceText: string;
    sourceTextHash: string;
    generatedCount: number;
    durationMs: number;
  }): Promise<number> {
    const { data: generation, error } = await this.supabase
      .from("generations")
      .insert({
        user_id: DEFAULT_USER_ID,
        source_text_hash: data.sourceTextHash,
        source_text_length: data.sourceText.length,
        generated_count: data.generatedCount,
        generation_duration: data.durationMs,
        model: this.model,
      })
      .select("id")
      .single();

    if (error) throw error;
    return generation.id;
  }

  private async logGenerationError(
    error: unknown,
    data: {
      sourceTextHash: string;
      sourceTextLength: number;
    }
  ): Promise<void> {
    await this.supabase.from("generation_error_logs").insert({
      user_id: DEFAULT_USER_ID,
      error_code: error instanceof Error ? error.name : "UNKNOWN",
      error_message: error instanceof Error ? error.message : String(error),
      model: this.model,
      source_text_hash: data.sourceTextHash,
      source_text_length: data.sourceTextLength,
    });
  }
}
