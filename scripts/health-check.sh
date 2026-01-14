#!/usr/bin/env bash
#
# Doucement - Health Check Script
# Vérifie la santé du codebase: fichiers orphelins, taille des tests, imports
#
# Usage: ./scripts/health-check.sh
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Doucement - Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# ==============================================================================
# 1. Vérification des répertoires vides
# ==============================================================================
echo -e "${BLUE}[1/6] Vérification des répertoires vides...${NC}"

EMPTY_DIRS=$(find src -type d -empty 2>/dev/null || true)
if [ -n "$EMPTY_DIRS" ]; then
    echo -e "${YELLOW}  ⚠ Répertoires vides trouvés:${NC}"
    echo "$EMPTY_DIRS" | while read dir; do
        echo -e "    - $dir"
    done
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}  ✓ Aucun répertoire vide${NC}"
fi

# ==============================================================================
# 2. Vérification de la taille des fichiers de test
# ==============================================================================
echo ""
echo -e "${BLUE}[2/6] Vérification de la taille des fichiers de test...${NC}"

# Ratio maximum test/source (3x)
MAX_RATIO=3

while IFS= read -r test_file; do
    # Trouver le fichier source correspondant
    source_file="${test_file%.test.ts}"
    source_file="${source_file%.test.tsx}"

    # Vérifier les deux extensions possibles
    if [ -f "${source_file}.ts" ]; then
        source_file="${source_file}.ts"
    elif [ -f "${source_file}.tsx" ]; then
        source_file="${source_file}.tsx"
    else
        continue
    fi

    test_lines=$(wc -l < "$test_file" 2>/dev/null || echo 0)
    source_lines=$(wc -l < "$source_file" 2>/dev/null || echo 1)

    if [ "$source_lines" -gt 0 ]; then
        ratio=$(echo "scale=2; $test_lines / $source_lines" | bc)
        ratio_int=$(echo "$test_lines / $source_lines" | bc)

        if [ "$ratio_int" -gt "$MAX_RATIO" ]; then
            echo -e "${YELLOW}  ⚠ ${test_file}: ${test_lines} lignes (ratio: ${ratio}x)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done < <(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null)

echo -e "${GREEN}  ✓ Ratio test/source vérifié${NC}"

# ==============================================================================
# 3. Vérification des imports cassés (TypeScript)
# ==============================================================================
echo ""
echo -e "${BLUE}[3/6] Vérification TypeScript...${NC}"

if npm run typecheck --silent 2>/dev/null; then
    echo -e "${GREEN}  ✓ TypeScript compile sans erreur${NC}"
else
    echo -e "${RED}  ✗ Erreurs TypeScript détectées${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ==============================================================================
# 4. Vérification du lint
# ==============================================================================
echo ""
echo -e "${BLUE}[4/6] Vérification ESLint...${NC}"

if npm run lint --silent 2>/dev/null; then
    echo -e "${GREEN}  ✓ Lint passe sans erreur${NC}"
else
    echo -e "${YELLOW}  ⚠ Warnings ESLint détectés${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ==============================================================================
# 5. Vérification Lighthouse (optionnel)
# ==============================================================================
echo ""
echo -e "${BLUE}[5/6] Vérification Lighthouse...${NC}"

# Vérifier si le dossier dist existe pour éviter un build inutile
if [ -d "dist" ]; then
    # Vérifier si Lighthouse est disponible
    if command -v npx &> /dev/null && npx lighthouse --version &> /dev/null; then
        # Vérifier si un rapport récent existe (moins d'une heure)
        RECENT_REPORT=$(find lighthouse-reports -name "*.json" -mmin -60 2>/dev/null | head -1)

        if [ -n "$RECENT_REPORT" ]; then
            echo -e "${GREEN}  ✓ Rapport Lighthouse récent trouvé${NC}"
            echo -e "    Fichier: $RECENT_REPORT"

            # Vérifier le score PWA du rapport existant
            PWA_SCORE=$(grep -o '"pwa":{[^}]*"score":[0-9.]*' "$RECENT_REPORT" 2>/dev/null | head -1 | grep -o '"score":[0-9.]*' | cut -d':' -f2)
            if [ -n "$PWA_SCORE" ] && [ "$PWA_SCORE" != "null" ]; then
                PWA_PERCENT=$(echo "$PWA_SCORE * 100" | bc | cut -d'.' -f1)
                if [ "$PWA_PERCENT" -ge 90 ]; then
                    echo -e "${GREEN}  ✓ Score PWA: ${PWA_PERCENT}% (seuil: 90%)${NC}"
                else
                    echo -e "${YELLOW}  ⚠ Score PWA: ${PWA_PERCENT}% (seuil: 90%)${NC}"
                    WARNINGS=$((WARNINGS + 1))
                fi
            fi
        else
            echo -e "${YELLOW}  ⚠ Aucun rapport Lighthouse récent${NC}"
            echo -e "    Exécutez: ./scripts/lighthouse-audit.sh"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}  ⚠ Lighthouse non disponible (npx lighthouse)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}  ⚠ Dossier dist absent, build requis pour Lighthouse${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ==============================================================================
# 6. Vérification de la cohérence de la documentation
# ==============================================================================
echo ""
echo -e "${BLUE}[6/6] Vérification de la documentation...${NC}"

REQUIRED_DOCS=(
    "docs/prd.md"
    "docs/design/design-system-specification.md"
    "docs/coherence-matrix.md"
    "CLAUDE.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}  ✓ $doc${NC}"
    else
        echo -e "${RED}  ✗ $doc manquant${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# ==============================================================================
# Résumé
# ==============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}  Erreurs: $ERRORS${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}  Avertissements: $WARNINGS${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}  ✓ Codebase en bonne santé!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}  ⚠ Quelques points à vérifier${NC}"
    exit 0
else
    echo -e "${RED}  ✗ Problèmes à corriger${NC}"
    exit 1
fi
