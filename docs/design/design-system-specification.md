# 📐 Design System & Guide UX
## Application Habitudes Progressives

---

## Table des matières

1. [Philosophie de design](#1-philosophie-de-design)
2. [Design Tokens](#2-design-tokens)
3. [Typographie](#3-typographie)
4. [Palette de couleurs](#4-palette-de-couleurs)
5. [Composants UI](#5-composants-ui)
6. [Micro-interactions](#6-micro-interactions)
7. [Guide UX Writing](#7-guide-ux-writing)
8. [Wireframes & Flux](#8-wireframes--flux)
9. [Accessibilité](#9-accessibilité)
10. [Annexes](#10-annexes)

---

## 1. Philosophie de design

### Vision esthétique

L'application adopte une esthétique **"Soft Organic"** — douce, chaleureuse et naturelle.

| Principe | Application |
|----------|-------------|
| **Douceur** | Coins très arrondis, ombres diffuses, couleurs désaturées |
| **Chaleur** | Palette de tons orangés et neutres chauds (pas de gris froids) |
| **Clarté** | Hiérarchie visuelle évidente, une seule action principale par écran |
| **Respiration** | Espaces généreux, pas de surcharge visuelle |

### Ce que l'app **n'est pas**

- ❌ Gamification agressive (pas de badges clinquants, pas de "streaks" stressants)
- ❌ Interface froide et clinique
- ❌ Design "fitness bro" agressif
- ❌ Tableaux de bord complexes

### Métaphore visuelle

> L'application est comme un **jardin personnel** : on plante des graines (habitudes), on les arrose quotidiennement (dose du jour), et on observe leur croissance naturelle (progression).

---

## 2. Design Tokens

### Espacements

```
spacing-1:   4px   (0.25rem)  — micro-ajustements
spacing-2:   8px   (0.5rem)   — entre éléments liés
spacing-3:  12px   (0.75rem)  — padding interne compact
spacing-4:  16px   (1rem)     — padding standard
spacing-5:  20px   (1.25rem)  — padding généreux
spacing-6:  24px   (1.5rem)   — séparation de sections
spacing-8:  32px   (2rem)     — grandes séparations
spacing-10: 40px   (2.5rem)   — marges de page
spacing-12: 48px   (3rem)     — espace entre écrans
```

### Rayons de bordure

```
radius-sm:   8px   — éléments secondaires, badges
radius-md:  12px   — boutons, champs
radius-lg:  16px   — cartes
radius-xl:  24px   — cartes principales, modales
radius-full: 9999px — avatars, pills, indicateurs
```

### Ombres

```css
shadow-soft:   0 2px 8px rgba(28, 25, 23, 0.06)   /* Cartes standard */
shadow-medium: 0 4px 16px rgba(28, 25, 23, 0.08)  /* Cartes élevées */
shadow-glow:   0 0 24px rgba(242, 125, 22, 0.15)  /* État focus/actif */
```

---

## 3. Typographie

### Familles de polices

| Usage | Police | Fallback |
|-------|--------|----------|
| **Titres & accents** | Fraunces | Georgia, serif |
| **Corps de texte** | Source Sans 3 | system-ui, sans-serif |

### Pourquoi ces choix ?

- **Fraunces** : Police variable avec des courbes organiques et chaleureuses. Son aspect légèrement "imparfait" renforce le ton bienveillant et humain.
- **Source Sans 3** : Excellente lisibilité sur mobile, ton neutre qui laisse Fraunces briller pour les accents.

### Échelle typographique

```
text-xs:   12px / 0.75rem   — mentions légales, métadonnées
text-sm:   14px / 0.875rem  — texte secondaire, labels
text-base: 16px / 1rem      — corps de texte
text-lg:   18px / 1.125rem  — sous-titres
text-xl:   20px / 1.25rem   — titres de section
text-2xl:  24px / 1.5rem    — titres de page
text-3xl:  30px / 1.875rem  — chiffres importants
text-4xl:  36px / 2.25rem   — écrans d'onboarding
text-5xl:  48px / 3rem      — splash screen
```

### Graisses

```
font-normal:   400  — corps de texte
font-medium:   500  — accent léger
font-semibold: 600  — titres, boutons
font-bold:     700  — chiffres clés, accents forts
```

---

## 4. Palette de couleurs

### Couleurs principales

#### Orange chaud (Primaire)
Représente l'énergie, la motivation, la chaleur.

```
primary-50:  #FFF8F0  — fond très léger
primary-100: #FFECD9  — fond de cartes highlight
primary-200: #FFD4AD  — bordures subtiles
primary-300: #FFB870  — indicateurs secondaires
primary-400: #FF9A3D  — accents hover
primary-500: #F27D16  — couleur principale ★
primary-600: #D86208  — boutons pressés
primary-700: #B34A06  — texte sur fond clair
```

#### Vert doux (Secondaire)
Représente la croissance, le succès, la nature.

```
secondary-50:  #F0FDF4  — fond de succès léger
secondary-100: #DCFCE7  — fond de cartes complétées
secondary-200: #BBF7D0  — bordures de succès
secondary-300: #86EFAC  — indicateurs
secondary-400: #4ADE80  — progress bars
secondary-500: #22C55E  — couleur de succès ★
secondary-600: #16A34A  — accents forts
```

#### Neutres chauds
Base de l'interface — jamais de gris pur.

```
neutral-0:   #FFFFFF  — blanc pur (cartes)
neutral-50:  #FDFCFB  — fond de page
neutral-100: #F7F5F3  — fond secondaire
neutral-200: #EBE8E4  — bordures, séparateurs
neutral-300: #D6D1CA  — éléments désactivés
neutral-400: #A8A099  — placeholder
neutral-500: #78716C  — texte tertiaire
neutral-600: #57534E  — texte secondaire
neutral-700: #44403C  — texte principal léger
neutral-800: #292524  — texte principal ★
neutral-900: #1C1917  — titres forts
```

### Couleurs sémantiques

| État | Couleur | Usage |
|------|---------|-------|
| Succès | `secondary-500` | Habitude complétée, progression positive |
| En cours | `primary-400` | Action partielle, progression |
| Neutre | `neutral-200` | État par défaut, inactif |
| Attention douce | `#FBBF24` (ambre) | Rappel bienveillant (jamais alarmant) |

### ⚠️ Couleurs interdites

- **Rouge vif** : Associé à l'échec, l'erreur. Jamais utilisé.
- **Gris froid** : Crée une distance émotionnelle.
- **Noir pur (#000)** : Trop dur visuellement.

---

## 5. Composants UI

### 5.1 Cartes

Les cartes sont l'élément central de l'interface.

**Variantes :**

| Variante | Usage | Style |
|----------|-------|-------|
| `default` | Contenu standard | Fond blanc, bordure neutral-200 |
| `elevated` | Contenu important | Fond blanc, shadow-medium |
| `highlight` | Appel à l'action | Fond primary-50, bordure primary-200 |

**Spécifications :**
- Padding : `spacing-5` (20px)
- Border-radius : `radius-lg` (16px)
- Marge entre cartes : `spacing-4` (16px)

### 5.2 Boutons

**Bouton primaire**
```css
background: linear-gradient(135deg, primary-500, primary-600);
color: white;
padding: 12px 24px;
border-radius: radius-full;
font-weight: 600;
```

**États :**
- Hover : scale(1.02), shadow légèrement plus intense
- Pressed : scale(0.97)
- Disabled : opacity 0.5, cursor not-allowed

**Variantes :**
- `primary` : Action principale (orange)
- `secondary` : Action secondaire (fond neutral-100)
- `ghost` : Action tertiaire (transparent, texte primary-600)
- `success` : Confirmation (vert)

### 5.3 Carte d'habitude

Composant central de l'écran "Aujourd'hui".

**Structure (habitude quotidienne) :**
```
┌─────────────────────────────────────┐
│ 💪 Push-ups          [15 répétitions]│
│ Forme physique                       │
│                                      │
│ "Tu en étais à 12. +3 aujourd'hui !" │
│                                      │
│ [Un peu] [    ✓ Fait    ] [+ Extra]  │
└─────────────────────────────────────┘
```

**Structure (habitude hebdomadaire) :**
```
┌─────────────────────────────────────┐
│ 🌙 Se coucher à heure fixe    [2/3] │
│ cette semaine                        │
│                                      │
│ "Plus qu'un soir pour atteindre     │
│  ton objectif de la semaine !"      │
│                                      │
│ [ Pas aujourd'hui ] [    ✓ Fait    ] │
└─────────────────────────────────────┘
```

Pour les habitudes hebdomadaires :
- La dose affiche "X/Y cette semaine" au lieu d'une valeur quotidienne
- X = nombre de jours complétés cette semaine
- Y = objectif hebdomadaire (ex: 3 soirs)
- Le check-in est binaire : "Fait" ou "Pas aujourd'hui"
- La progression hebdomadaire se réinitialise chaque lundi

**États visuels :**

| État | Bordure | Fond |
|------|---------|------|
| En attente | neutral-200 | neutral-0 |
| Partiel | primary-300 | primary-50 |
| Complété | secondary-400 | secondary-50 |
| Dépassé | secondary-500 | secondary-100 |

### 5.4 Indicateur de progression

**Cercle de progression**
- Taille standard : 120px
- Stroke width : 8px
- Animation : transition douce de 500ms
- Couleur dynamique selon le pourcentage :
  - 0-49% : primary-300
  - 50-99% : primary-500
  - 100% : secondary-500

**Barre de progression**
- Hauteur : 8px
- Border-radius : full
- Fond : neutral-200
- Remplissage : gradient primary-400 → primary-500

### 5.5 Message encourageant

Composant de feedback positif.

```css
background: linear-gradient(135deg, primary-50, secondary-50);
border-radius: radius-lg;
padding: spacing-4;
display: flex;
align-items: center;
gap: spacing-3;
```

---

## 6. Micro-interactions

### Principes d'animation

| Principe | Valeur |
|----------|--------|
| **Durée rapide** | 150ms — feedback immédiat (hover, press) |
| **Durée normale** | 300ms — transitions de contenu |
| **Durée lente** | 500ms — animations de célébration |
| **Easing gentle** | `cubic-bezier(0.4, 0, 0.2, 1)` — naturel |
| **Easing bounce** | `cubic-bezier(0.34, 1.56, 0.64, 1)` — célébration |

### Animations clés

#### 1. Entrée des cartes (fadeInUp)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Décalage progressif : 80-100ms entre chaque carte */
```

#### 2. Célébration de complétion
```css
@keyframes celebrate {
  0% { transform: scale(1); }
  25% { transform: scale(1.1) rotate(-2deg); }
  50% { transform: scale(1.15) rotate(2deg); }
  75% { transform: scale(1.1) rotate(-1deg); }
  100% { transform: scale(1); }
}
/* Durée : 500ms, une seule fois */
```

#### 3. Remplissage de progression
```css
@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--progress); }
}
/* Durée : 500ms avec easing gentle */
```

#### 4. Apparition du checkmark
```css
@keyframes checkmark-draw {
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
}
/* Durée : 300ms, déclenché après la célébration */
```

### Feedback haptique (mobile)

| Action | Vibration |
|--------|-----------|
| Complétion d'habitude | Léger (10ms) |
| Journée complète | Double léger |
| Appui sur bouton | Micro (5ms) |

---

## 7. Guide UX Writing

### Ton de voix

L'application parle comme **un ami bienveillant** — encourageant mais jamais condescendant.

| ✅ Faire | ❌ Ne pas faire |
|----------|-----------------|
| "Tu avances, c'est ce qui compte" | "Tu n'as pas atteint ton objectif" |
| "Continue comme ça" | "Tu dois faire mieux" |
| "Prends ton temps" | "Tu es en retard" |
| "Un peu, c'est déjà bien" | "Effort insuffisant" |

### Vocabulaire interdit

Ces mots ne doivent **jamais** apparaître dans l'interface :

- Échec / échec
- Raté / manqué
- Retard
- Insuffisant
- Objectif non atteint
- Streak cassé / perdu
- Punition / pénalité

### Messages types

#### Écran Aujourd'hui
```
Matin :     "Nouvelle journée, nouvelles possibilités ✨"
Après-midi : "Tu as encore du temps devant toi"
Soir :       "Termine en douceur"
```

#### Après complétion partielle
```
"Un peu, c'est déjà beaucoup."
"Chaque pas compte."
"L'important, c'est d'avoir essayé."
```

#### Après complétion totale
```
"Tu peux être fier·e 🎉"
"Bravo, journée réussie !"
"Tu as honoré ton engagement envers toi-même."
```

#### Après avoir dépassé l'objectif
```
"Wow, tu t'es surpassé·e !"
"Énergie bonus aujourd'hui 🔥"
```

#### Après un jour sans activité
```
"De retour ? Content de te revoir."
"Pas de pression. On reprend doucement ?"
```
*Note : Jamais de culpabilisation sur l'absence.*

### Formulation des doses

| Type | Formulation |
|------|-------------|
| Augmentation | "+3 push-ups par rapport à la semaine dernière" |
| Réduction | "Aujourd'hui : 45 min max d'écran (−5 min)" |
| Simple | "Aujourd'hui : méditer 5 minutes" |

### Écriture inclusive

Utiliser le point médian pour l'inclusivité :
- fier·e
- motivé·e
- prêt·e

---

## 8. Wireframes & Flux

### Écran principal : Aujourd'hui

```
┌─────────────────────────────────────┐
│                                     │
│  Vendredi 10 janvier          [73%] │
│  ═══════════════════════════════    │
│  Aujourd'hui                        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🌅 Nouvelle journée,        │    │
│  │    nouvelles possibilités   │    │
│  └─────────────────────────────┘    │
│                                     │
│  TES DOSES DU JOUR                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💪 Push-ups     [15 reps]   │    │
│  │ Forme physique              │    │
│  │                             │    │
│  │ "Tu en étais à 12..."       │    │
│  │                             │    │
│  │ [Un peu] [  Fait  ] [Extra] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧘 Méditation   [5 min]     │    │
│  │ ...                         │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
├─────────────────────────────────────┤
│     🏠              📊             │
│   Aujourd'hui     Progrès          │
└─────────────────────────────────────┘
```

### Flux de création d'habitude

```
Étape 1              Étape 2              Étape 3
┌──────────┐        ┌──────────┐        ┌──────────┐
│          │        │          │        │          │
│  Type ?  │───────▶│  Détails │───────▶│ Confirm  │
│          │        │          │        │          │
│ ○ Augment│        │ Nom: ___ │        │ Résumé   │
│ ○ Réduire│        │ Dose: __ │        │ de       │
│ ○ Simple │        │ Rythme:  │        │ l'habit. │
│          │        │          │        │          │
└──────────┘        └──────────┘        └──────────┘
```

### Revue hebdomadaire

```
┌─────────────────────────────────────┐
│                                     │
│  Ta semaine en résumé               │
│                                     │
│     L  M  M  J  V  S  D             │
│    [●][●][○][●][◐][ ][ ]           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │         73%                 │    │
│  │    ╭───────────╮            │    │
│  │    │           │            │    │
│  │    ╰───────────╯            │    │
│  │  Complétion cette semaine   │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────┐  ┌──────────┐         │
│  │  4 jours │  │   +12%   │         │
│  │  actifs  │  │ vs sem.  │         │
│  └──────────┘  └──────────┘         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🌱 Chaque petit pas compte  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## 9. Accessibilité

### Contrastes

Tous les textes respectent WCAG AA :
- Texte principal sur fond : ratio minimum 4.5:1
- Texte large (> 18px bold) : ratio minimum 3:1

### Zones de toucher

- Minimum : 44 × 44 px (norme iOS)
- Recommandé : 48 × 48 px
- Espacement entre cibles : minimum 8px

### Réduction de mouvement

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Labels et ARIA

- Tous les boutons ont un texte visible ou `aria-label`
- Les progress indicators ont `role="progressbar"` avec `aria-valuenow`
- Les états des habitudes sont annoncés (`aria-live="polite"`)

---

## 10. Annexes

### A. Ressources design

**Polices :**
- [Fraunces sur Google Fonts](https://fonts.google.com/specimen/Fraunces)
- [Source Sans 3 sur Google Fonts](https://fonts.google.com/specimen/Source+Sans+3)

**Icônes :**
- Emojis système pour les habitudes (simplicité, universalité)
- Icônes custom uniquement pour la navigation

### B. Checklist de validation design

Avant de valider un écran :

- [ ] L'action principale est évidente
- [ ] Aucun vocabulaire négatif n'est utilisé
- [ ] Les couleurs sont conformes à la palette
- [ ] Les animations sont subtiles et non distrayantes
- [ ] Les zones de toucher font minimum 44px
- [ ] Le contraste texte/fond est suffisant
- [ ] L'écran fonctionne avec `prefers-reduced-motion`

### C. Tests utilisateurs recommandés

| Test | Objectif |
|------|----------|
| Check-in quotidien | < 30 secondes, 2 taps max |
| Première impression | Comprendre l'app sans tutoriel |
| Sentiment après non-utilisation | Aucune culpabilité ressentie |
| Lecture des messages | Ton perçu comme bienveillant |

---

## 11. Nouveaux composants (Phases 9-14)

### 11.1 Composant IdentityPrompt

Étape optionnelle dans le wizard de création pour définir la phrase identitaire.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│  Qui voulez-vous devenir ?          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Je deviens quelqu'un qui... │    │
│  └─────────────────────────────┘    │
│                                     │
│  Exemples :                         │
│  • Prend soin de son corps          │
│  • Lit chaque jour                  │
│  • Maîtrise son temps d'écran       │
│                                     │
│  [Passer] [           Continuer    ]│
└─────────────────────────────────────┘
```

**Spécifications :**
- Input avec placeholder inspirant
- Chips cliquables pour les exemples
- Bouton « Passer » discret (ghost)

### 11.2 Composant RecalibrationPrompt

Modal affichée après détection d'absence prolongée (7+ jours).

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│  🌱 Content·e de vous revoir        │
│                                     │
│  La vie a pris le dessus.           │
│  Ce n'est pas un problème.          │
│                                     │
│  Votre dose a évolué pendant        │
│  votre absence. On recalibre ?      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ○ Reprendre à 50%           │    │
│  │ ○ Reprendre à 75%           │    │
│  │ ● Reprendre là où j'en étais│    │
│  └─────────────────────────────┘    │
│                                     │
│  [Garder ma dose actuelle]          │
│  [         Recalibrer             ] │
└─────────────────────────────────────┘
```

**Spécifications :**
- Fond : gradient primary-50 → secondary-50
- Radio buttons pour les options
- Aucun compteur de jours « manqués »

### 11.3 Composant ProgressComparison

Affichage de l'effet composé sur HabitDetail.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│  D'où vous venez                    │
│                                     │
│  Jour 1          →      Aujourd'hui │
│   8 pompes                14 pompes │
│                                     │
│  ─────────────────────────────────  │
│                   +75%              │
│                                     │
└─────────────────────────────────────┘
```

**Spécifications :**
- Fond : neutral-100
- Valeurs en text-2xl, font-bold
- Pourcentage en secondary-500

### 11.4 Composant MilestoneCard

Célébration des paliers de progression.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│  🎉 Nouveau palier atteint !        │
│                                     │
│         ×2                          │
│  Vous avez doublé votre dose        │
│  initiale. Impressionnant.          │
│                                     │
│  [         Continuer              ] │
└─────────────────────────────────────┘
```

**Spécifications :**
- Fond : gradient secondary-50 → secondary-100
- Animation : celebrate (voir section 6)
- Chiffre du palier en text-4xl

### 11.5 Composant FirstCheckInPrompt

Modal après création d'habitude pour le premier check-in.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│  ✨ Première victoire ?             │
│                                     │
│  Avez-vous déjà fait quelque        │
│  chose aujourd'hui ?                │
│                                     │
│  [Non, je commence demain]          │
│  [      Oui, je l'enregistre      ] │
└─────────────────────────────────────┘
```

**Spécifications :**
- Bouton principal : success
- Bouton secondaire : ghost

### 11.6 Composant ShareableProgressCard

Carte visuelle pour export/partage.

**Structure (rendu image) :**
```
┌─────────────────────────────────────┐
│                                     │
│  💪 Push-ups                        │
│  30 jours sur ma trajectoire        │
│                                     │
│  Jour 1 : 8   →   Maintenant : 24   │
│                                     │
│  ══════════════════════════════     │
│  22 jours actifs                    │
│                                     │
│              doucement              │
└─────────────────────────────────────┘
```

**Spécifications :**
- Dimensions : 1080×1080 px (carré Instagram)
- Fond : gradient warm neutral
- Branding discret en bas

### 11.7 Écran QuickCheckIn

Page minimaliste pour le check-in rapide via shortcut.

**Structure :**
```
┌─────────────────────────────────────┐
│  Check-in rapide              [×]   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💪 Push-ups         [15]   │    │
│  │         [    ✓ Fait      ] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧘 Méditation        [5 min]│    │
│  │         [    ✓ Fait      ] │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Spécifications :**
- Check-in en un seul tap
- Pas de navigation bottom
- Bouton fermer en haut à droite
- Chargement optimisé (< 1s)

---

## 12. Widgets Temporels et Visuels

Les widgets de saisie temporels (chronomètre, minuterie) et visuels (slider emoji) étendent les modes de check-in existants.

### 12.1 Composant StopwatchCheckIn

Widget chronomètre pour mesurer une durée.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│            ⏱️ 05:32                 │
│         Cible : 10:00               │
│                                     │
│    [⏸️]    [⏹️]    [🔄]             │
│                                     │
└─────────────────────────────────────┘
```

**Spécifications :**
- **Affichage du temps** : Police Source Sans 3, text-3xl (30px), font-bold
- **Format** : MM:SS par défaut, HH:MM:SS si > 1h
- **Cible** : text-sm, neutral-500, "Cible : XX:XX"

**États visuels :**

| État | Apparence |
|------|-----------|
| Initial | "00:00", fond neutral-100, bouton Play visible |
| En cours | Temps défilant, fond primary-50, bouton Pause visible |
| En pause | Temps fixe, fond neutral-100, bordure pointillée primary-300 |
| Cible atteinte | Bordure secondary-400, icône ✓ subtle |
| Dépassement | Bordure secondary-500, fond secondary-50 |

**Boutons :**
- **Play/Pause** : Icône ▶️/⏸️, 48x48px, fond primary-500
- **Stop** : Icône ⏹️, 48x48px, fond secondary-500, enregistre la valeur
- **Reset** : Icône 🔄, 48x48px, fond neutral-200, ghost

**Animation :**
- Transition douce (300ms) entre états
- Pulse subtil quand en cours (optionnel, respecte prefers-reduced-motion)

### 12.2 Composant TimerCheckIn

Widget minuterie avec compte à rebours.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│            ⏳ 04:28                 │
│         Restant : 04:28             │
│                                     │
│    [⏸️]    [⏹️]    [🔄]             │
│                                     │
└─────────────────────────────────────┘
```

**Spécifications identiques à StopwatchCheckIn, avec :**
- Démarre à la dose cible et décompte vers 0
- Continue en négatif si dépassé

**Affichage du dépassement :**
- Temps négatif : "-00:15" (15 secondes de dépassement)
- Couleur : **primary-500** (orange) — JAMAIS rouge
- Fond : primary-50

### 12.3 Composant SliderCheckIn

Widget slider avec emoji dynamique.

**Structure :**
```
┌─────────────────────────────────────┐
│                                     │
│               😊                    │
│                                     │
│    1 ────────●────────── 10         │
│              7                      │
│                                     │
│         [    Valider    ]           │
│                                     │
└─────────────────────────────────────┘
```

**Spécifications :**
- **Emoji** : text-4xl (36px), centré au-dessus du slider
- **Slider track** : Hauteur 8px, border-radius full, fond neutral-200
- **Slider fill** : Fond primary-400, transition 150ms
- **Thumb** : 24x24px, fond primary-500, bordure 2px white, shadow-soft
- **Labels min/max** : text-xs, neutral-500
- **Valeur actuelle** : text-lg, font-bold, neutral-800

**Accessibilité :**
- Utilisable au clavier (flèches ← →)
- `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Focus visible avec shadow-glow

**Mapping emoji par défaut (si non configuré) :**
```
1-3  → 😢
4-5  → 😕
6-7  → 😊
8-10 → 😄
```

**Bouton Valider :**
- Style : primary, border-radius full
- Texte : "Valider"
- Confirme et enregistre la valeur

### 12.4 Contraintes communes

**Touch targets :**
- Tous les boutons : minimum 44x44px
- Slider thumb : minimum 44px de zone de toucher

**Couleurs :**
- Jamais de rouge pour les états (même dépassement)
- Orange (#F27D16) pour les éléments interactifs et dépassement timer
- Vert (#22C55E) pour le succès et l'atteinte de cible

**Animation :**
- Respecter `prefers-reduced-motion`
- Durée rapide (150ms) pour les interactions
- Durée normale (300ms) pour les transitions d'état

---

*Document maintenu par l'équipe Design*
*Version 1.2 — Janvier 2026*
