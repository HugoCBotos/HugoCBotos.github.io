# 📚 Python & Deep Learning — LLM Wiki

A **persistent, compounding knowledge base** about Python and deep learning, built and maintained by an LLM agent. Designed for a mathematician who is new to programming.

## Architecture

```
llm-wiki/
├── AGENTS.md        # Schema — tells the LLM how to maintain this wiki
├── README.md        # This file
├── index.html       # Content catalog (card grid of all pages)
├── log.html         # Append-only chronological record
├── nav.js           # Sidebar navigation (auto-highlights current page)
├── search.js        # Client-side search (Ctrl+K, hardcoded index)
├── style.css        # Design system with CSS custom properties
├── pages/           # Wiki content pages (LLM writes here)
├── raw/             # Immutable source documents
└── assets/          # Images, diagrams
```

## How to Use

1. **Browse** — open `index.html` in your browser. Use the sidebar or card grid to navigate.
2. **Search** — press `Ctrl+K` to search across all wiki pages.
3. **Add a source** — drop an article/paper/note into `raw/`, then tell the LLM to ingest it.
4. **Ask questions** — the LLM searches the wiki and synthesizes answers with citations.
5. **Lint** — periodically ask the LLM to health-check the wiki.

## Relationship to Other Wikis

This wiki sits **between** the beginner-friendly BNN tutorial and the advanced reference site:

- **You are here** → beginner-friendly, LLM-maintained, grows with your understanding
- **`ablation_bayes/`** → advanced BNN tutorial (static, human-written)
- **`ablation_bayes/sources/`** → detailed technical paper pages (linked from this wiki's BNN Sources page)

## Principles

- **Raw sources are immutable.** The LLM reads from `raw/` but never modifies it.
- **The wiki is LLM-maintained.** I create, update, cross-reference, and log everything.
- **Knowledge compounds.** Every new source enriches the existing pages.
- **No RAG.** The wiki is the persistent knowledge store — no re-deriving on every query.
