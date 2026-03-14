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
