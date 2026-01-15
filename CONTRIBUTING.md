# Guide de Contribution

Merci de vouloir contribuer à **Doucement** ! Ce guide vous aidera à démarrer.

## Table des matières

- [Installation locale](#installation-locale)
- [Architecture du projet](#architecture-du-projet)
- [Conventions de code](#conventions-de-code)
- [Design System](#design-system)
- [Processus de contribution](#processus-de-contribution)
- [Code Review](#code-review)
- [Tests](#tests)

## Installation locale

### Prérequis

- Node.js 18+
- npm 9+

### Setup

```bash
# Cloner le repository
git clone https://github.com/votre-username/doucement.git
cd doucement

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Commandes utiles

```bash
npm run dev          # Serveur de développement (http://localhost:5173)
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run test         # Exécuter les tests unitaires
npm run test:watch   # Tests en mode watch
npm run lint         # Vérifier le linting
npm run typecheck    # Vérifier les types TypeScript
npm run format       # Formater le code avec Prettier
```

## Architecture du projet

```
src/
├── components/       # Composants React
│   ├── ui/          # Composants UI réutilisables
│   ├── habits/      # Composants liés aux habitudes
│   ├── charts/      # Composants de visualisation
│   ├── layout/      # Composants de mise en page
│   ├── onboarding/  # Composants d'onboarding
│   └── debug/       # Outils de debug
├── pages/           # Pages de l'application
├── hooks/           # Hooks React personnalisés
├── services/        # Logique métier
├── types/           # Définitions TypeScript
├── utils/           # Fonctions utilitaires
├── contexts/        # Contextes React
├── i18n/            # Internationalisation (fr, en)
└── styles/          # Styles globaux
```

## Conventions de code

### TypeScript

- Utiliser des types explicites, éviter `any`
- Préférer les interfaces aux types pour les objets
- Documenter les fonctions complexes avec JSDoc

### React

- Composants fonctionnels uniquement
- Hooks personnalisés dans `src/hooks/`
- Props typées avec des interfaces

### Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `HabitCard.tsx` |
| Hooks | camelCase avec `use` | `useAppData.ts` |
| Services | camelCase | `progression.ts` |
| Types | PascalCase | `Habit`, `DailyEntry` |
| CSS | kebab-case avec BEM | `.habit-card__title` |

### Style de code

- 2 espaces pour l'indentation
- Pas de point-virgule (géré par Prettier)
- Guillemets simples pour les strings
- Virgules trailing

## Design System

Consultez le design system complet dans [`docs/design/design-system-specification.md`](docs/design/design-system-specification.md).

### Points clés

- **Esthétique** : "Soft Organic" - coins arrondis, couleurs chaudes
- **Couleur primaire** : Orange `#F27D16`
- **Couleur secondaire** : Vert `#22C55E`
- **Pas de rouge** : Associé à l'échec, jamais utilisé
- **Touch targets** : Minimum 44x44px
- **Fonts** : Fraunces (titres), Source Sans 3 (corps)

### Vocabulaire UX

L'application utilise un vocabulaire positif et sans jugement :

| À éviter | À utiliser |
|----------|------------|
| échec, raté | progression, pause |
| objectif | dose du jour |
| score | progression |
| supprimer | archiver |
| streak | régularité |

Consultez [`docs/comm/banque-messages.md`](docs/comm/banque-messages.md) pour les messages officiels.

## Processus de contribution

### 1. Créer une issue

Avant de commencer, vérifiez qu'une issue n'existe pas déjà :
- Bug : Décrivez le comportement attendu vs actuel
- Feature : Expliquez le cas d'usage

### 2. Fork et branche

```bash
# Forker le repo sur GitHub, puis :
git clone https://github.com/votre-username/doucement.git
git checkout -b feat/ma-feature
# ou
git checkout -b fix/mon-bugfix
```

### 3. Développement

1. Écrire le code en suivant les conventions
2. Ajouter/mettre à jour les tests
3. Vérifier que tout passe :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### 4. Commit

Utiliser les [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajouter le mode sombre
fix: corriger le calcul de progression
docs: mettre à jour le README
style: formater le code
refactor: restructurer les hooks
test: ajouter tests pour useAppData
chore: mettre à jour les dépendances
```

### 5. Pull Request

1. Pusher votre branche
2. Ouvrir une PR vers `main`
3. Remplir le template de PR
4. Attendre la review

## Code Review

### Critères de validation

- [ ] Tests passent (`npm run test`)
- [ ] Types valides (`npm run typecheck`)
- [ ] Linting OK (`npm run lint`)
- [ ] Build réussit (`npm run build`)
- [ ] Documentation à jour si nécessaire
- [ ] Respect du design system
- [ ] Vocabulaire UX approprié

### Bonnes pratiques

- Répondre aux commentaires de façon constructive
- Petites PR focalisées (< 400 lignes)
- Description claire des changements
- Screenshots pour les changements UI

## Tests

> **Documentation complète** : Consultez [`docs/testing/strategy.md`](docs/testing/strategy.md) pour la stratégie de tests détaillée.

### Tests unitaires (Vitest)

```bash
npm run test           # Exécution unique
npm run test:watch     # Mode watch
npm run test -- --coverage  # Avec couverture
```

### Tests E2E (Playwright)

Les tests E2E utilisent des fichiers de données dans `public/test-data/` (voir [`docs/testing/test-data.md`](docs/testing/test-data.md)) :

```bash
# Build + preview (requis avant les tests E2E)
npm run build && npm run preview

# Dans un autre terminal
npx playwright test
```

### Fichiers de test

- Tests unitaires : `*.test.ts` ou `*.test.tsx` à côté du fichier source
- Mocks : Utiliser `vi.mock()` de Vitest
- Assertions : `expect()` avec les matchers Vitest
- Fixtures : Utiliser les fixtures centralisées dans `src/test/fixtures/`

## Questions ?

- Ouvrir une issue sur GitHub
- Consulter la documentation dans `docs/`

Merci pour votre contribution !
