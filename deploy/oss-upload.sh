#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/admin-web/dist"

: "${OSS_BUCKET:?Please set OSS_BUCKET}"
: "${OSS_REGION:?Please set OSS_REGION}"
: "${ALICLOUD_ACCESS_KEY_ID:?Please set ALICLOUD_ACCESS_KEY_ID}"
: "${ALICLOUD_ACCESS_KEY_SECRET:?Please set ALICLOUD_ACCESS_KEY_SECRET}"

OSS_ENDPOINT="${OSS_ENDPOINT:-oss-${OSS_REGION}.aliyuncs.com}"
OSSUTIL_CONFIG="${OSSUTIL_CONFIG:-${ROOT_DIR}/.ossutilconfig}"

if ! command -v ossutil >/dev/null 2>&1; then
  echo "ossutil is not installed. Install it first and ensure ossutil is in PATH."
  exit 1
fi

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Frontend dist directory not found: ${DIST_DIR}"
  echo "Run: cd ${ROOT_DIR}/admin-web && npm install && npm run build"
  exit 1
fi

echo "Configuring ossutil ..."
ossutil config \
  -c "${OSSUTIL_CONFIG}" \
  -e "${OSS_ENDPOINT}" \
  -i "${ALICLOUD_ACCESS_KEY_ID}" \
  -k "${ALICLOUD_ACCESS_KEY_SECRET}" \
  -L CH >/dev/null

echo "Uploading ${DIST_DIR} to oss://${OSS_BUCKET}/ ..."
ossutil cp "${DIST_DIR}/" "oss://${OSS_BUCKET}/" -r -f -u -c "${OSSUTIL_CONFIG}"

echo "Upload finished."
