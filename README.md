# Roommate Expense Tracker — Frontend

A mobile application built with **React Native** that helps roommates track shared expenses, split bills, manage groups, and settle up easily.

> **Status:** Active development — the frontend is being progressively connected to the backend API. Deployment is planned once backend development is complete.

---

## What Is It?

Roommate Expense Tracker is a cross-platform mobile app (Android & iOS) that solves the common problem of tracking shared household expenses among roommates. Users can:

- Register and log in securely with JWT authentication
- Create and manage expense groups with roommates
- Add, view, and split expenses across group members
- Track balances and see who owes whom
- Upload a profile avatar stored in the backend database
- Receive in-app activity and payment notifications
- Settle up outstanding balances between members

---

## Related Repositories

| Layer | Repository |
|---|---|
| **Frontend (this repo)** | React Native mobile app |
| **Backend** | [Nadil-Dulran/RMT_Backend](https://github.com/Nadil-Dulran/RMT_Backend.git) — Node.js + TypeScript REST API with MySQL |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.83.2 | Cross-platform mobile framework |
| TypeScript | 5.8.x | Type-safe JavaScript |
| React | 19.2.0 | UI rendering |
| React Navigation | 7.x | Stack + bottom tab navigation |
| react-native-image-picker | 8.x | Profile photo selection from device gallery |
| react-native-vector-icons | 10.x | Icon library (Feather icons) |
| react-native-linear-gradient | 2.x | Gradient UI elements |
| @react-native-async-storage | 3.x | Local auth token storage |
| @react-native-community/datetimepicker | 8.x | Date/time input for expenses |

### Backend (separate repository)

| Technology | Purpose |
|---|---|
| Node.js + TypeScript | REST API server |
| Express.js | HTTP routing |
| MySQL | Relational database (users, groups, expenses, avatars) |
| Sequelize ORM | Database models and queries |
| JWT | Authentication tokens |

---

## Project Structure

```
RoommateExpenseTracker/
├── App.tsx                          # App entry point
├── index.js                         # React Native entry
├── src/
│   ├── data/
│   │   └── mockData.ts              # Temporary mock data (replaced progressively by API)
│   ├── navigation/
│   │   ├── AppNavigator.tsx         # Root navigator (auth vs main flow)
│   │   └── BottomTabs.tsx           # Main tab bar (Dashboard, Groups, Expenses, Activity, Profile)
│   ├── screens/
│   │   ├── authentication/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── ForgetPasswordScreen.tsx
│   │   ├── main/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GroupsScreen.tsx
│   │   │   ├── ExpensesScreen.tsx
│   │   │   ├── ActivityScreen.tsx
│   │   │   └── AddExpensScreen.tsx
│   │   ├── external/
│   │   │   ├── GroupDetailsScreen.tsx
│   │   │   ├── NotificationScreen.tsx
│   │   │   └── SettleUpScreen.tsx
│   │   └── profile/
│   │       └── ProfileSettings.tsx
│   ├── services/                    # All backend API calls
│   │   ├── api.ts                   # Shared base URL config
│   │   ├── authService.ts           # Login, register
│   │   ├── profileService.ts        # Profile CRUD + avatar upload
│   │   ├── expenseService.ts        # Expense CRUD
│   │   ├── financeService.ts        # Balance/settle calculations
│   │   └── groupMembersService.ts   # Group member management
│   └── types/
│       ├── navigation.ts            # Navigation param types
│       ├── expense.ts
│       ├── group.ts
│       ├── user.ts
│       └── notification.ts
├── assets/
│   └── fonts/                       # Custom fonts
├── android/                         # Android native project
└── ios/                             # iOS native project
```

---

## Running the App in VS Code with Android Emulator

### Prerequisites

Make sure the following are installed and configured:

- [Node.js](https://nodejs.org/) v20 or later
- [Android Studio](https://developer.android.com/studio) with an Android Virtual Device (AVD) set up
- Java Development Kit (JDK 17 recommended)
- React Native environment — follow the [official setup guide](https://reactnative.dev/docs/set-up-your-environment) for your OS

### Step 1 — Clone and install dependencies

```sh
git clone <this-repo-url>
cd RoommateExpenseTracker
npm install
```

### Step 2 — Start the backend

Clone the backend repo and start the API server so it is reachable at `http://localhost:3000`:

```sh
git clone https://github.com/Nadil-Dulran/RMT_Backend.git
cd RMT_Backend
npm install
npm run dev
```

Make sure your MySQL database is running and the backend is connected before starting the app.

### Step 3 — Start the Android Emulator

1. Open **Android Studio**
2. Go to **Device Manager** and start your AVD
3. Wait until the emulator is fully booted

> The app connects to the backend using `http://10.0.2.2:3000/api` — this is the Android emulator's built-in alias for `localhost` on your host machine.

### Step 4 — Open the project in VS Code

```sh
code .
```

### Step 5 — Start Metro bundler

Open a terminal in VS Code and run:

```sh
npm start
```

### Step 6 — Run on Android

Open a **second terminal** in VS Code and run:

```sh
npm run android
```

The app builds and launches on the running emulator automatically.

### Reloading after changes

- Press `R` twice in the Metro terminal, **or**
- Press `Ctrl + M` inside the emulator and tap **Reload**

---

## Running the App in VS Code on Mac

### Backend 
```sh
npm run dev
```



## Development Notes

- `src/services/api.ts` — change the base URL here if your network address differs from the default.
- `src/data/mockData.ts` — placeholder data for screens not yet wired to the backend. Removed progressively as backend endpoints are completed.
- Avatar images are stored as raw Base64 in the `avatarBase64` MySQL column and decoded back to a `data:image` URI for display in the app.
- Auth token is stored in `AsyncStorage` and sent as a `Bearer` token on every API request.

---

## Deployment Plan

Deployment is planned once backend development is complete. Target platforms:

- **Android** — Google Play Store
- **iOS** — Apple App Store

The backend will be deployed to a cloud hosting provider with a production MySQL database.

---


## Author

**Nadil Dulran**
Intern Full Stack Software Engineer at **Akvasoft (PVT) LTD**

This project was built as part of an internship at Akvasoft (PVT) LTD, covering both the React Native frontend and the Node.js/TypeScript backend.

- Frontend: this repository
- Backend: [github.com/Nadil-Dulran/RMT_Backend](https://github.com/Nadil-Dulran/RMT_Backend)