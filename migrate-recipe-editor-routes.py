#!/usr/bin/env python3
"""Move Softmeal recipe editor routes and update internal links.

Run from the repository root:
    python3 /path/to/migrate-recipe-editor-routes.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path.cwd()
OLD_EDIT = ROOT / "app/sua-cong-thuc/[slug]/page.tsx"
NEW_EDIT = ROOT / "app/cong-thuc/[slug]/sua/page.tsx"
OLD_ADD = ROOT / "app/them/page.tsx"
NEW_ADD = ROOT / "app/cong-thuc/them/page.tsx"
CONFIG = ROOT / "next.config.ts"

required = [ROOT / "app/cong-thuc/[slug]/page.tsx", CONFIG]
missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
if missing:
    sys.exit("Run this script from the Softmeal repository root. Missing: " + ", ".join(missing))

if OLD_EDIT.exists() and NEW_EDIT.exists():
    sys.exit(f"Both old and new edit routes exist: {OLD_EDIT.relative_to(ROOT)} and {NEW_EDIT.relative_to(ROOT)}")
if OLD_ADD.exists() and NEW_ADD.exists():
    sys.exit(f"Both old and new create routes exist: {OLD_ADD.relative_to(ROOT)} and {NEW_ADD.relative_to(ROOT)}")
if not OLD_EDIT.exists() and not NEW_EDIT.exists():
    sys.exit("Could not find the edit route at either its old or new path.")
if not OLD_ADD.exists() and not NEW_ADD.exists():
    sys.exit("Could not find the create route at either its old or new path.")

# Move each route without changing its page implementation.
NEW_EDIT.parent.mkdir(parents=True, exist_ok=True)
if OLD_EDIT.exists():
    OLD_EDIT.replace(NEW_EDIT)

NEW_ADD.parent.mkdir(parents=True, exist_ok=True)
if OLD_ADD.exists():
    OLD_ADD.replace(NEW_ADD)

# Update route references in application pages, components, and shared libraries.
scan_roots = [ROOT / "app", ROOT / "components", ROOT / "lib"]
text_suffixes = {".ts", ".tsx", ".js", ".jsx", ".md"}
changed_files: list[str] = []
for scan_root in scan_roots:
    if not scan_root.exists():
        continue
    for path in scan_root.rglob("*"):
        if not path.is_file() or path.suffix not in text_suffixes:
            continue
        content = path.read_text(encoding="utf-8")
        updated = content
        # Links/configuration values referencing the create page.
        updated = updated.replace('"/them"', '"/cong-thuc/them"')
        updated = updated.replace("'/them'", "'/cong-thuc/them'")
        updated = updated.replace("`/them`", "`/cong-thuc/them`")
        # Keep dynamic slug expressions intact while nesting the edit URL.
        updated = re.sub(
            r"/sua-cong-thuc/\$\{([^}]+)\}",
            lambda match: f"/cong-thuc/${{{match.group(1)}}}/sua",
            updated,
        )
        if updated != content:
            path.write_text(updated, encoding="utf-8")
            changed_files.append(str(path.relative_to(ROOT)))

# Redirect legacy URLs so bookmarks and previously shared links still work.
config = CONFIG.read_text(encoding="utf-8")
if 'source: "/sua-cong-thuc/:slug"' not in config or 'source: "/them"' not in config:
    marker = "  async headers() {"
    if marker not in config:
        sys.exit("Could not find the async headers() block in next.config.ts; route files were moved but redirects were not added.")
    redirects = '''  async redirects() {
    return [
      {
        source: "/them",
        destination: "/cong-thuc/them",
        permanent: true,
      },
      {
        source: "/sua-cong-thuc/:slug",
        destination: "/cong-thuc/:slug/sua",
        permanent: true,
      },
    ];
  },
'''
    config = config.replace(marker, redirects + marker, 1)
    CONFIG.write_text(config, encoding="utf-8")
    changed_files.append("next.config.ts")

# Remove now-empty old route directories where possible.
for directory in [OLD_EDIT.parent, OLD_EDIT.parent.parent, OLD_ADD.parent]:
    try:
        directory.rmdir()
    except OSError:
        pass

print("Recipe editor route migration complete.")
print("  Edit:   /sua-cong-thuc/[slug] -> /cong-thuc/[slug]/sua")
print("  Create: /them -> /cong-thuc/them")
print("  Added permanent redirects for legacy URLs.")
print("Updated files:")
for filename in sorted(set(changed_files)):
    print(f"  - {filename}")
