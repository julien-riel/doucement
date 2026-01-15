# Widget Slider avec Emoji dynamique

## Vue d'ensemble

Le widget slider permet de saisir une valeur subjective sur une échelle visuelle, accompagnée d'un emoji qui change dynamiquement selon la position du curseur. Idéal pour les habitudes non quantifiables comme l'humeur, l'énergie ou la douleur.

## Concept

Au lieu de taper un chiffre, vous déplacez un curseur sur une échelle. Un emoji grand format reflète instantanément votre sélection, rendant l'expérience plus intuitive et engageante.

```
  😢 ←────────●────────→ 😊
       1  2  3  4  5  6  7  8  9  10
```

## Configuration du slider

### Structure de base

```typescript
interface SliderConfig {
  min: number      // Valeur minimale (ex: 1)
  max: number      // Valeur maximale (ex: 10)
  step: number     // Pas d'incrémentation (ex: 1)
  emojiRanges: EmojiRange[]  // Mapping emoji par plage
}

interface EmojiRange {
  from: number     // Début de la plage (inclusif)
  to: number       // Fin de la plage (inclusif)
  emoji: string    // Emoji à afficher
}
```

### Exemple de configuration

```typescript
const moodConfig: SliderConfig = {
  min: 1,
  max: 10,
  step: 1,
  emojiRanges: [
    { from: 1, to: 3, emoji: '😢' },   // Valeurs 1-3 → triste
    { from: 4, to: 5, emoji: '😕' },   // Valeurs 4-5 → neutre
    { from: 6, to: 7, emoji: '😊' },   // Valeurs 6-7 → content
    { from: 8, to: 10, emoji: '😄' },  // Valeurs 8-10 → joyeux
  ],
}
```

## Préréglages disponibles

### Humeur (par défaut)

| Plage | Emoji | Signification |
|-------|-------|---------------|
| 1-3 | 😢 | Tristesse |
| 4-5 | 😕 | Inconfort |
| 6-7 | 😊 | Bien |
| 8-10 | 😄 | Très bien |

### Énergie

| Plage | Emoji | Signification |
|-------|-------|---------------|
| 1-2 | 😴 | Épuisé |
| 3-4 | 🥱 | Fatigué |
| 5-6 | 😐 | Normal |
| 7-8 | ⚡ | En forme |
| 9-10 | 🔥 | Au top |

### Douleur (échelle 0-10)

| Plage | Emoji | Signification |
|-------|-------|---------------|
| 0 | 😊 | Aucune douleur |
| 1-3 | 🙂 | Légère |
| 4-6 | 😐 | Modérée |
| 7-8 | 😣 | Intense |
| 9-10 | 😖 | Sévère |

## Interface utilisateur

### Composants visuels

1. **Emoji géant** : Occupe le centre de l'attention, change instantanément
2. **Valeur numérique** : Affiche le nombre sélectionné
3. **Slider horizontal** : Curseur déplaçable à la souris ou au toucher
4. **Labels min/max** : Rappellent les bornes de l'échelle
5. **Bouton Valider** : Confirme la sélection

### États du bouton

| État | Label | Signification |
|------|-------|---------------|
| Nouveau | "Valider" | Aucune valeur enregistrée |
| Modifié | "Valider" | Valeur changée depuis la dernière sauvegarde |
| Enregistré | "✓ Enregistré" | Valeur sauvegardée, pas de changement |

## Accessibilité

Le slider est entièrement accessible au clavier :

| Touche | Action |
|--------|--------|
| ← / ↓ | Diminuer la valeur d'un pas |
| → / ↑ | Augmenter la valeur d'un pas |
| Entrée | Valider la sélection |

Attributs ARIA inclus :
- `aria-label` : Description de l'élément
- `aria-valuemin` / `aria-valuemax` : Bornes
- `aria-valuenow` : Valeur actuelle

## Mode d'entrée

Le slider fonctionne uniquement en mode `replace` :
- Chaque nouvelle valeur remplace la précédente
- Une seule valeur par jour est conservée
- Idéal pour les mesures subjectives ponctuelles

## Cas d'usage recommandés

### Suivi de l'humeur

**Configuration :** Échelle 1-10 avec 4 plages emoji

**Usage :** Enregistrez votre humeur quotidienne en un glissement de doigt.

### Niveau d'énergie

**Configuration :** Échelle 1-10 avec 5 plages emoji

**Usage :** Suivez votre énergie au fil des jours pour identifier des patterns.

### Suivi de la douleur

**Configuration :** Échelle 0-10 (échelle médicale standard)

**Usage :** Documentez l'évolution d'une douleur chronique.

### Niveau de stress

**Configuration personnalisée :**
```typescript
{
  min: 1,
  max: 10,
  step: 1,
  emojiRanges: [
    { from: 1, to: 2, emoji: '😌' },   // Zen
    { from: 3, to: 4, emoji: '🙂' },   // Détendu
    { from: 5, to: 6, emoji: '😐' },   // Normal
    { from: 7, to: 8, emoji: '😰' },   // Stressé
    { from: 9, to: 10, emoji: '😱' },  // Très stressé
  ],
}
```

### Qualité du sommeil

**Configuration personnalisée :**
```typescript
{
  min: 1,
  max: 5,
  step: 1,
  emojiRanges: [
    { from: 1, to: 1, emoji: '😫' },   // Terrible
    { from: 2, to: 2, emoji: '😕' },   // Mauvais
    { from: 3, to: 3, emoji: '😐' },   // Moyen
    { from: 4, to: 4, emoji: '😊' },   // Bon
    { from: 5, to: 5, emoji: '😴' },   // Excellent
  ],
}
```

## Création d'une habitude slider

1. Dans le wizard de création, choisissez le mode **Slider**

2. Configurez les paramètres :
   - **Min** : Valeur minimale de l'échelle
   - **Max** : Valeur maximale de l'échelle
   - **Pas** : Incrément entre chaque valeur (généralement 1)

3. Définissez les plages emoji (2 à 5 recommandé) :
   - Chaque plage a un début, une fin et un emoji
   - Les plages doivent couvrir toute l'échelle sans chevauchement
   - L'aperçu en temps réel montre le rendu

4. Un préréglage par défaut (humeur 1-10) est proposé pour démarrer rapidement

## Intégration aux statistiques

Les valeurs du slider s'intègrent dans :
- **Graphique de progression** : Évolution de la valeur dans le temps
- **Calendrier heatmap** : Intensité des couleurs selon la valeur
- **Statistiques** : Moyenne, tendance, jours avec entrée

## Bonnes pratiques

### Choix de l'échelle

- **1-5** : Pour les mesures simples (qualité du sommeil)
- **1-10** : Pour plus de nuances (humeur, énergie)
- **0-10** : Pour les échelles médicales standard (douleur)

### Choix des emojis

- Utilisez des emojis reconnaissables et distincts
- Progression logique (du négatif au positif ou inversement)
- Maximum 5 plages pour rester lisible
- Un emoji = une émotion ou un état clair

### Plages équilibrées

- Répartissez les plages de manière cohérente
- Évitez les plages trop petites (1 seule valeur) sauf aux extrêmes
- Assurez-vous que chaque valeur appartient à exactement une plage

## Références

- Types : [src/types/index.ts](../../src/types/index.ts) - `SliderConfig`, `EmojiRange`
- Composant : [SliderCheckIn.tsx](../../src/components/habits/SliderCheckIn.tsx)
- Utilitaires : [slider.ts](../../src/utils/slider.ts) - `getEmojiForValue`, préréglages
