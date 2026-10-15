#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "Running html-validate..."
npx --yes html-validate@9 index.html projects.html resume.html

echo "Checking local links and assets..."
failed=0

resolve_target() {
  local base_dir="$1"
  local ref="$2"
  local path_part="${ref%%#*}"
  path_part="${path_part%%\?*}"

  if [[ -z "$path_part" ]]; then
    return 0
  fi

  if [[ "$path_part" == /* ]]; then
    local target="$ROOT$path_part"
  else
    local target="$base_dir/$path_part"
  fi

  if realpath -m / >/dev/null 2>&1; then
    target="$(realpath -m "$target")"
  fi

  if [[ ! -e "$target" ]]; then
    echo "ERROR: missing local target: $ref (resolved: $target)"
    return 1
  fi
  return 0
}

for html in index.html projects.html resume.html; do
  html_dir="$(dirname "$html")"
  if [[ "$html_dir" == "." ]]; then
    base_dir="$ROOT"
  else
    base_dir="$ROOT/$html_dir"
  fi

  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    if [[ "$ref" == http:* || "$ref" == https:* || "$ref" == mailto:* || "$ref" == javascript:* ]]; then
      continue
    fi
    if [[ "$ref" == \#* ]]; then
      continue
    fi
    if ! resolve_target "$base_dir" "$ref"; then
      echo "  in $html"
      failed=1
    fi
  done < <(
    grep -oE '(href|src)=["'\''][^"'\'']+["'\'']' "$html" \
      | sed -E 's/(href|src)=["'\'']([^"'\'']+)["'\'']/\2/' \
      || true
  )
done

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Local link check passed."
