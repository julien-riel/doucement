# Améliorations basées sur la science comportementale

Ce document décrit les fonctionnalités d'amélioration identifiées à partir de la recherche en psychologie et sciences comportementales.

---

## Fondements scientifiques

### Sources principales

- **Self-Determination Theory (SDT)** - Deci & Ryan
- **Atomic Habits** - James Clear
- **Tiny Habits** - BJ Fogg (Stanford Behavior Design Lab)
- **Implementation Intentions** - Peter Gollwitzer

### Principes clés retenus

1. **Autonomie, Compétence, Connexion** (SDT) → Motivation intrinsèque durable
2. **Intentions d'implémentation** → Plans "si-alors" pour automatiser les comportements
3. **Habit stacking** → Ancrer les nouvelles habitudes aux existantes
4. **Renforcement positif** → Plus efficace que la punition pour le changement long terme
5. **Friction intentionnelle** → Ajouter des obstacles pour réduire les comportements indésirables

---

## 1. Implementation Intentions (Intentions d'implémentation)

### Fondement scientifique

Les intentions d'implémentation sont des plans "si-alors" introduits par Peter Gollwitzer (1999). La recherche montre qu'ils créent des associations automatiques entre situation et comportement, similaires aux habitudes.

> "Après [DÉCLENCHEUR], je ferai [HABITUDE] à [LIEU]"

### Implémentation prévue

#### Données

Nouveaux champs dans le type `Habit` :

```typescript
interface ImplementationIntention {
  trigger?: string;      // "Après mon café du matin"
  location?: string;     // "Dans le salon"
  time?: string;         // "07:30" ou "matin"
}
```

#### UX

- Étape optionnelle dans le wizard de création d'habitude
- Affichage de l'intention sur la HabitCard
- Question guidée : "Quand et où feras-tu cette habitude ?"

#### Messages suggérés

- "Associer ton habitude à un moment précis augmente tes chances de réussite"
- "Exemple : Après mon café du matin, je ferai 10 pompes dans le salon"

---

## 2. Habit Stacking (Ancrage d'habitudes)

### Fondement scientifique

James Clear et BJ Fogg ont démontré que lier une nouvelle habitude à une existante augmente le taux de succès de **64%**. Le cerveau utilise les voies neuronales existantes.

> "Après [HABITUDE EXISTANTE], je ferai [NOUVELLE HABITUDE]"

### Implémentation prévue

#### Données

```typescript
interface Habit {
  // ... champs existants
  anchorHabitId?: string;  // ID de l'habitude d'ancrage
}
```

#### UX

- Lors de la création, proposer de lier à une habitude existante
- Afficher les chaînes d'habitudes connectées dans la liste
- Regroupement visuel des habitudes liées

#### Exemples d'ancrage suggérés

- Réveil → Hydratation
- Repas → Médication/Suppléments
- Coucher → Lecture/Méditation

---

## 3. Visualisation mentale

### Fondement scientifique

Une étude 2025 (PMC11920387) montre que combiner les intentions d'implémentation avec l'imagerie mentale renforce la formation d'habitudes.

### Implémentation prévue

#### UX

- Option de "préparer mentalement" sa journée le matin
- Micro-écran de visualisation (5-10 secondes)
- Animation douce avec le texte de l'intention

#### Messages

- "Prends 5 secondes pour visualiser ta réussite"
- "Imagine-toi accomplir ta dose du jour"

---

## 4. Mode binaire débutant

### Fondement scientifique

Une étude 2025 montre que le tracking **binaire (oui/non)** maintient les habitudes **27% plus longtemps** que le tracking détaillé pendant la phase de formation.

### Implémentation prévue

#### Données

```typescript
interface Habit {
  // ... champs existants
  trackingMode: 'simple' | 'detailed';  // Nouveau champ
}
```

#### UX

- Par défaut : mode simple les 30 premiers jours
- Check-in en un tap : "Fait" ou "Pas aujourd'hui"
- Transition suggérée vers le mode détaillé après 30 jours
- Option de basculer manuellement

---

## 5. Récupération bienveillante

### Fondement scientifique

