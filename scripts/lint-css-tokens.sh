#!/usr/bin/env bash
#
# Doucement - CSS Tokens Linter
# Vérifie que tous les var(--*) utilisés dans les fichiers CSS
# sont déclarés dans src/styles/design-tokens.css ou localement
#
# Usage: ./scripts/lint-css-tokens.sh
#

set -e
shopt -s globstar nullglob

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

TOKENS_FILE="src/styles/design-tokens.css"
ERRORS=0

if [ ! -f "$TOKENS_FILE" ]; then
    echo -e "${RED}Erreur: $TOKENS_FILE introuvable${NC}"
    exit 1
fi

# Fichier temporaire pour les résultats
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

# 1. Extraire tous les tokens déclarés dans design-tokens.css
DECLARED_TOKENS=$(grep -oP '^\s*--[a-zA-Z0-9_-]+' "$TOKENS_FILE" | sed 's/^\s*//' | sort -u)

# 2. Extraire les tokens déclarés localement dans d'autres fichiers CSS
LOCAL_TOKENS=""
for f in src/**/*.css; do
    [ "$f" = "$TOKENS_FILE" ] && continue
    local_decls=$(grep -oP '^\s*--[a-zA-Z0-9_-]+(?=\s*:)' "$f" 2>/dev/null | sed 's/^\s*//' || true)
    if [ -n "$local_decls" ]; then
        LOCAL_TOKENS="${LOCAL_TOKENS}${local_decls}"$'\n'
    fi
done

# Combiner toutes les déclarations
ALL_DECLARED=$(echo -e "${DECLARED_TOKENS}\n${LOCAL_TOKENS}" | grep -v '^$' | sort -u)

# 3. Extraire tous les var(--*) utilisés dans les fichiers CSS (hors design-tokens.css)
USED_TOKENS=""
for f in src/**/*.css; do
    [ "$f" = "$TOKENS_FILE" ] && continue
    used=$(grep -oP 'var\(--[a-zA-Z0-9_-]+' "$f" 2>/dev/null | sed 's/var(//' || true)
    if [ -n "$used" ]; then
        USED_TOKENS="${USED_TOKENS}${used}"$'\n'
    fi
done
USED_TOKENS=$(echo "$USED_TOKENS" | grep -v '^$' | sort -u)

# 4. Tokens à ignorer (variables inline définies via JS style="")
IGNORED_TOKENS="--progress"

# 5. Comparer : trouver les tokens utilisés mais non déclarés
while IFS= read -r token; do
    [ -z "$token" ] && continue

    # Vérifier les tokens ignorés
    if echo "$IGNORED_TOKENS" | grep -qxF -- "$token"; then
        continue
    fi

    # Vérifier si déclaré
    if ! echo "$ALL_DECLARED" | grep -qxF -- "$token"; then
        echo "$token" >> "$TMPFILE"
        ERRORS=$((ERRORS + 1))
    fi
done <<< "$USED_TOKENS"

# 6. Afficher les résultats
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Tokens CSS non définis dans $TOKENS_FILE:${NC}"
    echo ""
    while IFS= read -r token; do
        [ -z "$token" ] && continue
        # Trouver les fichiers qui utilisent ce token
        echo -e "  ${RED}✗${NC} ${token}"
        for f in src/**/*.css; do
            [ "$f" = "$TOKENS_FILE" ] && continue
            if grep -q -- "var(${token})" "$f" 2>/dev/null; then
                echo -e "    ${YELLOW}→ $f${NC}"
            fi
        done
    done < "$TMPFILE"
    echo ""
    echo -e "${RED}$ERRORS token(s) non défini(s)${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Tous les tokens CSS sont définis dans $TOKENS_FILE${NC}"
    exit 0
fi
