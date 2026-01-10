# Règles d'arrondi pour le calcul de progression

Ce document décrit les règles d'arrondi appliquées lors du calcul de la dose cible quotidienne.

## Principe fondamental

L'arrondi est **toujours bienveillant** envers l'utilisateur. Cela signifie que les règles d'arrondi sont conçues pour être encourageantes et éviter toute frustration.

## Règles par direction

### Habitudes en augmentation (increase)

**Règle** : Arrondi au **plafond** (`Math.ceil`)

| Valeur calculée | Dose cible affichée |
|-----------------|---------------------|
| 10.1            | 11                  |
| 10.5            | 11                  |
| 10.9            | 11                  |
| 10.0            | 10                  |

**Justification** : On arrondit vers le haut pour encourager l'utilisateur à en faire un peu plus. Cela crée un effet de défi positif sans être décourageant.

**Exemple** : Pour une habitude de push-ups à +5% par semaine :
- Semaine 0 : 10 push-ups
- Semaine 1 : 10 × 1.05 = 10.5 → **11 push-ups**

### Habitudes en réduction (decrease)

**Règle** : Arrondi au **plancher** (`Math.floor`)

| Valeur calculée | Dose cible affichée |
|-----------------|---------------------|
| 10.1            | 10                  |
| 10.5            | 10                  |
| 10.9            | 10                  |
| 10.0            | 10                  |

**Justification** : On arrondit vers le bas pour être bienveillant. Cela donne à l'utilisateur une cible plus facile à atteindre, ce qui renforce le sentiment de réussite.

**Exemple** : Pour une réduction de cigarettes à -5% par semaine :
- Semaine 0 : 10 cigarettes
- Semaine 1 : 10 × 0.95 = 9.5 → **9 cigarettes** (objectif plus accessible)

### Habitudes en maintien (maintain)

**Règle** : Arrondi **classique** (`Math.round`)

| Valeur calculée | Dose cible affichée |
|-----------------|---------------------|
| 10.4            | 10                  |
| 10.5            | 11                  |
| 10.6            | 11                  |

**Justification** : Pour les habitudes de maintien, il n'y a pas de direction privilégiée, donc on utilise l'arrondi mathématique standard.

## Limites appliquées après arrondi

Après l'arrondi, des limites sont appliquées :

| Direction | Limite minimum | Limite maximum |
|-----------|----------------|----------------|
| increase  | 1              | `targetValue` (si défini) |
| decrease  | 0              | `targetValue` (si défini) |
| maintain  | 1              | — |

### Pourquoi minimum 1 pour increase ?

Une habitude d'augmentation doit toujours avoir au moins une unité à accomplir. Il n'est pas logique d'avoir une dose cible de 0 pour quelque chose qu'on veut augmenter.

### Pourquoi minimum 0 pour decrease ?

L'objectif ultime d'une réduction est d'atteindre zéro. On ne peut pas faire moins que rien.

## Implémentation

```typescript
function applyRounding(value: number, direction: 'increase' | 'decrease' | 'maintain'): number {
  switch (direction) {
    case 'increase':
      return Math.ceil(value);
    case 'decrease':
      return Math.floor(value);
    case 'maintain':
    default:
      return Math.round(value);
  }
}
```

Voir `src/services/progression.ts` pour l'implémentation complète.

## Résumé visuel

```
Augmentation (increase)   →   Plafond (ceil)    →   Encourage à en faire plus
Réduction (decrease)      →   Plancher (floor)  →   Bienveillant, plus facile
Maintien (maintain)       →   Standard (round)  →   Neutre
```

---

*Document généré à partir de la tâche 3.10 - Janvier 2026*