La "règle de la réponse absente" - après une interruption, les gens abandonnent souvent. La clé est de normaliser les pauses et faciliter le retour.

### Implémentation prévue

#### Logique

- Détecter 2+ jours sans check-in
- Afficher un message de retour bienveillant
- Ne pas afficher de "retard" ou compteur négatif

#### Messages (conformes à la banque de messages)

- "Content·e de te revoir ! On reprend doucement ?"
- "Chaque jour est une nouvelle opportunité"
- "La pause fait partie du voyage"

#### Fonctionnalité : Pause planifiée

- Permettre de déclarer une pause (vacances, maladie)
- Les jours de pause ne comptent pas dans les stats
- Message au retour : "Bienvenue ! Prêt·e à reprendre ?"

---

## 6. Friction intentionnelle (habitudes à réduire)

### Fondement scientifique

Pour réduire un comportement, ajouter de la friction est plus efficace que la volonté pure. La recherche montre que rendre un comportement difficile réduit sa fréquence.

### Implémentation prévue

#### UX (uniquement pour direction: 'decrease')

- Option "délai de réflexion" avant de logger (3-5 secondes)
- Question optionnelle : "Comment te sens-tu avant ?"
- Suggestion d'alternative positive après le log

#### Messages

- "Prends un moment pour réfléchir..."
- "Y a-t-il une alternative qui te ferait du bien ?"

---

## 7. Revue hebdomadaire enrichie

### Fondement scientifique

La réflexion régulière renforce l'apprentissage et permet l'ajustement des stratégies.

### Implémentation prévue

#### Nouvelles sections dans WeeklyReview

1. **Réflexion guidée**
   - "Qu'est-ce qui a bien fonctionné cette semaine ?"
   - Champ texte optionnel pour noter

2. **Patterns identifiés**
   - Meilleurs jours de la semaine
   - Meilleurs moments de la journée
   - Corrélations entre habitudes

3. **Suggestions d'ajustement**
   - Si progression stagne → suggérer réduction du rythme
   - Si sur-performance → féliciter et proposer d'ajuster

---

## 8. Contextualisation temporelle

### Fondement scientifique

78% des formateurs d'habitudes réussis font leurs habitudes clés avant 9h. Les créneaux matinaux sont les plus efficaces.

### Implémentation prévue

#### Analytics

- Tracker l'heure des check-ins
- Identifier les meilleurs moments par habitude
- Afficher dans les stats détaillées

#### Suggestions

- Recommander les créneaux matinaux pour les nouvelles habitudes
- "Les utilisateurs qui font [habitude] le matin réussissent plus souvent"

---

## Priorisation

| Priorité | Fonctionnalité | Effort | Impact | Phase |
|----------|----------------|--------|--------|-------|
| Haute | Implementation intentions | Moyen | Très élevé | 6 |
| Haute | Habit stacking | Moyen | Élevé | 6 |
| Haute | Récupération bienveillante | Faible | Élevé | 6 |
| Moyenne | Mode binaire débutant | Faible | Moyen | 6 |
| Moyenne | Friction intentionnelle | Faible | Moyen | 6 |
| Moyenne | Revue hebdomadaire enrichie | Moyen | Moyen | 6 |
| Basse | Visualisation mentale | Moyen | Moyen | Future |
| Basse | Contextualisation temporelle | Moyen | Moyen | Future |

---

## Références

1. [Digital Behavior Change Interventions - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161714/)
2. [Self-Determination Theory in Behaviour Change - Oxford Academic](https://academic.oup.com/iwc/advance-article/doi/10.1093/iwc/iwae040/7760010)
3. [Implementation Intentions - Wikipedia](https://en.wikipedia.org/wiki/Implementation_intention)
4. [Habit Stacking - James Clear](https://jamesclear.com/habit-stacking)
5. [Positive Reinforcement Long-term Effects](https://www.mastermindbehavior.com/post/the-impact-of-positive-reinforcement-on-long-term-behavior-change)
6. [Habit Formation Science - Coach Pedro Pinto](https://coachpedropinto.com/habit-formation-science-backed-strategies-for-leaders/)
7. [Reinforcing Implementation Intentions with Imagery - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11920387/)
