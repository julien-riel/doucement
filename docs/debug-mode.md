# Mode Debug

Le mode debug permet d'accéder à des fonctionnalités avancées pour tester et déboguer l'application Doucement.

## Activation

### Méthode 1 : Tap multiple sur la version

Dans l'écran **Paramètres**, taper 7 fois sur le numéro de version (ex: "v1.0.0") active le mode debug.

Un message "Mode debug activé" apparaît pour confirmer.

### Méthode 2 : URL parameter (développement)

Ajouter `?debug=true` à l'URL :

```
http://localhost:5173?debug=true
```

### Méthode 3 : Console (développement)

```javascript
localStorage.setItem('doucement-debug', 'true')
location.reload()
```

---

## Désactivation

- Taper à nouveau 7 fois sur la version
- Ou utiliser le bouton "Désactiver mode debug" dans le panneau debug
- Ou supprimer le flag via console : `localStorage.removeItem('doucement-debug')`

---

## Fonctionnalités du panneau debug

Une fois activé, une section **"Panneau Debug"** apparaît dans les Paramètres avec les fonctionnalités suivantes :

### Notifications

| Action | Description |
|--------|-------------|
| **Envoyer notification test** | Envoie immédiatement une notification de test |
| **Tester rappel matinal** | Simule la notification du matin |
| **Tester rappel du soir** | Simule la notification du soir |
| **Tester rappel revue** | Simule la notification de revue hebdomadaire |

### Écrans spéciaux

| Action | Description |
|--------|-------------|
| **Ouvrir WeeklyReview** | Force l'ouverture de la revue hebdomadaire |
| **Ouvrir Onboarding** | Relance l'onboarding complet |

### Simulation de date

| Action | Description |
|--------|-------------|
| **Simuler date** | Définir une date simulée pour tester les calculs |
| **Avancer de 1 jour** | Simuler le passage au jour suivant |
| **Réinitialiser date** | Revenir à la date réelle |

La date simulée affecte :
- Le calcul de la dose du jour (`calculateTargetDose`)
- Les statistiques affichées
- La détection d'absence
- Le déclenchement de la revue hebdomadaire

Un indicateur visuel en haut de l'écran affiche "Date simulée: JJ/MM/AAAA" quand une simulation est active.

### Données de test

| Action | Description |
|--------|-------------|
| **Charger fichier de test** | Sélecteur pour charger un scénario prédéfini |
| **Exporter données** | Export rapide des données actuelles |
| **Réinitialiser données** | Efface toutes les données (avec confirmation) |

Voir `/docs/test-data.md` pour la liste des fichiers de test disponibles.

### Inspection

| Action | Description |
|--------|-------------|
| **Afficher localStorage** | Affiche le JSON brut des données stockées |
| **Copier données** | Copie les données dans le presse-papier |
| **Afficher schéma version** | Montre la version actuelle du schéma |

---

## Indicateurs visuels

Quand le mode debug est activé :

1. **Badge "DEBUG"** - Affiché à côté du logo dans la barre de navigation
2. **Bordure orange** - Bordure colorée autour de l'application (optionnel)
3. **Date simulée** - Bannière si une date est simulée

---

## API Debug (pour développeurs)

Le mode debug expose également quelques fonctions sur `window` pour faciliter le débogage en console :

```javascript
// Disponibles uniquement en mode debug
window.__DOUCEMENT_DEBUG__ = {
  // Accès aux données
  getData: () => {...},
  setData: (data) => {...},

  // Notifications
  sendTestNotification: () => {...},

  // Date
  setSimulatedDate: (dateString) => {...},
  clearSimulatedDate: () => {...},

  // Utils
  recalculateAllDoses: () => {...},
  validateData: () => {...}
}
```

---

## Sécurité

- Le mode debug est **stocké localement** et n'est pas synchronisé
- Les fonctions debug ne sont **jamais disponibles en production** si `import.meta.env.PROD === true` (optionnel, selon la configuration)
- La réinitialisation des données **demande une confirmation**

---

## Cas d'utilisation typiques

### Tester les notifications

1. Activer le mode debug
2. Aller dans Panneau Debug > Notifications
3. Cliquer sur "Envoyer notification test"
4. Vérifier que la notification apparaît

### Tester la revue hebdomadaire

1. Activer le mode debug
2. Charger le fichier de test "weekly-review-due.json"
3. Cliquer sur "Ouvrir WeeklyReview"
4. Vérifier l'affichage des statistiques

### Tester une progression sur plusieurs semaines

1. Activer le mode debug
2. Créer une habitude avec progression
3. Utiliser "Avancer de 1 jour" plusieurs fois
4. Observer l'évolution de la dose cible

### Reproduire un bug signalé

1. Demander à l'utilisateur d'exporter ses données
2. Activer le mode debug
3. Importer les données via le panneau debug
4. Reproduire le problème
