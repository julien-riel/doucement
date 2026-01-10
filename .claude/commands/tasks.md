# Commande /tasks — Gestion des tâches du projet

Cette commande permet de consulter et mettre à jour le fichier `tasks.json` qui contient toutes les tâches du projet Doucement.

## Instructions

### Lecture du fichier

1. Lis le fichier `tasks.json` à la racine du projet
2. Affiche un résumé structuré :
   - Statistiques globales (total, complétées, en cours, en attente)
   - Pour chaque phase : nom, statut, nombre de tâches par statut
   - Si l'utilisateur demande une phase spécifique, affiche le détail des tâches

### Format d'affichage

```
## Projet Doucement — Suivi des tâches

**Progression globale :** X/Y tâches (Z%)

### Phase 1 : Structure projet React + Vite
- Statut : [En cours / Complétée / En attente]
- Tâches : X complétées, Y en cours, Z en attente

### Phase 2 : Stockage local
...
```

### Mise à jour des tâches

Quand l'utilisateur demande de mettre à jour une tâche :

1. Identifie la tâche par son ID (ex: "1.3", "2.1", "5.6")
2. Modifie le champ `status` avec une des valeurs :
   - `"pending"` — En attente
   - `"in_progress"` — En cours
   - `"completed"` — Terminée
3. Mets à jour le champ `updatedAt` à la date du jour (format YYYY-MM-DD)
4. Recalcule les `stats` globales
5. Si toutes les tâches d'une phase sont complétées, mets le statut de la phase à `"completed"`

### Commandes supportées

- `/tasks` ou `/tasks status` — Affiche le résumé de toutes les phases
- `/tasks phase 1` — Affiche le détail de la phase 1
- `/tasks complete 1.3` — Marque la tâche 1.3 comme complétée
- `/tasks start 2.1` — Marque la tâche 2.1 comme en cours
- `/tasks reset 3.5` — Remet la tâche 3.5 en attente
- `/tasks add 2 "Nom de la tâche" "Description"` — Ajoute une tâche à la phase 2
- `/tasks next` — Affiche les prochaines tâches à faire (priorité high, status pending)

### Règles importantes

1. **Ne jamais perdre de données** — Toujours lire le fichier avant de le modifier
2. **Garder la cohérence** — Mettre à jour les stats après chaque modification
3. **Une seule tâche en cours par phase** — Recommandé pour le focus
4. **Dates au format YYYY-MM-DD** — Standard ISO pour les dates

### Exemple de mise à jour

Si l'utilisateur dit : "J'ai terminé l'initialisation du projet Vite"

1. Cherche la tâche correspondante (1.1)
2. Modifie : `"status": "completed"`
3. Met à jour `updatedAt`
4. Recalcule les stats : `completed: 1, pending: 47`
5. Confirme : "Tâche 1.1 marquée comme complétée. Progression : 1/48 (2%)"

$ARGUMENTS
