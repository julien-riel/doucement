# PRD : Retours utilisateurs v2

## Objectif

Répondre à 3 retours utilisateurs majeurs + 2 améliorations pour améliorer l'expérience de suivi d'habitudes progressives.

## Contexte

Les utilisateurs apprécient l'app mais rapportent :
1. Impossibilité de modifier la valeur de départ après une rechute
2. Incohérence d'unités minutes/secondes sur les compteurs temporels
3. Messages de progression trop vagues sur la page du jour

## Use cases

### UC1 : Nouveau départ après rechute
> Marie avait réduit à 5 cigarettes/jour (départ: 20). Après une période de stress, elle est remontée à 15. Elle veut repartir de 15 sans perdre son historique précédent.

**Comportement attendu :**
- Bouton "Nouveau départ" dans la page d'édition
- Saisie libre de la nouvelle valeur de départ
- Historique de la recalibration préservé (date, ancienne valeur, nouvelle valeur)
- La progression (createdAt) repart de la date du nouveau départ
- L'historique des entrées passées reste intact

### UC2 : Timer en minutes
> Paul crée une habitude "Méditation" avec startValue=10 et unit="minutes". Le timer devrait décompter 10 minutes (600 secondes), pas 10 secondes.

**Comportement attendu :**
- Quand `unit === 'minutes'`, convertir `targetDose` en secondes (`× 60`) avant de le passer aux composants timer/stopwatch
- L'affichage de la dose dans le header de la carte reste en unité d'origine ("10 minutes")
- Le timer affiche le décompte correctement (10:00, 09:59, ...)
- La valeur enregistrée reste en secondes (cohérence interne)

### UC3 : Messages de progression enrichis
> Jean fait des pompes (départ: 10, aujourd'hui: 16). Au lieu de "Tu en étais à 10. +6 aujourd'hui !", il aimerait voir : "Hier : 15. Tu as déjà gagné +6 depuis le départ (+60%)"

**Comportement attendu :**
- Message adaptatif selon le contexte (voir section Messages)
- Informations combinées : valeur veille, progression cumulée, pourcentage
- Ton encourageant et bienveillant

### UC4 : Messages adaptatifs (amélioration)
> Le message change selon la situation : premier jour, progression rapide, retour après absence, proche de l'objectif final.

### UC5 : Historique des nouveaux départs (amélioration)
> Dans la page détail, une timeline montre les recalibrations passées avec des messages bienveillants.

## Architecture technique

### Fichiers impactés

**UC1 - Nouveau départ :**
- `src/pages/EditHabit/index.tsx` — Ajout section "Nouveau départ"
- `src/pages/EditHabit/sections/RestartSection.tsx` — Nouveau composant
- `src/hooks/useAppData.ts` — Modification de `recalibrateHabitDose()` ou nouveau handler
- `src/types/index.ts` — Ajout type `RestartReason` au `RecalibrationRecord`
- `src/i18n/locales/fr.json` + `en.json` — Traductions

**UC2 - Bug minutes/secondes :**
- `src/components/habits/HabitCard.tsx` — Conversion targetDose pour timer/stopwatch
- `src/components/habits/TimerCheckIn.tsx` — Pas de changement (reçoit déjà en secondes)
- `src/components/habits/StopwatchCheckIn.tsx` — Pas de changement

**UC3/UC4 - Messages de progression :**
- `src/components/habits/HabitCard.tsx` — Refactor `getProgressionMessage()`
- `src/services/progression.ts` — Nouvelle fonction `getProgressionContext()`
- `src/i18n/locales/fr.json` + `en.json` — Nouvelles clés de traduction

**UC5 - Historique des nouveaux départs :**
- `src/pages/HabitDetail.tsx` — Section timeline
- `src/components/habits/RestartTimeline.tsx` — Nouveau composant
- `src/i18n/locales/fr.json` + `en.json` — Traductions

### Structures de données

```typescript
// Enrichissement du RecalibrationRecord existant
export interface RecalibrationRecord {
  date: string
  previousStartValue: number
  newStartValue: number
  previousStartDate: string
  level: number           // 0.5, 0.75, 1 pour recalibration auto
  type?: 'recalibration' | 'restart'  // NOUVEAU
  reason?: string                       // NOUVEAU - raison libre optionnelle
}

// Contexte de progression pour les messages enrichis
export interface ProgressionContext {
  habit: Habit
  targetDose: number
  yesterdayDose: number | null
  totalChange: number           // diff absolue depuis startValue
  totalChangePercent: number    // diff en %
  daysActive: number
  isFirstDay: boolean
  isBackAfterAbsence: boolean
  daysAbsent: number
  isCloseToTarget: boolean      // si targetValue défini et proche
  remainingToTarget: number | null
}
```

### Composants UI

**RestartSection** (dans EditHabit)
- Props : `habit: Habit`, `onRestart: (newStartValue: number, reason?: string) => void`
- Affiche valeur actuelle en lecture seule
- Champ de saisie pour nouvelle valeur de départ
- Champ texte optionnel pour la raison
- Bouton "Nouveau départ" avec confirmation modale
- Ton bienveillant : "Chaque nouveau départ est une victoire"

**RestartTimeline** (dans HabitDetail)
- Props : `history: RecalibrationRecord[]`, `unit: string`
- Liste chronologique des recalibrations/restarts
- Icône différente pour recalibration (↑) vs restart (🔄)
- Message bienveillant pour chaque entrée

### Contraintes design

- Suivre `docs/design/design-system-specification.md`
- Pas de couleur rouge (pas d'échec)
- Bouton "Nouveau départ" : style secondaire, pas d'alerte anxiogène
- Messages : ton bienveillant, jamais culpabilisant
- Touch targets minimum 44x44px
- Couleurs : orange primary, green success
- Border radius : 12-16px pour les cartes

### Messages de progression adaptatifs

Priorité d'affichage (premier match) :

| Condition | Message FR | Message EN |
|-----------|-----------|------------|
| Premier jour | "C'est le début de ton aventure !" | "This is the start of your journey!" |
| Retour après absence (>3j) | "Content·e de te revoir ! Hier : {yesterdayDose}" | "Welcome back! Yesterday: {yesterdayDose}" |
| Proche objectif final (<10%) | "Plus que {remaining} avant ton objectif de {target} !" | "Only {remaining} to go before your goal of {target}!" |
| Progression increase | "Hier : {yesterday}. Déjà +{totalChange} depuis le départ ({percent}%)" | "Yesterday: {yesterday}. Already +{totalChange} from the start ({percent}%)" |
| Progression decrease | "Hier : {yesterday}. Déjà -{totalChange} depuis le départ ({percent}%)" | "Yesterday: {yesterday}. Already -{totalChange} from the start ({percent}%)" |
| Maintain | null (pas de message) | null |

## Critères de succès

1. **Nouveau départ** : L'utilisateur peut modifier sa valeur de départ, la progression repart de zéro, l'historique est préservé
2. **Timer/minutes** : Un objectif en minutes lance un timer avec la bonne durée (10 min = 600s de décompte)
3. **Messages enrichis** : Les messages affichent la valeur de la veille et la progression cumulée
4. **Messages adaptatifs** : Le message change selon le contexte (premier jour, retour, proche objectif)
5. **Timeline** : La page détail montre l'historique des nouveaux départs avec un ton bienveillant
