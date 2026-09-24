export interface SEOSiteConfig {
  id: string;
  siteName: string;
  domain?: string;
  sitemapUrl?: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface SEOIssue {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface SEOPage {
  id: string;
  url: string;
  path: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  imagesWithoutAlt: number;
  imagesTotal: number;
  seoScore: number;
  issues: SEOIssue[];
  lcp: number;
  fcp: number;
  cls: number;
  ttfb: number;
  visitCount: number;
  lastVisitedAt: string;
}

export interface SEOIssueGroup {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedPages: number;
  urls: string[];
  fixGuideUrl: string;
}

export interface SEODashboard {
  overallScore: number;
  totalPages: number;
  criticalIssues: number;
  warnings: number;
  infoIssues: number;
  avgLcp: number;
  avgCls: number;
  topIssues: SEOIssueGroup[];
  worstPages: SEOPage[];
}

export interface SEOPagesResponse {
  pages: SEOPage[];
  total: number;
  limit: number;
  offset: number;
}

export interface SEOVitalsPageEntry {
  url: string;
  path: string;
  lcp: number;
  fcp: number;
  cls: number;
  ttfb: number;
  score: number;
}

export interface SEOWebVitals {
  avgLcp: number;
  avgFcp: number;
  avgCls: number;
  avgTtfb: number;
  pages: SEOVitalsPageEntry[];
}

// ── Automate SEO — Bot & Auto-Fix ────────────────────────────────────────────

export interface SEOBotConfig {
  isEnabled: boolean;
  geoTargets: string[];
  customKeywords: string[];
  schedule: 'daily' | 'weekly' | 'off';
  autoFixEnabled: boolean;
  lastRunAt?: string;
}

export interface SEOTrendNewsItem {
  title: string;
  source: string;
  url: string;
}

export interface SEOTrendItem {
  title: string;
  traffic: string;
  url: string;
  news: SEOTrendNewsItem[];
}

export interface SEORecommendation {
  type: 'keyword_add' | 'meta_update' | 'create_content';
  priority: 'high' | 'medium' | 'low';
  pagePath?: string;
  title: string;
  description: string;
  keyword: string;
  codeSnippet?: string;
}

export interface SEOAutoFixPage {
  url: string;
  path: string;
  suggested?: string;
}

export interface SEOAutoFixItem {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedCount: number;
  isScriptFixable: boolean;
  codeSnippet: string;
  pages: SEOAutoFixPage[];
}

export interface SEOAutoFixResponse {
  fixes: SEOAutoFixItem[];
  autoFixEnabled: boolean;
}

export interface SEOTrendsResponse {
  geo: string;
  items: SEOTrendItem[];
}

export interface SEOBotRunResponse {
  trends: SEOTrendItem[];
  recommendations: SEORecommendation[];
  runAt: string;
}

// ── SEO Blog Post (GitHub App) ────────────────────────────────────────────────

export interface SEOBlogConfig {
  isConnected: boolean;
  repoOwner: string;
  repoName: string;
  branch: string;
  blogFolder: string;
  fileFormat: 'md' | 'mdx';
  postsPerRun: number;
  isEnabled: boolean;
  targetCountries: string[];
  customKeywords: string[];
  schedule: 'daily' | 'weekly' | 'off';
  sitemapPath: string;
  feedPath: string;
  customCSS: string;
}

export interface SEOBlogDetectResult {
  sitemapPath: string;
  feedPath: string;
}

export interface SEOBlogPost {
  id: string;
  title: string;
  keyword: string;
  filePath: string;
  commitUrl: string;
  wordCount: number;
  createdAt: string;
}

export interface SEOBlogRunResponse {
  posts: SEOBlogPost[];
  runAt: string;
}

export interface SEOBlogRepo {
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
}

// ── SEO Keyword Research & Ranking Agent ─────────────────────────────────────

export interface SEOKeywordResult {
  keyword: string;
  searchVolume: '<1K' | '1K-10K' | '10K-100K' | '100K-1M' | '>1M';
  difficulty: number; // 0-100
  competition: 'low' | 'medium' | 'high';
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  trend: 'rising' | 'stable' | 'declining';
  related: string[];
  popularity?: number;  // 0-100, autocomplete frequency/position
  opportunity?: number; // 0-100, volume vs difficulty
}

export interface SEOKeywordResearchResponse {
  seed: string;
  geo: string;
  keywords: SEOKeywordResult[];
  questions: string[];
  totalIdeas: number;
  context: string;
  source: 'autocomplete' | 'ai';
}

export interface SEOKeywordInsightSubscription {
  enabled: boolean;
  seeds: string[];
  geo: string;
  sendHourUtc: number;
  email: string;
  lastSentAt?: string;
  lastError?: string;
}

export interface SEOKeywordAgentRec {
  type: 'on_page' | 'content' | 'technical' | 'backlink';
  priority: 'high' | 'medium' | 'low';
  pagePath?: string;
  title: string;
  description: string;
  actionItems: string[];
}

export interface SEOKeywordAgentResult {
  recommendations: SEOKeywordAgentRec[];
  contentBrief: string;
  rankingScore: number;
  runAt: string;
}

export interface SEOTargetedKeyword {
  id: string;
  keyword: string;
  searchVolume: string;
  difficulty: number;
  competition: string;
  intent: string;
  trend: string;
  related: string[];
  agentResult?: SEOKeywordAgentResult;
  autoPublish: boolean;
  currentPosition: number;
  lastScanAt?: string;
  lastDailyRun?: string;
  createdAt: string;
}

// ── SERP Scan & Competitor Analysis ──────────────────────────────────────────

export interface SEOSERPEntry {
  rank: number;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  isUserSite: boolean;
}

export interface SEOCompetitorBlogPost {
  url: string;
  title: string;
}

export interface SEOCompetitorAnalysis {
  rank: number;
  domain: string;
  url: string;
  title: string;
  metaDesc: string;
  headings: string[];
  blogPosts: SEOCompetitorBlogPost[];
  wordCount: number;
  topKeywords: string[];
}

export interface SEOSuggestedBlogTitle {
  title: string;
  keyword: string;
  angle: string;
}

export interface SEOKeywordStrategy {
  approach: string;
  contentGaps: string[];
  suggestedBlogTitles: SEOSuggestedBlogTitle[];
  quickWins: string[];
  estimatedTimeToRank: string;
}

export interface SEOKeywordScanResponse {
  keywordId: string;
  keyword: string;
  userPosition: number;
  competitors: SEOCompetitorAnalysis[];
  strategy: SEOKeywordStrategy;
  scannedAt: string;
}

export interface SEOKeywordDailyRunResponse {
  id: string;
  keyword: string;
  date: string;
  blogGenerated: boolean;
  blogTitle: string;
  commitUrl: string;
  error?: string;
  runAt: string;
}

// ── Rank to Top ──────────────────────────────────────────────────────────────

export interface RankKeyword {
  keyword: string;
  source: 'ai' | 'manual';
  reason?: string;
  enabled: boolean;
  runs: number;
}

export interface RankConfig {
  githubConnected: boolean;
  repoOwner: string;
  repoName: string;
  branch: string;
  deliveryMode: 'pull_request' | 'direct';
  siteUrl: string;
  businessBrief: string;
  nicheSummary: string;
  keywords: RankKeyword[];
  enabled: boolean;
  runHourUtc: number;
  workspaceBytes: number;
  workspaceLimit: number;
  workspaceCommit?: string;
  workspaceSyncedAt?: string;
  credits: number;
  lastError?: string;
}

export type RankRunStatus = 'queued' | 'preparing' | 'auditing' | 'optimizing' | 'delivering' | 'completed' | 'failed';

export interface RankFileDiff {
  path: string;
  url?: string;
  diff: string;
  truncated?: boolean;
}

export interface RankRun {
  id: string;
  keyword: string;
  trigger: 'manual' | 'schedule';
  mode?: 'repo' | 'live';
  diffs?: RankFileDiff[];
  status: RankRunStatus;
  stage?: string;
  repo: string;
  baseBranch: string;
  runBranch?: string;
  summary?: string;
  improvements?: string[];
  nextSteps?: string[];
  files?: { path: string; additions: number; deletions: number; sourceUrl?: string; liveUrl?: string }[];
  reverted?: string[];
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
  prState?: 'open' | 'merged' | 'closed';
  prMergeable?: boolean;
  mergedAt?: string;
  log?: string;
  error?: string;
  creditRefunded: boolean;
  createdAt: string;
  finishedAt?: string;
}

export interface RankCreditPack {
  plan: string;
  name: string;
  credits: number;
  amount: number;
}

export interface RankCredits {
  credits: number;
  packs: RankCreditPack[];
  ledger: { delta: number; reason: string; note?: string; createdAt: string }[];
}
