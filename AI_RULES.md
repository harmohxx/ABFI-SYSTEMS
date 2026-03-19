# ABFI System — AI Development Rules

## Tech Stack Overview
- **Framework:** Expo (React Native) with **Expo Router** for file-based routing and navigation.
- **Language:** **TypeScript** for all components, hooks, and utility functions.
- **State Management:** **React Context API** for global state (`AuthContext`, `DataContext`).
- **Persistence:** **AsyncStorage** for local, offline-first data storage and session management.
- **UI & Styling:** Custom design system using React Native **StyleSheet** with a centralized `COLORS` constant.
- **Icons:** **@expo/vector-icons** (primarily Ionicons, MaterialCommunityIcons, and FontAwesome5).
- **Authentication:** Custom local authentication with **expo-local-authentication** for Biometric (FaceID/Fingerprint) support.
- **Backend Integration:** **Supabase** for remote database synchronization and cloud features.
- **Interactions:** **expo-haptics** for tactile feedback and **react-native-keyboard-controller** for smooth keyboard handling.

## Development Rules & Library Usage

### 1. Navigation
- Always use `expo-router`.
- Use `router.push()`, `router.replace()`, and `router.back()` for navigation.
- Keep route definitions within the `app/` directory structure.

### 2. Icons
- Use `@expo/vector-icons` exclusively.
- **Ionicons:** Use for general UI actions (back, settings, add, close).
- **MaterialCommunityIcons:** Use for domain-specific entities (farms, shops, accounts).
- **FontAwesome5:** Use for specialized icons like `hard-hat` for workers.

### 3. State & Data
- **Authentication:** Use the `useAuth` hook for user sessions, roles, and permissions.
- **Domain Data:** Use the `useData` hook for farmers, farms, workers, payments, and stock.
- **Persistence:** Do not call `AsyncStorage` directly in components; always wrap persistence logic within the Context providers.

### 4. Styling & Theming
- Use the `COLORS` constant from `@/constants/colors` for all styling.
- **Never hardcode hex codes** in components.
- Maintain the "Dark Enterprise" aesthetic (Dark Green and Gold).
- Use `LinearGradient` from `expo-linear-gradient` for headers and primary buttons.

### 5. Component Usage
- Use `ScreenHeader` for all top-level screens.
- Use `StatCard` for dashboard metrics.
- Use `RoleBadge` to display user roles consistently.
- Use `KeyboardAwareScrollViewCompat` for forms to ensure inputs aren't hidden by the keyboard.

### 6. User Feedback
- Trigger `Haptics.impactAsync` on button presses.
- Trigger `Haptics.notificationAsync` for success or error outcomes (e.g., login, saving a form).
- Use `Alert.alert` for destructive actions (deleting records).

### 7. Backend & API
- Use the `supabase` client located in `@/app/lib/supabase.ts` for all remote database operations.
- Ensure environment variables for Supabase are handled securely.