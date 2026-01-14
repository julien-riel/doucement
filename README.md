# Doucement

**Application de suivi d'habitudes progressives, sans culpabilité.**

*Doucement* signifie "gently/slowly" en français. Cette application aide les utilisateurs à construire ou réduire des habitudes de manière progressive, sans pression ni culpabilité.

<p align="center">
  <img src="public/icon-512.svg" alt="Doucement Logo" width="128" height="128">
</p>

## Fonctionnalités

- **Dose du jour** : Voyez uniquement votre objectif pour aujourd'hui, jamais d'objectifs à long terme intimidants
- **Habitudes progressives** : Augmentez ou diminuez progressivement vos habitudes (ex: +3% push-ups/semaine, -5% cigarettes/semaine)
- **Effort partiel = succès** : 70% de complétion est toujours une victoire
- **Pas de vocabulaire d'échec** : Jamais de mots comme "échec", "raté" ou "streak perdu"
- **100% privé** : Toutes les données restent sur votre appareil (localStorage)
- **PWA** : Installable sur mobile et bureau, fonctionne hors ligne
- **Multilingue** : Français (par défaut) et Anglais

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

Les contributions sont les bienvenues ! Veuillez consulter le [guide de contribution](CONTRIBUTING.md) (à venir).

### Principes de développement

- Suivez le design system défini dans `docs/design/design-system-specification.md`
- Utilisez un ton bienveillant dans tous les messages utilisateur
- N'utilisez jamais de rouge (associé à l'échec)
- Respectez les cibles de toucher minimum de 44x44px

## Licence

Ce projet est sous licence MIT.

---

*Construit avec soin pour vous aider à progresser en douceur.*
