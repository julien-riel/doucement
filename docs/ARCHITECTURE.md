# Architecture - Doucement

Ce document décrit l'architecture technique de Doucement avec des diagrammes Mermaid.

---

## Vue d'ensemble

Doucement est une **SPA 100% statique** (Single Page Application) sans backend. Toutes les données sont stockées localement dans le navigateur.

```mermaid
graph TB
    subgraph "Client (Navigateur)"
        UI[React Components]
        Hooks[Custom Hooks]
        Services[Services]
        Storage[(localStorage)]
    end

    UI --> Hooks
    Hooks --> Services
    Services --> Storage

    subgraph "Aucun serveur"
        Server[Backend]
    end

    UI -.->|"Aucune communication"| Server

    style Server fill:#f5f5f5,stroke:#ccc,stroke-dasharray: 5 5
```

---

## Flux de données

### Lecture des données

```mermaid
sequenceDiagram
    participant C as Component
    participant H as useAppData Hook
    participant S as storage.ts
    participant L as localStorage

    C->>H: Utilise le hook
    H->>S: loadData()
    S->>L: getItem('doucement-data')
    L-->>S: JSON string ou null
    S->>S: JSON.parse() + migration si nécessaire
    S-->>H: AppData
    H-->>C: { habits, entries, preferences, ... }
```

### Écriture des données

```mermaid
sequenceDiagram
    participant C as Component
    participant H as useAppData Hook
    participant S as storage.ts
    participant L as localStorage

    C->>H: addHabit(habitData)
    H->>H: Crée l'habitude avec ID + timestamps
    H->>S: saveData(newAppData)
    S->>S: JSON.stringify()
    S->>L: setItem('doucement-data', json)
    H-->>C: Mise à jour du state React
```

---

## Cycle de vie d'une habitude

```mermaid
stateDiagram-v2
    [*] --> Création: Utilisateur crée une habitude

    Création --> Active: Habitude active

    Active --> EnPause: Pause planifiée
    Active --> Archivée: Utilisateur archive

    EnPause --> Active: Fin de pause

    Archivée --> Active: Utilisateur restaure
    Archivée --> [*]: Suppression définitive

    state Active {
        [*] --> Pending
        Pending --> Partial: Check-in partiel
        Pending --> Completed: Check-in complet
        Partial --> Completed: Ajout de valeur
        Completed --> Exceeded: Dépassement
        Completed --> [*]: Nouveau jour
        Exceeded --> [*]: Nouveau jour
    }
```

---

## Structure des services

```mermaid
graph LR
    subgraph "Services"
        storage[storage.ts]
        progression[progression.ts]
        statistics[statistics.ts]
        migration[migration.ts]
        notifications[notifications.ts]
        milestones[milestones.ts]
        validation[validation.ts]
        importExport[importExport.ts]
        imageExport[imageExport.ts]
        exportPdf[exportPdf.ts]
    end

    subgraph "Hooks"
        useAppData[useAppData]
        useCelebrations[useCelebrations]
        useNotifications[useNotifications]
        useDebugMode[useDebugMode]
        useTheme[useTheme]
    end

    useAppData --> storage
    useAppData --> progression
    useAppData --> migration
    useCelebrations --> milestones
    useNotifications --> notifications
    statistics --> progression
```

### Responsabilités des services

| Service | Responsabilité |
|---------|----------------|
| `storage.ts` | Lecture/écriture localStorage |
| `progression.ts` | Calcul de la dose cible |
| `statistics.ts` | Calculs statistiques (taux, moyennes, patterns) |
| `migration.ts` | Migration des données entre versions de schéma |
| `notifications.ts` | Gestion des notifications Web |
| `milestones.ts` | Détection et célébration des jalons |
| `validation.ts` | Validation des données importées |
| `importExport.ts` | Import/export de données JSON |
| `imageExport.ts` | Export PNG (cartes partageables) |
| `exportPdf.ts` | Export PDF (rapports) |

---

## Structure des composants

```mermaid
graph TB
    subgraph "Layout"
        MainLayout[MainLayout]
        Nav[Navigation]
    end

    subgraph "Pages"
        Today[Today]
        CreateHabit[CreateHabit]
        EditHabit[EditHabit]
        HabitDetail[HabitDetail]
        HabitList[HabitList]
        Statistics[Statistics]
        WeeklyReview[WeeklyReview]
        Settings[Settings]
        Onboarding[Onboarding]
    end

    subgraph "Habits Components"
        HabitCard[HabitCard]
        CheckInButtons[CheckInButtons]
        DailyDose[DailyDose]
        ProgressBar[ProgressBar]
        CelebrationModal[CelebrationModal]
    end

    subgraph "Charts"
        ProgressionChart[ProgressionChart]
        HeatmapCalendar[HeatmapCalendar]
        ComparisonChart[ComparisonChart]
        ProjectionSection[ProjectionSection]
    end

    subgraph "UI Components"
        Button[Button]
        Card[Card]
        Input[Input]
        Modal[Modal]
        EmojiPicker[EmojiPicker]
    end

    MainLayout --> Nav
    MainLayout --> Pages

    Today --> HabitCard
    HabitCard --> CheckInButtons
    HabitCard --> DailyDose
    HabitCard --> ProgressBar

    HabitDetail --> Charts
    Statistics --> Charts
    WeeklyReview --> Charts
```

