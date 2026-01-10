# Fichiers de données de test

Ce document décrit les fichiers de test prédéfinis permettant de vérifier différents scénarios de l'application Doucement.

## Objectif

Les fichiers de test permettent de :
- Tester rapidement des fonctionnalités difficiles d'accès (atteinte d'objectif, revue hebdomadaire)
- Reproduire des cas d'utilisation spécifiques
- Faciliter les démos et présentations
- Aider au débogage

## Emplacement

Les fichiers de test sont situés dans `/public/test-data/` et sont accessibles via le mode debug de l'application.

---

## Fichiers disponibles

### 1. `goal-reached.json` - Atteinte d'objectif

**Scénario** : Une habitude progressive qui a atteint (ou est sur le point d'atteindre) sa valeur cible (`targetValue`).

**Cas d'utilisation** :
- Tester le message de félicitations quand `targetValue` est atteint
- Vérifier le comportement de l'habitude une fois l'objectif atteint
- Tester la suggestion de maintenir le niveau

**Données** :
- 1 habitude "Push-ups" en mode `increase`
- `startValue`: 10, `targetValue`: 50
- Date de création il y a ~45 jours
- Entrées quotidiennes montrant une progression jusqu'à 48-50

---

### 2. `growth-plateau.json` - Arrêt de croissance / Plateau

**Scénario** : Une habitude qui stagne depuis plusieurs jours (l'utilisateur fait exactement la dose cible sans jamais dépasser).

**Cas d'utilisation** :
- Tester la détection de plateau
- Vérifier la suggestion d'arrêter la progression et de passer en mode `maintain`
- Tester les messages d'encouragement pour la constance

**Données** :
- 1 habitude "Méditation" en mode `increase` (+5%/semaine)
- 14 jours d'entrées où `actualValue` = `targetDose` exactement
- Pas de dépassements, pas de journées partielles

---

### 3. `absence-detected.json` - Rappel tâches non-faites / Absence

**Scénario** : Utilisateur absent depuis 2-3 jours (pas d'entrées récentes).

**Cas d'utilisation** :
- Tester le composant `WelcomeBackMessage`
- Vérifier la détection d'absence dans `utils/absence.ts`
- Tester le ton bienveillant du retour

**Données** :
- 2 habitudes actives avec historique régulier
- Dernières entrées il y a 3 jours
- Aucune entrée pour aujourd'hui, hier et avant-hier

---

### 4. `weekly-review-due.json` - Revue hebdomadaire à faire

**Scénario** : La revue hebdomadaire est disponible (7+ jours depuis la dernière).

**Cas d'utilisation** :
- Tester l'écran `WeeklyReview`
- Vérifier le calcul des statistiques de la semaine
- Tester l'analyse des patterns

**Données** :
- 3 habitudes variées (increase, decrease, maintain)
- `lastWeeklyReviewDate` il y a 8 jours
- 7 jours d'entrées avec des performances variées
- Patterns détectables (meilleurs jours: lundi, mardi)

---

### 5. `habit-stacking.json` - Habitudes chaînées

**Scénario** : Plusieurs habitudes liées entre elles via `anchorHabitId`.

**Cas d'utilisation** :
- Tester l'affichage des chaînes d'habitudes
- Vérifier le regroupement visuel
- Tester la création d'une habitude ancrée à une autre

**Données** :
- Habitude A: "Café du matin" (routine de base)
- Habitude B: "Méditation" (ancrée à A)
- Habitude C: "Journal" (ancrée à B)
- Habitude D: "Sport" (indépendante)

---

### 6. `planned-pause.json` - Pause planifiée

**Scénario** : Une habitude est en pause planifiée (vacances, maladie).

**Cas d'utilisation** :
- Tester l'affichage de l'indicateur de pause
- Vérifier que les stats ne sont pas impactées
- Tester la fin automatique de la pause

**Données** :
- 1 habitude avec `plannedPause` active (dates couvrant aujourd'hui)
- 1 habitude avec `plannedPause` passée (terminée)
- 1 habitude sans pause (pour comparaison)

---

### 7. `full-scenario.json` - Scénario complet

**Scénario** : Un utilisateur expérimenté avec un historique riche.

**Cas d'utilisation** :
- Test de performance avec beaucoup de données
- Démo complète de l'application
- Test de migration de données

**Données** :
- 5-6 habitudes (mix de tous les types)
- 60+ jours d'historique
- Entrées variées (complétées, partielles, manquantes)
- Implementation intentions configurées
- Réflexions hebdomadaires sauvegardées

---

## Utilisation

### Via le mode debug

1. Activer le mode debug (voir `/docs/debug-mode.md`)
2. Aller dans Paramètres > Panneau Debug
3. Sélectionner "Charger fichier de test"
4. Choisir le scénario souhaité

### Via l'import manuel

1. Aller dans Paramètres > Données
2. Cliquer sur "Importer"
3. Sélectionner le fichier `.json` souhaité

### Via URL (développement uniquement)

```
http://localhost:5173?load-test=goal-reached
```

---

## Structure des fichiers

Chaque fichier suit la structure `AppData` :

```json
{
  "schemaVersion": 3,
  "habits": [...],
  "entries": [...],
  "preferences": {
    "onboardingCompleted": true,
    "lastWeeklyReviewDate": "...",
    "notifications": {...}
  }
}
```

Les dates dans les fichiers sont **relatives à aujourd'hui** et sont recalculées au chargement pour garantir des scénarios réalistes.

---

## Création de nouveaux fichiers de test

Pour créer un nouveau scénario :

1. Exporter les données depuis une session de test
2. Anonymiser les données si nécessaire
3. Convertir les dates en format relatif (`-1d`, `-7d`, etc.)
4. Documenter le scénario dans ce fichier
5. Placer le fichier dans `/public/test-data/`

---

## Notes importantes

- Les fichiers de test ne contiennent **aucune donnée personnelle**
- Les données sont **remplacées** lors du chargement (pas de fusion)
- Un message de confirmation est affiché avant le chargement
- Les données actuelles peuvent être exportées avant de charger un fichier de test
