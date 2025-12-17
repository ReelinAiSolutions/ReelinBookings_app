'use client';

import { GoogleGenAI } from "@google/genai";

// NOTE: In a production app, never expose your API key on the client side.
// This should be proxied through a backend (Next.js API Routes).
// For this simple demo, we access the env var directly.
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const generateServiceDescription = async (serviceName: string, keywords: string): Promise<string> => {
    if (!API_KEY) {
        console.warn("Missing API Key for Gemini");
        return "AI generation unavailable: Missing NEXT_PUBLIC_GEMINI_API_KEY.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `
      You are a professional copywriter for a high-end booking service.
      Write a short, compelling, and attractive description (max 2 sentences) for a service named "${serviceName}".
      Key qualities to include: ${keywords}.
      Do not use hashtags.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        return response.text || "Could not generate description.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error generating description. Please try again.";
    }
};
