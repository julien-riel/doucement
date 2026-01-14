# Spécification produit & architecture

## Application d’habitudes progressives (inspirée de *Atomic Habits*)

---

## 1. Objectif du document

Ce document décrit **la vision produit, les fonctionnalités, l’expérience utilisateur et l’architecture technique** de l’application.

Il sert de **référence commune** pour :

* l’équipe de **développement** (implémentation front-end, logique métier, stockage)
* le **designer** (UX/UI, ton, micro-interactions)
* la personne **communication / user guide / marketing** (positionnement, messages clés, documentation utilisateur)

---

## 2. Vision produit

### Problème adressé

De nombreuses personnes souhaitent :

* être plus **en santé**
* plus **heureuses**
* plus **efficaces**

Mais échouent souvent à cause de :

* changements trop brusques
* objectifs irréalistes
* culpabilisation
* outils intrusifs ou trop complexes

### Proposition de valeur

> Aider l’utilisateur à améliorer ses habitudes **progressivement**, **sans culpabilité**, **sans surveillance externe**, en s’appuyant sur l’effet composé et l’identité personnelle.

Principes fondateurs :

* Progression douce (± unités ou ± %)
* Une seule priorité : **la dose du jour**
* Effort partiel = succès
* Zéro backend → respect maximal de la vie privée

---

## 3. Public cible

* Grand public
* Personnes souhaitant :

  * améliorer leur santé (activité, alimentation, sommeil)
  * réduire de mauvaises habitudes (junk food, alcool, cigarette, écrans)
  * augmenter leur efficacité et leur bien-être

Le public **n’est pas** :

* des athlètes de performance
* des utilisateurs cherchant une gamification agressive

---

## 4. Concepts clés du produit

### 4.1 Types d’habitudes

1. **Habitude simple**

   * Oui / Non (ex. boire un verre d’eau)

2. **Habitude progressive**

   * Augmente ou diminue une *dose* dans le temps
   * Exemples :

     * +3 % de push-ups par semaine
     * −5 % de cigarettes par semaine
     * −1 portion de sucre par jour

### 4.2 Dose du jour

Concept central de l'application.

L'utilisateur ne gère jamais un objectif lointain.
Il voit uniquement :

> « Voici la dose cible pour aujourd'hui »

La progression est calculée automatiquement.

### 4.3 Fréquence de suivi

Les habitudes peuvent être suivies selon deux fréquences :

1. **Quotidienne** (par défaut)
   * L'utilisateur voit sa dose du jour
   * Check-in journalier classique
   * Exemple : "8 verres d'eau par jour"

2. **Hebdomadaire**
   * L'utilisateur voit sa progression de la semaine : "X/Y cette semaine"
   * Utile pour des objectifs qui ne s'appliquent pas tous les jours
   * Exemples :
     * "3 soirs de coucher à heure fixe par semaine"
     * "7 verres d'alcool maximum par semaine"
   * Le check-in quotidien est binaire (fait/pas fait)
   * Le compteur hebdomadaire s'incrémente automatiquement

Cette distinction permet de mieux représenter les habitudes qui ont naturellement un rythme hebdomadaire plutôt que quotidien.

---

## 5. Parcours utilisateur (haut niveau)

1. Onboarding guidé (3–4 écrans max)
2. Choix de 1 à 3 habitudes
3. Utilisation quotidienne de l’écran **Aujourd’hui**
4. Check-in simple (fait / partiel / dépassé)
5. Revue hebdomadaire avec ajustements
6. Progression continue sans remise à zéro

---

## 6. Écrans principaux (résumé)

* Onboarding
* Aujourd’hui (écran central)
* Créer une habitude
* Liste des habitudes
* Détail d’une habitude
* Progrès global
* Revue hebdomadaire
* Profil & paramètres

> Les wireframes détaillés font partie d’un document séparé ou d’une annexe.

---

## 7. Ton et principes UX (designer & communication)

### Ton

* Bienveillant
* Non moralisateur
* Encourageant mais sobre

À éviter absolument :

* vocabulaire d’échec
* pression
* comparaison sociale

