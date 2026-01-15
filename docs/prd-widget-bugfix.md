# PRD : Correction des bugs widgets (Time Widgets v1.35.x)

## Objectif

Corriger les bugs identifiés suite à l'implémentation des widgets chronomètre, minuterie et slider (v1.31.0 - v1.35.3).

## Contexte

### Bugs identifiés

Deux bugs ont été signalés après le déploiement :

1. **Erreur slider (stale closure)** : Le widget slider ne fonctionne pas correctement à cause d'une dépendance manquante dans un `useCallback`
2. **Erreur création d'habitude** : Erreur "Unexpected Application Error 310" lors de la sélection du mode slider en création

### Impact utilisateur

- Impossibilité de créer des habitudes avec le mode slider
- Comportement erratique du widget slider existant

## Analyse technique

### Bug 1 : Stale closure dans SliderCheckIn

**Fichier** : `src/components/habits/SliderCheckIn.tsx`
**Ligne** : 80

**Problème** :
```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ...
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()  // ← handleSubmit appelé
    }
  },
  [config.min, config.max, config.step]  // ← handleSubmit MANQUANT
)
```

La fonction `handleSubmit` n'est pas dans le tableau de dépendances de `handleKeyDown`. Cela crée une "stale closure" où `handleSubmit` référence une ancienne version de la fonction avec des valeurs obsolètes de `value` et `onCheckIn`.

**Solution** : Ajouter `handleSubmit` aux dépendances.

### Bug 2 : Erreur 310 en création

**Fichier probable** : `src/pages/CreateHabit/steps/SliderConfigSection.tsx`
**Ligne** : 310 (bouton preset "pain")

**Hypothèses** :
1. Le contexte n'est pas correctement initialisé quand on sélectionne le mode slider
2. `form.sliderConfig` est `null` et une opération est faite dessus avant initialisation
3. Race condition entre `handleTrackingModeChange` et le rendu de `SliderConfigSection`

**Investigation nécessaire** :
- Vérifier que `handleTrackingModeChange` initialise bien `sliderConfig` AVANT le rendu de `SliderConfigSection`
- Vérifier les accès à `config.emojiRanges` quand `config` pourrait être partiellement initialisé

## Corrections à appliquer

### Correction 1 : SliderCheckIn.tsx

```typescript
// Avant (ligne 80)
[config.min, config.max, config.step]

// Après
[config.min, config.max, config.step, handleSubmit]
```

### Correction 2 : SliderConfigSection.tsx ou CreateHabitContext

Investigation et correction selon la cause identifiée :

**Option A** : Si c'est un problème d'initialisation
- Assurer que `updateForm('sliderConfig', DEFAULT_MOOD_SLIDER_CONFIG)` est appelé de manière synchrone

**Option B** : Si c'est un problème d'accès null
- Ajouter des vérifications défensives dans `SliderConfigSection`

**Option C** : Si c'est un problème de timing React
- Utiliser `useEffect` pour s'assurer que la config est initialisée avant rendu

## Critères de succès

1. **Slider fonctionnel** :
   - Touche Enter enregistre la valeur correctement
   - Bouton "Valider" fonctionne
   - Pas d'erreur console

2. **Création d'habitude slider** :
   - Sélection du mode slider fonctionne
   - Presets (Humeur, Énergie, Douleur) cliquables
   - Création réussie de l'habitude
   - Habitude s'affiche correctement sur Today

## Tests à effectuer

### Tests manuels

1. Créer une nouvelle habitude avec mode slider
2. Modifier une habitude existante vers mode slider
3. Utiliser le widget slider avec clavier (flèches + Enter)
4. Utiliser le widget slider avec souris
5. Vérifier les presets du slider en création

### Tests E2E

- Mettre à jour `e2e/slider-habit.spec.ts` si nécessaire
- Ajouter un test spécifique pour la touche Enter

## Fichiers concernés

| Fichier | Type de modification |
|---------|---------------------|
| `src/components/habits/SliderCheckIn.tsx` | Bug fix (dépendance) |
| `src/pages/CreateHabit/steps/SliderConfigSection.tsx` | Investigation/Bug fix |
| `src/pages/CreateHabit/steps/StepDetails.tsx` | Investigation |
| `src/pages/CreateHabit/CreateHabitContext.tsx` | Investigation |
| `e2e/slider-habit.spec.ts` | Tests additionnels |
