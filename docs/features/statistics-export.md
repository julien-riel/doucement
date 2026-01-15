# Export des Statistiques

## Vue d'ensemble

Doucement permet d'exporter ses données et statistiques sous trois formats :
1. **PNG** : Image de progression partageable
2. **PDF** : Rapport complet
3. **JSON** : Données brutes

## Export PNG (Image partageable)

### Description

Génère une carte visuelle de progression, sobre et partageable.

### Contenu de la carte

- Emoji + nom de l'habitude
- Période couverte (ex: "30 derniers jours")
- Progression : startValue → currentValue
- Nombre de jours actifs
- Branding léger "Doucement"

### Implémentation

```typescript
// Service : src/services/exportImage.ts
async function exportHabitImage(habit: Habit, period: number): Promise<Blob>;
```

### Utilisation

- Disponible depuis HabitDetail
- Disponible depuis WeeklyReview
- Partage via Web Share API sur mobile

## Export PDF (Rapport complet)

### Description

Génère un rapport PDF avec statistiques détaillées.

### Contenu du rapport

1. **Page de garde**
   - Titre "Mon parcours Doucement"
   - Période du rapport
   - Date de génération

2. **Résumé global**
   - Nombre d'habitudes actives
   - Taux de complétion moyen
   - Meilleure progression

3. **Par habitude**
   - Graphique de progression
   - Statistiques clés
   - Meilleurs jours/périodes

### Implémentation

```typescript
// Service : src/services/exportPdf.ts
async function exportProgressReport(
  habits: Habit[],
  entries: DailyEntry[],
  period: { start: string; end: string }
): Promise<Blob>;
```

### Limitations connues

- Génération côté client uniquement
- Taille limitée par la mémoire du navigateur
- Design simplifié comparé à un PDF serveur

## Export JSON (Données brutes)

### Description

Export complet des données pour sauvegarde ou migration.

### Format

```json
{
  "schemaVersion": 10,
  "exportedAt": "2026-01-14T10:30:00Z",
  "habits": [...],
  "entries": [...],
  "preferences": {...}
}
```

### Implémentation

```typescript
// Service : src/services/storage.ts
function exportData(): AppData;
```

### Validation à l'import

- Vérification du schéma
- Migration automatique si version antérieure
- Options : remplacer ou fusionner

## Tableau récapitulatif

| Format | Usage | Disponible depuis |
|--------|-------|-------------------|
| PNG | Partage social | HabitDetail, WeeklyReview |
| PDF | Suivi personnel, impression | Statistics |
| JSON | Sauvegarde, migration | Settings |

## Bonnes pratiques

### Export régulier

Recommander aux utilisateurs d'exporter en JSON régulièrement :
- Avant une mise à jour majeure
- Avant de changer d'appareil
- Mensuellement pour backup

### Confidentialité

- Aucune donnée n'est envoyée à un serveur
- Le fichier reste sur l'appareil de l'utilisateur
- L'utilisateur choisit explicitement de partager

## Ce qu'on n'implémente PAS

- Export automatique vers le cloud
- Synchronisation entre appareils
- Lien vers l'app dans les images

## Références

- Service export image : [src/services/exportImage.ts](../../src/services/exportImage.ts)
- Service export PDF : [src/services/exportPdf.ts](../../src/services/exportPdf.ts)
- PRD : [docs/prd.md §18](../prd.md)
