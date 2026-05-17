---
description: Schema and workflows for maintaining the Python & DL LLM Wiki.
applyTo: "notes/llm-wiki/**"
---

# LLM Wiki — Agent Schema

This file defines how an LLM agent (Claude Code, Copilot, Codex, etc.) maintains the wiki. Follow these conventions and workflows precisely.

## Directory Structure

```
llm-wiki/
├── AGENTS.md           # This schema file
├── README.md           # Human overview
├── index.html          # Content catalog — update on every ingest
├── log.html            # Append-only log — append on every action
├── nav.js              # Sidebar navigation + collapsible subsections
├── toc.js              # Auto-generates "On This Page" TOC from <h2>s
├── search.js           # Search index — add entries on every ingest
├── style.css           # Design system with CSS custom properties
└── pages/              # ALL wiki pages flat in one directory (23 total)
    ├── bnn-for-beginners.html   # BNN overview
    ├── neural-network.html      # 1. Neural Networks
    ├── bayesian-inference.html  # 2. Bayesian Inference
    ├── ...                      # (10 concept pages + 12 paper pages + 2 index pages)
    ├── blundell-bayes-by-backprop.html
    └── ...
```

## Page Template

Every wiki page in `pages/` must follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title — LLM Wiki</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="wrapper">
    <nav class="sidebar">
        <!-- Copy sidebar from index.html, update active class -->
        <h2>📚 Python &amp; DL Wiki</h2>
        <div class="tagline">LLM-maintained knowledge base</div>
        <ul class="sidebar-nav">
            <li><a href="../index.html">🏠 Wiki Index</a></li>
            <li><a href="../log.html">📋 Activity Log</a></li>
            <li class="section-label">Deep Learning</li>
            <li><a href="bnn-for-beginners.html">📖 BNN Overview</a></li>
            <li><a href="neural-network.html">1. Neural Networks</a></li>
            <li><a href="bayesian-inference.html">2. Bayesian Inference</a></li>
            <li><a href="probability-distributions.html">3. Probability Distributions</a></li>
            <li><a href="uncertainty.html">4. Types of Uncertainty</a></li>
            <li><a href="kl-divergence.html">5. KL Divergence</a></li>
            <li><a href="evidence-lower-bound.html">6. The ELBO</a></li>
            <li><a href="variational-inference.html">7. Variational Inference</a></li>
            <li><a href="mc-dropout.html">8. MC Dropout</a></li>
            <li><a href="laplace-approximation.html">9. Laplace Approximation</a></li>
            <li><a href="mcmc-hmc.html">10. MCMC &amp; HMC</a></li>
            <li class="section-label">References</li>
            <li><a href="bnn-sources.html">📖 BNP Paper Index</a></li>
            <li><a href="blundell-bayes-by-backprop.html">Bayes by Backprop</a></li>
            <li><a href="hernandez-probabilistic-backprop.html">Probabilistic Backprop</a></li>
            <li><a href="louizos-normalizing-flows.html">Normalizing Flows</a></li>
            <li><a href="gal-dropout-bayesian.html">Dropout as Bayesian</a></li>
            <li><a href="daxberger-laplace-redux.html">Laplace Redux</a></li>
            <li><a href="izmailov-bnn-posteriors.html">BNN Posteriors</a></li>
            <li><a href="betancourt-hmc.html">HMC Intro</a></li>
            <li><a href="jospin-hands-on-bnn.html">Hands-on BNN</a></li>
            <li><a href="goan-fookes-survey.html">Survey (Goan &amp; Fookes)</a></li>
            <li><a href="wang-yeung-survey.html">Survey (Wang &amp; Yeung)</a></li>
            <li><a href="magris-bayesian-survey.html">Bayesian Survey (Magris)</a></li>
        </ul>
    </nav>

    <main class="main-content">
        <a href="../index.html" class="back-link">← Back to wiki index</a>
        <div class="breadcrumb"><a href="../index.html">Home</a> / Topic Area</div>

        <h1>Page Title</h1>
        <!-- ... content ... -->
    </main>
