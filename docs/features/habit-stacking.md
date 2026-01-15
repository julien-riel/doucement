# Habit Stacking (Chaînage d'habitudes)

## Concept

Le habit stacking (chaînage d'habitudes) permet d'ancrer une nouvelle habitude à une habitude existante. Cette technique, issue d'*Atomic Habits*, augmente le taux de réussite de 64%.

## Principe

> "Après [HABITUDE EXISTANTE], je ferai [NOUVELLE HABITUDE]"

L'habitude existante sert de déclencheur automatique pour la nouvelle habitude.

## Structure de données

### Champ `anchorHabitId`

```typescript
interface Habit {
  // ...autres champs
  anchorHabitId?: string; // ID de l'habitude ancre
}
```

- Optionnel
- Référence l'ID d'une habitude active
- L'habitude ancre doit exister et ne pas être archivée

## Comportement UI

### Affichage sur Today

Les habitudes chaînées s'affichent groupées visuellement :
- L'habitude ancre apparaît en premier
- Les habitudes dépendantes sont légèrement indentées
- Un connecteur visuel lie les habitudes

### Création

Lors de la création d'une habitude, l'utilisateur peut :
1. Choisir une habitude existante comme ancre
2. L'implementation intention est alors pré-remplie avec "Après [habitude ancre]..."

## Exemples

### Exemple 1 : Routine matinale
- **Ancre** : Faire mon café (habitude existante)
- **Nouvelle habitude** : 5 minutes de méditation
- **Implementation intention** : "Après avoir fait mon café, je méditerai 5 minutes dans le salon"

### Exemple 2 : Routine du soir
- **Ancre** : Se brosser les dents
- **Nouvelle habitude** : Lire 10 pages
- **Implementation intention** : "Après m'être brossé les dents, je lirai 10 pages au lit"

## Références

- Voir aussi : [docs/prd.md §20.2](../prd.md)
- Implementation intentions : [tracking-modes.md](tracking-modes.md)
