import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_RESUME_TEXT,
  DEFAULT_TARGET_ROLE,
  analyzeResumeDeterministic,
  ResumeAnalysisZodSchema,
  runGroundingValidator,
} from './src/utils/resumeAnalyzer';
import { AnalyzeApiResponse, GemmaModelId } from './src/types/resume';

dotenv.config();

const ALLOWED_GEMMA_MODELS: GemmaModelId[] = [
  'gemma-4-26b-a4b-it',
  'gemma-4-31b-it',
];

const SYSTEM_INSTRUCTION = `You are ResumeLens, an expert technical recruiter, ATS specialist and career coach.

TASK: Analyze the candidate's resume against the target role or job description and return ONLY a concise JSON object matching the provided schema. No markdown, no commentary. Keep each string concise (1 sentence max per rationale, description, and how_to_close).

RULES:
1. GROUNDING: Only report skills, tools, employers, degrees and numbers that are explicitly present in the resume. For every skill, put a short verbatim quote from the resume in "evidence". If a skill is only implied, mark level "beginner" and say "implied" in the evidence. Never list missing target skills in "skills".
2. NO FABRICATION: In bullet rewrites, never invent metrics, tools or outcomes. If the original has no number, use a placeholder like "[X%]" or "[N users]" and say in the rationale that the candidate should fill in the real value.
3. XYZ FORMULA: Rewrite weak bullets as "Accomplished [X], as measured by [Y], by doing [Z]." Start with a strong action verb, keep each bullet strictly under 25 words.
4. GAPS: Compare the resume to the job description. Split required skills (high severity if missing) from preferred skills (medium or low). Treat synonyms as matches (JS = JavaScript, K8s = Kubernetes, ML = Machine Learning, SQL = MySQL/PostgreSQL). Each gap needs a concrete 1-sentence "how_to_close" step.
5. SCORING (each 0-100): keywords match to JD, impact_metrics (share of bullets with measurable results), structure (standard headings, logical order, length), formatting (single-column readability, consistent dates), relevance (seniority and domain fit). overall_match_score is a weighted average: keywords 30%, relevance 30%, impact 20%, structure 10%, formatting 10%.
6. ACTION PLAN: 4 weeks (1-2 concise tasks per week), ordered by impact, small tasks first. Prefer free resources and say the resource type (course, project, docs, certification).
7. FAIRNESS: Do not infer or comment on gender, age, ethnicity, nationality, religion, marital status or disability. Ignore names, photos and graduation years when scoring.
8. HONESTY: If the resume text looks garbled or incomplete, or the job description is too vague, say so in "warnings" and lower your confidence instead of guessing.
9. TONE: Specific, direct and encouraging. No generic advice like "improve your resume".`;

const GEMMA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    overall_match_score: { type: Type.INTEGER },
    sub_scores: {
      type: Type.OBJECT,
      properties: {
        keywords: { type: Type.INTEGER },
        relevance: { type: Type.INTEGER },
        impact_metrics: { type: Type.INTEGER },
        structure: { type: Type.INTEGER },
        formatting: { type: Type.INTEGER },
      },
      required: ['keywords', 'relevance', 'impact_metrics', 'structure', 'formatting'],
    },
    confidence: { type: Type.INTEGER },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          level: { type: Type.STRING },
          matched_to_target: { type: Type.BOOLEAN },
          evidence: { type: Type.STRING },
        },
        required: ['name', 'category', 'level', 'matched_to_target', 'evidence'],
      },
    },
    missing_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          requirement_type: { type: Type.STRING },
          severity: { type: Type.STRING },
          how_to_close: { type: Type.STRING },
        },
        required: ['skill', 'requirement_type', 'severity', 'how_to_close'],
      },
    },
    bullet_rewrites: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          original: { type: Type.STRING },
          rewritten: { type: Type.STRING },
          word_count: { type: Type.INTEGER },
          placeholders: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          rationale: { type: Type.STRING },
        },
        required: [
          'section',
          'original',
          'rewritten',
          'word_count',
          'placeholders',
          'rationale',
        ],
      },
    },
    action_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.INTEGER },
          theme: { type: Type.STRING },
          focus_area: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                resource_name: { type: Type.STRING },
                resource_type: { type: Type.STRING },
                estimated_hours: { type: Type.NUMBER },
                impact: { type: Type.STRING },
              },
              required: [
                'title',
                'description',
                'resource_name',
                'resource_type',
                'estimated_hours',
                'impact',
              ],
            },
          },
        },
        required: ['week', 'theme', 'focus_area', 'tasks'],
      },
    },
  },
  required: [
    'summary',
    'overall_match_score',
    'sub_scores',
    'confidence',
    'warnings',
    'skills',
    'missing_skills',
    'bullet_rewrites',
    'action_plan',
  ],
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

