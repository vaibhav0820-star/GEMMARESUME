import { z } from 'zod';
import {
  ResumeAnalysisResult,
  SubScores,
  GroundedSkill,
  MissingSkillGap,
  BulletRewrite,
  GroundingReport,
  CandidatePreset,
} from '../types/resume';

export const DEFAULT_TARGET_ROLE =
  'Junior Full Stack Developer (React, Node.js, SQL, Docker)';

export const DEFAULT_RESUME_TEXT = `Rahul Sharma | Jabalpur
Skills: HTML, CSS, JavaScript, React, MySQL
Projects:
- Made a todo app using React
- Worked on a college website
Experience:
- Intern at a local company, helped with website work
Education: B.Tech CSE, 2025`;

export const CANDIDATE_PRESETS: CandidatePreset[] = [
  {
    id: 'rahul-junior-fullstack',
    label: '1. Rahul Sharma — Junior Full Stack (Default)',
    targetRole: DEFAULT_TARGET_ROLE,
    resumeText: DEFAULT_RESUME_TEXT,
  },
  {
    id: 'backend-node-candidate',
    label: '2. Backend API Developer Sample',
    targetRole: 'Backend Engineer (Node.js, PostgreSQL, Docker, Kubernetes, Redis)',
    resumeText: `Candidate Profile | Remote
Skills: JS, Node.js, Express, PostgreSQL, Git
Projects:
- Built REST API for inventory tracking using Node.js and PostgreSQL
- Created authentication middleware with JWT for 120 active students
Experience:
- Backend Intern at CloudWorks (Jan 2025 - May 2025), maintained Express endpoints and SQL queries
Education: B.E. Information Technology`,
  },
  {
    id: 'frontend-react-senior',
    label: '3. Alex Chen — Mid Frontend → Senior React Role',
    targetRole: 'Senior Frontend Engineer (React 19, TypeScript, Next.js, Tailwind CSS, Jest, GraphQL, CI/CD)',
    resumeText: `Alex Chen | San Francisco, CA
Skills: JavaScript, TypeScript, React, Next.js, Tailwind CSS, HTML, CSS, Git
Projects:
- E-Commerce Storefront: Built high-performance shopping cart in Next.js and Tailwind
- Realtime Analytics Dashboard: Created customizable charting interface using React and WebSockets
Experience:
- Frontend Engineer at Apex Labs (2023 - Present): Migrated codebase from JavaScript to TypeScript. Improved page load times by 28%. Collaborated with UX team to redesign design system components.
- Junior Web Developer at ByteWorks (2021 - 2023): Implemented responsive UI components in React for over 45,000 monthly active users.
Education: B.S. in Computer Science, University of California`,
  },
  {
    id: 'devops-sre-candidate',
    label: '4. Priya Patel — DevOps & Cloud Engineer',
    targetRole: 'DevOps / SRE Engineer (Kubernetes, AWS, Terraform, Docker, Python, CI/CD, Prometheus)',
    resumeText: `Priya Patel | Austin, TX
Skills: Linux, Docker, Python, Bash, AWS, Jenkins, Git, PostgreSQL
Projects:
- Automated Deployment Pipeline: Created multi-stage Jenkins pipeline deploying Docker containers to AWS EC2
- Infrastructure Monitoring Script: Wrote Python scripts to alert on server CPU and memory thresholds
Experience:
- Cloud Operations Associate at CloudScale (2024 - Present): Maintained 15 AWS microservices. Reduced deployment failure rate by 22%. Managed Docker images across staging and production clusters.
Education: B.S. in Information Systems, 2024`,
  },
  {
    id: 'sparse-garbled-candidate',
    label: '5. Incomplete / Sparse Resume (Tests Honesty & Warnings)',
    targetRole: 'Senior Full Stack Architect (Go, React, Distributed Systems, Microservices)',
    resumeText: `John Doe
Did some coding in React and Python.
Helped out on team tasks.
Looking for Senior Architect role.`,
  },
];

const lowerString = (val: unknown) =>
  typeof val === 'string' ? val.toLowerCase().trim() : val;

/**
 * Zod schema for validating Gemma 4 output before post-processing.
 */
