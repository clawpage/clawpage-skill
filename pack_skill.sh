#!/usr/bin/env bash
#
# Pack the clawpage plugin into a tar.gz for upload to plugin
# distribution channels (e.g. clawhub, manual sharing).
#
# Plugin contents = git-tracked files only.
#
# Usage:
#   ./pack_skill.sh                 # default: dist/clawpage-<version>-<sha>.tar.gz
#   ./pack_skill.sh my-name         # custom: dist/my-name.tar.gz
#   ./pack_skill.sh --format zip    # produce zip instead

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
mkdir -p "${DIST_DIR}"

format="tar.gz"
custom_name=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format)
      format="$2"
      shift 2
      ;;
    --format=*)
      format="${1#*=}"
      shift
      ;;
    *)
      custom_name="$1"
      shift
      ;;
  esac
done

if [[ "${format}" != "tar.gz" && "${format}" != "zip" ]]; then
  echo "error: --format must be 'tar.gz' or 'zip' (got: ${format})" >&2
  exit 1
fi

cd "${ROOT_DIR}"

if ! command -v git >/dev/null 2>&1; then
  echo "error: git not found" >&2
  exit 1
fi

if [[ ! -d ".git" && ! -f ".git" ]]; then
  echo "error: ${ROOT_DIR} is not a git repository" >&2
  exit 1
fi

version="$(node -p "require('./.claude-plugin/plugin.json').version" 2>/dev/null || echo "0.0.0")"
sha_short="$(git rev-parse --short HEAD)"
default_name="clawpage-${version}-${sha_short}"
output_name="${custom_name:-${default_name}}"
output_path="${DIST_DIR}/${output_name}.${format}"

if [[ "${output_name}" == */* ]]; then
  echo "error: output name must be a file name, not a path: ${output_name}" >&2
  exit 1
fi

# Files to pack = whatever git tracks. Excludes .git/, dist/, anything in
# .gitignore. Also drops the pack script + raw dotfiles that don't belong
# in a distribution tarball.
file_list="$(mktemp)"
trap 'rm -f "${file_list}"' EXIT

git ls-files -z | while IFS= read -r -d '' f; do
  case "${f}" in
    pack_skill.sh|.gitignore|.gitattributes) continue ;;
    dist/*) continue ;;
    # Drop extensionless metadata files — some plugin marketplaces
    # (e.g. clawhub) reject anything not detected as text by extension.
    # The repo itself keeps LICENSE for legal use; SPDX identifier in
    # plugin.json carries the license info into the tarball.
    LICENSE) continue ;;
    *.gitkeep|*.keep|*.empty) continue ;;
  esac
  printf '%s\0' "${f}"
done > "${file_list}"

file_count="$(tr -cd '\0' < "${file_list}" | wc -c | tr -d ' ')"

if [[ "${file_count}" == "0" ]]; then
  echo "error: no files selected for packaging" >&2
  exit 1
fi

if [[ "${format}" == "tar.gz" ]]; then
  tar --null -T "${file_list}" -czf "${output_path}"
else
  # zip needs a different invocation; build via temp dir to handle symlinks.
  staging="$(mktemp -d)"
  trap 'rm -f "${file_list}"; rm -rf "${staging}"' EXIT
  while IFS= read -r -d '' f; do
    mkdir -p "${staging}/$(dirname "${f}")"
    # cp -L follows symlinks
    cp -L "${f}" "${staging}/${f}"
  done < "${file_list}"
  (cd "${staging}" && zip -rq "${output_path}" .)
fi

size_bytes="$(stat -f%z "${output_path}" 2>/dev/null || stat -c%s "${output_path}")"
size_kb="$((size_bytes / 1024))"

echo "✓ packed ${file_count} files"
echo "  archive: ${output_path}"
echo "  size:    ${size_kb} KB (${size_bytes} bytes)"
echo "  version: ${version}"
echo "  commit:  ${sha_short}"
