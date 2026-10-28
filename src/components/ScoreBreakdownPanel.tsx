import React from 'react';
import { ResumeAnalysisResult } from '../types/resume';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScoreBreakdownPanelProps {
  analysis: ResumeAnalysisResult;
  targetRole: string;
}

export const ScoreBreakdownPanel: React.FC<ScoreBreakdownPanelProps> = ({
  analysis,
  targetRole,
}) => {
  const { overall_match_score, sub_scores, confidence, warnings, summary } = analysis;

  const dimensions = [
    {
      key: 'keywords',
      label: 'Keywords Match',
      score: sub_scores.keywords,
      weight: '30%',
      contribution: (sub_scores.keywords * 0.3).toFixed(1),
      detail: 'Direct & synonym match against target stack',
    },
    {
      key: 'relevance',
      label: 'Role Relevance',
      score: sub_scores.relevance,
      weight: '30%',
      contribution: (sub_scores.relevance * 0.3).toFixed(1),
      detail: 'Seniority & full-stack domain alignment',
    },
    {
      key: 'impact_metrics',
      label: 'Impact Metrics',
      score: sub_scores.impact_metrics,
      weight: '20%',
      contribution: (sub_scores.impact_metrics * 0.2).toFixed(1),
      detail: 'Share of bullets with measurable outcomes',
    },
    {
      key: 'structure',
      label: 'Structure',
      score: sub_scores.structure,
      weight: '10%',
      contribution: (sub_scores.structure * 0.1).toFixed(1),
      detail: 'Standard ATS headings & logical order',
    },
    {
      key: 'formatting',
      label: 'Formatting',
      score: sub_scores.formatting,
      weight: '10%',
      contribution: (sub_scores.formatting * 0.1).toFixed(1),
      detail: 'Single-column readability & date consistency',
    },
  ];

  const getScoreStateLabel = (score: number) => {
    if (score >= 75) return { text: 'Strong Match', colorClass: 'text-emerald-700' };
    if (score >= 45) return { text: 'Partial Match — Gaps Identified', colorClass: 'text-amber-700' };
    return { text: 'Action Required — High-Severity Gaps', colorClass: 'text-red-700' };
  };

  const overallState = getScoreStateLabel(overall_match_score);

  return (
    <section aria-label="ATS Scoring and Summary" className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Overall Match Score & Executive Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>Target Role Audit</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Confidence {confidence}%</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 text-balance">
              {targetRole}
            </h2>

            <div className="flex items-baseline gap-4 mb-3">
              <div
                data-testid="overall-match-score"
                className="text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900"
              >
                {overall_match_score}
                <span className="text-xl font-normal text-slate-400">/100</span>
              </div>
              <div className={`text-xs font-medium ${overallState.colorClass}`}>
                {overallState.text}
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {summary}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Fairness Guard Active</span>
            <span aria-hidden="true">·</span>
            <span>Demographics, names & graduation years excluded from scoring</span>
          </div>
        </div>

        {/* Right Column: Weighted Scoring Table */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                01. Weighted ATS Dimension Breakdown
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Formula: 30% KW + 30% Rel + 20% Imp + 10% Str + 10% Fmt
              </span>
            </div>

            <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
              {dimensions.map((dim) => (
                <div
                  key={dim.key}
                  className="py-2.5 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{dim.label}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        Weight {dim.weight}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{dim.detail}</p>
                  </div>

                  <div className="w-32 hidden sm:block">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 70
                            ? 'bg-emerald-600'
                            : dim.score >= 45
                            ? 'bg-amber-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.max(4, dim.score)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0 w-28">
                    <span className="font-semibold text-slate-900">{dim.score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                    <span className="text-xs text-slate-500 ml-1.5">
                      (+{dim.contribution})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Honesty Warnings (Rule 8) */}
          {warnings.length > 0 && (
            <div className="mt-4 bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Audit Completeness & Honesty Notes (Confidence {confidence}%)</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900/90">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {idx + 1}. {warn}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Resume and target role contain complete metadata for high-confidence scoring.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