### Règles UX

* 1–2 interactions max pour un check-in
* Mobile-first
* Lecture immédiate (pas de tableaux complexes)
* Toujours offrir une sortie positive

---

## 8. Architecture technique

### 8.1 Choix structurants

* Application **100 % statique**
* Aucune communication serveur
* Données stockées localement
* Import / export manuel des données

Objectifs :

* Vie privée maximale
* Coûts d’infrastructure nuls
* Simplicité de maintenance

---

## 8.2 Stack technique cible

* Front-end : SPA (React / Vue / Svelte – au choix de l’équipe)
* Déploiement : fichiers statiques
* Serveur : **Nginx**
* Stockage :

  * MVP : `localStorage`
  * Évolution possible : `IndexedDB`

---

## 8.3 Stockage des données

### Principes

* Toutes les données sont locales
* Aucun tracking serveur
* L’utilisateur est propriétaire de ses données

### Format

* JSON structuré
* Champ `schemaVersion` obligatoire
* Dates stockées au format local `YYYY-MM-DD`

---

## 8.4 Import / Export

### Export

* Téléchargement manuel d’un fichier `.json`
* Contient :

  * paramètres
  * habitudes
  * historique
* Option future : chiffrement côté client

### Import

* Validation du schéma
* Choix utilisateur :

  * remplacer
  * fusionner
* Migration automatique si version antérieure

---

## 8.5 Calcul de la progression

### Modes supportés

* Incrément absolu

  * +1 unité / jour
  * −1 unité / semaine

* Pourcentage

  * +X % / semaine
  * −X % / semaine

### Règles

* Arrondis explicites (plancher / plafond selon type)
* Version minimale toujours acceptée
* Progression ajustable à tout moment

---

## 9. Notifications locales

### Principes

* **Opt-in uniquement** : désactivées par défaut, l'utilisateur doit explicitement les activer
* **100% locales** : aucun serveur push, tout se passe sur l'appareil
* **Non intrusives** : respectent le ton bienveillant de l'app

### Types de rappels

1. **Rappel matinal** (configurable)
   * Heure par défaut : 08:00
   * Message : « Votre dose du jour vous attend »

2. **Rappel du soir** (optionnel)
   * Uniquement si journée non enregistrée
   * Heure par défaut : 20:00
   * Message : « Vous n'avez pas encore enregistré votre journée »

3. **Rappel de revue hebdomadaire** (optionnel)
   * Le dimanche
   * Message : « C'est l'heure de votre revue hebdomadaire »

### Implémentation technique

* Web Notifications API pour les notifications dans le navigateur
* Service Worker pour les notifications en arrière-plan (PWA installée)
* Stockage des préférences dans `UserPreferences`
* Pas de dépendance à des services tiers (Firebase, OneSignal, etc.)

---

## 10. Sécurité & vie privée

* Aucune donnée transmise à des serveurs tiers
* Pas d'analytics obligatoires
* Notifications 100% locales (pas de push serveur)
* Option future :

  * verrouillage local par mot de passe
  * chiffrement des exports

---

## 11. Rôles dans l'équipe

### Développeurs

* Implémentation UI + logique métier
* Gestion du stockage local
* Import / export / migration

### Designer

* UX mobile-first
* Micro-interactions
* Hiérarchie visuelle claire
* Messages bienveillants

### Communication / user guide / marketing

* Traduire les concepts :

  * « dose du jour »
  * « progression douce »
* Rédiger :

  * guide utilisateur
  * onboarding textuel
  * messages motivationnels

---

## 12. Critères de succès

* L’utilisateur comprend l’app sans tutoriel long
* L’utilisation quotidienne prend < 30 secondes
* Aucun sentiment d’échec
* L’utilisateur ressent une progression réelle après 2–3 semaines

---

## 13. Hors scope (pour l'instant)

* Backend serveur
* Comptes utilisateurs
* Synchronisation multi-appareils automatique
* Comparaison sociale

Ces éléments pourront être envisagés **uniquement** si compatibles avec la vision vie privée.

---

