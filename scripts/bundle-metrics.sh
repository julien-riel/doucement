#!/usr/bin/env bash
#
# Doucement - Bundle Metrics Script
# Analyse la taille du bundle après build et compare avec les seuils définis.
#
# Usage: ./scripts/bundle-metrics.sh
#
# Prérequis: npm run build doit avoir été exécuté
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Seuils (en KB)
TOTAL_SIZE_THRESHOLD=500        # Seuil total bundle JS
TOTAL_GZIP_THRESHOLD=150        # Seuil total gzippé
CHUNK_SIZE_WARNING=200          # Avertissement par chunk

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Doucement - Bundle Metrics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier 'dist' n'existe pas.${NC}"
    echo -e "Exécutez d'abord: npm run build"
    exit 1
fi

# Vérifier que les fichiers JS existent
if [ ! -d "dist/assets" ]; then
    echo -e "${RED}Erreur: Le dossier 'dist/assets' n'existe pas.${NC}"
    exit 1
fi

ERRORS=0

# ==============================================================================
# Analyse des chunks JS
# ==============================================================================
echo -e "${BLUE}Chunks JavaScript:${NC}"
echo -e "─────────────────────────────────────────────────────────────"
printf "%-45s %10s %12s\n" "Fichier" "Taille" "Gzip"
echo -e "─────────────────────────────────────────────────────────────"

TOTAL_SIZE=0
TOTAL_GZIP=0

# Parcourir tous les fichiers JS dans dist/assets
while IFS= read -r file; do
    filename=$(basename "$file")

    # Calculer la taille en KB
    size_bytes=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
    size_kb=$(echo "scale=2; $size_bytes / 1024" | bc)

    # Calculer la taille gzippée
    gzip_bytes=$(gzip -c "$file" | wc -c)
    gzip_kb=$(echo "scale=2; $gzip_bytes / 1024" | bc)

    # Ajouter aux totaux
    TOTAL_SIZE=$(echo "$TOTAL_SIZE + $size_kb" | bc)
    TOTAL_GZIP=$(echo "$TOTAL_GZIP + $gzip_kb" | bc)

    # Déterminer la couleur selon la taille
    if (( $(echo "$size_kb > $CHUNK_SIZE_WARNING" | bc -l) )); then
        COLOR=$YELLOW
    else
        COLOR=$GREEN
    fi

    # Tronquer le nom de fichier si trop long
    if [ ${#filename} -gt 40 ]; then
        display_name="${filename:0:37}..."
    else
        display_name="$filename"
    fi

    printf "${COLOR}%-45s %8.2f KB %9.2f KB${NC}\n" "$display_name" "$size_kb" "$gzip_kb"

done < <(find dist/assets -name "*.js" -type f | sort)

echo -e "─────────────────────────────────────────────────────────────"

# ==============================================================================
# Totaux
# ==============================================================================
echo ""
echo -e "${BOLD}Totaux:${NC}"
echo -e "─────────────────────────────────────────────────────────────"

# Vérifier le total
if (( $(echo "$TOTAL_SIZE > $TOTAL_SIZE_THRESHOLD" | bc -l) )); then
    echo -e "${RED}  Total JS:    ${TOTAL_SIZE} KB (seuil: ${TOTAL_SIZE_THRESHOLD} KB) ✗${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}  Total JS:    ${TOTAL_SIZE} KB (seuil: ${TOTAL_SIZE_THRESHOLD} KB) ✓${NC}"
fi

if (( $(echo "$TOTAL_GZIP > $TOTAL_GZIP_THRESHOLD" | bc -l) )); then
    echo -e "${RED}  Total Gzip:  ${TOTAL_GZIP} KB (seuil: ${TOTAL_GZIP_THRESHOLD} KB) ✗${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}  Total Gzip:  ${TOTAL_GZIP} KB (seuil: ${TOTAL_GZIP_THRESHOLD} KB) ✓${NC}"
fi

# ==============================================================================
# Chunks CSS
# ==============================================================================
echo ""
echo -e "${BLUE}Chunks CSS:${NC}"
echo -e "─────────────────────────────────────────────────────────────"
printf "%-45s %10s %12s\n" "Fichier" "Taille" "Gzip"
echo -e "─────────────────────────────────────────────────────────────"

CSS_TOTAL=0
CSS_GZIP_TOTAL=0

while IFS= read -r file; do
    filename=$(basename "$file")

    size_bytes=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
    size_kb=$(echo "scale=2; $size_bytes / 1024" | bc)

    gzip_bytes=$(gzip -c "$file" | wc -c)
    gzip_kb=$(echo "scale=2; $gzip_bytes / 1024" | bc)

    CSS_TOTAL=$(echo "$CSS_TOTAL + $size_kb" | bc)
    CSS_GZIP_TOTAL=$(echo "$CSS_GZIP_TOTAL + $gzip_kb" | bc)

    if [ ${#filename} -gt 40 ]; then
        display_name="${filename:0:37}..."
    else
        display_name="$filename"
    fi

    printf "${GREEN}%-45s %8.2f KB %9.2f KB${NC}\n" "$display_name" "$size_kb" "$gzip_kb"

done < <(find dist/assets -name "*.css" -type f | sort)

echo -e "─────────────────────────────────────────────────────────────"
echo -e "  Total CSS:   ${CSS_TOTAL} KB (gzip: ${CSS_GZIP_TOTAL} KB)"

# ==============================================================================
# Vendor Chunks Analysis
# ==============================================================================
echo ""
echo -e "${BLUE}Analyse des vendor chunks:${NC}"
echo -e "─────────────────────────────────────────────────────────────"

VENDOR_CHUNKS=("vendor-react" "vendor-charts" "vendor-export" "vendor-i18n" "vendor-emoji")

for vendor in "${VENDOR_CHUNKS[@]}"; do
    file=$(find dist/assets -name "${vendor}*.js" -type f 2>/dev/null | head -1)
    if [ -n "$file" ]; then
        size_bytes=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        size_kb=$(echo "scale=2; $size_bytes / 1024" | bc)
        echo -e "${GREEN}  ✓ ${vendor}: ${size_kb} KB${NC}"
    else
        echo -e "${YELLOW}  ⚠ ${vendor}: non trouvé${NC}"
    fi
done

# ==============================================================================
# Résumé
# ==============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✓ Tous les seuils sont respectés${NC}"
    exit 0
else
    echo -e "${RED}  ✗ ${ERRORS} seuil(s) dépassé(s)${NC}"
    echo ""
    echo -e "${YELLOW}Conseils d'optimisation:${NC}"
    echo -e "  - Vérifiez les imports inutilisés"
    echo -e "  - Utilisez le lazy loading pour les composants lourds"
    echo -e "  - Optimisez les imports de bibliothèques (tree-shaking)"
    exit 1
fi