export const ResumeAnalysisZodSchema = z.object({
  summary: z.string(),
  overall_match_score: z.number(),
  sub_scores: z.object({
    keywords: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
    impact_metrics: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    formatting: z.number().min(0).max(100),
  }),
  confidence: z.number().min(0).max(100),
  warnings: z.array(z.string()),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z
        .preprocess(
          lowerString,
          z.enum(['frontend', 'backend', 'database', 'devops', 'language', 'other'])
        )
        .catch('other'),
      level: z
        .preprocess(lowerString, z.enum(['beginner', 'intermediate', 'advanced']))
        .catch('beginner'),
      matched_to_target: z.boolean(),
      evidence: z.string(),
    })
  ),
  missing_skills: z.array(
    z.object({
      skill: z.string(),
      requirement_type: z
        .preprocess(lowerString, z.enum(['required', 'preferred']))
        .catch('required'),
      severity: z
        .preprocess(lowerString, z.enum(['high', 'medium', 'low']))
        .catch('medium'),
      how_to_close: z.string(),
    })
  ),
  bullet_rewrites: z.array(
    z.object({
      section: z.string(),
      original: z.string(),
      rewritten: z.string(),
      word_count: z.number().optional().default(0),
      placeholders: z.array(z.string()).optional().default([]),
      rationale: z.string(),
    })
  ),
  action_plan: z.array(
    z.object({
      week: z.number(),
      theme: z.string(),
      focus_area: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          resource_name: z.string(),
          resource_type: z
            .preprocess(
              lowerString,
              z.enum(['docs', 'course', 'project', 'certification'])
            )
            .catch('docs'),
          estimated_hours: z.number(),
          impact: z
            .preprocess(lowerString, z.enum(['high', 'medium']))
            .catch('high'),
        })
      ),
    })
  ),
});

