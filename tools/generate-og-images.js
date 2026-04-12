/**
 * Generate Open Graph images using Playwright.
 *
 * Usage (run from the website project root):
 *   export PATH="/Users/thomaschung/.nvm/versions/node/v20.20.0/bin:$PATH"
 *   node tools/generate-og-images.js
 *
 * Requires @playwright/test from the atlassian project (resolved via absolute path).
 * Outputs 7 images to assets/og/ at 1200x630 (standard OG dimensions).
 */

const { chromium } = require('/Users/thomaschung/Projects/personal/atlassian/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'og');

// ── Design tokens (matching listing images) ────────────────────
const T = {
  bgDark: '#0D2137',
  accent: '#0052CC',
  accentLight: '#4C9AFF',
  white: '#FFFFFF',
  gray200: '#DFE1E6',
  gray400: '#97A0AF',
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// ── Logo SVG (blue square with T) ──────────────────────────────
const logoSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle"
        font-family="${T.fontStack}" font-size="16" font-weight="800" fill="${T.white}">T</text>
</svg>`;

// ── Shared CSS for all OG cards ────────────────────────────────
const baseCss = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${T.fontStack};
    background: ${T.bgDark};
    color: ${T.white};
    width: 1200px;
    height: 630px;
    overflow: hidden;
  }
  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    height: 100%;
    padding: 80px 100px;
    position: relative;
  }
  .logo-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 36px;
  }
  .logo-icon {
    width: 52px;
    height: 52px;
    background: ${T.accent};
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-icon svg { width: 32px; height: 32px; }
  .logo-text {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  h1 {
    font-size: 56px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
    max-width: 900px;
  }
  .subtitle {
    font-size: 24px;
    line-height: 1.5;
    color: ${T.gray200};
    max-width: 750px;
  }
  .divider {
    width: 64px;
    height: 4px;
    background: ${T.accent};
    border-radius: 2px;
    margin-bottom: 24px;
  }
  .domain {
    position: absolute;
    bottom: 40px;
    right: 100px;
    font-size: 18px;
    color: ${T.gray400};
    letter-spacing: 0.3px;
  }
  /* Accent line at top */
  .accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, ${T.accent}, ${T.accentLight});
  }
`;

// ── HTML generator for each card ───────────────────────────────
function ogCardHtml(title, subtitle) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>${baseCss}</style></head><body>
<div class="card">
  <div class="accent-bar"></div>
  <div class="logo-row">
    <div class="logo-icon">${logoSvg}</div>
    <div class="logo-text">TeamOps</div>
  </div>
  <h1>${title}</h1>
  <div class="divider"></div>
  <div class="subtitle">${subtitle}</div>
  <div class="domain">pplxsoftware.com</div>
</div>
</body></html>`;
}

// ── Image definitions ──────────────────────────────────────────
const OG_IMAGES = [
  {
    name: 'og-default.png',
    title: 'TeamOps | HR for Jira',
    subtitle: 'Leave management, onboarding &amp; offboarding for Jira',
  },
  {
    name: 'og-blog.png',
    title: 'TeamOps Blog',
    subtitle: 'Practical guides for HR teams using Jira',
  },
  {
    name: 'og-templates.png',
    title: 'Free HR Templates for&nbsp;Jira',
    subtitle: '7 templates, 140 tasks, ready to use',
  },
  {
    name: 'og-comparison.png',
    title: 'TeamOps vs Alternatives',
    subtitle: 'Leave management comparison for Jira teams',
  },
  {
    name: 'og-roadmap.png',
    title: 'TeamOps Roadmap',
    subtitle: 'What we&rsquo;re building next',
  },
  {
    name: 'og-whats-new.png',
    title: 'What&rsquo;s New in TeamOps',
    subtitle: 'Latest updates and releases',
  },
  {
    name: 'og-security.png',
    title: 'Security &amp; Privacy',
    subtitle: 'Forge-native. Your data stays in Atlassian.',
  },
];

// ── Main ───────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const img of OG_IMAGES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(ogCardHtml(img.title, img.subtitle), { waitUntil: 'load' });

    const outputPath = path.join(ASSETS_DIR, img.name);
    await page.screenshot({ path: outputPath, type: 'png' });

    const stats = fs.statSync(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.info(`Generated ${img.name} (1200x630, ${sizeKb} KB)`);

    await page.close();
  }

  await browser.close();
  console.info(`\nAll ${OG_IMAGES.length} OG images saved to ${ASSETS_DIR}`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
