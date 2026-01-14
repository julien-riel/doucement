#!/usr/bin/env bash
#
# Doucement - Lighthouse Audit Script
# Exécute un audit Lighthouse en mode headless et vérifie les scores PWA/Performance.
#
# Usage: ./scripts/lighthouse-audit.sh
#
# Prérequis:
#   - npm run build doit avoir été exécuté
#   - Le serveur preview doit être accessible (npm run preview)
#   - npx lighthouse doit être disponible
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Seuils de score (sur 100)
PWA_THRESHOLD=90
PERFORMANCE_THRESHOLD=80
ACCESSIBILITY_THRESHOLD=90
BEST_PRACTICES_THRESHOLD=90
SEO_THRESHOLD=90

# Configuration
URL="${1:-http://localhost:4173}"
OUTPUT_DIR="lighthouse-reports"
OUTPUT_FILE="${OUTPUT_DIR}/lighthouse-report-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Doucement - Lighthouse Audit${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier que le dossier dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier 'dist' n'existe pas.${NC}"
    echo -e "Exécutez d'abord: npm run build"
    exit 1
fi

# Créer le dossier de rapports s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

# Vérifier si le serveur est accessible
echo -e "${BLUE}Vérification du serveur preview...${NC}"
if ! curl -s --head "$URL" >/dev/null 2>&1; then
    echo -e "${YELLOW}Le serveur n'est pas accessible sur $URL${NC}"
    echo -e "Démarrage du serveur preview en arrière-plan..."

    # Démarrer le serveur preview en arrière-plan
    npm run preview -- --host &
    PREVIEW_PID=$!

    # Attendre que le serveur soit prêt
    echo -n "Attente du démarrage du serveur"
    for i in {1..30}; do
        if curl -s --head "$URL" >/dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}Serveur démarré!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    if ! curl -s --head "$URL" >/dev/null 2>&1; then
        echo ""
        echo -e "${RED}Erreur: Impossible de démarrer le serveur preview${NC}"
        kill $PREVIEW_PID 2>/dev/null || true
        exit 1
    fi

    STARTED_SERVER=true
else
    echo -e "${GREEN}Serveur accessible sur $URL${NC}"
    STARTED_SERVER=false
fi

echo ""
echo -e "${BLUE}Exécution de l'audit Lighthouse...${NC}"
echo -e "URL: $URL"
echo ""

# Exécuter Lighthouse
npx lighthouse "$URL" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --output=json,html \
    --output-path="$OUTPUT_FILE" \
    --only-categories=performance,accessibility,best-practices,seo,pwa \
    --quiet \
    2>/dev/null

# Arrêter le serveur si on l'a démarré
if [ "$STARTED_SERVER" = true ]; then
    echo -e "${BLUE}Arrêt du serveur preview...${NC}"
    kill $PREVIEW_PID 2>/dev/null || true
fi

# Lire les scores depuis le rapport JSON
if [ ! -f "${OUTPUT_FILE}.json" ]; then
    echo -e "${RED}Erreur: Le rapport Lighthouse n'a pas été généré${NC}"
    exit 1
fi

ERRORS=0

echo ""
echo -e "${BLUE}Résultats de l'audit:${NC}"
echo -e "─────────────────────────────────────────────────────────────"
printf "%-20s %10s %15s %10s\n" "Catégorie" "Score" "Seuil" "Status"
echo -e "─────────────────────────────────────────────────────────────"

# Fonction pour extraire et vérifier un score
check_score() {
    local category=$1
    local display_name=$2
    local threshold=$3

    # Extraire le score (valeur entre 0 et 1, convertir en %)
    local score_raw=$(grep -o "\"${category}\":{[^}]*\"score\":[0-9.]*" "${OUTPUT_FILE}.json" | head -1 | grep -o '"score":[0-9.]*' | cut -d':' -f2)

    if [ -z "$score_raw" ] || [ "$score_raw" = "null" ]; then
        printf "${YELLOW}%-20s %10s %15s %10s${NC}\n" "$display_name" "N/A" "$threshold" "⚠"
        return
    fi

    local score=$(echo "$score_raw * 100" | bc | cut -d'.' -f1)

    if [ "$score" -ge "$threshold" ]; then
        printf "${GREEN}%-20s %10s %15s %10s${NC}\n" "$display_name" "$score" "$threshold" "✓"
    else
        printf "${RED}%-20s %10s %15s %10s${NC}\n" "$display_name" "$score" "$threshold" "✗"
        ERRORS=$((ERRORS + 1))
    fi
}

check_score "performance" "Performance" $PERFORMANCE_THRESHOLD
check_score "accessibility" "Accessibilité" $ACCESSIBILITY_THRESHOLD
check_score "best-practices" "Best Practices" $BEST_PRACTICES_THRESHOLD
check_score "seo" "SEO" $SEO_THRESHOLD
check_score "pwa" "PWA" $PWA_THRESHOLD

echo -e "─────────────────────────────────────────────────────────────"

# Afficher le chemin du rapport
echo ""
echo -e "${BLUE}Rapports générés:${NC}"
echo -e "  JSON: ${OUTPUT_FILE}.json"
echo -e "  HTML: ${OUTPUT_FILE}.html"

# Résumé
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✓ Tous les scores respectent les seuils${NC}"
    exit 0
else
    echo -e "${RED}  ✗ ${ERRORS} catégorie(s) sous le seuil${NC}"
    echo ""
    echo -e "${YELLOW}Conseils d'amélioration:${NC}"
    echo -e "  - Consultez le rapport HTML pour les détails"
    echo -e "  - Vérifiez les images non optimisées"
    echo -e "  - Assurez-vous que le service worker est bien configuré"
    exit 1
fi