const SYNONYM_GROUPS: Record<string, string[]> = {
  javascript: ['javascript', 'js', 'ecmascript', 'es6'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  'node.js': ['node.js', 'nodejs', 'node', 'express', 'express.js'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'rdbms'],
  docker: ['docker', 'containers', 'dockerfile', 'docker-compose'],
  kubernetes: ['kubernetes', 'k8s'],
  'machine learning': ['machine learning', 'ml'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'tailwind', 'tailwindcss'],
  git: ['git', 'github', 'gitlab'],
  redis: ['redis'],
  rest_api: ['rest', 'rest api', 'restful', 'api'],
};

/**
 * Computes the weighted overall match score per Rule 5:
 * keywords 30%, relevance 30%, impact_metrics 20%, structure 10%, formatting 10%.
 */
export function calculateOverallMatchScore(subScores: SubScores): number {
  const weighted =
    subScores.keywords * 0.3 +
    subScores.relevance * 0.3 +
    subScores.impact_metrics * 0.2 +
    subScores.structure * 0.1 +
    subScores.formatting * 0.1;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

/**
 * Counts words in a bullet string and verifies the < 25 words constraint (Rule 3).
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Checks whether two skill strings match directly or via canonical synonyms (Rule 4).
 */
export function areSkillsSynonymous(skillA: string, skillB: string): boolean {
  const normA = skillA.trim().toLowerCase();
  const normB = skillB.trim().toLowerCase();
  if (normA === normB) return true;

  for (const group of Object.values(SYNONYM_GROUPS)) {
    const hasA = group.includes(normA);
    const hasB = group.includes(normB);
    if (hasA && hasB) return true;
  }
  return false;
}

/**
 * Replaces placeholders like [X%] or [N users] in a bullet rewrite with user-supplied values.
 */
export function applyBulletPlaceholders(
  rewrittenTemplate: string,
  values: Record<string, string>
): string {
  let result = rewrittenTemplate;
  for (const [placeholder, replacement] of Object.entries(values)) {
    if (replacement && replacement.trim().length > 0) {
      result = result.split(placeholder).join(replacement.trim());
    }
  }
  return result;
}

/**
 * Fuzzy-matches a skill and its evidence quote/paraphrase against the candidate's raw resume text.
 */
export function verifySkillEvidenceInResume(
  skillName: string,
  evidenceText: string,
  resumeText: string
): boolean {
  const normResume = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9.+#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normResume) return false;

  // 1. Check if the skill name itself (or a canonical synonym) appears in the resume
  const cleanSkill = skillName
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase();
  if (cleanSkill.length >= 2 && normResume.includes(cleanSkill)) {
    return true;
  }

  for (const group of Object.values(SYNONYM_GROUPS)) {
    if (group.includes(cleanSkill)) {
      const hasSynonymInResume = group.some((syn) => {
        const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(resumeText);
      });
      if (hasSynonymInResume) return true;
    }
  }

  // 2. Check if quoted segments in evidence appear in the resume
  const quotes = Array.from(evidenceText.matchAll(/"([^"]{3,})"/g)).map((m) =>
    m[1].toLowerCase().replace(/[^a-z0-9.+#\s]/g, ' ').replace(/\s+/g, ' ').trim()
  );
  for (const q of quotes) {
    if (q.length >= 4 && normResume.includes(q)) {
      return true;
    }
  }

  // 3. Token overlap fuzzy check on evidence content words (ignoring boilerplate words)
  const stopWords = new Set([
    'explicitly',
    'listed',
    'in',
    'the',
    'and',
    'or',
    'implied',
    'by',
    'from',
    'resume',
    'section',
    'used',
    'with',
    'for',
    'work',
    'Mentioned',
    'mentioned',
    'skills',
    'projects',
    'experience',
  ]);
  const evidenceTokens = evidenceText
    .toLowerCase()
    .replace(/[^a-z0-9.+#\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  if (evidenceTokens.length === 0) return false;

  const matchedTokens = evidenceTokens.filter((token) => normResume.includes(token));
  return matchedTokens.length / evidenceTokens.length >= 0.5 && matchedTokens.length >= 1;
}

/**
 * Checks that a rewritten bullet only uses numbers as bracketed placeholders like [X%] or [N users],
 * unless a number was already explicitly present in the original bullet.
 */
export function verifyBulletPlaceholdersOnly(
  originalBullet: string,
  rewrittenBullet: string
): boolean {
  // Extract numbers that were originally present in the source bullet (e.g. "120" or "2025")
  const originalNumbers = new Set(originalBullet.match(/\d+(?:\.\d+)?%?/g) || []);

  // Strip out all bracketed placeholders like [X%], [N users], [10%], etc.
  const withoutBrackets = rewrittenBullet.replace(/\[[^\]]+\]/g, '');

  // Strip out technology names that contain version digits (e.g. HTML5, CSS3, ES6, Web3, K8s, S3, EC2)
  const withoutTechTokens = withoutBrackets.replace(
    /\b(?:html5|css3|es6|k8s|web3|s3|ec2|oauth2|http2|ipv4|ipv6|3d|2d)\b/gi,
    ''
  );

  // Check if any remaining standalone numbers were invented
  const remainingNumbers = withoutTechTokens.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  const hasFabricatedNumber = remainingNumbers.some((num) => !originalNumbers.has(num));

  if (hasFabricatedNumber) {
    return false;
  }

  // If the original had no numbers at all, the rewrite should include at least one bracketed placeholder
  if (originalNumbers.size === 0) {
    return /\[[^\]]+\]/.test(rewrittenBullet);
  }

  return true;
}

/**
 * Post-processing Grounding Validator (Requirement 3):
 * - Recomputes overall_match_score from sub_scores using calculateOverallMatchScore
 * - Fuzzy-verifies each skill's evidence against resumeText
 * - Checks each bullet rewrite is < 25 words via countWords and only uses numbers as placeholders
 */
export function runGroundingValidator(
  rawAnalysis: ResumeAnalysisResult,
  resumeText: string
): { result: ResumeAnalysisResult; grounding: GroundingReport } {
  const modelRawScore = rawAnalysis.overall_match_score;
  const recomputedScore = calculateOverallMatchScore(rawAnalysis.sub_scores);

  const verifiedSkills: GroundedSkill[] = rawAnalysis.skills.map((skill) => {
    const isVerified = verifySkillEvidenceInResume(
      skill.name,
      skill.evidence,
      resumeText
    );
    return {
      ...skill,
      verified_in_resume: isVerified,
    };
  });

  const validatedBullets: BulletRewrite[] = rawAnalysis.bullet_rewrites.map((b) => {
    const wc = countWords(b.rewritten);
    const passesWordLimit = wc < 25;
    const passesPlaceholder = verifyBulletPlaceholdersOnly(b.original, b.rewritten);
    const extractedPlaceholders = Array.from(
      new Set(b.rewritten.match(/\[[^\]]+\]/g) || b.placeholders || [])
    );
    return {
      ...b,
      word_count: wc,
      placeholders: extractedPlaceholders,
      passes_word_limit: passesWordLimit,
      passes_placeholder_check: passesPlaceholder,
    };
  });

  const verifiedSkillsCount = verifiedSkills.filter((s) => s.verified_in_resume).length;
  const unverifiedSkillNames = verifiedSkills
    .filter((s) => !s.verified_in_resume)
    .map((s) => s.name);
  const bulletsWithinLimit = validatedBullets.filter((b) => b.passes_word_limit).length;
  const bulletsPassingPlaceholders = validatedBullets.filter(
    (b) => b.passes_placeholder_check
  ).length;

  const grounding: GroundingReport = {
    verified_skills_count: verifiedSkillsCount,
    total_skills_count: verifiedSkills.length,
    unverified_skill_names: unverifiedSkillNames,
    bullets_within_word_limit_count: bulletsWithinLimit,
    bullets_passing_placeholder_check_count: bulletsPassingPlaceholders,
    total_bullets_count: validatedBullets.length,
    recomputed_overall_score: recomputedScore,
    model_raw_overall_score: modelRawScore,
  };

  const result: ResumeAnalysisResult = {
    ...rawAnalysis,
    overall_match_score: recomputedScore,
    skills: verifiedSkills,
    bullet_rewrites: validatedBullets,
    grounding_report: grounding,
  };

  return { result, grounding };
}

/**
 * Pure generic offline fallback analyzer.
 * Used ONLY if the Gemma 4 API call fails twice. Contains NO hardcoded candidate blocks.
 */
export function analyzeResumeDeterministic(
  resumeText: string,
  targetRole: string
): ResumeAnalysisResult {
  const trimmedResume = resumeText.trim();
  const trimmedRole = targetRole.trim();

  const lines = trimmedResume
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const bulletLines = lines.filter(
    (l) => l.startsWith('-') || l.startsWith('•') || l.startsWith('*')
  );
  const bulletsWithMetrics = bulletLines.filter((b) => /\d+%|\b\d+\b/.test(b));

  const targetTokens = trimmedRole
    .replace(/[(),/]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 1 &&
        ![
          'junior',
          'senior',
          'developer',
          'engineer',
          'full',
          'stack',
          'and',
          'with',
          'for',
          'the',
          'role',
        ].includes(w.toLowerCase())
    );

  const uniqueTargetSkills = Array.from(new Set(targetTokens));
  const foundSkills: GroundedSkill[] = [];
  const missingSkills: MissingSkillGap[] = [];

  const knownCatalog: Array<{
    name: string;
    category: GroundedSkill['category'];
    patterns: RegExp;
  }> = [
    { name: 'HTML', category: 'frontend', patterns: /\bhtml5?\b/i },
    { name: 'CSS', category: 'frontend', patterns: /\bcss3?\b|\btailwind\b/i },
    { name: 'JavaScript', category: 'language', patterns: /\bjavascript\b|\bjs\b/i },
    { name: 'TypeScript', category: 'language', patterns: /\btypescript\b|\bts\b/i },
    { name: 'React', category: 'frontend', patterns: /\breact(?:\.js|js)?\b/i },
    { name: 'Node.js', category: 'backend', patterns: /\bnode(?:\.js|js)?\b|\bexpress\b/i },
    { name: 'MySQL', category: 'database', patterns: /\bmysql\b/i },
    { name: 'PostgreSQL', category: 'database', patterns: /\bpostgres(?:ql)?\b/i },
    { name: 'SQL', category: 'database', patterns: /\bsql\b/i },
    { name: 'Docker', category: 'devops', patterns: /\bdocker\b/i },
    { name: 'Kubernetes', category: 'devops', patterns: /\bkubernetes\b|\bk8s\b/i },
    { name: 'Git', category: 'devops', patterns: /\bgit\b|\bgithub\b/i },
    { name: 'Redis', category: 'database', patterns: /\bredis\b/i },
  ];

  for (const item of knownCatalog) {
    const matchingLine = lines.find((line) => item.patterns.test(line));
    if (matchingLine) {
      const matchedToTarget = uniqueTargetSkills.some((t) =>
        areSkillsSynonymous(item.name, t)
      );
      const inBullets = bulletLines.some((b) => item.patterns.test(b));
      foundSkills.push({
        name: item.name,
        category: item.category,
        level: inBullets ? 'intermediate' : 'beginner',
        matched_to_target: matchedToTarget,
        evidence: `Explicitly present in: "${matchingLine.slice(0, 90)}"`,
      });
    }
  }

  for (const reqSkill of uniqueTargetSkills) {
    const isMatched = foundSkills.some((s) => areSkillsSynonymous(s.name, reqSkill));
    if (!isMatched) {
      missingSkills.push({
        skill: reqSkill,
        requirement_type: 'required',
        severity: 'high',
        how_to_close: `Build a feature or module using ${reqSkill} and add a quantified bullet showing how it integrates with your existing project stack.`,
      });
    }
  }

  const matchedCount = uniqueTargetSkills.filter((req) =>
    foundSkills.some((s) => areSkillsSynonymous(s.name, req))
  ).length;

  const keywordScore =
    uniqueTargetSkills.length > 0
      ? Math.round((matchedCount / uniqueTargetSkills.length) * 100)
      : 50;
  const impactScore =
    bulletLines.length > 0
      ? Math.round((bulletsWithMetrics.length / bulletLines.length) * 100)
      : 0;
  const structureScore = Math.min(
    100,
    45 + foundSkills.length * 6 + bulletLines.length * 8
  );
  const formattingScore = trimmedResume.length > 180 ? 75 : 58;
  const relevanceScore = Math.round((keywordScore + structureScore) / 2);

  const sub_scores: SubScores = {
    keywords: keywordScore,
    relevance: relevanceScore,
    impact_metrics: impactScore,
    structure: structureScore,
    formatting: formattingScore,
  };

  const overall_match_score = calculateOverallMatchScore(sub_scores);

  const bullet_rewrites: BulletRewrite[] = (
    bulletLines.length > 0 ? bulletLines : ['Worked on software projects']
  ).map((rawBullet) => {
    const clean = rawBullet.replace(/^[-•*]\s*/, '').trim();
    const hasNum = /\d+/.test(clean);
    const rewritten = hasNum
      ? `Engineered ${clean.toLowerCase()}, improving reliability by [X%], by applying modular components.`
      : `Delivered ${clean.toLowerCase()}, improving efficiency by [X%] for [N users], by building modular components.`;
    return {
      section: 'Projects & Experience',
      original: clean,
      rewritten,
      word_count: countWords(rewritten),
      placeholders: hasNum ? ['[X%]'] : ['[X%]', '[N users]'],
      rationale:
        'Rewritten using the XYZ formula under 25 words. Candidate should fill in the real values for the bracketed placeholders.',
    };
  });

  const warnings: string[] = [];
  if (trimmedResume.split(/\s+/).length < 80) {
    warnings.push(
      `Resume text is brief (${trimmedResume.split(/\s+/).length} words); dates or detailed outcomes are incomplete.`
    );
  }
  if (trimmedRole.split(/\s+/).length < 15) {
    warnings.push(
      'Target role description is concise; skill requirements are inferred from the listed role technologies.'
    );
  }

  const rawResult: ResumeAnalysisResult = {
    summary: `Basic offline analysis against "${trimmedRole}": matched ${matchedCount} of ${uniqueTargetSkills.length} target technologies and found ${bulletsWithMetrics.length}/${bulletLines.length} quantified bullets.`,
    overall_match_score,
    sub_scores,
    confidence: warnings.length > 0 ? 70 : 85,
    warnings,
    skills: foundSkills,
    missing_skills: missingSkills,
    bullet_rewrites,
    action_plan: [
      {
        week: 1,
        theme: 'Quantify Existing Bullets & Ground Skills',
        focus_area: 'XYZ Bullet Rewrites',
        tasks: [
          {
            title: 'Replace passive bullets with XYZ formula and real metrics',
            description:
              'Fill in every [X%] and [N users] placeholder with verified numbers from your projects.',
            resource_name: 'Google Tech Dev Guide — XYZ Formula Documentation',
            resource_type: 'docs',
            estimated_hours: 3,
            impact: 'high',
          },
        ],
      },
      {
        week: 2,
        theme: 'Close Primary Missing Requirement',
        focus_area: missingSkills[0]?.skill || 'Core Stack Requirement',
        tasks: [
          {
            title: `Complete core hands-on module for ${missingSkills[0]?.skill || 'Backend APIs'}`,
            description:
              'Learn the core concepts and build a minimal working endpoint or module.',
            resource_name: 'The Odin Project / Official Documentation',
            resource_type: 'course',
            estimated_hours: 6,
            impact: 'high',
          },
        ],
      },
      {
        week: 3,
        theme: 'Full-Stack Project Integration',
        focus_area: missingSkills[1]?.skill || 'Containerization & Integration',
        tasks: [
          {
            title: `Integrate ${missingSkills[1]?.skill || 'Docker'} into your existing project`,
            description:
              'Extend your existing resume project with the missing stack component and document it.',
            resource_name: 'Official Get Started Project Guide',
            resource_type: 'project',
            estimated_hours: 6,
            impact: 'high',
          },
        ],
      },
      {
        week: 4,
        theme: 'Verification & Final ATS Review',
        focus_area: 'Portfolio Proof',
        tasks: [
          {
            title: 'Publish repository with architecture notes and benchmarks',
            description:
              'Measure real performance metrics and add them to your updated resume bullets.',
            resource_name: 'freeCodeCamp / GitHub Documentation',
            resource_type: 'certification',
            estimated_hours: 4,
            impact: 'medium',
          },
        ],
      },
    ],
  };

  return runGroundingValidator(rawResult, resumeText).result;
}
