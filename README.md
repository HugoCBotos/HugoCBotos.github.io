# Hugo Cattarucci Botós — Personal Site

Personal academic website hosted on GitHub Pages.

## Structure

```
├── index.html              # Home page
├── articles.html           # Publications & preprints
├── exposition.html         # Expositions, talks & courses
├── notes.html              # Notes & Tutorials
├── analysis/               # Generated Analysis book
├── classicalgeometry.html  # Classical geometry course notes
├── oqehgeometria.html      # "O que é geometria?" course notes
├── css/
│   └── style.css           # Stylesheet
├── scripts/publish-analysis.sh
└── README.md
```

## Deploy

This site is hosted on [GitHub Pages](https://pages.github.com/) from the `master` branch.

The Analysis book is linked from `notes.html` and served from `analysis/`. Its editable original is `../Analysis/Sequences.md`; the build source is `../Analysis/site/`. After editing the Markdown, run `./scripts/publish-analysis.sh` to rebuild and update the local copy. Check the result, then run `./scripts/publish-analysis.sh --push` to commit and publish the book. Set `ANALYSIS_SITE_DIR` if the source is elsewhere.
