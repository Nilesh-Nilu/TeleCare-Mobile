# TeleCare Mobile

## Requirements

- Node.js 18+
- npm 9+
- Expo CLI (optional, `npx expo` works without global install)
- Android Studio (for Android emulator/device builds)
- Xcode + CocoaPods (for iOS simulator/device builds, macOS only)

## Recommended Versions

- Node.js: 18 LTS or 20 LTS
- npm: 9 or newer
- Expo SDK: 52 (as defined in `package.json`)

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file in `mobile/` and define:

```bash
EXPO_PUBLIC_API_URL=<your_api_base_url>/api
EXPO_PUBLIC_SOCKET_URL=<your_socket_base_url>
EXPO_PUBLIC_AGORA_APP_ID=<your_agora_app_id>
```

Notes:
- `EXPO_PUBLIC_*` variables are exposed to the client app.
- After changing `.env`, restart Expo.

## Run

```bash
# start Expo dev server
npm run start

# run Android
npm run android

# run iOS
npm run ios

# run web
npm run web
```

### Platform Tips

- Android:
  - Start an emulator from Android Studio, then run `npm run android`.
  - For real device, enable USB debugging.
- iOS:
  - Requires macOS and Xcode.
  - If pods are not installed automatically, run:
    - `npx pod-install ios`
  - Then run `npm run ios`.
- Web:
  - Runs through Expo web (`expo start --web`).
  - PWA install is supported (details below).

## Build

```bash
# Android build using EAS
npm run build:android
```

For production builds, ensure EAS is configured and authenticated:

```bash
npx eas login
npx eas build --platform android
```

## Scripts

- `npm run start` - start Expo
- `npm run android` - run Android app
- `npm run ios` - run iOS app
- `npm run web` - run web app
- `npm run build:android` - create Android build
- `npm run lint` - run ESLint

## PWA Notes (Web)

- Web app includes `manifest.json` and `sw.js`.
- Android/Chrome: use browser install prompt or "Install app".
- iOS/Safari: use "Share -> Add to Home Screen".
- Installability works best over HTTPS in production.

## Project Stack

- Expo + React Native + Expo Router
- Redux Toolkit + React Redux
- Axios for API calls
- Socket.IO client for realtime events
- Agora SDK for video consultation

## Troubleshooting

- Metro cache issues:
  - `npx expo start -c`
- Dependency mismatch:
  - delete `node_modules` and reinstall with `npm install`
- Android build issues:
  - run `npx expo doctor`
- iOS pod issues:
  - `npx pod-install ios`

## Lint

```bash
npm run lint
```
