# Doucement

**Application de suivi d'habitudes progressives, sans culpabilité.**

*Doucement* signifie "gently/slowly" en français. Cette application aide les utilisateurs à construire ou réduire des habitudes de manière progressive, sans pression ni culpabilité.

<p align="center">
  <img src="public/icon-512.svg" alt="Doucement Logo" width="128" height="128">
</p>

## Fonctionnalités

### Concept de base
- **Dose du jour** : Voyez uniquement votre objectif pour aujourd'hui, jamais d'objectifs à long terme intimidants
- **Habitudes progressives** : Augmentez ou diminuez progressivement vos habitudes (ex: +3% push-ups/semaine, -5% cigarettes/semaine)
- **Effort partiel = succès** : 70% de complétion est toujours une victoire
- **Pas de vocabulaire d'échec** : Jamais de mots comme "échec", "raté" ou "streak perdu"

### Modes de suivi
- **Simple** : Habitudes binaires (fait / pas fait)
- **Détaillé** : Suivi quantitatif avec valeur précise
- **Compteur** : Suivi incrémental au fil de la journée

### Fonctionnalités avancées
- **Habitudes hebdomadaires** : Objectifs répartis sur la semaine
- **Chaînage d'habitudes** : Ancrer une nouvelle habitude à une existante
- **Pauses planifiées** : Suspendre une habitude sans impact sur les stats
- **Célébrations** : Confettis aux jalons 25%, 50%, 75%, 100%
- **Exports** : PNG (partage), PDF (rapport), JSON (sauvegarde)

### Vie privée et accessibilité
- **100% privé** : Toutes les données restent sur votre appareil (localStorage)
- **PWA** : Installable sur mobile et bureau, fonctionne hors ligne
- **Multilingue** : Français (par défaut) et Anglais

> **Documentation complète** : Voir [docs/features/](docs/features/) pour les guides détaillés de chaque fonctionnalité.

## Capture d'écran

L'application adopte une esthétique "Soft Organic" : douce, chaleureuse et naturelle avec des coins très arrondis et des couleurs orangées.

## Installation

### Prérequis

- Node.js 18+
- npm 9+

### Étapes

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/doucement.git
cd doucement

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

## Utilisation

### Développement

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Compiler pour la production
npm run preview      # Prévisualiser la version de production
```

### Tests

```bash
npm run test         # Exécuter les tests unitaires (Vitest)
npm run test:e2e     # Exécuter les tests E2E (Playwright)
```

> **Documentation complète** : Voir [docs/testing/strategy.md](docs/testing/strategy.md) pour la stratégie de tests.

### Qualité du code

```bash
npm run lint         # Vérifier le code avec ESLint
npm run typecheck    # Vérifier les types TypeScript
npm run format       # Formater le code avec Prettier
```

### Vérification de santé

```bash
./scripts/health-check.sh   # Audit complet de la qualité du code
```

## Architecture

```
src/
├── components/       # Composants React
│   ├── ui/          # Composants UI réutilisables
│   ├── habits/      # Composants spécifiques aux habitudes
│   ├── charts/      # Visualisations
│   └── layout/      # Mise en page
├── pages/           # Pages de l'application
├── services/        # Logique métier
├── hooks/           # Hooks React personnalisés
├── types/           # Définitions TypeScript
├── i18n/            # Internationalisation
├── utils/           # Fonctions utilitaires
└── styles/          # Styles globaux et design tokens
```

## Technologies

- **React 18** avec TypeScript
- **Vite** pour le bundling et HMR
- **React Router** pour la navigation
- **Recharts** pour les graphiques
- **i18next** pour l'internationalisation
- **Vitest** pour les tests unitaires
- **Playwright** pour les tests E2E

## Contribution

Les contributions sont les bienvenues ! Consultez le [guide de contribution](CONTRIBUTING.md).

### Principes de développement

- Suivez le [design system](docs/design/design-system-specification.md)
- Utilisez un ton bienveillant dans tous les messages utilisateur
- N'utilisez jamais de rouge (associé à l'échec)
- Respectez les cibles de toucher minimum de 44x44px

## Documentation

| Document | Description |
|----------|-------------|
| [Guide utilisateur](docs/comm/guide-utilisateur.md) | Guide complet pour les utilisateurs |
| [Glossaire](docs/GLOSSARY.md) | Définitions des termes techniques |
| [Architecture](docs/ARCHITECTURE.md) | Architecture et flux de données |
| [Fonctionnalités](docs/features/) | Guides détaillés par fonctionnalité |
| [Tests](docs/testing/strategy.md) | Stratégie de tests |
| [Design System](docs/design/design-system-specification.md) | Spécifications visuelles |

## Licence

Ce projet est sous licence MIT.

---

*Construit avec soin pour vous aider à progresser en douceur.*
