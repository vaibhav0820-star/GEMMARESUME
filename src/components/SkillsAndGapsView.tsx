import React, { useState } from 'react';
import { GroundedSkill, MissingSkillGap } from '../types/resume';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SkillsAndGapsViewProps {
  skills: GroundedSkill[];
  missingSkills: MissingSkillGap[];
}

export const SkillsAndGapsView: React.FC<SkillsAndGapsViewProps> = ({
  skills,
  missingSkills,
}) => {
  const [skillFilter, setSkillFilter] = useState<'all' | 'matched' | 'unverified'>('all');
  const [gapFilter, setGapFilter] = useState<'all' | 'required' | 'preferred'>('all');

  const filteredSkills = skills.filter((s) => {
    if (skillFilter === 'matched') return s.matched_to_target;
    if (skillFilter === 'unverified') return s.verified_in_resume === false;
    return true;
  });

  const filteredGaps = missingSkills.filter((g) => {
    if (gapFilter === 'required') return g.requirement_type === 'required';
    if (gapFilter === 'preferred') return g.requirement_type === 'preferred';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Grounded Skills Table (Rule 1 + Requirement 3 Fuzzy Verification) */}
      <section
        aria-label="Grounded Resume Skills"
        className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              02. Grounded Skills & Resume Evidence
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each skill is fuzzy-checked against the raw resume text by the grounding validator
            </p>
          </div>

          {/* Interactive segmented filter control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSkillFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                skillFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({skills.length})
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter('matched')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                skillFilter === 'matched'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Target Match ({skills.filter((s) => s.matched_to_target).length})
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter('unverified')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                skillFilter === 'unverified'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unverified ({skills.filter((s) => s.verified_in_resume === false).length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {filteredSkills.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No skills match the selected filter.
            </div>
          ) : (
            filteredSkills.map((skill, idx) => {
              const isVerified = skill.verified_in_resume !== false;
              return (
                <div key={idx} className="py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {skill.name}
                      </span>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Verified in resume</span>
                        </span>
                      ) : (
                        <span
                          data-testid="not-verified-skill-badge"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Not verified in resume</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      <span className="capitalize">{skill.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize font-medium text-slate-700">
                        Level: {skill.level}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          skill.matched_to_target
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {skill.matched_to_target ? 'JD Match' : 'Additional'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-700">Evidence: </span>
                    {skill.evidence}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Missing Skills & Gap Closure Plan (Rule 4) */}
      <section
        aria-label="Missing Skills and Gaps"
        className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              03. Skill Gaps & How to Close
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Required vs. preferred gaps with synonym normalization (SQL = MySQL, JS = JavaScript)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setGapFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                gapFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({missingSkills.length})
            </button>
            <button
              type="button"
              onClick={() => setGapFilter('required')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                gapFilter === 'required'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Required ({missingSkills.filter((g) => g.requirement_type === 'required').length})
            </button>
            <button
              type="button"
              onClick={() => setGapFilter('preferred')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                gapFilter === 'preferred'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preferred ({missingSkills.filter((g) => g.requirement_type === 'preferred').length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {filteredGaps.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No skill gaps found in this category.
            </div>
          ) : (
            filteredGaps.map((gap, idx) => {
              const severityColor =
                gap.severity === 'high'
                  ? 'text-red-700 font-semibold'
                  : gap.severity === 'medium'
                  ? 'text-amber-700 font-medium'
                  : 'text-slate-600';

              return (
                <div key={idx} className="py-3.5">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <span className="font-semibold text-sm text-slate-900">
                      {gap.skill}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      <span className="capitalize">{gap.requirement_type}</span>
                      <span aria-hidden="true">·</span>
                      <span className={severityColor}>
                        Severity: {gap.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-800">How to close: </span>
                    {gap.how_to_close}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
