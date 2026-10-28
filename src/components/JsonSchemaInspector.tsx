import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../types/resume';
import { Check, Copy, Download } from 'lucide-react';

interface JsonSchemaInspectorProps {
  analysis: ResumeAnalysisResult;
}

export const JsonSchemaInspector: React.FC<JsonSchemaInspectorProps> = ({
  analysis,
}) => {
  const [copied, setCopied] = useState(false);
  const formattedJson = JSON.stringify(analysis, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumelens-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Strict JSON Schema Output"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            06. Strict JSON Schema Output
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Validated JSON payload containing summary, overall_match_score, sub_scores, confidence, warnings, skills, missing_skills, bullet_rewrites, and action_plan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      <pre
        data-testid="json-schema-output"
        className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-[540px] leading-relaxed"
      >
        {formattedJson}
      </pre>
    </section>
  );
};
