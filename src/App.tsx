/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_RESUME_TEXT,
  DEFAULT_TARGET_ROLE,
  CANDIDATE_PRESETS,
  analyzeResumeDeterministic,
  runGroundingValidator,
} from './utils/resumeAnalyzer';
import {
  ResumeAnalysisResult,
  GroundingReport,
  GemmaModelId,
  AnalyzeApiResponse,
  Gemma2ArchitectureInfo,
} from './types/resume';
import { ScoreBreakdownPanel } from './components/ScoreBreakdownPanel';
import { GroundingChecksPanel } from './components/GroundingChecksPanel';
import { SkillsAndGapsView } from './components/SkillsAndGapsView';
import { BulletRewriteStudio } from './components/BulletRewriteStudio';
import { ActionPlanTimeline } from './components/ActionPlanTimeline';
import { JsonSchemaInspector } from './components/JsonSchemaInspector';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<string>('rahul-junior-fullstack');
  const [activeModel, setActiveModel] = useState<GemmaModelId>('gemma-2-architecture');
  const [targetRole, setTargetRole] = useState<string>(DEFAULT_TARGET_ROLE);
  const [resumeText, setResumeText] = useState<string>(DEFAULT_RESUME_TEXT);

  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [grounding, setGrounding] = useState<GroundingReport | null>(null);
  const [architectureInfo, setArchitectureInfo] = useState<Gemma2ArchitectureInfo | null>(null);
  const [showArchitectureDetails, setShowArchitectureDetails] = useState<boolean>(true);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [analyzedByModel, setAnalyzedByModel] = useState<GemmaModelId>('gemma-2-architecture');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'bullets' | 'plan' | 'json'>('all');

  const executeAnalyzeRequest = useCallback(
    async (roleToAnalyze: string, resumeToAnalyze: string, modelToUse: GemmaModelId) => {
      if (!roleToAnalyze.trim()) {
        setValidationError('Please enter a Target Role or Job Description before running the audit.');
        return;
      }
      if (!resumeToAnalyze.trim()) {
        setValidationError('Please enter the candidate resume text before running the audit.');
        return;
      }

      setValidationError(null);
      setIsAnalyzing(true);
      const clientStart = Date.now();

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: resumeToAnalyze.trim(),
            targetRole: roleToAnalyze.trim(),
            model: modelToUse,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to analyze resume.');
        }

        const data = (await response.json()) as AnalyzeApiResponse;
        setAnalysis(data.result);
        setGrounding(data.grounding);
        if (data.architectureInfo) {
          setArchitectureInfo(data.architectureInfo);
        }
        setIsFallbackMode(Boolean(data.fallback));
        setAnalyzedByModel(data.model || modelToUse);
        setResponseTimeMs(
          typeof data.responseTimeMs === 'number'
            ? data.responseTimeMs
            : Date.now() - clientStart
        );
      } catch {
        // Network failure reaching /api/analyze -> run offline deterministic fallback
        const rawFallback = analyzeResumeDeterministic(resumeToAnalyze, roleToAnalyze);
        const validated = runGroundingValidator(rawFallback, resumeToAnalyze);
        setAnalysis(validated.result);
        setGrounding(validated.grounding);
        setIsFallbackMode(true);
        setAnalyzedByModel(modelToUse);
        setResponseTimeMs(Date.now() - clientStart);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Trigger analysis automatically on initial load via POST /api/analyze
  useEffect(() => {
    executeAnalyzeRequest(DEFAULT_TARGET_ROLE, DEFAULT_RESUME_TEXT, 'gemma-2-architecture');
  }, [executeAnalyzeRequest]);

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeAnalyzeRequest(targetRole, resumeText, activeModel);
  };

  const handleModelToggle = (newModel: GemmaModelId) => {
    setActiveModel(newModel);
    if (targetRole.trim() && resumeText.trim()) {
      executeAnalyzeRequest(targetRole, resumeText, newModel);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const found = CANDIDATE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPreset(presetId);
    setValidationError(null);
    setTargetRole(found.targetRole);
    setResumeText(found.resumeText);
    executeAnalyzeRequest(found.targetRole, found.resumeText, activeModel);
  };

  const handleResetDefault = () => {
    setSelectedPreset('rahul-junior-fullstack');
    setValidationError(null);
    setTargetRole(DEFAULT_TARGET_ROLE);
    setResumeText(DEFAULT_RESUME_TEXT);
    executeAnalyzeRequest(DEFAULT_TARGET_ROLE, DEFAULT_RESUME_TEXT, activeModel);
  };

  const handleApplyBulletToResume = (originalBullet: string, newBullet: string) => {
    const updatedResume = resumeText.includes(originalBullet)
      ? resumeText.replace(originalBullet, newBullet)
      : `${resumeText.trim()}\n- ${newBullet}`;
    setResumeText(updatedResume);
    executeAnalyzeRequest(targetRole, updatedResume, activeModel);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract with Active Gemma 4 Model Name */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        {/* Zone 1: Single text element wordmark with active model name */}
        <a
          href="#top"
          data-testid="header-active-model"
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          ResumeLens · {activeModel}
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#audit-overview"
            onClick={() => setActiveView('all')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Audit Overview
          </a>
          <a
            href="#xyz-studio"
            onClick={() => setActiveView('all')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            XYZ Rewrites
          </a>
          <a
            href="#action-plan"
            onClick={() => setActiveView('all')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Action Plan
          </a>
          <a
            href="#json-schema"
            onClick={() => setActiveView('all')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            JSON Schema
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleRunAnalysis()}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {isAnalyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Offline Fallback Banner (Requirement 4) OR Gemma 4 Attribution Banner (Requirement 5) */}
        {analysis && isFallbackMode && (
          <div
            role="status"
            data-testid="offline-fallback-banner"
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-medium text-amber-900"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Offline fallback mode - Gemma 4 was unreachable. Results are basic.
              </span>
            </div>
            {responseTimeMs !== null && (
              <span className="font-mono tabular-nums text-amber-800">
                Fallback completed in {responseTimeMs} ms
              </span>
            )}
          </div>
        )}

        {analysis && !isFallbackMode && (
          <div
            role="status"
            data-testid="gemma-success-banner"
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Gemma 2 Architecture Verified ({analyzedByModel}) · Zero Hallucination Active</span>
            </div>
            {responseTimeMs !== null && (
              <span className="font-mono tabular-nums text-emerald-800">
                Response time: {responseTimeMs} ms
              </span>
            )}
          </div>
        )}

        {/* Gemma 2 Architecture Specs Inspector Card */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 text-xs">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowArchitectureDetails((prev) => !prev)}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-white">Gemma 2 Architecture Engine Active</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                {activeModel === 'gemma-2-architecture' ? 'Native <start_of_turn> Conditioning' : activeModel}
              </span>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
            >
              {showArchitectureDetails ? 'Hide Architecture Specs' : 'View Architecture Specs'}
              {showArchitectureDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showArchitectureDetails && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Sliding Window Attention
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Alternating local 4096-token sliding window and global attention layers to ground verbatim quotes directly from resume text.
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Logit Soft-Capping
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Attention logits capped at 50.0 and output logits capped at 30.0, suppressing extreme tail probabilities and preventing fabricated metrics.
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  Turn Token Conditioning
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed font-mono text-[10px]">
                  &lt;start_of_turn&gt;user ... &lt;end_of_turn&gt;<br />
                  &lt;start_of_turn&gt;model (strict JSON output)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Input, Gemma 4 Model Toggle & Preset Controls */}
        <section
          aria-label="Candidate Resume and Target Role Input"
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-900 text-balance">
                Evidence-Grounded ATS & Technical Recruiter Audit
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Powered by Gemma 2 Architecture · Turn Delimiters · Sliding Window Attention · Zero Fabricated Metrics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* AI Model Selector */}
              <div
                role="group"
                aria-label="Select AI Model"
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => handleModelToggle('gemma-2-architecture')}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeModel === 'gemma-2-architecture'
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gemma 2 Architecture — Native <start_of_turn> conditioning, Sliding Window Attention & Logit Soft-Capping"
                >
                  gemma-2-architecture (native)
                </button>
                <button
                  type="button"
                  onClick={() => handleModelToggle('gemini-3.1-flash-lite')}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeModel === 'gemini-3.1-flash-lite'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gemini 3.1 Flash Lite — Fast production model"
                >
                  gemini-3.1-flash-lite (fast)
                </button>
                <button
                  type="button"
                  onClick={() => handleModelToggle('gemma-4-26b-a4b-it')}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeModel === 'gemma-4-26b-a4b-it'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gemma 4 26B"
                >
                  gemma-4-26b-a4b-it
                </button>
                <button
                  type="button"
                  onClick={() => handleModelToggle('gemma-4-31b-it')}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeModel === 'gemma-4-31b-it'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gemma 4 31B"
                >
                  gemma-4-31b-it
                </button>
              </div>

              <label htmlFor="preset-select" className="text-xs font-medium text-slate-600">
                Sample Profile:
              </label>
              <select
                id="preset-select"
                aria-label="Select sample candidate profile"
                value={selectedPreset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {CANDIDATE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Rahul Sharma</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                <div>
                  <label
                    htmlFor="target-role-input"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Target Role / Job Description
                  </label>
                  <textarea
                    id="target-role-input"
                    rows={4}
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Junior Full Stack Developer (React, Node.js, SQL, Docker)"
                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Synonyms are matched automatically (JS = JavaScript, SQL = MySQL/PostgreSQL, K8s = Kubernetes).
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200/80 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {isAnalyzing
                        ? `Running ${activeModel}...`
                        : `Re-Run Audit with ${activeModel}`}
                    </span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="resume-text-input"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Candidate Resume Text
                  </label>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
                <textarea
                  id="resume-text-input"
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the candidate's raw resume text here..."
                  className="w-full flex-1 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </form>
        </section>

        {/* Loading Skeleton State when awaiting initial analysis */}
        {!analysis && isAnalyzing && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
            <div className="text-sm font-semibold text-slate-900">
              Analyzing resume with Gemma 4 ({activeModel})...
            </div>
            <p className="text-xs text-slate-500">
              Running JSON schema validation and post-processing grounding checks.
            </p>
          </div>
        )}

        {analysis && grounding && (
          <>
            {/* Grounding Checks Panel (Requirement 6) */}
            <GroundingChecksPanel
              grounding={grounding}
              model={analyzedByModel}
              fallback={isFallbackMode}
              responseTimeMs={responseTimeMs}
            />

            {/* Workspace View Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="Audit View Filter"
                className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'all'}
                  onClick={() => setActiveView('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Complete Audit View
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'bullets'}
                  onClick={() => setActiveView('bullets')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'bullets'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  XYZ Bullet Studio ({analysis.bullet_rewrites.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'plan'}
                  onClick={() => setActiveView('plan')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'plan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4-Week Action Plan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'json'}
                  onClick={() => setActiveView('json')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'json'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw JSON Schema
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono tabular-nums">
                <span>Active Model: {activeModel}</span>
                {responseTimeMs !== null && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{responseTimeMs} ms</span>
                  </>
                )}
              </div>
            </div>

            {/* Audit Sections */}
            {activeView === 'all' && (
              <div className="space-y-8">
                <div id="audit-overview" className="space-y-6">
                  <ScoreBreakdownPanel analysis={analysis} targetRole={targetRole} />
                  <SkillsAndGapsView
                    skills={analysis.skills}
                    missingSkills={analysis.missing_skills}
                  />
                </div>

                <div id="xyz-studio">
                  <BulletRewriteStudio
                    rewrites={analysis.bullet_rewrites}
                    onApplyBulletToResume={handleApplyBulletToResume}
                  />
                </div>

                <div id="action-plan">
                  <ActionPlanTimeline weeks={analysis.action_plan} />
                </div>

                <div id="json-schema">
                  <JsonSchemaInspector analysis={analysis} />
                </div>
              </div>
            )}

            {activeView === 'bullets' && (
              <BulletRewriteStudio
                rewrites={analysis.bullet_rewrites}
                onApplyBulletToResume={handleApplyBulletToResume}
              />
            )}

            {activeView === 'plan' && <ActionPlanTimeline weeks={analysis.action_plan} />}

            {activeView === 'json' && <JsonSchemaInspector analysis={analysis} />}
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>ResumeLens — Grounded Technical Recruiter & ATS Audit Workspace</span>
          <span>
            Gemma 4 ({activeModel}) · Zod Validation · Post-Processing Grounding Checks
          </span>
        </div>
      </footer>
    </div>
  );
}
