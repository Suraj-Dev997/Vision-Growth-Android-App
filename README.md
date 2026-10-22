# VISION Growth — React Native (CLI)

Doctor app for children’s vision assessment tracking. Uses the Node API in `../backend`.

**Not Expo** — this is a React Native Community CLI project (`VisionGrowth`).

## Prerequisites

- Node.js 22+
- Android Studio (SDK + emulator) and/or Xcode for iOS
- MySQL `vision_growth` DB (schema in `../database/schema.sql`)

Start the API yourself when you need it (do not leave it running unless you are actively developing):

```bash
cd ../backend
npm start
# listens on http://localhost:4000
```

## Install

```bash
cd mobile
npm install
```

## API base URL

Configured in `src/config/api.ts`:

| Platform | Base URL |
|----------|----------|
| Android emulator | `http://10.0.2.2:4000/api` |
| iOS simulator | `http://localhost:4000/api` |
| Physical device | set `LAN_IP` in that file to your PC’s LAN IP |

## Run

```bash
# Metro bundler
npm start

# Android
npx react-native run-android

# iOS (macOS only)
npx react-native run-ios
```

## Auth note

With `OTP_DEBUG=true` on the backend, register/resend/forgot-password responses include `data.otp` for development.

Forgot password: Login → Forgot password → OTP → new password (`/auth/forgot-password`, `/auth/verify-reset-otp`, `/auth/reset-password`).

## Play Store version / force update

Keep these in sync on every release:

1. `android/app/build.gradle` — `versionCode` / `versionName`
2. `src/config/appVersion.ts` — `APP_VERSION_CODE` / `APP_VERSION_NAME`

On the server, run `../database/app_config.sql` once, then after publishing:

```sql
-- Force old apps to update (e.g. after shipping versionCode 2)
UPDATE app_config
SET android_min_version_code = 2,
    android_latest_version_code = 2,
    force_update = 1;

-- Soft nudge only (optional update dialog)
UPDATE app_config
SET android_latest_version_code = 2,
    force_update = 0;
```

App calls `GET /app/config` on startup: below `android_min_version_code` with `force_update=1` blocks the UI; below `android_latest_version_code` shows an optional Play Store prompt.
