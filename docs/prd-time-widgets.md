# PRD : Widgets de saisie temporels et visuels

## Objectif

Enrichir les modes de saisie des habitudes avec des widgets interactifs basés sur le temps (chronomètre, minuterie) et une saisie visuelle (slider avec emojis), permettant une expérience de check-in plus adaptée à certains types d'habitudes.

## Contexte

### Situation actuelle

L'application propose actuellement 3 modes de tracking (`TrackingMode`) :
- **simple** : Binaire (fait / pas fait)
- **detailed** : Quantitatif avec boutons intelligents
- **counter** : Compteur +1/-1

Et 2 modes de saisie (`EntryMode`) :
- **replace** : Chaque valeur remplace la précédente
- **cumulative** : Les valeurs s'additionnent dans la journée

### Manque identifié

Pour certaines habitudes basées sur le temps (méditation, lecture, exercice), les utilisateurs doivent :
1. Utiliser un chronomètre externe
2. Mémoriser le temps
3. Saisir manuellement la valeur

Cette friction réduit l'adoption et la précision des données.

De plus, pour les habitudes subjectives (humeur, douleur, énergie), un slider visuel avec emojis serait plus intuitif qu'une saisie numérique.

## Use cases prioritaires

### UC1 : Méditation chronométrée
> "Je veux méditer 10 minutes par jour. Je lance le chrono, je médite, et quand j'arrête le chrono le temps est automatiquement enregistré."

### UC2 : Gainage avec minuterie
> "Je veux tenir ma planche 2 minutes. Je lance le compte à rebours, je tiens, et si je dépasse c'est encore mieux - le temps supplémentaire est comptabilisé."

### UC3 : Sessions multiples de lecture
> "Je lis plusieurs fois par jour. Chaque session chrono s'ajoute au total du jour."

### UC4 : Suivi de l'humeur
> "Je veux noter mon humeur sur une échelle de 1 à 10 avec un emoji qui change selon ma sélection."

## Architecture technique

### Nouveaux types

```typescript
// Extension de TrackingMode
export type TrackingMode =
  | 'simple'
  | 'detailed'
  | 'counter'
  | 'stopwatch'  // Nouveau : chronomètre
  | 'timer'      // Nouveau : minuterie
  | 'slider'     // Nouveau : slider visuel

// Configuration du slider
export interface SliderConfig {
  /** Valeur minimale (défaut: 0) */
  min: number
  /** Valeur maximale (défaut: 10) */
  max: number
  /** Pas d'incrémentation (défaut: 1) */
  step: number
  /** Mapping emoji par plage de valeurs */
  emojiRanges?: EmojiRange[]
}

export interface EmojiRange {
  /** Valeur minimale de la plage (inclusive) */
  from: number
  /** Valeur maximale de la plage (inclusive) */
  to: number
  /** Emoji à afficher pour cette plage */
  emoji: string
}

// Configuration chrono/minuterie sur Habit
export interface Habit {
  // ... champs existants ...

  /** Configuration du slider (si trackingMode='slider') */
  sliderConfig?: SliderConfig
}

// État du chronomètre persisté
export interface TimerState {
  /** ID de l'habitude */
  habitId: string
  /** Date concernée (YYYY-MM-DD) */
  date: string
  /** Timestamp de démarrage (ISO) */
  startedAt: string
  /** Temps accumulé avant pause (en secondes) */
  accumulatedSeconds: number
  /** En cours ou en pause */
  isRunning: boolean
}
```

### Stockage de l'état du chronomètre

L'état des chronomètres en cours est stocké dans `localStorage` sous une clé dédiée :
- Clé : `doucement_timer_states`
- Valeur : `TimerState[]`

Cela permet de :
1. Reprendre un chrono après fermeture de l'app
2. Calculer le temps écoulé depuis `startedAt` au retour
3. Gérer plusieurs chronos simultanés (un par habitude)

### Persistance en arrière-plan

Quand l'utilisateur ferme l'app avec un chrono actif :
1. L'état est sauvegardé (startedAt + accumulatedSeconds + isRunning=true)
2. Au retour, on calcule : `temps_total = accumulatedSeconds + (now - startedAt)`
3. Le chrono reprend automatiquement

### Notification de dépassement

