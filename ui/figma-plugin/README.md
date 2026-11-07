# Horizon Design System — Figma plugin

Builds the Horizon digest site's design system natively in Figma: Variables, Text Styles,
Components / Component Sets and sample pages (desktop/mobile x light/dark).

Pipeline: Figma (this plugin) -> export tokens -> repo -> Jekyll build -> visual parity check.
This directory covers the Figma side and the token export only; the Jekyll site is unchanged.

## Files

| Path | Purpose |
|---|---|
| `tokens/horizon.tokens.json` | Source of truth, Tokens Studio format (sets: `primitives`, `semantic/light`, `semantic/dark`, `component`; themes Light/Dark) |
| `src/code.js` | Plugin source |
| `build.mjs` | `node build.mjs` embeds the tokens and writes `code.js` (the file Figma loads) |
| `manifest.json`, `ui.html` | Plugin manifest and the export dialog |

Values come from `Horizon/docs/assets/css/horizon.css` and `digest.css`.
After editing the tokens or `src/code.js`, run `node build.mjs` and commit `code.js`.

## Use

1. Figma desktop: Plugins > Development > Import plugin from manifest... > `figma-plugin/manifest.json`.
2. In a new, empty design file run **1. Build design system**. It stops if the collections already exist.
3. Optional: import `tokens/horizon.tokens.json` into Tokens Studio to edit tokens there; re-sync to Variables.
4. Run **2. Export tokens (CSS + JSON)** to download `horizon-tokens.css` (`:root` + dark media query) and `figma-variables.json`.

## What gets created

- Collections: `Primitives` (hidden from publishing), `Semantic` (Light/Dark modes, aliases to primitives),
  `Component` (aliases to semantic/primitives). Each variable has a WEB code syntax, e.g. `var(--hz-bg)`,
  so the existing `--hz-*` CSS names are preserved.
- Text styles `Horizon/*` with font size bound to variables (Noto Sans SC, falling back to Inter).
- Components, with fills, strokes, padding, gaps and radii bound to variables:

| Figma component | Variants / properties | Jekyll CSS |
|---|---|---|
| Tab | State = default, hover, active; Label | `.digest-tab` |
| Score Badge | Tier = high, good, mid, low; Score | `.score-badge[data-tier]` |
| Tag | Label | `.tag-line code` |
| Lang Toggle | Position = first, last; Active; Label | `.lang-toggle button` |
| Callout | Text | `.main-content > blockquote` |
| Source Line | Source | `.source-line` |
| News Item | Index, Title, Badge (instance swap) | TOC row |
| Details | Open; Summary | `.main-content details` |
| Page Header | Breakpoint = desktop, mobile; Title, Tagline | `.page-header` |
| Footer | Credit | `.site-footer` |

Pages are composed only of instances; modes are set per page frame via explicit variable modes.

## Known approximations

- Spacing uses a token scale (tab padding 8/20 px vs. CSS 7.2/20.8 px; `em`-based paddings rounded).
- Weight 800 headings map to the `Bold` face; the 120deg header gradient is approximated for a fixed aspect ratio.
- Cayman's responsive title/tagline sizes are modelled only for the 375 px and 1280 px breakpoints.
