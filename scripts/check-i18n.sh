#!/usr/bin/env bash
#
# Doucement - Vérification i18n
# Compare les clés FR/EN et détecte les chaînes françaises hardcodées dans src/
#
# Usage: ./scripts/check-i18n.sh
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

FR_FILE="src/i18n/locales/fr.json"
EN_FILE="src/i18n/locales/en.json"

echo "Vérification i18n..."
echo ""

# ==============================================================================
# 1. Comparaison des clés FR / EN
# ==============================================================================
echo "[1/2] Comparaison des clés FR ↔ EN..."

if [ ! -f "$FR_FILE" ] || [ ! -f "$EN_FILE" ]; then
    echo -e "${RED}  ✗ Fichiers de traduction manquants${NC}"
    exit 1
fi

# Utiliser Node.js pour extraire et comparer les clés (gère les objets imbriqués)
DIFF_OUTPUT=$(node -e "
const fr = require('./${FR_FILE}');
const en = require('./${EN_FILE}');

function flattenKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const frKeys = new Set(flattenKeys(fr));
const enKeys = new Set(flattenKeys(en));

const missingInEn = [...frKeys].filter(k => !enKeys.has(k));
const missingInFr = [...enKeys].filter(k => !frKeys.has(k));

if (missingInEn.length > 0) {
  console.log('MISSING_EN:' + missingInEn.join(','));
}
if (missingInFr.length > 0) {
  console.log('MISSING_FR:' + missingInFr.join(','));
}
if (missingInEn.length === 0 && missingInFr.length === 0) {
  console.log('OK:' + frKeys.size + ' clés synchronisées');
}
" 2>&1)

if echo "$DIFF_OUTPUT" | grep -q "^MISSING_EN:"; then
    KEYS=$(echo "$DIFF_OUTPUT" | grep "^MISSING_EN:" | sed 's/^MISSING_EN://')
    echo -e "${RED}  ✗ Clés manquantes dans en.json:${NC}"
    echo "$KEYS" | tr ',' '\n' | while read -r key; do
        echo "    - $key"
    done
    ERRORS=$((ERRORS + 1))
fi

if echo "$DIFF_OUTPUT" | grep -q "^MISSING_FR:"; then
    KEYS=$(echo "$DIFF_OUTPUT" | grep "^MISSING_FR:" | sed 's/^MISSING_FR://')
    echo -e "${RED}  ✗ Clés manquantes dans fr.json:${NC}"
    echo "$KEYS" | tr ',' '\n' | while read -r key; do
        echo "    - $key"
    done
    ERRORS=$((ERRORS + 1))
fi

if echo "$DIFF_OUTPUT" | grep -q "^OK:"; then
    MSG=$(echo "$DIFF_OUTPUT" | grep "^OK:" | sed 's/^OK://')
    echo -e "${GREEN}  ✓ ${MSG}${NC}"
fi

# ==============================================================================
# 2. Détection des chaînes françaises hardcodées dans src/
# ==============================================================================
echo ""
echo "[2/2] Recherche de chaînes françaises hardcodées..."

# Heuristique : chercher des chaînes entre quotes contenant des caractères accentués
# typiques du français, avec au moins 3 mots
# Exclure : fichiers de traduction, fichiers de test, fichiers de config
# On cherche dans les fichiers composants et pages (user-facing)
HARDCODED=$(grep -rn \
    --include="*.tsx" \
    --include="*.ts" \
    --exclude="*.test.ts" \
    --exclude="*.test.tsx" \
    --exclude="*.d.ts" \
    --exclude-dir="i18n" \
    --exclude-dir="test" \
    --exclude-dir="__tests__" \
    --exclude-dir="node_modules" \
    -E "(['\"])[^'\"]*[àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ][^'\"]*[[:space:]][^'\"]*[[:space:]][^'\"]*\1" \
    src/ 2>/dev/null || true)

# Filtrer les faux positifs courants
# Le format de sortie grep est "fichier:ligne:contenu", il faut filtrer sur le contenu
FILTERED=""
if [ -n "$HARDCODED" ]; then
    FILTERED=$(echo "$HARDCODED" | \
        grep -v ':[[:space:]]*//' | \
        grep -v ':[[:space:]]*\*' | \
        grep -v ':[[:space:]]*/\*' | \
        grep -v 'console\.' | \
        grep -v 'import ' | \
        grep -v "from '" | \
        grep -v '\.test\.' | \
        grep -v 'aria-label' | \
        grep -v 'data-testid' | \
        grep -v '@param' | \
        grep -v '@returns' | \
        grep -v '@example' || true)
fi

if [ -n "$FILTERED" ]; then
    COUNT=$(echo "$FILTERED" | wc -l)
    echo -e "${YELLOW}  ⚠ ${COUNT} chaîne(s) possiblement hardcodée(s) trouvée(s):${NC}"
    echo "$FILTERED" | head -20 | while IFS= read -r line; do
        echo -e "    ${line}"
    done
    if [ "$COUNT" -gt 20 ]; then
        echo "    ... et $((COUNT - 20)) autres"
    fi
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}  ✓ Aucune chaîne française hardcodée détectée${NC}"
fi

# ==============================================================================
# Résumé
# ==============================================================================
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ ${ERRORS} erreur(s) i18n détectée(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} avertissement(s) i18n${NC}"
    exit 0
else
    echo -e "${GREEN}✓ i18n OK${NC}"
    exit 0
fi
