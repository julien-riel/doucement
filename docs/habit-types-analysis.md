# Analyse des Types d'Habitudes - Doucement

Ce document décrit les différents types d'habitudes supportés par l'application Doucement et analyse comment les habitudes suggérées doivent être configurées.

---

## 1. Dimensions des Habitudes

### 1.1 Direction (direction)

| Valeur | Description | Comportement |
|--------|-------------|--------------|
| `increase` | Bonnes habitudes à augmenter | Plus on fait, mieux c'est. Score positif si >= dose cible |
| `decrease` | Mauvaises habitudes à réduire | Moins on fait, mieux c'est. Score positif si <= dose cible |
| `maintain` | Habitudes à maintenir | Garder un niveau stable sans progression |

**Logique de scoring :**
- `increase` : `actualValue >= targetDose` = succès
- `decrease` : `actualValue <= targetDose` = succès (faire moins est mieux)
- `maintain` : `actualValue == targetDose` = succès

### 1.2 Fréquence de suivi (trackingFrequency)

| Valeur | Description | Affichage |
|--------|-------------|-----------|
| `daily` (défaut) | Suivi quotidien | Dose du jour : "X unités" |
| `weekly` | Suivi hebdomadaire | Progression : "X/Y cette semaine" |

**Cas d'usage weekly :**
- Habitudes qui ne s'appliquent pas tous les jours
- Objectifs hebdomadaires (ex: 3 soirs de sport par semaine)
- Substances à limiter par semaine (ex: verres d'alcool)

### 1.3 Mode de suivi (trackingMode)

| Valeur | Description | Interface |
|--------|-------------|-----------|
| `simple` | Binaire (fait / pas fait) | 2 boutons : "Fait" / "Pas aujourd'hui" |
| `detailed` (défaut) | Quantitatif | 3 boutons : "Un peu" / "Fait" / "Encore +" |

**Recommandations :**
- `simple` : Idéal pour débuter, réduit la friction
- `detailed` : Pour les utilisateurs qui veulent suivre précisément

### 1.4 Type de valeur

| Type | Exemples | Unité |
|------|----------|-------|
| Compteur | Verres d'eau, cigarettes, pages | `verres`, `cigarettes`, `pages` |
| Durée | Méditation, lecture, marche | `minutes` |
| Distance | Marche, course | `pas`, `km` |
| Répétitions | Pompes, squats | `répétitions` |
| Fréquence | Coucher régulier | `soirs/semaine` |

---

## 2. Matrice des Combinaisons

### 2.1 Habitudes à Augmenter (direction: increase)

| Fréquence | Mode | Comportement Check-in | Exemple |
|-----------|------|----------------------|---------|
| daily + simple | Binaire quotidien | "Fait" = targetDose, "Non" = 0 | Boire de l'eau |
| daily + detailed | Quantitatif quotidien | Saisie de valeur exacte | Pompes |
| weekly + simple | Binaire cumulatif | +1 par jour fait | Coucher régulier |
| weekly + detailed | Non recommandé | - | - |

### 2.2 Habitudes à Réduire (direction: decrease)

| Fréquence | Mode | Comportement Check-in | Exemple |
|-----------|------|----------------------|---------|
| daily + detailed | Quantitatif quotidien | Saisie de valeur, moins = mieux | Cigarettes |
| weekly + detailed | Total hebdomadaire | Saisie cumulative | Alcool |
| daily + simple | Non recommandé* | - | - |
| weekly + simple | Non recommandé* | - | - |

**Note :** Pour les habitudes à réduire, le mode `detailed` est préférable car :
- Il permet de consigner "zéro" (grande victoire)
- Il donne une visibilité sur la quantité réelle
- Le bouton "Moins" encourage à faire moins que la cible

### 2.3 Habitudes à Maintenir (direction: maintain)

| Fréquence | Mode | Comportement | Exemple |
|-----------|------|--------------|---------|
| daily + simple | Check binaire | Fait/Pas fait | Prendre ses vitamines |
| daily + detailed | Cible fixe | Toujours même dose | 8 verres d'eau |

---

## 3. Comportements Spéciaux

### 3.1 Saisie Multiple par Jour

**Cas d'usage :** Boire de l'eau, grignotages, cigarettes

**Comportement actuel :**
- Chaque check-in écrase la valeur précédente
- L'utilisateur doit entrer le cumul

**Amélioration suggérée :**
- Ajouter un mode `cumulative` pour additionner les saisies
- Afficher "X/Y (cumul)" au lieu de remplacer

### 3.2 Saisie de Zéro

**Pour decrease :**
- Consigner "0" est une victoire majeure
- Le bouton "Moins" permet de saisir 0
- Message de félicitations spécial pour 0

**Pour increase :**
- Consigner "0" = non fait
- Équivalent à "Pas aujourd'hui"

### 3.3 Habitudes à Réduire - Pas de Chaînage ni "Après"

Pour les habitudes `decrease`, il ne faut PAS :
- Proposer l'ancrage (habit stacking)
- Suggérer "Après [déclencheur]"
- Encourager à les faire "plus tard"

L'objectif est de les faire MOINS, pas de les planifier.

---

## 4. Analyse des Habitudes Suggérées

### 4.1 Sommeil (sleep)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `sleep-regular-bedtime` | Se coucher à heure fixe | direction: increase, weekly, 3 soirs/sem | OK | Binaire quotidien, cumul hebdo |
| `sleep-screen-before-bed` | Réduire écrans avant coucher | direction: increase, 15min | OK | Durée sans écran (positif) |

### 4.2 Mouvement (movement)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `movement-daily-walk` | Marche quotidienne | direction: increase, 2000 pas | OK | Quantitatif daily |
| `movement-pushups` | Pompes ou squats | direction: increase, 5 reps | OK | Quantitatif daily |
| `movement-walk-after-meal` | Marche après repas | direction: increase, 5min | **Ajouter `trackingMode: simple`** | Binaire suffisant |

### 4.3 Écrans (screen)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `screen-social-media` | Réduire réseaux sociaux | direction: decrease, 60min | OK | Quantitatif, moins=mieux |
| `screen-before-sleep` | Pas d'écran 1h avant coucher | direction: increase, 15min | OK | Durée sans écran (positif) |

### 4.4 Méditation (mindfulness)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `mindfulness-meditation` | Méditation guidée | direction: increase, 2min | OK | Durée quantitative |
| `mindfulness-breathing` | Exercices de respiration | direction: increase, 3 respi, period: daily | **Changer period à `weekly`** | 3 respi/jour avec +1/jour semble excessif |

### 4.5 Lecture (reading)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `reading-daily` | Lecture quotidienne | direction: increase, 5 pages | OK | Quantitatif daily |
| `reading-before-bed` | Lecture avant coucher | direction: increase, 10min | **Ajouter `trackingMode: simple`** | Binaire suffit |

### 4.6 Substances (substance)

| ID | Nom | Configuration Actuelle | Configuration Recommandée | Notes |
|----|-----|------------------------|---------------------------|-------|
| `substance-cigarettes` | Réduire cigarettes | direction: decrease, 10 cig | OK | Quantitatif, suivi précis important |
| `substance-alcohol` | Réduire alcool | direction: decrease, weekly, 7 verres | OK | Total hebdo |
| `substance-caffeine` | Réduire caféine | direction: decrease, 4 cafés | OK | Compteur quotidien |

---

## 5. Modifications de Code Recommandées

### 5.1 Ajouter `trackingMode: simple` aux habitudes appropriées

**Fichier:** `src/constants/suggestedHabits.ts`

```typescript
// Pour movement-walk-after-meal
trackingMode: 'simple',

// Pour reading-before-bed
trackingMode: 'simple',
```

### 5.2 Corriger la période pour mindfulness-breathing

**Fichier:** `src/constants/suggestedHabits.ts`

```typescript
// mindfulness-breathing - changer de daily à weekly
progression: {
  mode: 'absolute',
  value: 1,
  period: 'weekly',  // au lieu de 'daily'
},
```

### 5.3 Désactiver habit stacking pour direction: decrease

**Fichier:** `src/components/habits/StepIntentions.tsx`

Ne pas afficher le sélecteur d'ancrage pour les habitudes à réduire.

### 5.4 Ajouter support pour saisie cumulative

**Nouveau type:**
```typescript
export type EntryMode = 'replace' | 'cumulative'
```

**Impact:**
- Types: Ajouter `entryMode?: EntryMode` à `Habit`
- CheckInButtons: Additionner au lieu de remplacer si cumulative
- HabitCard: Afficher "X (total)" si cumulative

### 5.5 Messages spéciaux pour zéro

**Fichier:** `src/constants/messages.ts`

```typescript
export const DECREASE_ZERO = {
  title: "Journée parfaite !",
  message: "Tu n'as pas cédé aujourd'hui. C'est une vraie victoire.",
}
```

---

## 6. Tests E2E Recommandés

### 6.1 Test par type d'habitude

| Test | Fichier | Scénario |
|------|---------|----------|
| `habit-increase-daily.spec.ts` | Création + check-in | Habitude increase/daily, vérifier score positif si >= cible |
| `habit-increase-weekly.spec.ts` | Suivi hebdo | Habitude increase/weekly, vérifier compteur X/Y |
| `habit-decrease-daily.spec.ts` | Réduction | Habitude decrease, vérifier que moins = mieux |
| `habit-decrease-zero.spec.ts` | Zéro = victoire | Saisir 0, vérifier message de félicitations |
| `habit-maintain.spec.ts` | Maintien | Habitude maintain, pas de progression |

### 6.2 Fixtures de test

Créer des fichiers de test dans `public/test-data/`:

- `habit-types/increase-daily.json`
- `habit-types/increase-weekly.json`
- `habit-types/decrease-daily.json`
- `habit-types/decrease-weekly.json`
- `habit-types/maintain-simple.json`

---

## 7. Récapitulatif des Actions

### Priorité Haute
1. Corriger `mindfulness-breathing` période → weekly
2. Ajouter `trackingMode: simple` à 2 habitudes
3. Désactiver habit stacking pour decrease

### Priorité Moyenne
4. Ajouter mode cumulatif pour saisies multiples
5. Messages spéciaux pour zéro (decrease)
6. Tests E2E pour chaque combinaison

### Priorité Basse
7. Améliorer l'UI des habitudes decrease (couleur verte pour moins)
8. Ajouter indicateur "dernière saisie aujourd'hui"
