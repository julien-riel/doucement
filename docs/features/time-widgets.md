# Widgets temporels : Chronomètre et Minuterie

## Vue d'ensemble

Les widgets temporels permettent de suivre des habitudes basées sur le temps, comme la méditation, la lecture ou les exercices physiques. Au lieu de saisir manuellement une durée, vous démarrez un chronomètre ou une minuterie directement dans l'application.

## Deux modes disponibles

### Chronomètre (`stopwatch`)

Le chronomètre mesure le temps qui passe. Idéal pour les activités à durée variable.

| Aspect | Description |
|--------|-------------|
| **Affichage** | Temps écoulé (00:00 → ∞) |
| **Départ** | À zéro |
| **Cas d'usage** | Méditation, lecture, sport libre |

**Comportement :**
- Le temps s'écoule depuis le démarrage
- Vous pouvez mettre en pause et reprendre
- Un indicateur visuel s'affiche quand la cible est atteinte
- Le temps enregistré est le temps total écoulé

### Minuterie (`timer`)

La minuterie compte à rebours depuis la cible. Idéale pour les activités à durée fixe avec dépassement possible.

| Aspect | Description |
|--------|-------------|
| **Affichage** | Temps restant (cible → 0 → négatif) |
| **Départ** | À la cible du jour |
| **Cas d'usage** | Gainage, planche, tâches chronométrées |

**Comportement :**
- Le temps décompte depuis la cible vers 0
- En cas de dépassement, le temps devient négatif (-00:15 = 15s de bonus)
- Le temps négatif s'affiche en orange (jamais en rouge)
- Le temps enregistré est le temps total écoulé (pas le temps restant)

## Interface utilisateur

### Boutons de contrôle

Les deux widgets partagent les mêmes boutons :

| Bouton | Action |
|--------|--------|
| ▶ Démarrer | Lance le chrono/minuterie |
| ⏸ Pause | Met en pause (reprendre possible) |
| ⏹ Valider | Arrête et enregistre le temps |
| Réinitialiser | Remet à zéro sans enregistrer |

### États visuels

| État | Apparence |
|------|-----------|
| Initial | Affichage "00:00", bouton Démarrer |
| En cours | Fond légèrement coloré, bouton Pause |
| En pause | Temps fixe, bouton Reprendre |
| Cible atteinte | Bordure verte, message "Objectif atteint !" |
| Dépassement (minuterie) | Temps négatif en orange |

### Barre de progression

Une barre visuelle indique la progression vers la cible :
- Remplissage proportionnel au temps écoulé / cible
- Couleur verte quand la cible est atteinte
- Ne dépasse pas 100% visuellement

## Persistance de l'état

Les chronos et minuteries conservent leur état même si vous fermez l'application.

### Comment ça marche

1. Quand vous démarrez un chrono, l'état est sauvegardé dans le navigateur
2. Si vous fermez l'app pendant qu'un chrono tourne, il reprend automatiquement au retour
3. Le temps écoulé pendant la fermeture est correctement calculé

### Données sauvegardées

```
- ID de l'habitude
- Date concernée
- Heure de démarrage
- Temps accumulé avant pause
- État (en cours / en pause)
```

## Notifications

Quand la cible est atteinte, vous pouvez recevoir une notification :

- **Vibration** : Vibration courte (si supportée par votre appareil)
- **Son** : Petit "ding" discret

Pour activer cette fonction, cochez l'option "Notifier quand la cible est atteinte" lors de la création de l'habitude.

## Compatibilité avec EntryMode

Les widgets temporels fonctionnent avec les deux modes d'entrée :

| Entry Mode | Comportement |
|------------|--------------|
| `replace` | Chaque session remplace la précédente |
| `cumulative` | Les sessions s'additionnent dans la journée |

### Exemple : Lecture cumulative

- Matin : 15 minutes de lecture → Total : 15 min
- Soir : 20 minutes de lecture → Total : 35 min

## Cas d'usage recommandés

### Chronomètre

- **Méditation** : "Je médite 10 minutes par jour" → Dose: 600 secondes
- **Lecture** : "Je lis 30 minutes par jour" → Dose: 1800 secondes, mode cumulative
- **Sport** : "Je cours 20 minutes" → Dose: 1200 secondes

### Minuterie

- **Gainage** : "Je tiens ma planche 2 minutes" → Dose: 120 secondes
- **Pomodoro** : "Je travaille 25 minutes d'affilée" → Dose: 1500 secondes
- **Étirements** : "Je tiens chaque position 1 minute" → Dose: 60 secondes

## Création d'une habitude temporelle

1. Dans le wizard de création, choisissez le mode de tracking :
   - **Chronomètre** pour mesurer le temps qui passe
   - **Minuterie** pour un compte à rebours avec dépassement possible

2. Définissez votre dose cible en secondes ou minutes

3. Optionnellement, activez la notification quand la cible est atteinte

## Intégration aux statistiques

Les valeurs des widgets temporels s'intègrent naturellement dans :
- Les graphiques de progression
- Le calendrier heatmap
- Les statistiques hebdomadaires
- Les projections d'objectif

Le temps est stocké en secondes et converti pour l'affichage selon l'unité choisie.

## Accessibilité

- Tous les boutons ont des labels ARIA descriptifs
- Annonce vocale quand la cible est atteinte
- Contraste suffisant pour les chiffres du chrono
- Navigation au clavier supportée

## Références

- Types : [src/types/index.ts](../../src/types/index.ts) - `TimerState`
- Composants : `StopwatchCheckIn`, `TimerCheckIn`
- Hooks : `useStopwatch`, `useTimer`
- Service : [timerStorage.ts](../../src/services/timerStorage.ts)
