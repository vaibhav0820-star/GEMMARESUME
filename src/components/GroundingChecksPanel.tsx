import React from 'react';
import { GroundingReport, GemmaModelId } from '../types/resume';
import { ShieldCheck, AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react';

interface GroundingChecksPanelProps {
  grounding: GroundingReport;
  model: GemmaModelId;
  fallback: boolean;
  responseTimeMs: number | null;
}

export const GroundingChecksPanel: React.FC<GroundingChecksPanelProps> = ({
  grounding,
  model,
  fallback,
  responseTimeMs,
}) => {
  const allSkillsVerified =
    grounding.verified_skills_count === grounding.total_skills_count;
  const allBulletsUnderLimit =
    grounding.bullets_within_word_limit_count === grounding.total_bullets_count;
  const allPlaceholdersValid =
    grounding.bullets_passing_placeholder_check_count ===
    grounding.total_bullets_count;

  return (
    <section
      aria-label="Grounding checks"
      data-testid="grounding-checks-panel"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Grounding checks
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic post-processing validator applied to model output (fuzzy resume evidence match, &lt;25-word limit, bracketed placeholder check, and weighted score recomputation)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono tabular-nums">
          {!fallback ? (
            <span
              data-testid="gemma-analyzed-badge"
              className="text-emerald-700 font-medium"
            >
              Analyzed by Gemma 4 ({model})
            </span>
          ) : (
            <span className="text-amber-700 font-medium">
              Offline Fallback Validator ({model} unreachable)
            </span>
          )}
          {responseTimeMs !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span data-testid="response-time-display">
                {responseTimeMs} ms
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Check 1: Skills Verified in Resume */}
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-800">
                Skills Verified in Resume
              </span>
              {allSkillsVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </div>
            <div
              data-testid="grounding-skills-verified"
              className="text-2xl font-bold font-mono tabular-nums text-slate-900"
            >
              {grounding.verified_skills_count} / {grounding.total_skills_count}
              <span className="text-xs font-normal text-slate-500 ml-2">
                verified
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
            {grounding.unverified_skill_names.length === 0 ? (
              <span>All reported skills fuzzy-matched against resume text.</span>
            ) : (
              <span className="text-amber-800">
                Flagged as &ldquo;Not verified in resume&rdquo;:{' '}
                {grounding.unverified_skill_names.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Check 2: Bullet Word Limit & Placeholder Integrity */}
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-800">
                Bullets Passing Word Limit (&lt;25w)
              </span>
              {allBulletsUnderLimit && allPlaceholdersValid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </div>
            <div
              data-testid="grounding-bullets-verified"
              className="text-2xl font-bold font-mono tabular-nums text-slate-900"
            >
              {grounding.bullets_within_word_limit_count} /{' '}
              {grounding.total_bullets_count}
              <span className="text-xs font-normal text-slate-500 ml-2">
                under 25 words
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-mono tabular-nums">
            <span>
              Placeholder-only numbers:{' '}
              {grounding.bullets_passing_placeholder_check_count}/
              {grounding.total_bullets_count} passed
            </span>
          </div>
        </div>

        {/* Check 3: Recomputed Score from Sub-Scores */}
        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-800">
                Recomputed Overall Score
              </span>
              <Calculator className="w-4 h-4 text-slate-700 shrink-0" />
            </div>
            <div
              data-testid="grounding-recomputed-score"
              className="text-2xl font-bold font-mono tabular-nums text-slate-900"
            >
              {grounding.recomputed_overall_score}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-mono tabular-nums">
            <span>
              Model raw score: {grounding.model_raw_overall_score}/100 · Enforced
              30/30/20/10/10 average
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