## 14. Identité & Motivation (« Le Pourquoi »)

### Fondement scientifique

*Atomic Habits* insiste sur le pouvoir de l'identité : « Je suis quelqu'un qui fait de l'exercice » est plus puissant que « Je veux faire 50 pompes ». Le changement durable vient du changement d'identité, pas seulement du changement de comportement.

### Fonctionnalité : Déclaration d'intention identitaire

1. **Phrase d'identité optionnelle**
   * Au moment de créer une habitude, l'utilisateur peut définir sa phrase identitaire
   * Format : « Je deviens quelqu'un qui [description] »
   * Exemples :
     * « Je deviens quelqu'un qui prend soin de son corps »
     * « Je suis une personne qui lit chaque jour »
     * « Je deviens quelqu'un qui maîtrise son temps d'écran »

2. **Rappel de l'identité**
   * Affichée sur l'écran de détail de l'habitude
   * Rappelée lors de la revue hebdomadaire
   * Renforce la motivation intrinsèque

### Ce qu'on n'implémente PAS

* Pas de partage obligatoire de l'identité
* Pas de validation externe de l'identité

---

## 15. Mode Rattrapage Intelligent

### Problème adressé

Après une absence prolongée (vacances, maladie, perte de motivation), la dose calculée peut être devenue irréaliste. L'utilisateur revient face à un objectif impossible, ce qui garantit l'abandon.

### Fonctionnalité : Recalibration bienveillante

1. **Détection d'absence prolongée**
   * Si 7+ jours sans check-in sur une habitude progressive
   * Différent du message de retour après 2-3 jours (déjà existant)

2. **Proposition de recalibration**
   * Message bienveillant : « Tu étais absent un moment. On recalibre ensemble ? »
   * Options de reprise :
     * Reprendre à 50% de la dernière dose
     * Reprendre à 75% de la dernière dose
     * Reprendre au niveau où j'en étais
   * Sans jugement, sans compteur de « jours manqués »

3. **Conservation de l'historique**
   * L'historique reste intact
   * Nouvelle date de départ pour le calcul de progression
   * La recalibration est enregistrée pour analyse future

---

## 16. Visualisation de l'Effet Composé

### Problème adressé

Le produit repose sur l'effet composé, mais l'utilisateur ne le *voit* jamais. Après 3 semaines de +3%/semaine, il fait peut-être 15% de plus qu'au départ — mais il ne le réalise pas.

### Fonctionnalité : Vue « D'où je viens »

1. **Comparaison simple**
   * Affichage sur l'écran de détail : « Jour 1 : 8 pompes → Aujourd'hui : 14 pompes »
   * Pas de graphique complexe, juste un avant/après parlant

2. **Métriques d'effet composé**
   * Pourcentage de progression depuis le début (+75%)
   * Différence en valeur absolue (+6 pompes)

3. **Milestones de progression**
   * Détection automatique des paliers significatifs
   * Célébration quand l'utilisateur double sa dose initiale
   * Célébration à +50%, +100%, +200%

4. **Intégration dans WeeklyReview**
   * Section « Votre progression depuis le début »
   * Rappel du chemin parcouru

---

## 17. Premier Check-in Immédiat (Day One)

### Problème adressé

L'onboarding mène à créer une habitude, puis l'utilisateur doit attendre le lendemain pour voir sa première dose. C'est un trou dans l'engagement initial.

### Fonctionnalité : Première victoire instantanée

1. **Proposition après création**
   * Après confirmation de l'habitude : « Voulez-vous enregistrer ce que vous avez déjà fait aujourd'hui ? »
   * Option de faire son premier check-in immédiatement

2. **Check-in du jour de création**
   * Autoriser l'enregistrement d'une entrée le jour même
   * La dose du jour 1 est égale à la dose de départ

3. **Message de première victoire**
   * Célébration immédiate si premier check-in effectué
   * « Première dose enregistrée. Le voyage commence maintenant. »

---

## 18. Export Visuel Partageable

### Problème adressé

L'app exclut la comparaison sociale — très bien. Mais un export visuel permettrait à l'utilisateur de célébrer sans créer de compétition.

