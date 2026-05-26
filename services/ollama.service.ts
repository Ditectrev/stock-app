/**
 * Ollama Integration Service
 * Provides local AI capabilities via Ollama running on the user's device.
 * No data is sent to external services — all inference is local.
 * Requirements: 22.9, 22.10, 22.11
 */

import { logger } from "@/lib/logger";

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: Date;
}

export interface OllamaGenerateRequest {
  model?: string;
  prompt: string;
  stream?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  totalDuration?: number;
}

export interface OllamaVerificationResult {
  available: boolean;
  version?: string;
  models?: OllamaModel[];
  error?: string;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = "http://localhost:11434",
    defaultModel: string = ""
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  /**
   * Verifies that Ollama is installed and accessible on the user's device.
   * Requirement: 22.10
   */
  async verify(): Promise<OllamaVerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return {
          available: false,
          error: `Ollama returned status ${response.status}`,
        };
      }

      const versionData = await response.json();
      const models = await this.listModels();

      logger.info("Ollama verified successfully", {
        version: versionData.version,
        modelCount: models.length,
      });

      return {
        available: true,
        version: versionData.version,
        models,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn("Ollama not available", { error: message });
      return {
        available: false,
        error: `Ollama is not running or not installed: ${message}`,
      };
    }
  }

  /**
   * Lists available models installed in Ollama.
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.models ?? []).map((m: any) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: new Date(m.modified_at),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sends a prompt to a local Ollama model and returns the response.
   * All inference is local — no data leaves the user's machine.
   * Requirement: 22.11
   */
  async generate(request: OllamaGenerateRequest): Promise<string> {
    const model =
      request.model ||
      this.defaultModel ||
      (await this.getFirstInstalledModel());

    logger.info("Sending prompt to local Ollama model", { model });

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: request.prompt,
        stream: false,
        ...(request.format ? { format: request.format } : {}),
        options: request.options,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama generate failed with status ${response.status}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  }

  /**
   * Returns the configured base URL (for testing/verification).
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Returns the default model name.
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  private async getFirstInstalledModel(): Promise<string> {
    const models = await this.listModels();
    const model = models.sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()
    )[0];

    if (!model) {
      throw new Error(
        "No Ollama models are installed. Install one with `ollama pull llama3.2` or another model, then try again."
      );
    }

    return model.name;
  }
}

export const ollamaService = new OllamaService();
