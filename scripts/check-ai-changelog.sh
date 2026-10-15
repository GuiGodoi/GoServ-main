#!/usr/bin/env bash
# Confere a regra obrigatória do AGENTS.md: mudança feita com IA precisa estar em docs/AI_CHANGELOG.md.
#
# Uso: scripts/check-ai-changelog.sh <base-ref> [head-ref]     (head padrão: HEAD)
#
# Falha (exit 1) quando:
#   1. algum commit do intervalo tem sinal de IA (trailer Co-Authored-By de uma IA, "Generated with ..." ou um ID
#      AI-NNNN na mensagem) e o PR não alterou docs/AI_CHANGELOG.md;
#   2. a mensagem de um commit cita um ID AI-NNNN que não existe no registro;
#   3. o registro está malformado: IDs repetidos ou fora da ordem (a mais nova fica no topo).
# Limite: só enxerga IA que deixou rastro na mensagem do commit. Quem não deixa rastro depende da regra do AGENTS.md.

set -euo pipefail

BASE="${1:?uso: check-ai-changelog.sh <base-ref> [head-ref]}"
HEAD_REF="${2:-HEAD}"
LOG_FILE="docs/AI_CHANGELOG.md"
AI_PATTERN='co-authored-by:.*(claude|anthropic|copilot|cursor|openai|chatgpt|codex|gemini|aider|devin|windsurf|cody)|generated with .*(claude|copilot|codex|cursor|gemini)'

fail=0
error() { echo "ERRO: $*" >&2; fail=1; }

MERGE_BASE="$(git merge-base "$BASE" "$HEAD_REF")"

if ! git cat-file -e "$HEAD_REF:$LOG_FILE" 2>/dev/null; then
  echo "ERRO: $LOG_FILE não existe em $HEAD_REF." >&2
  exit 1
fi
# Remove CR para funcionar igual com arquivos CRLF (Windows) e LF.
changelog="$(git show "$HEAD_REF:$LOG_FILE" | tr -d '\r')"

# --- Commits do intervalo com sinal de IA e IDs citados ---
ai_commits=()
cited_ids=()
for sha in $(git rev-list --no-merges "$MERGE_BASE..$HEAD_REF"); do
  msg="$(git log -1 --format=%B "$sha" | tr -d '\r')"
  ids="$(printf '%s\n' "$msg" | grep -oE '\bAI-[0-9]{4}\b' | sort -u || true)"
  if printf '%s\n' "$msg" | grep -qiE "$AI_PATTERN" || [ -n "$ids" ]; then
    ai_commits+=("$(git log -1 --format='%h %s' "$sha")")
  fi
  for id in $ids; do cited_ids+=("$id"); done
done

# --- 1. Registro alterado? ---
if [ "${#ai_commits[@]}" -gt 0 ]; then
  if ! git diff --name-only "$MERGE_BASE" "$HEAD_REF" | grep -qx "$LOG_FILE"; then
    error "há commits feitos com IA, mas $LOG_FILE não foi alterado neste PR:"
    printf '  - %s\n' "${ai_commits[@]}" >&2
    echo "  Adicione a entrada nova no topo do registro (regra obrigatória do AGENTS.md)." >&2
  fi
fi

# --- 2. IDs citados existem? ---
for id in $(printf '%s\n' "${cited_ids[@]+"${cited_ids[@]}"}" | sort -u); do
  [ -z "$id" ] && continue
  if ! printf '%s\n' "$changelog" | grep -qE "^## $id\b"; then
    error "um commit cita $id, mas não há entrada '## $id' em $LOG_FILE."
  fi
done

# --- 3. Formato: IDs únicos e em ordem decrescente (mais nova no topo) ---
file_ids="$(printf '%s\n' "$changelog" | grep -oE '^## AI-[0-9]{4}' | grep -oE '[0-9]{4}' || true)"
if [ -n "$file_ids" ]; then
  if [ "$(printf '%s\n' "$file_ids" | sort -u | wc -l)" -ne "$(printf '%s\n' "$file_ids" | wc -l)" ]; then
    error "$LOG_FILE tem IDs AI-NNNN repetidos."
  fi
  if [ "$file_ids" != "$(printf '%s\n' "$file_ids" | sort -r)" ]; then
    error "$LOG_FILE está fora de ordem: a entrada mais nova (maior ID) deve ficar no topo."
  fi
fi

# --- Aviso (não falha): linhas removidas de entradas antigas ---
removed="$(git diff "$MERGE_BASE" "$HEAD_REF" -- "$LOG_FILE" | tr -d '\r' | grep -E '^-[^-]' \
  | grep -vE '^-(>|\*\*Commit:\*\*|- \*\*Commit:\*\*)' || true)"
if [ -n "$removed" ]; then
  echo "AVISO: linhas foram removidas/alteradas no registro (entradas antigas não devem ser editadas," >&2
  echo "       exceto o campo Commit). Confira se foi intencional:" >&2
  printf '%s\n' "$removed" | head -10 | sed 's/^/  /' >&2
fi

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "OK: registro de mudanças por IA consistente (${#ai_commits[@]} commit(s) com sinal de IA no intervalo)."
