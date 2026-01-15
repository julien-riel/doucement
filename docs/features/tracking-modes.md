# Modes de Tracking et d'Entrée

## Vue d'ensemble

Doucement offre deux dimensions de personnalisation pour le suivi des habitudes :
1. **Tracking Mode** : Comment la valeur est affichée et saisie
2. **Entry Mode** : Comment les valeurs multiples dans une journée sont gérées

## Tracking Modes

### 1. Simple (`simple`)

Suivi binaire : fait ou pas fait.

| Aspect | Description |
|--------|-------------|
| **Affichage** | Bouton unique "Fait" |
| **Valeur enregistrée** | 0 ou 1 |
| **Cas d'usage** | Habitudes oui/non (méditer, prendre ses vitamines) |

### 2. Detailed (`detailed`)

Suivi avec saisie numérique.

| Aspect | Description |
|--------|-------------|
| **Affichage** | Boutons +/- et champ numérique |
| **Valeur enregistrée** | Nombre quelconque |
| **Cas d'usage** | Habitudes quantifiables (verres d'eau, pompes) |

### 3. Counter (`counter`)

Suivi avec compteur incrémental.

| Aspect | Description |
|--------|-------------|
| **Affichage** | Bouton + à chaque occurrence |
| **Valeur enregistrée** | Total des incréments |
| **Cas d'usage** | Habitudes comptées (cigarettes, cafés) |
| **Historique** | Conserve chaque opération avec timestamp |

```typescript
interface CounterOperation {
  value: number;
  timestamp: string; // ISO 8601
}
```

## Entry Modes

### 1. Replace (`replace`)

Chaque nouvelle valeur remplace la précédente.

| Aspect | Description |
|--------|-------------|
| **Comportement** | La dernière saisie écrase les précédentes |
| **Cas d'usage** | Habitudes à valeur finale (heures de sommeil) |
| **Par défaut** | Mode par défaut pour `simple` et `detailed` |

### 2. Cumulative (`cumulative`)

Chaque nouvelle valeur s'ajoute aux précédentes.

| Aspect | Description |
|--------|-------------|
| **Comportement** | Les valeurs s'additionnent dans la journée |
| **Cas d'usage** | Habitudes accumulées (verres d'eau, pas) |
| **Par défaut** | Mode par défaut pour `counter` |

## Tableau récapitulatif

| Tracking Mode | Entry Mode par défaut | Peut être changé ? |
|--------------|----------------------|-------------------|
| `simple` | `replace` | Non |
| `detailed` | `replace` | Oui → `cumulative` |
| `counter` | `cumulative` | Non |

## Structure de données

```typescript
type TrackingMode = 'simple' | 'detailed' | 'counter';
type EntryMode = 'replace' | 'cumulative';

interface Habit {
  trackingMode: TrackingMode;
  entryMode?: EntryMode; // Si non défini, utilise le défaut
}
```

## Exemples

### Exemple 1 : Verres d'eau (detailed + cumulative)
- Matin : +3 verres → Total : 3
- Midi : +2 verres → Total : 5
- Soir : +3 verres → Total : 8

### Exemple 2 : Heures de sommeil (detailed + replace)
- Première saisie : 7h → Valeur : 7
- Correction : 7.5h → Valeur : 7.5

### Exemple 3 : Cigarettes (counter + cumulative)
- 9h00 : +1 → Total : 1
- 11h30 : +1 → Total : 2
- 14h00 : +1 → Total : 3

## Références

- Types : [src/types/index.ts](../../src/types/index.ts)
- Matrice de cohérence : [docs/coherence-matrix.md](../coherence-matrix.md)
