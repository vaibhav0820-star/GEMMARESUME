import React, { useState } from 'react';
import { BulletRewrite } from '../types/resume';
import {
  applyBulletPlaceholders,
  countWords,
  verifyBulletPlaceholdersOnly,
} from '../utils/resumeAnalyzer';
import { Check, Copy, Sparkles } from 'lucide-react';

interface BulletRewriteStudioProps {
  rewrites: BulletRewrite[];
  onApplyBulletToResume: (originalBullet: string, newBullet: string) => void;
}

export const BulletRewriteStudio: React.FC<BulletRewriteStudioProps> = ({
  rewrites,
  onApplyBulletToResume,
}) => {
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<number, Record<string, string>>
  >({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const handlePlaceholderChange = (
    bulletIndex: number,
    placeholder: string,
    value: string
  ) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [bulletIndex]: {
        ...(prev[bulletIndex] || {}),
        [placeholder]: value,
      },
    }));
  };

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleApply = (index: number, original: string, renderedText: string) => {
    onApplyBulletToResume(original, renderedText);
    setAppliedIndex(index);
    setTimeout(() => setAppliedIndex(null), 2000);
  };

  return (
    <section
      aria-label="XYZ Bullet Rewrite Studio"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            04. XYZ Formula Bullet Rewrites (Zero-Fabrication Studio)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formula: &ldquo;Accomplished [X], as measured by [Y], by doing [Z].&rdquo; Grounding validator enforces &lt;25 words and checks that numbers only appear as bracketed placeholders.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          {rewrites.length} bullets audited · Max 25 words per bullet
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {rewrites.map((item, idx) => {
          const currentMap = placeholderValues[idx] || {};
          const liveRendered = applyBulletPlaceholders(item.rewritten, currentMap);
          const liveWordCount = countWords(liveRendered);
          const isUnderLimit = liveWordCount < 25;
          const passesPlaceholderCheck =
            item.passes_placeholder_check ??
            verifyBulletPlaceholdersOnly(item.original, item.rewritten);

          return (
            <div key={idx} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    Section: {item.section}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Bullet #{idx + 1}</span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span
                    className={
                      isUnderLimit
                        ? 'text-emerald-700 font-medium'
                        : 'text-red-700 font-semibold'
                    }
                  >
                    {liveWordCount} / 25 words ({isUnderLimit ? 'Pass' : 'Over limit'})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      passesPlaceholderCheck
                        ? 'text-emerald-700 font-medium'
                        : 'text-red-700 font-semibold'
                    }
                  >
                    {passesPlaceholderCheck
                      ? 'Placeholders verified'
                      : 'Unbracketed number detected'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
                {/* Original Weak Bullet */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Original Resume Bullet
                  </div>
                  <p className="text-sm text-slate-700 font-mono">
                    &ldquo;{item.original}&rdquo;
                  </p>
                </div>

                {/* Rewritten XYZ Bullet + Interactive Metric Fill-in */}
                <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50/40 border border-slate-200 rounded-lg p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-900">
                        XYZ Formula Rewrite
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(idx, liveRendered)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Bullet</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApply(idx, item.original, liveRendered)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {appliedIndex === idx
                              ? 'Updated in Resume'
                              : 'Replace in Resume'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <p
                      data-testid={`rewritten-bullet-${idx}`}
                      className="text-sm font-medium text-slate-900 leading-relaxed mb-3"
                    >
                      {liveRendered}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      <span className="font-semibold text-slate-800">Recruiter Rationale: </span>
                      {item.rationale}
                    </p>
                  </div>

                  {/* Interactive Placeholder Fill-In Inputs */}
                  {item.placeholders.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-medium text-slate-700">
                        Fill in real values:
                      </span>
                      {item.placeholders.map((ph) => (
                        <label
                          key={ph}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600"
                        >
                          <span className="font-mono font-semibold text-slate-800">
                            {ph}:
                          </span>
                          <input
                            type="text"
                            aria-label={`Fill real value for ${ph} in bullet ${idx + 1}`}
                            placeholder={ph === '[X%]' ? 'e.g. 35%' : 'e.g. 12'}
                            value={currentMap[ph] || ''}
                            onChange={(e) =>
                              handlePlaceholderChange(idx, ph, e.target.value)
                            }
                            className="w-24 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
