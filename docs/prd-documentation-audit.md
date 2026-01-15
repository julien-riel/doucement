# PRD - Audit et Amélioration Documentation

## Objectif

Porter la documentation du projet Doucement à un niveau de qualité production, avec une couverture complète des fonctionnalités, une structure claire sans duplication, et une documentation technique pour les contributeurs.

## Contexte

### Situation actuelle

Un audit a révélé que la documentation couvre environ 60% des fonctionnalités implémentées. Plusieurs features avancées ne sont pas documentées, des fichiers sont mal placés, et il manque une documentation technique (architecture, JSDoc).

### Problèmes identifiés

1. **Fonctionnalités non documentées** :
   - Habit stacking (chaînage d'habitudes)
   - Modes de tracking (simple/detailed/counter)
   - Modes d'entrée (replace/cumulative)
   - Agrégation hebdomadaire (count-days/sum-units)
   - Pauses planifiées
   - Recalibration après absence prolongée
   - Système de milestones (25/50/75/100%)
   - Pattern analysis (meilleurs jours/heures)
   - Export PNG/PDF
   - Quick check-in (PWA shortcut)
   - Implementation intentions (détails)
   - Identity statements (détails)

2. **Problèmes structurels** :
   - `fonctionnalités-souhaitées.md` à la racine (devrait être archivé ou dans backlog)
   - `sources.md` à la racine (devrait être dans docs/)
   - Pas de glossaire des termes techniques
   - Pas de documentation d'architecture

3. **Duplications** :
   - Architecture technique dans prd.md, CLAUDE.md, README.md
   - Stratégie de tests dispersée dans 3 fichiers

## Use Cases

### UC1 - Nouveau contributeur
Un développeur clone le projet et veut comprendre l'architecture et les conventions avant de contribuer.

### UC2 - Utilisateur avancé
Un utilisateur veut comprendre les fonctionnalités avancées (habit stacking, modes de tracking) pour mieux utiliser l'app.

### UC3 - Maintenance
Le mainteneur veut retrouver rapidement comment fonctionne un service ou un type.

## Architecture documentaire cible

```
docs/
├── prd.md                          # PRD principal (existant)
├── GLOSSARY.md                     # NOUVEAU - Termes et concepts
├── ARCHITECTURE.md                 # NOUVEAU - Architecture avec diagrammes
├── coherence-matrix.md             # Existant
├── technical-reference.md          # Existant
├── features/                       # NOUVEAU - Guides par fonctionnalité
│   ├── habit-stacking.md
│   ├── tracking-modes.md
│   ├── weekly-habits.md
│   ├── milestones.md
│   ├── planned-pause.md
│   ├── statistics-export.md
│   └── pattern-analysis.md
├── testing/                        # NOUVEAU - Consolidation tests
│   ├── strategy.md                 # Consolidé depuis README/CONTRIBUTING/CLAUDE
│   ├── test-data.md                # Existant, déplacé
│   └── debug-mode.md               # Existant, déplacé
├── comm/                           # Existant
│   ├── banque-messages.md
│   ├── guide-utilisateur.md        # À enrichir
│   └── textes-onboarding.md
├── design/                         # Existant
│   └── design-system-specification.md
└── archive/                        # Existant
    └── ...
```

## Livrables

### Phase 1 - Structure et nettoyage
- Déplacer fichiers orphelins
- Créer structure docs/features/ et docs/testing/
- Consolider documentation tests

### Phase 2 - Glossaire et Architecture
- Créer GLOSSARY.md avec tous les termes techniques
- Créer ARCHITECTURE.md avec diagrammes Mermaid

### Phase 3 - Guides fonctionnalités
- Créer 7 guides dans docs/features/
- Chaque guide : description, cas d'usage, structure données, exemples

### Phase 4 - Guide utilisateur enrichi
- Enrichir guide-utilisateur.md avec fonctionnalités avancées
- Ajouter sections pour chaque feature manquante

### Phase 5 - Documentation technique
- Ajouter JSDoc aux services clés (progression.ts, statistics.ts, storage.ts)
- Mettre à jour coherence-matrix.md si nécessaire

### Phase 6 - Validation finale
- Relecture et cohérence
- Mise à jour README.md et CLAUDE.md (références)
- Supprimer duplications restantes

## Critères de succès

1. **Couverture** : 100% des fonctionnalités implémentées sont documentées
2. **Structure** : Aucun fichier orphelin, hiérarchie claire
3. **Duplication** : Pas de contenu dupliqué significatif
4. **Accessibilité** : Un nouveau contributeur peut comprendre le projet en 30 min
5. **Maintenabilité** : Chaque document a un périmètre clair

## Hors périmètre

- Traduction de la documentation en anglais (existant FR suffit)
- Génération automatique de documentation (Storybook, TypeDoc)
- Documentation vidéo ou tutoriels interactifs
