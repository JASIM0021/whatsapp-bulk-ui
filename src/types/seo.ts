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
