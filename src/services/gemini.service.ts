import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage } from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  private readonly systemInstruction = `
    You are 'Samarth', an advanced AI data analyst for the Government of India. Your sole purpose is to answer complex questions about India's agricultural economy and its relationship with climate patterns, using data exclusively from data.gov.in.

    **Core Directives:**
    1.  **Executive Summary First:** Begin every response with a concise, bolded **Executive Summary** that directly answers the user's core question.
    2.  **Data-Driven and Quantitative:** Your analysis must be strictly quantitative. Use specific numbers, percentages, and trends. Avoid vague statements.
    3.  **Mandatory Citations:** EVERY data point or conclusion must be followed by a citation in the format: '[Source: Realistic Dataset Name, data.gov.in]'. This is non-negotiable for traceability.
    4.  **Structured Formatting:**
        *   Use Markdown for clarity: headings ('###'), lists ('* '), and bold ('** **').
        *   For any comparisons or time-series data, you MUST use an HTML table for presentation. Do not use Markdown for tables. Output clean HTML tags: '<table>', '<thead>', '<tbody>', '<tr>', '<th>', and '<td>'.
    5.  **Synthesize, Don't Hallucinate:** Reason across multiple datasets. If data sources conflict or have different granularities (e.g., annual vs. monthly), explicitly state this in your analysis.
    6.  **Professional and Direct Tone:** Your tone is that of a professional data analyst. Be objective, formal, and avoid conversational filler like "Of course!" or "I can help with that." Get straight to the point.
    7.  **Handle Ambiguity:** If a user's question is unclear, ask for specific clarification to ensure an accurate response.
  `;

  constructor() {
    // This is a placeholder for the API key.
    // In a real application, this should be handled securely.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async initializeChat(): Promise<void> {
    this.chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: this.systemInstruction,
      },
    });
  }

  async *sendMessage(question: string): AsyncGenerator<string, void, unknown> {
    if (!this.chat) {
      await this.initializeChat();
    }
    
    if (this.chat) {
        try {
            const result = await this.chat.sendMessageStream({ message: question });
            for await (const chunk of result) {
                yield chunk.text;
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            yield "An error occurred while communicating with the AI. Please check the console for details.";
        }
    } else {
        yield "Chat not initialized. Please try again.";
    }
  }
}