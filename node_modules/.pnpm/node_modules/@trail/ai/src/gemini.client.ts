import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@trail/config';

const TONE_GUIDE = {
  friendly: 'warm and encouraging',
  luxury: 'sophisticated and elevated',
  playful: 'fun and enthusiastic',
};

const SYSTEM_PROMPT = `You are a fashion stylist AI.
Only compliment the clothing, outfit, and styling choices.
Never mention body shape, weight, skin tone, attractiveness, race, or age.
Keep the compliment under 20 words.
Return ONLY valid JSON. No markdown. No explanation.`;

export async function generateCompliment(params: {
  tone: 'friendly' | 'luxury' | 'playful';
}): Promise<{ compliment: string; score: number }> {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `${SYSTEM_PROMPT}

Tone: ${TONE_GUIDE[params.tone]}
Return exactly: {"compliment": "...", "score": 8.5}
Score range: 6.0 to 9.9`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 80,
      },
    });

    const text = result.response.text().trim();
    // Basic JSON extraction in case of markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonText);

    return {
      compliment: String(parsed.compliment),
      score: Math.min(9.9, Math.max(6.0, Number(parsed.score))),
    };
  } catch (error) {
    console.error('Gemini error:', error);
    // Fallback — never crash a job over a compliment
    return { compliment: '✨ This outfit looks amazing on you!', score: 8.0 };
  }
}