### Fonctionnalité : Image de progression

1. **Carte partageable**
   * Image générée avec résumé de progression
   * Format : 30 jours, habitude, statistiques clés
   * Design sobre avec branding léger « Doucement »

2. **Contenu de la carte**
   * Emoji + nom de l'habitude
   * « 30 jours sur ma trajectoire »
   * Dose initiale → Dose actuelle
   * Nombre de jours actifs

3. **Partage**
   * Téléchargement en PNG
   * API Web Share sur mobile (partage natif)
   * Option dans HabitDetail et WeeklyReview

### Ce qu'on n'implémente PAS

* Pas de lien vers l'app dans l'image
* Pas de classement ou comparaison
* Pas de partage automatique

---

## 19. Widget Mobile (PWA)

### Problème adressé

Pour une app d'usage quotidien de moins de 30 secondes, la friction d'ouverture de l'app est un risque de décrochage. Un widget affichant la dose du jour sans ouvrir l'app serait idéal.

### Limitations PWA

Les widgets natifs (iOS/Android) ne sont pas disponibles pour les PWA. Les alternatives sont :

### Fonctionnalités implémentées

1. **PWA Shortcuts**
   * Accès rapide via appui long sur l'icône
   * Shortcut « Check-in rapide » → page minimaliste

2. **Page Quick Check-in**
   * Route `/quick-checkin`
   * Interface ultra-minimaliste
   * Affiche uniquement les habitudes du jour
   * Check-in en un tap

3. **App Badge (expérimental)**
   * Badge sur l'icône avec le nombre de doses restantes
   * Via `navigator.setAppBadge()` (support limité)

### Documentation utilisateur

Guide expliquant :
* Comment ajouter l'app à l'écran d'accueil
* Comment utiliser les shortcuts
* Les limitations par rapport aux widgets natifs

---

## 20. Améliorations basées sur la science comportementale

### Fonctionnalités implémentées

Basées sur la recherche en psychologie et sciences comportementales :

1. **Implementation Intentions** (Gollwitzer, 1999)
   * Plans "si-alors" pour automatiser les comportements
   * "Après [DÉCLENCHEUR], je ferai [HABITUDE] à [LIEU]"

2. **Habit Stacking** (Clear, Fogg)
   * Ancrer les nouvelles habitudes aux existantes
   * Augmente le taux de succès de 64%

3. **Récupération bienveillante**
   * Messages de retour sans culpabilité après une pause
   * Option de pause planifiée (vacances, maladie)

4. **Mode binaire débutant**
   * Tracking simplifié les 30 premiers jours
   * Maintient les habitudes 27% plus longtemps

5. **Friction intentionnelle** (habitudes à réduire)
   * Délai de réflexion avant de logger
   * Suggestion d'alternatives positives

6. **Revue hebdomadaire enrichie**
   * Réflexion guidée
   * Identification des patterns
   * Suggestions d'ajustement

### Principes scientifiques retenus

* **Self-Determination Theory** (Deci & Ryan) : Autonomie, Compétence, Connexion
* **Renforcement positif** : Plus efficace que la punition pour le changement long terme
* **Effet composé** : Petits changements → grands résultats

---

## 21. Ce qu'il ne faut PAS ajouter

Ces fonctionnalités sont explicitement exclues car elles vont à l'encontre de la philosophie de l'application :

* **Streaks visibles** — Créent de l'anxiété et transforment un jour manqué en catastrophe
* **Badges/récompenses** — Gamification qui attire un public différent et dilue le message
* **Classements** — Contradictoire avec « pas de comparaison sociale »
* **Notifications agressives** — L'app doit rester un outil, pas un maître
* **Objectifs imposés** — L'utilisateur définit son propre rythme
* **Compteur de jours manqués** — Culpabilisant et contre-productif

---

## 22. Conclusion

Cette application est volontairement **simple techniquement** mais **exigeante sur l’expérience humaine**.

Le succès du produit repose sur :

* la clarté
* la douceur
* la constance

> *La trajectoire compte plus que la perfection.*