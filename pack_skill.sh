#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"

OUTPUT_NAME="${1:-clawpage-skill-${TIMESTAMP}.tar.gz}"
OUTPUT_PATH="${DIST_DIR}/${OUTPUT_NAME}"

if [[ "${OUTPUT_NAME}" == */* ]]; then
  echo "error: output name must be a file name, not a path: ${OUTPUT_NAME}" >&2
  exit 1
fi

if [[ "${OUTPUT_NAME}" != *.tar.gz ]]; then
  OUTPUT_PATH="${DIST_DIR}/${OUTPUT_NAME}.tar.gz"
fi

mkdir -p "${DIST_DIR}"
cd "${ROOT_DIR}"

FILE_LIST="$(mktemp)"
trap 'rm -f "${FILE_LIST}"' EXIT

git ls-files -z --cached --others --exclude-standard | while IFS= read -r -d '' f; do
  base="${f##*/}"
  [[ "${f}" == ".gitignore" ]] && continue
  [[ "${f}" == "pack_skill.sh" ]] && continue
  [[ "${f}" == "README.md" ]] && continue
  [[ "${f}" == "LICENSE" ]] && continue
  [[ "${f}" == docs/* ]] && continue
  [[ "${f}" == dist/* ]] && continue
  [[ "${base}" == ".gitkeep" ]] && continue
  [[ "${base}" == ".keep" ]] && continue
  [[ "${base}" == ".empty" ]] && continue
  printf '%s\0' "${f}"
done > "${FILE_LIST}"

FILE_COUNT="$(tr -cd '\0' < "${FILE_LIST}" | wc -c | tr -d ' ')"

if [[ "${FILE_COUNT}" == "0" ]]; then
  echo "error: no files selected for packaging" >&2
  exit 1
fi

tar --null -T "${FILE_LIST}" -czf "${OUTPUT_PATH}"

echo "packed ${FILE_COUNT} files"
echo "archive: ${OUTPUT_PATH}"
