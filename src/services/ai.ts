import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIConfig } from "../interfaces";

export interface GeminiModel {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
}

export class AIService {
  private static instance: AIService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string | null = null;
  private promptTemplate: string | null = null;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public initialize(config: IAIConfig) {
    if (!config.apiKey) {
      throw new Error("API Key is required");
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
    this.apiKey = config.apiKey;
    this.promptTemplate = config.promptTemplate || 
      "Simplifica este nombre de tarea manteniendo la esencia pero haciéndolo más conciso. Máximo 50 caracteres. SOLO devuelve el texto simplificado, sin comillas ni explicaciones adicionales. La tarea es: ";
  }

  public async simplifyTask(taskName: string): Promise<string> {
    try {
      if (!this.genAI || !this.model) {
        throw new Error("AI not initialized");
      }

      const prompt = `${this.promptTemplate}${taskName}`;
      console.log("Usando prompt:", prompt);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();
      
      return text;
    } catch (error) {
      console.error("Error simplifying task:", error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<GeminiModel[]> {
    if (!this.apiKey) {
      throw new Error("API Key no configurada");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener modelos: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models.filter((model: GeminiModel) => 
        model.name.includes('gemini') && 
        !model.name.includes('vision') && 
        !model.name.includes('embedding')
      );
    } catch (error) {
      console.error("Error fetching models:", error);
      throw error;
    }
  }
}

export const aiService = AIService.getInstance(); 