# Référence Technique - Doucement

Ce document décrit les types d'habitudes, leurs comportements et les règles de calcul.

---

## 1. Dimensions des Habitudes

### Direction (`direction`)

| Valeur | Description | Scoring |
|--------|-------------|---------|
| `increase` | Habitudes à augmenter | `actualValue >= targetDose` = succès |
| `decrease` | Habitudes à réduire | `actualValue <= targetDose` = succès |
| `maintain` | Habitudes à maintenir | `actualValue == targetDose` = succès |

### Fréquence de suivi (`trackingFrequency`)

| Valeur | Description | Affichage |
|--------|-------------|-----------|
| `daily` | Suivi quotidien (défaut) | "X unités" |
| `weekly` | Suivi hebdomadaire | "X/Y cette semaine" |

### Mode de suivi (`trackingMode`)

| Valeur | Interface | Recommandation |
|--------|-----------|----------------|
| `simple` | 2 boutons : "Fait" / "Pas aujourd'hui" | Débutants, friction minimale |
| `detailed` | 3 boutons : "Un peu" / "Fait" / "Encore +" | Suivi précis |
| `counter` | Boutons +1/-1 avec historique | Saisies multiples par jour |

### Mode d'entrée (`entryMode`)

| Valeur | Comportement |
|--------|--------------|
| `replace` | Chaque saisie écrase la précédente |
| `cumulative` | Les saisies s'additionnent |

### Agrégation hebdomadaire (`weeklyAggregation`)

Pour `trackingFrequency: 'weekly'` :

| Mode | Cas d'usage | Exemple |
|------|-------------|---------|
| `count-days` | Nombre de jours réussis | "3 soirs à se coucher tôt" |
| `sum-units` | Total sur la semaine | "Max 10 verres par semaine" |

---

## 2. Matrice des Combinaisons Recommandées

### Habitudes à augmenter (`increase`)

| Fréquence | Mode | Exemple |
|-----------|------|---------|
| daily + simple | Boire de l'eau |
| daily + detailed | Pompes, méditation |
| weekly + simple | Coucher régulier (count-days) |

### Habitudes à réduire (`decrease`)

| Fréquence | Mode | Exemple |
|-----------|------|---------|
| daily + detailed | Cigarettes |
| weekly + detailed | Alcool (sum-units) |

**Note :** Pour `decrease`, le mode `detailed` est préférable (permet de consigner "zéro").

---

## 3. Règles d'Arrondi

> L'arrondi est **toujours bienveillant** envers l'utilisateur.

| Direction | Arrondi | Justification |
|-----------|---------|---------------|
| `increase` | `Math.ceil` (plafond) | Encourage à en faire plus |
| `decrease` | `Math.floor` (plancher) | Cible plus accessible |
| `maintain` | `Math.round` (standard) | Neutre |

### Limites après arrondi

| Direction | Minimum | Maximum |
|-----------|---------|---------|
| `increase` | 1 | `targetValue` si défini |
| `decrease` | 0 | `targetValue` si défini |
| `maintain` | 1 | — |

### Implémentation

```typescript
function applyRounding(value: number, direction: HabitDirection): number {
  switch (direction) {
    case 'increase': return Math.ceil(value);
    case 'decrease': return Math.floor(value);
    case 'maintain': return Math.round(value);
  }
}
```

---

## 4. Calcul du Pourcentage de Complétion

### Habitudes `increase` / `maintain`

**Formule :** `(actualValue / targetDose) * 100`

| Cible | Réalisé | % | Statut |
|-------|---------|---|--------|
| 10 | 10 | 100% | Complété |
| 10 | 8 | 80% | Complété (≥70%) |
| 10 | 12 | 120% | Dépassé |

### Habitudes `decrease` (formule inversée)

**Formule :** `(targetDose / actualValue) * 100`

Moins c'est mieux → faire moins que la cible donne >100%.

| Cible | Réalisé | % | Explication |
|-------|---------|---|-------------|
| 4 | 4 | 100% | Pile la dose |
| 4 | 3 | 133% | Mieux que prévu |
| 4 | 0 | 100% | Parfait |
| 4 | 10 | 40% | Dépassement |

### Cas spéciaux

- `targetDose = 0` et `actualValue = 0` → 100%
- `targetDose = 0` et `actualValue > 0` → 0%
- `targetDose > 0` et `actualValue = 0` → 100% (rien consommé = victoire)

---

## 5. Comportements Spéciaux

### Habitudes à réduire (`decrease`)

- **Pas de habit stacking** : Ne pas proposer l'ancrage
- **Pas de "Après [déclencheur]"** : L'objectif est de faire MOINS
- **Message spécial pour zéro** : "Journée parfaite !"

### Mode compteur (`counter`)

- Historique des opérations (`CounterOperation[]`)
- Possibilité d'annuler la dernière action
- Affiche "Dernière action: +1 à 14:32"

---

## 6. Références

- Types : `src/types/index.ts`
- Calcul progression : `src/services/progression.ts`
- Statistiques : `src/services/statistics.ts`
- Matrice de cohérence : `docs/coherence-matrix.md`
