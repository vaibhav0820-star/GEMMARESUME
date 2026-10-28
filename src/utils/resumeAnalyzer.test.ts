import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RESUME_TEXT,
  DEFAULT_TARGET_ROLE,
  calculateOverallMatchScore,
  countWords,
  areSkillsSynonymous,
  applyBulletPlaceholders,
  verifySkillEvidenceInResume,
  verifyBulletPlaceholdersOnly,
  runGroundingValidator,
  ResumeAnalysisZodSchema,
  analyzeResumeDeterministic,
} from './resumeAnalyzer';

test('calculateOverallMatchScore follows exact 30/30/20/10/10 weighting', () => {
  const score = calculateOverallMatchScore({
    keywords: 55,
    relevance: 52,
    impact_metrics: 0,
    structure: 65,
    formatting: 58,
  });
  assert.equal(score, 44);
});

test('areSkillsSynonymous matches canonical synonyms', () => {
  assert.equal(areSkillsSynonymous('JS', 'JavaScript'), true);
  assert.equal(areSkillsSynonymous('K8s', 'Kubernetes'), true);
  assert.equal(areSkillsSynonymous('ML', 'Machine Learning'), true);
  assert.equal(areSkillsSynonymous('SQL', 'MySQL'), true);
  assert.equal(areSkillsSynonymous('React', 'Docker'), false);
});

test('runGroundingValidator overrides model overall_match_score, flags unverified skills, and validates bullet constraints', () => {
  const rawGemmaOutput = ResumeAnalysisZodSchema.parse({
    summary: 'Gemma 4 audit summary.',
    overall_match_score: 99, // Deliberately wrong score from model to test recomputation
    sub_scores: {
      keywords: 60,
      relevance: 50,
      impact_metrics: 20,
      structure: 70,
      formatting: 60,
    },
    confidence: 80,
    warnings: [],
    skills: [
      {
        name: 'React',
        category: 'frontend',
        level: 'intermediate',
        matched_to_target: true,
        evidence: 'Made a todo app using React',
      },
      {
        name: 'GraphQL',
        category: 'backend',
        level: 'advanced',
        matched_to_target: false,
        evidence: 'Built federated GraphQL schemas at Acme Corp',
      },
    ],
    missing_skills: [
      {
        skill: 'Docker',
        requirement_type: 'required',
        severity: 'high',
        how_to_close: 'Containerize the React todo app.',
      },
    ],
    bullet_rewrites: [
      {
        section: 'Projects',
        original: 'Made a todo app using React',
        rewritten:
          'Built a task manager app, improving task completion speed by [X%] for [N users], by engineering modular React state components.',
        word_count: 15,
        placeholders: ['[X%]', '[N users]'],
        rationale: 'Fill in real numbers.',
      },
      {
        section: 'Projects',
        original: 'Worked on a college website',
        rewritten:
          'Redesigned 15 college website pages, reducing load time by 42% for 5000 students, by optimizing HTML and CSS.',
        word_count: 18,
        placeholders: [],
        rationale: 'Contains fabricated numbers that were not in original.',
      },
    ],
    action_plan: [
      {
        week: 1,
        theme: 'Week 1 Theme',
        focus_area: 'Focus',
        tasks: [
          {
            title: 'Task 1',
            description: 'Desc',
            resource_name: 'Docs',
            resource_type: 'docs',
            estimated_hours: 2,
            impact: 'high',
          },
        ],
      },
    ],
  });

  const { result, grounding } = runGroundingValidator(
    rawGemmaOutput,
    DEFAULT_RESUME_TEXT
  );

  // 1. Recomputed score: 60*0.3 (18) + 50*0.3 (15) + 20*0.2 (4) + 70*0.1 (7) + 60*0.1 (6) = 50
  assert.equal(result.overall_match_score, 50);
  assert.equal(grounding.recomputed_overall_score, 50);
  assert.equal(grounding.model_raw_overall_score, 99);

  // 2. Skill fuzzy verification: React is verified, GraphQL is flagged unverified
  assert.equal(result.skills[0].verified_in_resume, true);
  assert.equal(result.skills[1].verified_in_resume, false);
  assert.equal(grounding.verified_skills_count, 1);
  assert.equal(grounding.total_skills_count, 2);
  assert.deepEqual(grounding.unverified_skill_names, ['GraphQL']);

  // 3. Bullet checks: Bullet 1 passes (<25 words and uses [X%] placeholders), Bullet 2 fails placeholder check due to fabricated 15, 42%, 5000
  assert.equal(result.bullet_rewrites[0].passes_word_limit, true);
  assert.equal(result.bullet_rewrites[0].passes_placeholder_check, true);
  assert.equal(result.bullet_rewrites[1].passes_word_limit, true);
  assert.equal(result.bullet_rewrites[1].passes_placeholder_check, false);
});

test('verifySkillEvidenceInResume and verifyBulletPlaceholdersOnly work accurately', () => {
  assert.equal(
    verifySkillEvidenceInResume(
      'MySQL',
      'Skills: HTML, CSS, JavaScript, React, MySQL',
      DEFAULT_RESUME_TEXT
    ),
    true
  );
  assert.equal(
    verifySkillEvidenceInResume(
      'Rust',
      'Wrote kernel drivers in Rust',
      DEFAULT_RESUME_TEXT
    ),
    false
  );
  assert.equal(
    verifyBulletPlaceholdersOnly(
      'Made a todo app using React',
      'Built a todo app, cutting load time by [X%], using React.'
    ),
    true
  );
  assert.equal(
    verifyBulletPlaceholdersOnly(
      'Made a todo app using React',
      'Built a todo app, cutting load time by 45%, using React.'
    ),
    false
  );
});

test('analyzeResumeDeterministic runs generically for offline fallback and applyBulletPlaceholders replaces tokens', () => {
  const fallback = analyzeResumeDeterministic(
    DEFAULT_RESUME_TEXT,
    DEFAULT_TARGET_ROLE
  );
  assert.equal(
    fallback.overall_match_score,
    calculateOverallMatchScore(fallback.sub_scores)
  );
  assert.ok(fallback.grounding_report);
  assert.ok(countWords(fallback.bullet_rewrites[0].rewritten) < 25);

  const filled = applyBulletPlaceholders(
    'Delivered app, improving speed by [X%] for [N users].',
    { '[X%]': '30%', '[N users]': '200 users' }
  );
  assert.equal(filled, 'Delivered app, improving speed by 30% for 200 users.');
});