async function callGemmaOnce(
  ai: GoogleGenAI,
  model: GemmaModelId,
  resumeText: string,
  targetRole: string
) {
  const userPrompt = `TARGET ROLE: ${targetRole.trim()}\n\nRESUME:\n${resumeText.trim()}\n\nUse category values: frontend, backend, database, devops, language, other. Use level values: beginner, intermediate, advanced. Use requirement_type: required, preferred. Use severity: high, medium, low. Use resource_type: docs, course, project, certification.`;

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: GEMMA_RESPONSE_SCHEMA,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error(`Empty response from ${model}`);
  }

  const jsonStr = extractJsonObject(rawText);
  const parsedJson = JSON.parse(jsonStr);
  return ResumeAnalysisZodSchema.parse(parsedJson);
}

const responseCache = new Map<string, AnalyzeApiResponse>();
const inflightRequests = new Map<string, Promise<AnalyzeApiResponse>>();

async function performAnalysisWithRetry(
  activeModel: GemmaModelId,
  resumeText: string,
  targetRole: string
): Promise<AnalyzeApiResponse> {
  const cacheKey = `${activeModel}::${targetRole.trim()}::${resumeText.trim()}`;
  const cached = responseCache.get(cacheKey);
  if (cached && !cached.fallback) {
    return cached;
  }

  const existingInflight = inflightRequests.get(cacheKey);
  if (existingInflight) {
    return existingInflight;
  }

  const promise = (async (): Promise<AnalyzeApiResponse> => {
    const startTime = Date.now();
    const errors: string[] = [];

    // Try Gemma 4 up to 2 times before falling back to analyzeResumeDeterministic
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY',
          httpOptions: {
            timeout: 55000,
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const zodValidated = await callGemmaOnce(
          ai,
          activeModel,
          resumeText,
          targetRole
        );

        const { result, grounding } = runGroundingValidator(
          zodValidated,
          resumeText
        );

        const responseTimeMs = Date.now() - startTime;
        const payload: AnalyzeApiResponse = {
          result,
          grounding,
          model: activeModel,
          fallback: false,
          responseTimeMs,
          attempts: attempt,
        };
        responseCache.set(cacheKey, payload);
        return payload;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Attempt ${attempt}: ${msg}`);
      }
    }

    // Both Gemma 4 attempts failed -> run offline deterministic fallback
    const fallbackRaw = analyzeResumeDeterministic(resumeText, targetRole);
    const { result, grounding } = runGroundingValidator(fallbackRaw, resumeText);
    const responseTimeMs = Date.now() - startTime;

    return {
      result,
      grounding,
      model: activeModel,
      fallback: true,
      responseTimeMs,
      attempts: 2,
      errorDetails: errors.join(' | '),
    };
  })();

  inflightRequests.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/analyze', async (req, res) => {
    const { resumeText, targetRole, model: requestedModel } = req.body || {};

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      res.status(400).json({ error: 'Please provide non-empty resume text to analyze.' });
      return;
    }
    if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
      res.status(400).json({ error: 'Please provide a target role or job description.' });
      return;
    }

    const activeModel: GemmaModelId = ALLOWED_GEMMA_MODELS.includes(requestedModel)
      ? requestedModel
      : 'gemma-4-26b-a4b-it';

    const responsePayload = await performAnalysisWithRetry(
      activeModel,
      resumeText,
      targetRole
    );
    res.json(responsePayload);
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResumeLens server running at http://localhost:${PORT}`);
    // Pre-warm default Rahul Sharma analysis with Gemma 4 on startup
    performAnalysisWithRetry(
      'gemma-4-26b-a4b-it',
      DEFAULT_RESUME_TEXT,
      DEFAULT_TARGET_ROLE
    ).catch(() => {});
  });
}

startServer();
