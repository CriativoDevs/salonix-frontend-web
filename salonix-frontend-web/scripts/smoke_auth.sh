#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000/api/}"
LOGIN_EMAIL="${LOGIN_EMAIL:-pro_smoke@demo.local}"
SMOKE_USER_PASSWORD="${SMOKE_USER_PASSWORD:-Smoke@123}"

echo "[*] Autenticando em $BASE_URL como $LOGIN_EMAIL"

ACCESS=$(curl -sS -X POST "${BASE_URL%/}/users/token/" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$SMOKE_USER_PASSWORD\"}" | jq -r .access)

if [[ -z "$ACCESS" || "$ACCESS" == "null" ]]; then
  echo "[FAIL] Não foi possível obter token. Verifique BASE_URL/credenciais." >&2
  exit 1
fi

echo "[OK] Token obtido. Buscando bootstrap do tenant…"

TENANT=$(curl -sS -X GET "${BASE_URL%/}/users/me/tenant/" -H "Authorization: Bearer $ACCESS")
SLUG=$(echo "$TENANT" | jq -r .slug)
NAME=$(echo "$TENANT" | jq -r .name)

if [[ -z "$SLUG" || "$SLUG" == "null" ]]; then
  echo "[FAIL] Bootstrap não retornou slug. Resposta:" >&2
  echo "$TENANT" | jq . || echo "$TENANT"
  exit 1
fi

echo "[OK] Tenant bootstrap: slug=$SLUG name=$NAME"
echo "[*] Buscando meta pública…"

META=$(curl -sS -X GET "${BASE_URL%/}/users/tenant/meta/?tenant=$SLUG")
MNAME=$(echo "$META" | jq -r .name)

echo "[OK] Meta carregada: name=$MNAME"
echo "[DONE] Smoke de auth/tenant concluído com sucesso."

