#!/bin/bash

# Script d'implémentation automatique avec Claude
# Appelle claude /implement en boucle avec validation automatique

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteur d'itérations
ITERATION=0
MAX_ITERATIONS=${1:-10}  # Par défaut 10 itérations, ou le premier argument

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_separator() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo ""
}

run_validation() {
    log_info "Exécution des validations..."

    # Format
    log_info "npm run format..."
    if npm run format; then
        log_success "Format OK"
    else
        log_error "Format failed"
        return 1
    fi

    # Lint
    log_info "npm run lint..."
    if npm run lint; then
        log_success "Lint OK"
    else
        log_error "Lint failed"
        return 1
    fi

    # Typecheck
    log_info "npm run typecheck..."
    if npm run typecheck; then
        log_success "Typecheck OK"
    else
        log_error "Typecheck failed"
        return 1
    fi

    # Tests
    log_info "npm run test..."
    if npm run test; then
        log_success "Tests OK"
    else
        log_error "Tests failed"
        return 1
    fi

    return 0
}

main() {
    log_separator
    log_info "🚀 Démarrage de l'implémentation automatique"
    log_info "Maximum d'itérations: $MAX_ITERATIONS"
    log_separator

    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))

        log_separator
        log_info "📦 Itération $ITERATION / $MAX_ITERATIONS"
        log_separator

        # Étape 1: Appeler claude /implement
        log_info "Appel de claude /implement..."

        # Utilise --print pour mode non-interactif, --permission-mode pour accepter automatiquement
        if claude -p "/implement" --allowedTools "Read,Glob,Grep,Edit,Write,Bash,TodoWrite" --permission-mode acceptEdits; then
            log_success "Claude /implement terminé"
        else
            log_warning "Claude /implement a retourné une erreur ou s'est terminé"
        fi

        # Étape 2: Validation
        if run_validation; then
            log_success "✅ Validation réussie pour l'itération $ITERATION"
        else
            log_error "❌ Validation échouée pour l'itération $ITERATION"
            log_info "Arrêt de la boucle pour correction manuelle"
            exit 1
        fi

        # Vérifier s'il reste des tâches
        log_info "Vérification des tâches restantes..."

    done

    log_separator
    log_success "🎉 Toutes les itérations sont terminées!"
    log_separator
}

# Exécution
main
