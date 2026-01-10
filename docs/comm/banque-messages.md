# Banque de messages — Doucement

Ce document contient l'ensemble des messages, encouragements et micro-textes de l'application. Chaque message respecte le ton bienveillant et non moralisateur de l'application.

---

## Principes rédactionnels

**À privilégier :**
- Formulations positives
- Reconnaissance de l'effort
- Focus sur la trajectoire, pas la performance
- Simplicité et sobriété

**À éviter absolument :**
- Vocabulaire d'échec (« raté », « perdu », « manqué »)
- Comparaisons (« mieux que les autres », « dans le top X% »)
- Pression temporelle (« il reste X heures ! »)
- Culpabilisation passive-agressive (« Tu es sûr ? »)

---

## Messages de check-in quotidien

### Dose complétée (100%)

- « Nickel. À demain. »
- « C'est fait. Beau travail. »
- « Dose du jour : accomplie. »
- « Parfait. Un jour de plus sur la bonne voie. »
- « ✓ Enregistré. Vous avancez. »

### Dose partiellement complétée (50-99%)

- « Chaque effort compte. C'est noté. »
- « Vous avez avancé aujourd'hui. C'est l'essentiel. »
- « Pas 100%, mais vous n'avez pas abandonné. »
- « L'important, c'est d'avoir fait quelque chose. »
- « Bien joué. Demain est un autre jour. »

### Dose dépassée (>100%)

- « Au-delà de la dose. Impressionnant, mais pas obligatoire. »
- « Vous en avez fait plus. L'élan est là. »
- « Extra ! Mais souvenez-vous : la régularité bat l'intensité. »

### Journée sans activité enregistrée

- « Pas d'entrée aujourd'hui. Ce n'est pas grave. »
- « Une pause, c'est aussi avancer parfois. »
- « Demain est une nouvelle occasion. »

---

## Messages de revue hebdomadaire

### Semaine positive (majorité des jours avec activité)

- « Belle semaine. Vous construisez quelque chose. »
- « 7 jours de plus sur votre trajectoire. »
- « La constance paie. Continuez comme ça. »
- « Semaine solide. L'effet composé fait son travail. »

### Semaine moyenne (environ 50% des jours)

- « Une semaine en demi-teinte, mais vous êtes toujours là. »
- « Quelques jours actifs. C'est mieux que zéro. »
- « La semaine n'a pas été parfaite. Et alors ? On continue. »

### Semaine difficile (peu ou pas d'activité)

- « Semaine compliquée ? Ça arrive. »
- « Pas la meilleure semaine, mais ce n'est qu'une semaine. »
- « L'important n'est pas de tomber, c'est de se relever. »
- « Nouveau départ dans 3... 2... 1... »

### Message de milestone (ex: 4 semaines, 3 mois, etc.)

- « Ça fait [X] semaines que vous avez commencé. Regardez le chemin parcouru. »
- « [X] jours sur cette habitude. Vous n'êtes plus la même personne. »
- « Un mois. Puis deux. Puis trois. C'est ça, l'effet composé. »

---

## Messages d'interface

### Écran vide (pas d'habitude créée)

**Titre :** « Tout commence par une habitude »
**Sous-titre :** « Créez votre première habitude pour démarrer votre progression. »
**Bouton :** « Créer une habitude »

### Confirmation de création d'habitude

- « Habitude créée. Votre dose du jour commence demain. »
- « C'est parti. Vous verrez votre première dose demain matin. »

### Confirmation de modification

- « Modification enregistrée. »
- « C'est noté. Votre nouvelle progression démarre maintenant. »

### Confirmation d'archivage

- « Habitude archivée. Son historique est conservé. »
- « Habitude mise en pause. Vous pourrez la réactiver quand vous voudrez. »

### Confirmation d'export

- « Export terminé. Vos données sont dans le fichier téléchargé. »

### Confirmation d'import

- « Import réussi. Vos données sont restaurées. »

### Erreur d'import (fichier invalide)

- « Ce fichier ne semble pas compatible. Vérifiez qu'il s'agit d'un export Doucement. »

---

## Messages de progression

### Augmentation de dose (habitude en croissance)

- « Nouvelle dose : [X]. Vous avez grandi depuis le début. »
- « Votre dose augmente à [X]. Signe que vous progressez. »

### Diminution de dose (habitude en réduction)

- « Nouvelle cible : [X]. Vous vous rapprochez de votre objectif. »
- « Dose réduite à [X]. Chaque jour, un peu moins. »

### Objectif atteint

- « Objectif atteint. Vous l'avez fait. »
- « La cible est atteinte. Félicitations, vraiment. »
- « C'est fait. Vous pouvez être fier·e de vous. »

---

## Notifications (si activées)

### Rappel quotidien (matin)

- « Votre dose du jour vous attend. »
- « Nouveau jour, nouvelle dose. »
- « Qu'est-ce qu'on fait aujourd'hui ? »

### Rappel quotidien (soir, si pas encore fait)

- « Vous n'avez pas encore enregistré votre journée. »
- « Petit rappel : votre dose du jour est toujours là. »

### Rappel hebdomadaire (revue)

- « C'est l'heure de votre revue hebdomadaire. »
- « Comment s'est passée votre semaine ? Faisons le point. »

**Note importante :** Les notifications sont optionnelles et désactivées par défaut. L'utilisateur doit explicitement les activer.

---

## Textes légaux et paramètres

### À propos

> Doucement est une application conçue pour vous aider à améliorer vos habitudes progressivement, sans culpabilité. Vos données restent sur votre appareil. Aucune information n'est collectée ni transmise.

### Vie privée

> Cette application fonctionne entièrement hors ligne. Aucune donnée personnelle n'est collectée, stockée sur des serveurs ou partagée avec des tiers. Toutes vos informations restent exclusivement sur votre appareil.

---

## Index des termes clés (pour cohérence)

| Terme officiel | À éviter |
|----------------|----------|
| Dose du jour | Objectif, quota, cible quotidienne |
| Progression | Performance, score |
| Enregistrer | Valider, confirmer |
| Archiver | Supprimer, effacer |
| Effort partiel | Échec partiel, tentative |
| Habitude | Challenge, défi |
| Revue hebdomadaire | Bilan, évaluation |

---

## Notes pour l'implémentation

Les messages de check-in devraient être affichés de manière aléatoire parmi les options disponibles pour éviter la répétition et maintenir un sentiment de fraîcheur.

Pour les milestones, calculer automatiquement le nombre de jours ou semaines depuis la création de l'habitude.

Tous les messages doivent pouvoir être traduits. Prévoir une structure de fichiers de langue (fr.json, en.json, etc.).
