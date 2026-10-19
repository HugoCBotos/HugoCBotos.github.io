#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
analysis_site="${ANALYSIS_SITE_DIR:-$repo_dir/../Analysis/site}"

if [[ "${1:-}" != "" && "${1:-}" != "--push" ]]; then
  echo "Usage: $0 [--push]" >&2
  exit 2
fi
if [[ ! -f "$repo_dir/notes.html" || ! -d "$repo_dir/.git" || ! -x "$analysis_site/build.sh" ]]; then
  echo "Analysis source or GitHub Pages checkout not found." >&2
  exit 1
fi

"$analysis_site/build.sh"
python3 - "$analysis_site/_book" "$repo_dir/analysis" <<'PY'
from pathlib import Path
import shutil
import sys

source, target = (Path(value).resolve() for value in sys.argv[1:])
staged = target.with_name('.analysis-next')
previous = target.with_name('.analysis-previous')
if staged.exists() or previous.exists():
    raise SystemExit('An earlier Analysis update needs attention before retrying.')
shutil.copytree(source, staged)
if target.exists():
    target.rename(previous)
try:
    staged.rename(target)
except Exception:
    if previous.exists():
        previous.rename(target)
    raise
if previous.exists():
    shutil.rmtree(previous)
print(f'Updated {target}')
PY

if [[ "${1:-}" == "--push" ]]; then
  git -C "$repo_dir" add -- analysis
  if ! git -C "$repo_dir" diff --cached --quiet -- analysis; then
    git -C "$repo_dir" commit -m "Update Analysis book" -- analysis
    git -C "$repo_dir" push origin master
  else
    echo "Analysis has no changes to publish."
  fi
else
  echo "Review the site, then run this script with --push to publish Analysis."
fi
