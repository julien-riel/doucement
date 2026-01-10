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

Concept central de l’application.

L’utilisateur ne gère jamais un objectif lointain.
Il voit uniquement :

> « Voici la dose cible pour aujourd’hui »

La progression est calculée automatiquement.

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

## 9. Sécurité & vie privée

* Aucune donnée transmise à des serveurs tiers
* Pas d’analytics obligatoires
* Option future :

  * verrouillage local par mot de passe
  * chiffrement des exports

---

## 10. Rôles dans l’équipe

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

## 11. Critères de succès

* L’utilisateur comprend l’app sans tutoriel long
* L’utilisation quotidienne prend < 30 secondes
* Aucun sentiment d’échec
* L’utilisateur ressent une progression réelle après 2–3 semaines

---

## 12. Hors scope (pour l'instant)

* Backend serveur
* Comptes utilisateurs
* Synchronisation multi-appareils automatique
* Comparaison sociale

Ces éléments pourront être envisagés **uniquement** si compatibles avec la vision vie privée.

---

## 13. Améliorations basées sur la science comportementale

> Document détaillé : `docs/science-based-improvements.md`

### Fonctionnalités planifiées (Phase 6)

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

## 14. Conclusion

Cette application est volontairement **simple techniquement** mais **exigeante sur l’expérience humaine**.

Le succès du produit repose sur :

* la clarté
* la douceur
* la constance

> *La trajectoire compte plus que la perfection.*