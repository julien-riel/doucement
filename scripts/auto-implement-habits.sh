#!/bin/bash

# Script d'implémentation automatique pour les types d'habitudes
# - Lit habits-tasks.json pour trouver les tâches pending
# - Appelle claude /implement-habits en boucle
# - Valide avec format, lint, typecheck, test
# - Lance les tests E2E si demandé
# - Commit et push automatique si tout passe
# - Continue jusqu'à succès ou max itérations

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ITERATION=0
MAX_ITERATIONS=${1:-10}
MAX_FIX_ATTEMPTS=3
RUN_E2E=${2:-false}
AUTO_COMMIT=${3:-true}
AUTO_PUSH=${4:-false}
LOG_FILE="auto-implement-habits-$(date +%Y%m%d-%H%M%S).log"

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

log_phase() {
    echo -e "${MAGENTA}[PHASE]${NC} $1" | tee -a "$LOG_FILE"
}

log_separator() {
    echo "" | tee -a "$LOG_FILE"
    echo "════════════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Compte les tâches pending dans habits-tasks.json
count_pending_tasks() {
    if [ -f "habits-tasks.json" ]; then
        grep -o '"status": "pending"' habits-tasks.json | wc -l
    else
        echo "0"
    fi
}

# Validation complète
run_validation() {
    local errors=""

    log_info "Exécution des validations..."

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

    # Tests unitaires
    log_info "  → npm run test..."
    local test_output
    if test_output=$(npm run test 2>&1); then
        log_success "  ✓ Tests unitaires OK"
    else
        log_error "  ✗ Tests unitaires failed"
        errors+="test "
        echo "$test_output" >> "$LOG_FILE"
    fi

    # Tests E2E si demandé
    if [ "$RUN_E2E" = "true" ]; then
        log_info "  → npm run test:e2e..."
        local e2e_output
        if e2e_output=$(npm run test:e2e 2>&1); then
            log_success "  ✓ Tests E2E OK"
        else
            log_warning "  ⚠ Tests E2E failed (non-bloquant)"
            echo "$e2e_output" >> "$LOG_FILE"
        fi
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

    log_info "Tentative de correction $attempt/$MAX_FIX_ATTEMPTS pour: $error_type"

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

Corrige ces erreurs en modifiant les fichiers appropriés. Consulte docs/habit-types-analysis.md si nécessaire."

    log_info "Appel de Claude pour correction..."

    if claude -p "$prompt" --allowedTools "Read,Glob,Grep,Edit,Write,Bash" --permission-mode acceptEdits; then
        log_success "Claude a tenté une correction"
        return 0
    else
        log_error "Claude n'a pas pu corriger"
        return 1
    fi
}

# Commit automatique
do_commit() {
    local iteration=$1

    if [ "$AUTO_COMMIT" = "true" ]; then
        log_info "Commit automatique..."

        git add -A

        # Générer un message de commit intelligent
        local pending_before=$(count_pending_tasks)
        local commit_msg="feat(habits): auto-implement iteration $iteration

Tâches restantes: $pending_before

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

        if git commit -m "$commit_msg"; then
            log_success "Commit créé"

            if [ "$AUTO_PUSH" = "true" ]; then
                log_info "Push automatique..."
                if git push; then
                    log_success "Push réussi"
                else
                    log_warning "Push échoué (non-bloquant)"
                fi
            fi
        else
            log_warning "Rien à commiter"
        fi
    fi
}

# Release automatique
do_release() {
    log_phase "Lancement de la release..."

    # Appeler la commande /release de Claude
    if claude -p "/release" --allowedTools "Read,Glob,Grep,Edit,Write,Bash,TodoWrite" --permission-mode acceptEdits; then
        log_success "Release terminée"
    else
        log_warning "Release échouée ou interrompue"
    fi
}

# Boucle principale
main() {
    log_separator
    log_phase "Démarrage de l'implémentation automatique des types d'habitudes"
    log_info "Maximum d'itérations: $MAX_ITERATIONS"
    log_info "Tests E2E: $RUN_E2E"
    log_info "Auto-commit: $AUTO_COMMIT"
    log_info "Auto-push: $AUTO_PUSH"
    log_info "Log file: $LOG_FILE"

    local pending=$(count_pending_tasks)
    log_info "Tâches pending au démarrage: $pending"
    log_separator

    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))

        # Vérifier s'il reste des tâches
        pending=$(count_pending_tasks)
        if [ "$pending" -eq "0" ]; then
            log_success "Toutes les tâches sont terminées !"
            break
        fi

        log_separator
        log_phase "ITÉRATION $ITERATION / $MAX_ITERATIONS (${pending} tâches restantes)"
        log_separator

        # Étape 1: Appeler claude /implement-habits
        log_info "Appel de claude /implement-habits..."

        if claude -p "/implement-habits" --allowedTools "Read,Glob,Grep,Edit,Write,Bash,TodoWrite" --permission-mode acceptEdits; then
            log_success "Claude /implement-habits terminé avec succès"
        else
            log_warning "Claude /implement-habits terminé (possible fin des tâches)"
        fi

        # Étape 2: Validation avec tentatives de correction
        local fix_attempt=0
        local validation_passed=false

        while [ $fix_attempt -lt $MAX_FIX_ATTEMPTS ]; do
            log_separator
            log_info "Validation (tentative $((fix_attempt + 1))/$MAX_FIX_ATTEMPTS)"

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
            do_commit $ITERATION
        else
            log_error "❌ Itération $ITERATION échouée après $MAX_FIX_ATTEMPTS tentatives"
            log_info "Arrêt pour correction manuelle. Voir le log: $LOG_FILE"
            exit 1
        fi

    done

    log_separator

    # Vérification finale
    pending=$(count_pending_tasks)
    if [ "$pending" -eq "0" ]; then
        log_success "🎉 Toutes les tâches sont terminées!"

        # Proposer une release
        read -p "Voulez-vous créer une release ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            do_release
        fi
    else
        log_warning "⚠ Il reste $pending tâches pending après $MAX_ITERATIONS itérations"
    fi

    log_separator
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 [max_iterations] [run_e2e] [auto_commit] [auto_push]"
    echo ""
    echo "Arguments:"
    echo "  max_iterations  Nombre maximum d'itérations (défaut: 10)"
    echo "  run_e2e         Lancer les tests E2E: true/false (défaut: false)"
    echo "  auto_commit     Commit automatique: true/false (défaut: true)"
    echo "  auto_push       Push automatique: true/false (défaut: false)"
    echo ""
    echo "Exemples:"
    echo "  $0              # 10 itérations, pas d'E2E, commit auto, pas de push"
    echo "  $0 5            # 5 itérations"
    echo "  $0 10 true      # Avec tests E2E"
    echo "  $0 10 true true true  # Tout automatique avec push"
}

# Gestion des arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Gestion des signaux
trap 'log_warning "Interruption reçue, arrêt..."; exit 130' INT TERM

# Vérification que claude est installé
if ! command -v claude &> /dev/null; then
    log_error "Claude CLI n'est pas installé ou pas dans le PATH"
    exit 1
fi

# Vérification que habits-tasks.json existe
if [ ! -f "habits-tasks.json" ]; then
    log_error "habits-tasks.json n'existe pas. Créez-le d'abord."
    exit 1
fi

# Exécution
main "$@"