</div>
<script src="../nav.js"></script>
<script src="../toc.js"></script>
</body>
</html>
```

### Available CSS Components

| Component | Class | When to use |
|-----------|-------|-------------|
| Key insight | `.key-insight` | Opening "in one sentence" summary |
| Equation box | `.equation-box` | Math formulas, derivations |
| Info box (blue) | `.info-box` | Tips, clarifications, context |
| Warning box (orange) | `.warning-box` | Caveats, common pitfalls |
| Success box (green) | `.success-box` | Key results, recommendations |
| Story/narrative | `.story` | Analogies, intuitive explanations |
| Concept box | `.concept-box` | Grouped key ideas, "big picture" |
| Card grid | `.card-grid` > `.card` | Index pages, page listings |
| Pipeline | `.pipeline` > `.pipeline-step` | Sequential method comparisons |
| Code block | `<pre><code>` | Code snippets (use span classes for syntax) |
| Table | `<table>` | Comparisons, reference data |
| Bottom nav | `.bottom-nav` | Previous/Next page navigation |

### Code Syntax Highlighting

Inside `<pre><code>`, wrap spans with these classes:
- `.code-comment` — comments
- `.code-keyword` — `import`, `def`, `class`, `return`, `if`, `for`, etc.
- `.code-string` — string literals
- `.code-function` — function names
- `.code-class` — class names
- `.code-number` — numeric literals
- `.code-operator` — operators

### Difficulty/Tag Badges

- `.diff-beginner` / `.diff-intermediate` / `.diff-advanced` on cards
- `.tag-variational` / `.tag-foundational` / `.tag-flow` / `.tag-dropout` / `.tag-laplace` / `.tag-hmc` / `.tag-survey` / `.tag-tutorial` on source cards

## Collapsible Sidebar Sections

The sidebar has one top-level section **BNN** with all pages inside it.
**References** is a nested subsection within BNN (below the concept pages).

Structure:
```html
<li class="sidebar-section">
    <div class="section-header">... BNN ...</div>
    <ul class="section-pages">
        <li><a>BNN Overview</a></li>
        <li><a>1. Neural Networks</a></li>
        ... (10 concept pages)
        <li class="sidebar-subsection">
            <div class="subsection-header">... References ...</div>
            <ul class="subsection-pages">
                <li><a>BNP Paper Index</a></li>
                ... (11 paper pages)
            </ul>
        </li>
    </ul>
</li>
```

`nav.js` auto-expands the section (and subsection) containing the currently active page.
The ▶ toggle rotates 90° when expanded.

When adding a new page:
1. Add a `<li><a href="...">Page Name</a></li>` inside the appropriate `<ul class="section-pages">` or `<ul class="subsection-pages">`
2. Update the sidebar in all directory depths (root, pages/, sources/, sources/pages/)
3. Top-level toggles use `.section-toggle`; nested toggles use `.subsection-toggle`

## "On This Page" Auto-TOC

Each page automatically gets a floating "On This Page" table of contents generated by `toc.js`.
It extracts all `<h2>` elements from `.main-content`, assigns slugified `id` attributes to them,
and inserts a TOC box after the `<h1>`. No manual maintenance needed.

If you want a section to be linkable from search or external pages, you can explicitly set an `id`
on the `<h2>` element — `toc.js` will use it instead of generating one.

## Cross-Referencing Rules

1. Every page must link back to `index.html` via the back-link and breadcrumb.
2. When a page mentions a concept that has its own page, link to it.
3. When a page references an external source that has a page in this wiki, link to it.
4. When a source contradicts an existing claim, flag it explicitly in a warning-box.

## Search Index Updates

On every ingest, add entries to the `searchIndex` array in `search.js`. Each entry is:

```javascript
["keyword","Short description (max 80 chars)",prefix+"page-filename.html"]
```

Guidelines:
- Add 5-15 search entries per new page
- Include synonyms and common misspellings
- Entries are case-insensitive; use lowercase keywords
- Keep descriptions under 80 characters
- The prefix variable handles directory depth automatically

## log.html Updates

On every action (ingest, query, lint), append a new entry at the top of the log entries section:

```html
<div class="log-entry">
    <div class="log-date">## [YYYY-MM-DD] action | Title</div>
    <div class="log-title">Short action title</div>
    <div class="log-description">What was done, which pages were affected, key decisions.</div>
