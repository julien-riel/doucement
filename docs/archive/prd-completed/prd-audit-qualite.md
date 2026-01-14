# PRD - Audit Qualité et Cohérence du Codebase

## Objectif

Réaliser un audit qualité complet du codebase Doucement pour :
- Identifier et éliminer les incohérences et doublons
- Valider la pertinence des tests
- Synchroniser la documentation avec le code
- Améliorer la structure globale du projet
- Créer des outils pour maintenir la qualité dans le temps

## Contexte

Le projet Doucement a évolué rapidement avec des phases d'implémentation automatisée. Cette croissance a potentiellement introduit :
- Des fichiers de tests auto-générés très volumineux
- Des répertoires et fichiers obsolètes
- Des constantes dupliquées ou inutilisées
- Une documentation potentiellement désynchronisée

### État actuel identifié

| Métrique | Valeur |
|----------|--------|
| Code source | ~30 400 LOC |
| Tests unitaires | ~8 500 LOC |
| Tests E2E | 25 fichiers spec |
| Services | 11 services core |
| Pages | 9 pages |
| Composants | 70+ composants |
| Documentation | 15 fichiers |

### Problèmes identifiés

1. **Fichiers de tests anormalement volumineux**
   - `useAppData.test.ts` : 33 697 lignes (source : ~15 000)
   - `useDebugMode.test.ts` : 16 447 lignes
   - `absence.test.ts` : 16 710 lignes
   - `habitDisplay.test.ts` : 14 749 lignes
   - `CheckInButtons.test.tsx` : 15 092 lignes

2. **Répertoires vides/obsolètes**
   - `/src/components/Button/` (Button existe dans ui/)
   - `/src/components/Card/` (Card existe dans ui/)
   - `/src/components/BottomNav/` (semble inutilisé)

3. **Fichiers de constantes massifs**
   - `constants/messages.ts` : 27 616 lignes
   - `constants/suggestedHabits.ts` : 28 246 lignes

4. **Couverture tests unitaires partielle**
   - Pages : 0/9 testées
   - Composants UI : 0/17 testés
   - Composants habits : 2/54 testés

## Use Cases

### UC1 - Développeur maintenant le code
- Veut comprendre rapidement la structure
- Besoin de savoir quels tests sont pertinents
- Doit pouvoir vérifier la cohérence types/code/docs

### UC2 - Développeur ajoutant une feature
- Doit suivre les patterns existants
- Besoin de savoir où ajouter les tests
- Doit mettre à jour la documentation appropriée

### UC3 - Audit périodique
- Exécuter une checklist de santé
- Identifier les dérives de qualité
- Maintenir la cohérence dans le temps

## Livrables

### 1. Rapport d'audit
Document détaillant :
- Incohérences trouvées et corrigées
- Doublons identifiés et éliminés
- Tests non pertinents supprimés ou consolidés
- Documentation mise à jour

### 2. Matrice de cohérence types/code/docs
Fichier `docs/coherence-matrix.md` contenant :
- Tableau des types TypeScript principaux
- Leurs utilisations dans le code (services, composants)
- Leur documentation associée
- Statut de cohérence (✓ aligné, ⚠ divergence, ✗ manquant)

### 3. Checklist de santé projet
Script ou commande pour audit périodique vérifiant :
- Fichiers orphelins (non importés)
- Types non utilisés
- Tests sans assertions
- Documentation obsolète
- Dépendances non utilisées

## Architecture technique

### Structure cible après audit

```
src/
├── components/
│   ├── ui/           # Composants réutilisables (Button, Card, Input...)
│   ├── habits/       # Composants spécifiques aux habitudes
│   ├── layout/       # Composants de mise en page
│   ├── onboarding/   # Composants d'onboarding
│   └── charts/       # Composants de visualisation
├── pages/            # Pages de l'application
├── services/         # Logique métier
├── hooks/            # Hooks React personnalisés
├── utils/            # Fonctions utilitaires
├── types/            # Types TypeScript
├── constants/        # Constantes (à restructurer si nécessaire)
├── contexts/         # Contextes React
├── i18n/             # Internationalisation
└── test/             # Utilitaires de test
```

### Répertoires à supprimer
- `/src/components/Button/` (vide)
- `/src/components/Card/` (vide)
- `/src/components/BottomNav/` (vide)

## Contraintes

### Ne pas modifier
- Comportement fonctionnel de l'application
- Structure des types principaux (Habit, DailyEntry, AppData)
- Tests E2E existants (sauf correction de bugs)

### À préserver
- Vocabulaire UX français (pas de "échec", "raté", etc.)
- Design system (couleurs, typographie, espacements)
- Compatibilité des données existantes (schemaVersion)

## Critères de succès

1. **Aucun répertoire vide** dans src/components/
2. **Tests consolidés** - Fichiers de tests < 2x taille du code source
3. **Documentation synchronisée** - Matrice de cohérence à jour
4. **Checklist fonctionnelle** - Script exécutable sans erreur
5. **Build et tests passent** - `npm run build && npm test` OK
6. **Aucune régression** - Tests E2E passent

## Hors scope

- Ajout de nouvelles fonctionnalités
- Refactoring architectural majeur
- Migration de technologies
- Augmentation de la couverture de tests (sauf consolidation)
