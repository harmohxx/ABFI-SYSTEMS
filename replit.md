# ABFI System — Enterprise Farm Management App

## Overview
ABFI System is a comprehensive enterprise-grade farm management application built with Expo React Native. It features a director-controlled hierarchy with strict role-based access control (RBAC).

## Key Features
- **Local Authentication** — Email + password login with biometric (Face ID / Fingerprint) support
- **Role Hierarchy** — Director → CEO → Manager → Accountant → Field Officer
- **Farmer & Farm Management** — Register farmers, assign farms with GPS coordinates
- **Worker Management** — Register workers per farm, set wage types (daily/weekly/monthly)
- **Payroll & Payments** — M-Pesa/Bank payment flow with Director/CEO approval
- **Sales Monitoring** — Record daily sales per shop, revenue dashboards
- **Stock & Inventory** — Product stock levels, low-stock alerts, stock in/out
- **User Management** — Director-only: add/remove system users
- **Audit Logs** — All actions immutably logged, cannot be deleted

## Default Login Credentials (Director)
- **Name:** Harmony Nyaga
- **Email:** `harmony@abfi.com`
- **Password:** `teclaharm`

## Tech Stack
- **Frontend:** Expo Router (React Native), TypeScript
- **State:** React Context + AsyncStorage (local persistence)
- **UI:** Custom design system with dark green/gold enterprise theme
- **Auth:** Local auth + expo-local-authentication for biometrics
- **Icons:** @expo/vector-icons (Ionicons, MaterialCommunityIcons, FontAwesome5)

## Project Structure
```
app/
  _layout.tsx          # Root layout with auth redirect
  index.tsx            # Login screen
  (app)/
    _layout.tsx        # Tab navigation (Dashboard, Farmers, Workers, Payroll, More)
    dashboard.tsx      # Role-aware dashboard
    farmers.tsx        # Farmer & Farm management
    workers.tsx        # Worker management
    payroll.tsx        # Payroll & payment approvals
    more.tsx           # Sales, Stock, Users, Audit (hub screen)
context/
  AuthContext.tsx      # Authentication state + user management
  DataContext.tsx      # All app data (farmers, farms, workers, payments, etc.)
components/
  StatCard.tsx         # Dashboard statistics card
  RoleBadge.tsx        # User role badge
  ScreenHeader.tsx     # Reusable screen header
constants/
  colors.ts            # ABFI dark green/gold color palette
server/
  index.ts             # Express backend (landing page only)
```

## Android Studio Development

### Download & Setup
1. Download this project from Replit (use the Download as ZIP option)
2. Extract the folder
3. Install Node.js (v18+) if not installed
4. Run `npm install` in the project folder
5. Install Expo CLI: `npm install -g @expo/cli`
6. Run `npx expo start --android` to launch in Android emulator
   OR scan the QR code with Expo Go on your physical device

### Building APK for Android Studio
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo account: `eas login`
3. Configure build: `eas build:configure`
4. Build APK: `eas build -p android --profile preview`

### Local Development
- Backend (Express): `npm run server:dev` (port 5000)
- Frontend (Expo): `npm run expo:dev` (port 8081)

## Role Permissions
| Feature | Director | CEO | Manager | Accountant | Field Officer |
|---------|----------|-----|---------|------------|---------------|
| Add/Remove Users | ✓ | - | - | - | - |
| View All Data | ✓ | ✓ | - | - | - |
| Approve Payments | ✓ | ✓ | - | - | - |
| Manage Farmers/Workers | ✓ | - | ✓ | - | ✓ |
| Initiate Payments | ✓ | - | ✓ | ✓ | - |
| Record Sales/Stock | ✓ | - | ✓ | ✓ | ✓ |
| View Audit Logs | ✓ | ✓ | - | - | - |
