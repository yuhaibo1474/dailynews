#!/usr/bin/env node
/**
 * ui/sync.mjs — 把 Figma 插件导出的 token / shell 应用到 Jekyll 站点。
 *
 * 只改「UI 外壳」相关的 CSS 变量与静态文案；绝不触碰动态内容（_posts、{{ content }}）。
 *
 * 用法：
 *   node ui/sync.mjs --css horizon-tokens.css [--shell shell.json]
 *
 *   --css   插件「2. Export tokens」下载的 horizon-tokens.css，合并进 Horizon/docs/assets/css/horizon.css
 *   --shell 插件「3. Export shell」下载的 shell.json，写回 _config.yml 与 _includes/digest-footer.html
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // dailynews 仓库根目录
const HORIZON_CSS = join(ROOT, 'Horizon', 'docs', 'assets', 'css', 'horizon.css');
const CONFIG_YML = join(ROOT, 'Horizon', 'docs', '_config.yml');
const FOOTER_HTML = join(ROOT, 'Horizon', 'docs', '_includes', 'digest-footer.html');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

// ---------------- token 解析 ----------------
function extractVars(text) {
  const vars = {};
  for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function parseTokens(text) {
  const parts = text.split(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  return { light: extractVars(parts[0] || ''), dark: parts[1] ? extractVars(parts[1]) : {} };
}

function replaceVarsInSection(section, vars) {
  let out = section;
  for (const [name, value] of Object.entries(vars)) {
    const re = new RegExp('(' + name.replace(/-/g, '\\-') + '\\s*:\\s*)[^;]+;');
    if (re.test(out)) {
      out = out.replace(re, (m, p1) => p1 + value + ';'); // 保留行尾注释
    } else {
      const m = out.match(/(:root\s*\{\s*\n)/); // 新增变量：插到 :root { 之后
      out = m ? out.replace(m[1], m[1] + '  ' + name + ': ' + value + ';\n') : out + '\n  ' + name + ': ' + value + ';';
    }
  }
  return out;
}

function mergeTokens(horizonCss, tokens) {
  const idx = horizonCss.indexOf('@media (prefers-color-scheme: dark)');
  const lightSection = idx >= 0 ? horizonCss.slice(0, idx) : horizonCss;
  const darkSection = idx >= 0 ? horizonCss.slice(idx) : '';
  return replaceVarsInSection(lightSection, tokens.light) + replaceVarsInSection(darkSection, tokens.dark);
}

// ---------------- shell 文案应用 ----------------
function applyShell(shell) {
  const done = [];
  if (shell && shell.site) {
    let cfg = readFileSync(CONFIG_YML, 'utf8');
    if (shell.site.title) cfg = cfg.replace(/^title:.*$/m, 'title: ' + shell.site.title);
    if (shell.site.tagline) cfg = cfg.replace(/^description:.*$/m, 'description: ' + shell.site.tagline);
    writeFileSync(CONFIG_YML, cfg);
    done.push('_config.yml → title / description');
  }
  if (shell && shell.footer && shell.footer.credit) {
    let html = readFileSync(FOOTER_HTML, 'utf8');
    const href = (html.match(/<a\s+href="([^"]+)"[^>]*>Horizon<\/a>/) || [])[1] || 'https://github.com/Thysrael/Horizon';
    const linked = String(shell.footer.credit).replace('Horizon', '<a href="' + href + '">Horizon</a>');
    html = html.replace(/<span class="site-footer-credits">[\s\S]*?<\/span>/, '<span class="site-footer-credits">' + linked + '</span>');
    writeFileSync(FOOTER_HTML, html);
    done.push('digest-footer.html → 页脚 credit');
  }
  return done;
}

// ---------------- 主流程 ----------------
const cssPath = arg('--css');
const shellPath = arg('--shell');

if (!cssPath && !shellPath) {
  console.log('用法: node ui/sync.mjs --css horizon-tokens.css [--shell shell.json]');
  process.exit(1);
}

if (cssPath) {
  const tokens = parseTokens(readFileSync(cssPath, 'utf8'));
  const horizon = readFileSync(HORIZON_CSS, 'utf8');
  const merged = mergeTokens(horizon, tokens);
  writeFileSync(HORIZON_CSS, merged);
  console.log(`horizon.css → ${Object.keys(tokens.light).length} 个亮色变量、${Object.keys(tokens.dark).length} 个暗色变量已合并`);
}

if (shellPath) {
  const shell = JSON.parse(readFileSync(shellPath, 'utf8'));
  for (const line of applyShell(shell)) console.log(line);
}
