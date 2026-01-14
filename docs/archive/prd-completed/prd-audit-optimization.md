# PRD - Optimisation suite à l'Audit de Maturité

**Version:** 1.0
**Date:** 2026-01-13
**Référence:** docs/audit-maturite-2026-01-13.md

---

## Objectif

Implémenter les 10 recommandations de l'audit de maturité pour améliorer le score global de **33/40 (82.5%)** vers **37/40 (92.5%)**, avec un focus prioritaire sur la performance (bundle JS de 1.8MB → 500KB).

## Contexte

L'audit de maturité v1.22.0 a révélé :
- **Score Performance : 3/5** (priorité HIGH) - Bundle JS 3x au-dessus du seuil recommandé
- **Score Documentation : 4/5** - README.md et guide de contribution absents
- **Score Maintenabilité : 4/5** - CreateHabit.tsx (1102 lignes) et Settings.tsx (539 lignes) à découper
- **Score Fonctionnalité : 4.5/5** - RecalibrationPrompt UI non accessible

### Métriques actuelles

| Métrique | Valeur actuelle | Cible |
|----------|-----------------|-------|
| Bundle JS principal | 1,802 KB | < 500 KB |
| Bundle JS gzippé | 520 KB | < 150 KB |
| Fichiers source | 122 | - |
| Fichiers de test | 13 | > 20 |
| Score global audit | 33/40 | 37/40 |

## Use Cases

### UC1 : Chargement initial rapide
**Acteur:** Utilisateur mobile
**Scénario:** L'utilisateur ouvre l'app sur mobile 4G
**Attendu:** Page interactive en < 3 secondes (vs ~6s actuellement)

### UC2 : Contribution au projet
**Acteur:** Nouveau développeur
**Scénario:** Clone le repo et veut comprendre le projet
**Attendu:** README.md standard avec setup en < 5 minutes

### UC3 : Recalibration d'habitude
**Acteur:** Utilisateur ayant dépassé ses objectifs
**Scénario:** Veut ajuster la progression de son habitude
**Attendu:** Accès facile à la fonction de recalibration depuis l'UI

### UC4 : Suivi des métriques de build
**Acteur:** Développeur
**Scénario:** Vérifie l'impact d'un changement sur la taille du bundle
**Attendu:** Script qui affiche les métriques avant/après

## Architecture Technique

### Code Splitting Strategy

```
src/
├── pages/
│   ├── Today.tsx           # Eager load (route principale)
│   ├── index.ts            # Re-exports avec React.lazy()
│   └── [autres pages]      # Lazy loaded
└── router.tsx              # React.lazy + Suspense
```

### Vendor Chunking (vite.config.ts)

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-charts': ['recharts'],
        'vendor-export': ['html2canvas', 'jspdf'],
        'vendor-i18n': ['i18next', 'react-i18next'],
        'vendor-emoji': ['emoji-picker-react']
      }
    }
  }
}
```

### Structure CreateHabit refactorisée

```
src/pages/CreateHabit/
├── index.tsx                    # Composant principal (orchestration)
├── CreateHabitContext.tsx       # État du wizard
├── steps/
│   ├── BasicInfoStep.tsx        # Étape 1: Nom, emoji, type
│   ├── TrackingModeStep.tsx     # Étape 2: Mode de suivi
│   ├── ProgressionStep.tsx      # Étape 3: Progression
│   ├── FrequencyStep.tsx        # Étape 4: Fréquence
│   ├── ImplementationStep.tsx   # Étape 5: Intention d'implémentation
│   └── SummaryStep.tsx          # Étape 6: Résumé
├── components/
│   ├── StepIndicator.tsx
│   └── NavigationButtons.tsx
└── hooks/
    └── useCreateHabitForm.ts
```

### Structure Settings refactorisée

```
src/pages/Settings/
├── index.tsx                    # Composant principal
├── sections/
│   ├── ThemeSection.tsx         # Mode clair/sombre
│   ├── LanguageSection.tsx      # i18n
│   ├── NotificationSection.tsx  # Rappels
│   ├── DataSection.tsx          # Import/Export
│   └── AboutSection.tsx         # Version, liens
└── components/
    └── SettingsCard.tsx
```

## Structures de Données

### RecalibrationPrompt (existant, à exposer)

```typescript
// Déjà dans types/index.ts
interface Habit {
  // ... autres champs
  recalibrationNeeded?: boolean;  // Flag pour déclencher le prompt
}

// Nouveau composant
interface RecalibrationPromptProps {
  habit: Habit;
  onRecalibrate: (newBaselineValue: number) => void;
  onDismiss: () => void;
}
```

### Métriques de build

```typescript
interface BuildMetrics {
  timestamp: string;
  bundles: {
    name: string;
    size: number;      // bytes
    gzipSize: number;  // bytes gzipped
  }[];
  totalSize: number;
  totalGzipSize: number;
}
```

## Composants UI

### RecalibrationPrompt

**Props:**
- `habit: Habit` - L'habitude à recalibrer
- `onRecalibrate: (value: number) => void` - Callback de validation
- `onDismiss: () => void` - Callback d'annulation

**Comportement:**
- Affiche la progression actuelle vs baseline
- Permet d'ajuster la valeur de base
- Ton bienveillant ("Tu as dépassé tes objectifs !")
- Accessible depuis HabitDetail via bouton discret

### Step Components (CreateHabit)

Chaque step doit :
- Recevoir les données du form via context
- Valider ses propres champs
- Être testable unitairement
- Suivre le design system (pas de rouge, ton bienveillant)

## Contraintes Design

- **Accessibilité:** Tous les nouveaux composants ARIA-compliant
- **Touch targets:** Minimum 44x44px
- **Pas de rouge:** Utiliser orange pour les avertissements
- **Responsive:** Mobile-first
- **Mode sombre:** Supporter les deux thèmes

## Critères de Succès

### Phase 1 (Performance Quick Wins)
- [ ] Bundle JS < 800KB (vs 1.8MB actuel)
- [ ] Lazy loading sur toutes les routes sauf Today
- [ ] Vendors chunked séparément
- [ ] README.md présent et complet

### Phase 2 (Maintenabilité)
- [ ] CreateHabit.tsx < 200 lignes
- [ ] RecalibrationPrompt accessible depuis UI
- [ ] 3+ nouveaux fichiers de tests composants

### Phase 3 (Optimisations avancées)
- [ ] Bundle JS < 600KB
- [ ] Settings.tsx < 200 lignes
- [ ] Documentation API hooks complète

### Phase 4 (Métriques & Qualité)
- [ ] Script de métriques de build fonctionnel
- [ ] Lighthouse PWA score > 90
- [ ] Score audit global ≥ 36/40

## Dépendances

- Aucune nouvelle dépendance requise
- Optimisations sur dépendances existantes (tree-shaking recharts)

## Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression fonctionnelle après refactoring | Medium | High | Tests E2E avant/après |
| Lazy loading cause flash/delay visible | Low | Medium | Skeleton loaders |
| Tree-shaking recharts casse des charts | Low | Medium | Tests visuels |

---

*Document généré automatiquement le 2026-01-13*