</div>
```

The `## [YYYY-MM-DD]` prefix lets you grep entries from the terminal:
```bash
grep "^## \[" log.html | tail -5
```

## index.html Updates

On every ingest:
1. Add a new `.card` to the `.card-grid` section
2. Update the stats table (page count, last updated)
3. Update the "Recent Activity" list

## Workflows

### Workflow 1: Ingest

When the user adds a source to `raw/` and asks to ingest it:

1. **Read** the source document from `raw/`
2. **Discuss** key takeaways with the user — what to emphasize, what to de-emphasize
3. **Write** a summary page in `pages/` following the page template:
   - Add a `<li>` for the new page in the appropriate `<ul class="section-pages">` in the sidebar
   - Update the sidebar in all directory depths (root, pages/, sources/, sources/pages/)
   - Include `toc.js` script tag alongside `nav.js`
4. **Update** relevant existing pages with cross-references to the new page
5. **Update** `index.html` — add card, update stats, update recent activity
6. **Update** `search.js` — add 5-15 search index entries
7. **Append** entry to `log.html`

For batch ingest (multiple sources at once), process them one at a time but batch the log entry.

### Workflow 2: Query

When the user asks a question:

1. **Read** `index.html` to find relevant pages
2. **Read** the relevant pages in `pages/`
3. **Synthesize** an answer with citations to wiki pages (use page titles as links)
4. If the answer is valuable enough to keep:
   a. Write it as a new page in `pages/`
   b. Update `index.html`, `search.js`, and `log.html`

### Workflow 3: Lint

When the user asks for a health check:

1. **Cross-reference check** — for each page, verify all linked pages still exist
2. **Orphan check** — find pages with no inbound links from other wiki pages
3. **Contradiction check** — flag contradictory claims between pages
4. **Gap check** — identify concepts mentioned across pages that lack their own page
5. **Staleness check** — flag claims that newer sources may have superseded
6. **Report** findings in a structured way and suggest next actions

## Naming Conventions

- **Page files**: `kebab-case.html` (e.g., `bnn-for-beginners.html`)
- **Source files**: keep original filenames, add date prefix if useful
- **Asset files**: `kebab-case.ext` in `assets/`
- **Anchor IDs**: `kebab-case-id` (e.g., `id="variational-inference"`)
- **Section IDs in page-sections JSON**: must match the `id` on the corresponding `<h2>` element.
  Use the slugified version of the heading text (lowercase, hyphens, no special chars).
  E.g., heading "3. The Forward Pass" → id `3-the-forward-pass`

## Citation Format

When citing sources within a wiki page:
- **Papers**: `Author et al. (Year) — [Title](link-to-source-page)`
- **Articles**: `[Source Title](link-to-source-page)`
- **Cross-references**: `[Concept Name](link-to-concept-page)`

## Style Guide

- Write for a mathematician who is new to Python/programming
- Lead with the mathematical intuition, then show the code
- Use `.key-insight` for the one-sentence takeaway at the top of every page
- Use `.story` for analogies and intuitive explanations
- Use `.equation-box` for all mathematical expressions
- Use `.info-box` for tips and clarifications
- Use `.warning-box` for common mistakes and limitations
- Keep paragraphs short (3-5 sentences max)
- Every page should answer: "Why should I care about this?"