---

## Calcul de progression

```mermaid
flowchart TB
    Start([Calcul dose du jour])
    GetHabit[Récupérer habitude]
    CheckPause{Pause planifiée?}
    GetConfig[Récupérer ProgressionConfig]
    CheckNull{Config null?}
    ReturnStart[Retourner startValue]
    CalcDays[Calculer jours depuis création]
    CheckMode{Mode?}
    CalcAbsolute[Appliquer progression absolue]
    CalcPercent[Appliquer progression pourcentage]
    CheckDirection{Direction?}
    ApplyIncrease[Ajouter progression]
    ApplyDecrease[Soustraire progression]
    Clamp[Appliquer min/max et arrondi]
    End([Dose cible])

    Start --> GetHabit
    GetHabit --> CheckPause
    CheckPause -->|Oui| ReturnStart
    CheckPause -->|Non| GetConfig
    GetConfig --> CheckNull
    CheckNull -->|Oui| ReturnStart
    CheckNull -->|Non| CalcDays
    CalcDays --> CheckMode
    CheckMode -->|absolute| CalcAbsolute
    CheckMode -->|percentage| CalcPercent
    CalcAbsolute --> CheckDirection
    CalcPercent --> CheckDirection
    CheckDirection -->|increase| ApplyIncrease
    CheckDirection -->|decrease| ApplyDecrease
    CheckDirection -->|maintain| Clamp
    ApplyIncrease --> Clamp
    ApplyDecrease --> Clamp
    Clamp --> End
```

---

## Gestion des notifications

```mermaid
sequenceDiagram
    participant App as Application
    participant Hook as useNotifications
    participant Svc as notifications.ts
    participant SW as Service Worker
    participant API as Notification API

    App->>Hook: useNotifications()

    Note over Hook: Vérifier permission

    Hook->>API: Notification.permission
    API-->>Hook: "default" | "granted" | "denied"

    alt Permission non accordée
        Hook->>API: Notification.requestPermission()
        API-->>Hook: "granted"
    end

    Hook->>Svc: scheduleReminder(type, time)
    Svc->>SW: Enregistrer dans cache

    Note over SW: Au moment prévu

    SW->>API: new Notification(title, options)
    API-->>App: Notification affichée
```

---

## Stockage des données

### Structure localStorage

```mermaid
erDiagram
    AppData ||--o{ Habit : contains
    AppData ||--o{ DailyEntry : contains
    AppData ||--|| UserPreferences : has

    AppData {
        number schemaVersion
    }

    Habit {
        string id PK
        string name
        string emoji
        string direction
        number startValue
        string unit
        json progressionConfig
        string trackingMode
        string trackingFrequency
        string entryMode
        string anchorHabitId FK
        json plannedPause
        string createdAt
        string archivedAt
    }

    DailyEntry {
        string id PK
        string habitId FK
        string date
        number targetDose
        number actualValue
        string note
        json operations
        string createdAt
        string updatedAt
    }

    UserPreferences {
        boolean onboardingCompleted
        string lastWeeklyReviewDate
        json notifications
        json weeklyReflections
        string theme
        json milestones
    }
```

### Clé localStorage

```
localStorage.getItem('doucement-data')
```

### Format de date

Toutes les dates utilisent le format **YYYY-MM-DD** (ISO 8601 simplifié).

---

## Migration de données

```mermaid
flowchart LR
    Import([Import données])
    Check{Version < actuelle?}
    Migrate[Appliquer migrations]
    V1[v1 → v2]
    V2[v2 → v3]
    V3[...]
    V9[v9 → v10]
    Save([Sauvegarder])

    Import --> Check
    Check -->|Oui| Migrate
    Check -->|Non| Save
    Migrate --> V1
    V1 --> V2
    V2 --> V3
    V3 --> V9
    V9 --> Save
```

Chaque migration est **idempotente** et **réversible** en théorie.

---

## PWA & Service Worker

```mermaid
graph TB
    subgraph "Installation PWA"
        Manifest[manifest.json]
        SW[Service Worker]
        Icons[Icons 192/512]
    end

    subgraph "Fonctionnalités"
        Offline[Mode hors-ligne]
        Install[Installable]
        Shortcuts[App Shortcuts]
        Badge[App Badge]
    end

    subgraph "Shortcuts"
        QuickCheckin["/quick-checkin"]
        Today["/"]
    end

    Manifest --> Install
    SW --> Offline
    Manifest --> Shortcuts
    Shortcuts --> QuickCheckin
    Shortcuts --> Today
```

---

## Technologies

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| Framework | React 18 | UI Components |
| Build | Vite | Bundling, HMR |
| Routing | React Router | Navigation SPA |
| Charts | Recharts | Graphiques |
| i18n | i18next | Internationalisation |
| Tests unitaires | Vitest | Services, Hooks |
| Tests E2E | Playwright | Parcours utilisateur |

---

## Références

- PRD : [prd.md](prd.md)
- Types : [src/types/index.ts](../src/types/index.ts)
- Glossaire : [GLOSSARY.md](GLOSSARY.md)
- Design System : [design/design-system-specification.md](design/design-system-specification.md)
