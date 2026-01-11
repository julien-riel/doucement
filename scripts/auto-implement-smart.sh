#!/bin/bash

# Script d'implémentation automatique intelligent avec Claude
# - Appelle claude /implement en boucle
# - Valide avec format, lint, typecheck, test
# - Si erreur: demande à Claude de corriger
# - Continue jusqu'à succès ou max itérations

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ITERATION=0
MAX_ITERATIONS=${1:-10}
MAX_FIX_ATTEMPTS=3
LOG_FILE="auto-implement-$(date +%Y%m%d-%H%M%S).log"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_separator() {
    echo "" | tee -a "$LOG_FILE"
    echo "════════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Exécute une commande npm et capture l'erreur
run_npm_command() {
    local cmd=$1
    local output
    local exit_code

    output=$(npm run "$cmd" 2>&1) || exit_code=$?

    if [ -z "$exit_code" ]; then
        exit_code=0
    fi

    echo "$output"
    return $exit_code
}

# Validation complète
run_validation() {
    local errors=""

    log_info "📋 Exécution des validations..."

    # Format
    log_info "  → npm run format..."
    if npm run format > /dev/null 2>&1; then
        log_success "  ✓ Format OK"
    else
        log_error "  ✗ Format failed"
        errors+="format "
    fi

    # Lint
    log_info "  → npm run lint..."
    local lint_output
    if lint_output=$(npm run lint 2>&1); then
        log_success "  ✓ Lint OK"
    else
        log_error "  ✗ Lint failed"
        errors+="lint "
        echo "$lint_output" >> "$LOG_FILE"
    fi

    # Typecheck
    log_info "  → npm run typecheck..."
    local typecheck_output
    if typecheck_output=$(npm run typecheck 2>&1); then
        log_success "  ✓ Typecheck OK"
    else
        log_error "  ✗ Typecheck failed"
        errors+="typecheck "
        echo "$typecheck_output" >> "$LOG_FILE"
    fi

    # Tests
    log_info "  → npm run test..."
    local test_output
    if test_output=$(npm run test 2>&1); then
        log_success "  ✓ Tests OK"
    else
        log_error "  ✗ Tests failed"
        errors+="test "
        echo "$test_output" >> "$LOG_FILE"
    fi

    if [ -z "$errors" ]; then
        return 0
    else
        echo "$errors"
        return 1
    fi
}

# Demande à Claude de corriger les erreurs
fix_errors() {
    local error_type=$1
    local attempt=$2

    log_info "🔧 Tentative de correction $attempt/$MAX_FIX_ATTEMPTS pour: $error_type"

    # Capture l'erreur spécifique
    local error_output=""

    case $error_type in
        *lint*)
            error_output=$(npm run lint 2>&1 || true)
            ;;
        *typecheck*)
            error_output=$(npm run typecheck 2>&1 || true)
            ;;
        *test*)
            error_output=$(npm run test 2>&1 || true)
            ;;
    esac

    # Demande à Claude de corriger
    local prompt="Les validations ont échoué avec les erreurs suivantes. Corrige-les:

Erreurs de: $error_type

$error_output

Corrige ces erreurs en modifiant les fichiers appropriés."

    log_info "Appel de Claude pour correction..."

    if claude -p "$prompt" --allowedTools "Read,Glob,Grep,Edit,Write,Bash" --permission-mode acceptEdits; then
        log_success "Claude a tenté une correction"
        return 0
    else
        log_error "Claude n'a pas pu corriger"
        return 1
    fi
}

# Boucle principale
main() {
    log_separator
    log_info "🚀 Démarrage de l'implémentation automatique intelligente"
    log_info "Maximum d'itérations: $MAX_ITERATIONS"
    log_info "Log file: $LOG_FILE"
    log_separator

    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))

        log_separator
        log_info "📦 ITÉRATION $ITERATION / $MAX_ITERATIONS"
        log_separator

        # Étape 1: Appeler claude /implement
        log_info "🤖 Appel de claude /implement..."

        if claude -p "/implement" --allowedTools "Read,Glob,Grep,Edit,Write,Bash,TodoWrite" --permission-mode acceptEdits; then
            log_success "Claude /implement terminé avec succès"
        else
            log_warning "Claude /implement terminé (possible fin des tâches)"
        fi

        # Étape 2: Validation avec tentatives de correction
        local fix_attempt=0
        local validation_passed=false

        while [ $fix_attempt -lt $MAX_FIX_ATTEMPTS ]; do
            log_separator
            log_info "🔍 Validation (tentative $((fix_attempt + 1))/$MAX_FIX_ATTEMPTS)"

            local errors
            if errors=$(run_validation); then
                validation_passed=true
                break
            else
                fix_attempt=$((fix_attempt + 1))

                if [ $fix_attempt -lt $MAX_FIX_ATTEMPTS ]; then
                    fix_errors "$errors" $fix_attempt
                else
                    log_error "Maximum de tentatives de correction atteint"
                fi
            fi
        done

        if [ "$validation_passed" = true ]; then
            log_success "✅ Itération $ITERATION réussie!"

            # Commit automatique optionnel
            if [ "${AUTO_COMMIT:-false}" = "true" ]; then
                log_info "📝 Commit automatique..."
                git add -A
                git commit -m "feat: auto-implement iteration $ITERATION" || true
            fi
        else
            log_error "❌ Itération $ITERATION échouée après $MAX_FIX_ATTEMPTS tentatives"
            log_info "Arrêt pour correction manuelle. Voir le log: $LOG_FILE"
            exit 1
        fi

    done

    log_separator
    log_success "🎉 Toutes les $MAX_ITERATIONS itérations terminées avec succès!"
    log_separator
}

# Gestion des signaux
trap 'log_warning "Interruption reçue, arrêt..."; exit 130' INT TERM

# Vérification que claude est installé
if ! command -v claude &> /dev/null; then
    log_error "Claude CLI n'est pas installé ou pas dans le PATH"
    exit 1
fi

# Exécution
main "$@"
