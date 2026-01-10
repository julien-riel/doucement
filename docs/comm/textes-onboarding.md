# Textes d'onboarding — Doucement

Ce document contient les textes pour les 3 à 4 écrans d'introduction de l'application. Le ton est bienveillant, sobre et encourageant.

---

## Écran 1 — Accueil

**Titre principal**
Bienvenue dans Doucement

**Sous-titre**
L'application qui vous aide à changer, un jour à la fois.

**Corps de texte**
Pas de révolution. Pas de pression.
Juste des petits pas constants vers la personne que vous voulez devenir.

**Bouton**
Commencer →

---

## Écran 2 — La dose du jour

**Titre**
Une seule chose à retenir

**Illustration suggérée**
Un cercle simple avec un chiffre au centre (ex. « 12 »)

**Corps de texte**
Chaque jour, l'application vous montre votre « dose du jour » : ce que vous devez faire aujourd'hui. Pas de tableaux. Pas de graphiques complexes. Juste un objectif clair.

La dose évolue automatiquement selon votre rythme.

**Bouton**
Continuer →

---

## Écran 3 — L'effort partiel

**Titre**
Ici, 70% c'est une victoire

**Illustration suggérée**
Une jauge remplie aux trois quarts avec un check mark

**Corps de texte**
Vous n'avez pas atteint 100% aujourd'hui ? Ce n'est pas grave.

Dans Doucement, faire une partie de votre dose compte. L'important, c'est de ne pas s'arrêter. La perfection n'est pas l'objectif. La constance, oui.

**Bouton**
Continuer →

---

## Écran 4 — Vos données, votre vie privée

**Titre**
Tout reste sur votre appareil

**Illustration suggérée**
Un cadenas ou un smartphone avec un bouclier

**Corps de texte**
Aucun compte à créer.
Aucune donnée envoyée sur internet.
Vos habitudes vous appartiennent.

Vous pouvez exporter vos données à tout moment.

**Bouton**
C'est parti →

---

## Variante courte (3 écrans)

Si l'espace est limité, les écrans 3 et 4 peuvent être fusionnés :

**Titre**
Bienveillance et vie privée

**Corps de texte**
L'effort partiel compte : faire 70% de votre dose, c'est avancer.

Et vos données ? Elles restent sur votre appareil. Aucun compte, aucun tracking.

**Bouton**
C'est parti →

---

## Notes pour le designer

**Ton visuel**
Les illustrations doivent être simples, organiques et chaleureuses. Éviter les icônes trop corporate ou les illustrations surchargées. Privilégier des formes douces, des couleurs naturelles (vert sauge, terracotta, crème).

**Animation**
Des transitions légères entre les écrans (fondu ou glissement doux). Éviter les animations trop énergiques qui contrediraient le message de « douceur ».

**Indicateur de progression**
Points discrets en bas de l'écran. Ne pas afficher de barre de progression agressive.

**Possibilité de skip**
Prévoir un lien « Passer » discret en haut à droite pour les utilisateurs impatients. Ne pas le rendre trop visible pour ne pas encourager à sauter l'onboarding.

---

## Notes pour le développement

**Stockage**
À la fin de l'onboarding, stocker un flag `onboardingCompleted: true` dans le localStorage pour ne pas réafficher les écrans.

**Premier lancement**
Après l'onboarding, diriger l'utilisateur vers l'écran de création d'une première habitude.

**Réaccès**
Prévoir un accès à l'onboarding depuis les paramètres (« Revoir l'introduction ») pour les utilisateurs qui voudraient rafraîchir leur mémoire.
