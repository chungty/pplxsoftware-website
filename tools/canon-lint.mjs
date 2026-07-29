#!/usr/bin/env node
/**
 * tools/canon-lint.mjs — canonical-claim guard for pplxsoftware.com
 *
 * Fails if a marketing page states a claim that violates TeamOps canon.
 * This is the BACKSTOP for direct merges to this repo: the growth-loop's `act`
 * stage runs the full teamops-atlassian/tools/canon-check.mjs, but human PRs
 * merged straight here (e.g. #26/#27) bypass that — which shipped a banned
 * "5 minutes" setup claim to production on 2026-07-28. This guard catches that
 * class of error before it can merge again.
 *
 * Seeded from teamops-atlassian/canonical/facts.yaml. When a fact changes there,
 * update the RULES below. Dependency-free on purpose (no npm install in CI).
 *
 * Usage:  node tools/canon-lint.mjs            # scan all HTML in repo
 *         node tools/canon-lint.mjs <files...> # scan specific files
 * Exit:   0 = clean · 1 = violations found
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// SCOPE: factual claims that are wrong regardless of context (wrong numbers,
// overclaims). Vague-phrasing/voice rules (e.g. "easy to set up") are deliberately
// NOT here — they false-positive on comparative copy about non-TeamOps approaches;
// leave those to the full teamops canon-check + human review.
const RULES = [
  // FACT-020 — canonical setup time is "60 seconds". The negative lookbehind
  // (?<!\d) lets legit durations ("15 minutes", "45 min") pass while catching
  // a bare "5 min/5 minutes" setup claim.
  { id: 'FACT-020', re: /(?<!\d)5\s*min(?:ute)?s?\b/i, msg: 'setup time: canonical is "60 seconds" (FACT-020); "5 min/minutes" is banned' },
  { id: 'FACT-020', re: /\binstant(?:ly)?\s+set[\s-]*up\b/i, msg: 'setup: "instant setup" overclaims (FACT-020); use "typical setup in 60 seconds"' },
  { id: 'FACT-020', re: /\binstantaneous\b/i, msg: 'setup: "instantaneous" banned (FACT-020)' },
  // FACT-001 — free tier is "free for teams up to 10"; unhedged "free" banned.
  { id: 'FACT-001', re: /\bfree forever\b/i, msg: 'free tier: "free forever" banned (FACT-001); use "free for teams up to 10"' },
  { id: 'FACT-001', re: /\bfree for life\b/i, msg: 'free tier: "free for life" banned (FACT-001)' },
  { id: 'FACT-001', re: /\balways free\b/i, msg: 'free tier: "always free" banned (FACT-001)' },
  // FACT-012 — bare "5/five templates" undercounts the real total of 7.
  { id: 'FACT-012', re: /\b(?:5|five) templates\b/i, msg: 'templates: bare "5/five templates" undercounts; total is "7 templates (5 onboarding + 2 offboarding)" (FACT-012)' },
  // FACT-002/004 — pricing rate + window claims.
  { id: 'FACT-002', re: /\bearly[\s-]adopter (?:pricing|rate)\b/i, msg: 'pricing: use "founding-member rate", not "early adopter" (FACT-002)' },
  { id: 'FACT-002', re: /\bearly[\s-]bird\b/i, msg: 'pricing: "early-bird" banned (FACT-002)' },
  { id: 'FACT-002', re: /\b(?:introductory price|promotional rate)\b/i, msg: 'pricing: banned promo phrasing (FACT-002)' },
  { id: 'FACT-004', re: /\b(?:locked|guaranteed|fixed) for 24 months\b/i, msg: 'pricing: implies a guarantee (FACT-004); use "intend to hold for 24 months"' },
  { id: 'FACT-004', re: /\blocked for life\b/i, msg: 'pricing: "locked for life" banned (FACT-004)' },
];

function collectHtml(dir, acc) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name.endsWith('.bak')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const args = process.argv.slice(2);
const files = args.length ? args : collectHtml('.', []);
let violations = 0;

for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      const m = line.match(rule.re);
      if (m) {
        violations++;
        console.error(`✗ ${f}:${i + 1} [${rule.id}] ${rule.msg}`);
        console.error(`    matched "${m[0].trim()}" in: ${line.trim().slice(0, 120)}`);
      }
    }
  });
}

if (violations) {
  console.error(`\n${violations} canon violation(s). Fix the copy, or update tools/canon-lint.mjs if a fact legitimately changed.`);
  process.exit(1);
}
console.log(`canon-lint: clean (${files.length} HTML files scanned)`);