Quand le chrono/minuterie atteint la cible du jour :
1. Vibration courte (si supportée par le navigateur)
2. Son discret optionnel
3. Le chrono continue de tourner (pas d'interruption)

Configuration :
```typescript
export interface Habit {
  // ... autres champs ...

  /** Activer la notification quand la cible est atteinte */
  notifyOnTarget?: boolean
}
```

## Composants UI

### StopwatchCheckIn

Widget chronomètre pour mesurer une durée.

```typescript
interface StopwatchCheckInProps {
  /** Dose cible du jour (en secondes ou minutes selon unit) */
  targetDose: number
  /** Unité de temps */
  unit: 'seconds' | 'minutes'
  /** Valeur déjà enregistrée aujourd'hui */
  currentValue?: number
  /** État persisté du chrono */
  timerState?: TimerState
  /** Callback quand l'utilisateur valide */
  onCheckIn: (value: number) => void
  /** Callback pour sauvegarder l'état */
  onTimerStateChange: (state: TimerState | null) => void
  /** Notifier quand la cible est atteinte */
  notifyOnTarget?: boolean
  /** Désactivé */
  disabled?: boolean
}
```

**Comportement** :
- Boutons : Play/Pause, Stop (valide), Reset
- Affichage : Temps écoulé (MM:SS ou HH:MM:SS)
- Indicateur visuel quand la cible est atteinte/dépassée
- Mode cumulative : "Stop" ajoute le temps au total du jour

### TimerCheckIn

Widget minuterie (compte à rebours).

```typescript
interface TimerCheckInProps {
  /** Dose cible du jour (point de départ du compte à rebours) */
  targetDose: number
  /** Unité de temps */
  unit: 'seconds' | 'minutes'
  /** Valeur déjà enregistrée aujourd'hui */
  currentValue?: number
  /** État persisté */
  timerState?: TimerState
  /** Callback quand l'utilisateur valide */
  onCheckIn: (value: number) => void
  /** Callback pour sauvegarder l'état */
  onTimerStateChange: (state: TimerState | null) => void
  /** Notifier quand la cible est atteinte */
  notifyOnTarget?: boolean
  /** Désactivé */
  disabled?: boolean
}
```

**Comportement** :
- Démarre à `targetDose` et décompte vers 0
- Peut aller en négatif (affichage : "-00:15" = 15s de dépassement)
- Le temps enregistré = temps depuis le départ (pas le temps restant)

### SliderCheckIn

Widget slider avec emoji dynamique.

```typescript
interface SliderCheckInProps {
  /** Configuration du slider */
  config: SliderConfig
  /** Valeur actuelle */
  currentValue?: number
  /** Callback quand l'utilisateur valide */
  onCheckIn: (value: number) => void
  /** Désactivé */
  disabled?: boolean
}
```

**Comportement** :
- Slider horizontal de min à max
- Emoji qui change selon la valeur (mapping configurable)
- Affichage de la valeur numérique
- Bouton "Valider" pour confirmer

## Contraintes design

### Respect du design system

- Couleurs : Orange (#F27D16) pour les éléments actifs
- Pas de rouge (même pour le dépassement négatif de la minuterie)
- Border radius : 12px pour les boutons, 8px pour le slider
- Touch targets : minimum 44x44px
- Police : Source Sans 3 pour les chiffres du chrono

### États visuels du chrono/minuterie

| État | Apparence |
|------|-----------|
| Initial | Affichage "00:00", bouton Play visible |
| En cours | Temps qui défile, bouton Pause visible, fond légèrement coloré |
| En pause | Temps fixe, bouton Play visible, indicateur "en pause" |
| Cible atteinte | Bordure verte (#22C55E), petit confetti optionnel |
| Dépassement (timer) | Temps négatif en orange, continue de compter |

### Accessibilité

- Aria-labels sur tous les boutons
- Annonce vocale quand la cible est atteinte
- Contraste suffisant pour les chiffres
- Le slider doit être utilisable au clavier

## Intégration dans le flux existant

### Création d'habitude

Dans `TrackingSection.tsx`, ajouter les options :
- "Chronomètre" → `trackingMode: 'stopwatch'`
- "Minuterie" → `trackingMode: 'timer'`
- "Slider" → `trackingMode: 'slider'`

Pour le slider, afficher un configurateur :
- Min / Max
- Mapping emoji (interface simplifiée avec 3 plages par défaut)

### HabitCard

La logique de sélection de widget dans `HabitCard.tsx` :
```typescript
switch (habit.trackingMode) {
  case 'stopwatch':
    return <StopwatchCheckIn {...props} />
  case 'timer':
    return <TimerCheckIn {...props} />
  case 'slider':
    return <SliderCheckIn {...props} />
  // ... cas existants
}
```

### Compatibilité EntryMode

Les widgets chrono/minuterie sont compatibles avec :
- `entryMode: 'replace'` → Chaque session remplace la précédente
- `entryMode: 'cumulative'` → Les sessions s'additionnent

Le slider est en mode replace uniquement (une seule valeur par jour).

### Statistiques

Les valeurs des nouveaux widgets sont stockées comme des `actualValue` numériques standard. Elles s'intègrent naturellement dans :
- Les graphiques de progression
- Le heatmap calendrier
- Les statistiques hebdomadaires

## Critères de succès

1. **Fluidité** : Démarrer/arrêter un chrono en moins de 2 taps
2. **Fiabilité** : Le chrono reprend correctement après fermeture de l'app
3. **Précision** : Le temps affiché est exact à la seconde près
4. **Intuitivité** : L'utilisateur comprend le slider emoji sans explication
5. **Cohérence** : Les nouveaux widgets respectent le design system existant

## Documentation à mettre à jour

### Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `docs/GLOSSARY.md` | Ajouter : stopwatch, timer, slider, TimerState, SliderConfig, EmojiRange |
| `docs/ARCHITECTURE.md` | Diagramme des composants avec nouveaux widgets, flux de persistance chrono |
| `docs/features/tracking-modes.md` | Section dédiée aux nouveaux modes |
| `CLAUDE.md` | Référencer les nouveaux tracking modes dans la section concepts |
| `docs/design/design-system-specification.md` | Spécifications visuelles des nouveaux widgets |

### Nouvelle documentation à créer

| Fichier | Contenu |
|---------|---------|
| `docs/features/time-widgets.md` | Guide utilisateur chrono/minuterie |
| `docs/features/slider-widget.md` | Guide utilisateur slider + configuration emoji |

## Hors scope

- Export des données chrono détaillées (lap times)
- Synchronisation multi-appareils des chronos en cours
- Widget iOS/Android natif
- Son personnalisable pour les notifications
