export type GemmaModelId =
  | 'gemma-2-architecture'
  | 'gemma-4-26b-a4b-it'
  | 'gemma-4-31b-it'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-3.8-flash';

export interface Gemma2ArchitectureInfo {
  attentionMechanism: string;
  logitSoftCapping: string;
  slidingWindowSize: number;
  turnTokens: {
    userTurnStart: string;
    turnEnd: string;
    modelTurnStart: string;
  };
  groundingGuarantees: string[];
}

export interface SubScores {
  keywords: number;
  relevance: number;
  impact_metrics: number;
  structure: number;
  formatting: number;
}

export interface GroundedSkill {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'language' | 'other';
  level: 'beginner' | 'intermediate' | 'advanced';
  matched_to_target: boolean;
  evidence: string;
  verified_in_resume?: boolean;
}

export interface MissingSkillGap {
  skill: string;
  requirement_type: 'required' | 'preferred';
  severity: 'high' | 'medium' | 'low';
  how_to_close: string;
}

export interface BulletRewrite {
  section: string;
  original: string;
  rewritten: string;
  word_count: number;
  placeholders: string[];
  rationale: string;
  passes_word_limit?: boolean;
  passes_placeholder_check?: boolean;
}

export interface ActionPlanTask {
  title: string;
  description: string;
  resource_name: string;
  resource_type: 'docs' | 'course' | 'project' | 'certification';
  estimated_hours: number;
  impact: 'high' | 'medium';
}

export interface ActionPlanWeek {
  week: number;
  theme: string;
  focus_area: string;
  tasks: ActionPlanTask[];
}

export interface GroundingReport {
  verified_skills_count: number;
  total_skills_count: number;
  unverified_skill_names: string[];
  bullets_within_word_limit_count: number;
  bullets_passing_placeholder_check_count: number;
  total_bullets_count: number;
  recomputed_overall_score: number;
  model_raw_overall_score: number;
}

export interface ResumeAnalysisResult {
  summary: string;
  overall_match_score: number;
  sub_scores: SubScores;
  confidence: number;
  warnings: string[];
  skills: GroundedSkill[];
  missing_skills: MissingSkillGap[];
  bullet_rewrites: BulletRewrite[];
  action_plan: ActionPlanWeek[];
  grounding_report?: GroundingReport;
}

export interface AnalyzeApiResponse {
  result: ResumeAnalysisResult;
  grounding: GroundingReport;
  model: GemmaModelId;
  fallback: boolean;
  responseTimeMs: number;
  attempts: number;
  errorDetails?: string;
  architectureInfo?: Gemma2ArchitectureInfo;
}

export interface CandidatePreset {
  id: string;
  label: string;
  targetRole: string;
  resumeText: string;
}
