import { GoogleGenAI } from '@google/genai';
import { ReviewSuggestionRequest, ReviewSuggestionResponse } from '../types.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Curated deterministic fallback templates for assignment ordering platform per rating bracket
const FALLBACK_TEMPLATES: Record<string, string[]> = {
  // 1-3 Stars: Constructive, honest, respectful feedback on coursework/assignment delivery
  low: [
    'My recent assignment order did not fully follow all rubric guidelines, and delivery was cutting it close to my deadline. The explanations could be clearer, though I hope support uses this feedback to improve revision turnaround.',
    'A bit disappointed with the turnaround on my assignment order. The initial draft missed a couple of key requirements, though customer support was polite. Better attention to specific project prompts is needed.',
    'The delivered coursework had formatting inconsistencies and required revisions before it was usable. The platform is simple to use, but initial draft quality needs to be higher.',
    'The order fell short of my academic expectations. While the support team was responsive, the solution lacked the depth and citations requested in the brief.',
  ],
  // 4-6 Stars: Balanced, fair feedback on assignment delivery & clarity
  mid: [
    'The assignment was completed and delivered on time. The overall structure was solid, though a few explanations required minor personal touch-ups. A decent, fair tool for coursework guidance.',
    'A solid experience ordering my assignment through ASKMATE. The ordering workflow was smooth and communication was good, though I needed slight clarifications on the final solution.',
    'Fair and helpful overall. It met the core requirements and gave me a helpful starting foundation, though referencing details could have been slightly more thorough.',
    'Generally good service. Delivered before the deadline and solved the main problems, but could benefit from more detailed step-by-step breakdowns.',
  ],
  // 7-8 Stars: Positive, appreciative feedback on learning & assignment assistance
  high: [
    'Really helped make my coursework and study prep much easier! The assignment was delivered ahead of deadline with clear explanations and proper formatting. Would definitely recommend to fellow students.',
    'Very solid academic assistance. The solutions were well-structured, easy to follow, and saved me so much stress. The LEARN | EASY approach really shows in the ordering flow.',
    'Smooth and reliable assignment ordering tool. Clear step-by-step answers and responsive support whenever I had questions about the delivery.',
    'Pleasantly impressed with the depth and clarity of the work provided. Clean formatting, good references, and timely delivery. Looking forward to using it again.',
  ],
  // 9-10 Stars: Very positive, enthusiastic praise for assignment ordering tool
  exceptional: [
    'Outstanding academic assistance from start to finish! My assignment was completed well ahead of the deadline with thorough research, clean citations, and crystal-clear step-by-step explanations. Truly makes learning easy!',
    'Exceptional quality and incredible turnaround speed! The paper followed every rubric instruction to perfection and made complex concepts simple to understand. Easily a 10/10 assignment tool.',
    'Flawless experience! The ordering process took seconds, delivery was super fast, and the academic standard was top tier. ASKMATE lives up to LEARN | EASY!',
    'Best assignment helper tool I have used! Accurate, well-researched, completely original work delivered on time. Takes away all the stress of heavy coursework!',
  ],
};

function getDeterministicSuggestion(rating: number, category?: string, businessName?: string): string {
  let bracket: 'low' | 'mid' | 'high' | 'exceptional';
  if (rating <= 3) bracket = 'low';
  else if (rating <= 6) bracket = 'mid';
  else if (rating <= 8) bracket = 'high';
  else bracket = 'exceptional';

  const list = FALLBACK_TEMPLATES[bracket];
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export async function generateReviewSuggestion(req: ReviewSuggestionRequest): Promise<ReviewSuggestionResponse> {
  const rating = Math.max(1, Math.min(10, Math.round(req.rating)));
  const businessName = 'ASKMATE';

  const ai = getAiClient();

  if (!ai) {
    return {
      suggestion: getDeterministicSuggestion(rating),
      aiPowered: false,
    };
  }

  // Construct precise prompt for an assignment ordering & academic assistance tool
  let toneGuidance = '';
  if (rating <= 3) {
    toneGuidance = 'Constructive and polite feedback from a student whose assignment order had issues (e.g. deadline rush, formatting inconsistencies, or needed revisions). Do not be abusive.';
  } else if (rating <= 6) {
    toneGuidance = 'Balanced and fair feedback. Acknowledge timely delivery and decent structure while noting areas where explanations or formatting could be polished.';
  } else if (rating <= 8) {
    toneGuidance = 'Positive and appreciative review praising timely delivery, clear explanations, good structure, and helpful study assistance.';
  } else {
    toneGuidance = 'Enthusiastic and high-praise review from a student praising fast delivery, top-notch academic quality, step-by-step clarity, and how it made learning easier.';
  }

  const prompt = `You are an AI assistant helping a student customer draft a realistic review for ASKMATE, an assignment ordering and academic assistance platform with the tagline "LEARN | EASY".
Rating given: ${rating} out of 10 stars.
Tone: ${toneGuidance}

STRICT CONSTRAINTS:
1. Focus on typical student assignment experience: turnaround speed, adherence to rubric guidelines, clarity of explanations, citations, and support responsiveness.
2. Do NOT invent specific course names, professor names, school names, subject codes, or fake person names.
3. Keep the review concise: 2 to 3 sentences (35-50 words).
4. Natural, authentic student voice.
5. Return ONLY the review text. Do NOT include quotes or prefixes.`;

  try {
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Generation Timeout')), 4000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);

    const text = response.text?.trim();
    if (text && text.length > 15) {
      // Clean any accidental wrapper quotes
      const cleaned = text.replace(/^["']|["']$/g, '').trim();
      return {
        suggestion: cleaned,
        aiPowered: true,
        modelUsed: 'gemini-3.8-flash',
      };
    }

    return {
      suggestion: getDeterministicSuggestion(rating),
      aiPowered: false,
    };
  } catch (err) {
    console.warn('Gemini API call timed out or failed, falling back to deterministic template:', err);
    return {
      suggestion: getDeterministicSuggestion(rating),
      aiPowered: false,
    };
  }
}
