import { env } from '../config/env';
import { ServiceResult } from './weatherService';

export interface AIIncidentAssessment {
  estimatedSeverity: 'low' | 'moderate' | 'high' | 'critical';
  confidenceRating: number; // 0-100
  secondaryHazardRisks: string[]; // e.g. ["Damming of stream", "Culvert blowout"]
  immediateActionRecommendations: string[];
  geologicalAnalysis: string;
}

/**
 * AI-enabled geological risk and report triaging service powered by Google Gemini.
 * Uses real API keys from process.env with zero hardcoding.
 */
export async function assessIncidentWithAI(
  incidentType: string,
  description: string,
  rainfallMm24h?: number,
  roadName?: string
): Promise<ServiceResult<AIIncidentAssessment>> {
  if (!env.GEMINI_API_KEY) {
    return {
      success: false,
      errorCode: 'CONFIG_MISSING',
      message: 'GEMINI_API_KEY is not configured in environment variables.',
    };
  }

  const prompt = `You are a Senior Geotechnical Engineer and Disaster Response Specialist for the North Eastern Region of India (Assam, Meghalaya, Sikkim, etc.).
Analyze this reported ground incident and return a JSON object ONLY matching this schema:
{
  "estimatedSeverity": "low" | "moderate" | "high" | "critical",
  "confidenceRating": number (0-100),
  "secondaryHazardRisks": string[],
  "immediateActionRecommendations": string[],
  "geologicalAnalysis": string
}

Incident Details:
- Incident Type: ${incidentType}
- Description: ${description}
- Road/Corridor: ${roadName || 'Off-road slope'}
- 24-Hour Cumulative Rainfall: ${rainfallMm24h ?? 'Unknown'} mm

Output valid JSON only. Do not include markdown formatting or commentary outside the JSON.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        errorCode: 'PROVIDER_ERROR',
        message: `Gemini API returned status ${response.status}: ${errorText}`,
      };
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return {
        success: false,
        errorCode: 'NO_DATA',
        message: 'No response content returned by Gemini API.',
      };
    }

    const parsed: AIIncidentAssessment = JSON.parse(rawText);
    return {
      success: true,
      data: parsed,
    };
  } catch (err: any) {
    console.error('Error invoking Gemini API:', err);
    return {
      success: false,
      errorCode: 'NETWORK_FAILURE',
      message: err.message || 'Network failure communicating with Gemini API.',
    };
  }
}
