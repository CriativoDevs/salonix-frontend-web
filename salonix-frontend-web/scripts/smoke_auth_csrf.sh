#!/usr/bin/env bash
set -euo pipefail

# Configs
BASE_URL="${BASE_URL:-http://localhost:8000/api/}"
LOGIN_EMAIL="${LOGIN_EMAIL:-pro_smoke@demo.local}"
SMOKE_USER_PASSWORD="${SMOKE_USER_PASSWORD:-Smoke@123}"
ORIGIN="${ORIGIN:-http://localhost:5173}"

COOKIE_JAR="cookies.txt"

echo "[*] Iniciando Smoke Test com validação de CSRF e Cookies"
echo "    Target: $BASE_URL"
echo "    Origin: $ORIGIN"

# 1. Login (simulando request do browser com credenciais)
# Deve retornar cookies de sessão e csrf (se configurado)
echo "[1] Tentando Login..."
RESPONSE=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" \
  -H 'Content-Type: application/json' \
  -X POST "${BASE_URL%/}/users/token/" \
  -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$SMOKE_USER_PASSWORD\"}")

ACCESS=$(echo "$RESPONSE" | jq -r .access)

if [[ -z "$ACCESS" || "$ACCESS" == "null" ]]; then
  echo "[FAIL] Login falhou. Resposta:"
  echo "$RESPONSE"
  exit 1
fi

echo "[OK] Token obtido."

# Validar se cookies foram setados no jar
if grep -q "csrftoken" "$COOKIE_JAR"; then
  echo "[OK] Cookie CSRF detectado."
else
  echo "[WARN] Cookie CSRF NÃO detectado (pode ser normal se autenticação for puramente JWT, mas verifique se esperado)."
fi

# 2. Request Autenticado que exigiria CSRF (ex: PATCH/POST)
# O endpoint users/me/profile/ PATCH exige autenticação. 
# Se CSRF estiver ativo no backend (SessionAuth), precisaria do token e header.
# Como usamos JWT, CSRF geralmente não é exigido, a menos que SessionAuthentication esteja habilitada no DRF.

echo "[2] Testando request autenticado (GET users/me/profile/)..."
PROFILE=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $ACCESS" \
  -X GET "${BASE_URL%/}/users/me/profile/")

EMAIL=$(echo "$PROFILE" | jq -r .email)

if [[ "$EMAIL" != "$LOGIN_EMAIL" ]]; then
  echo "[FAIL] Falha ao obter perfil. Resposta:"
  echo "$PROFILE"
  exit 1
fi
echo "[OK] Perfil obtido: $EMAIL"

echo "[DONE] Smoke Test Concluído com Sucesso!"
rm -f "$COOKIE_JAR"
