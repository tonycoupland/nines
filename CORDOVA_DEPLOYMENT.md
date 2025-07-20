# MEGA TIC TAC TOE - Cordova Mobile Deployment Guide

This document provides comprehensive instructions for deploying the Phaser.js MEGA TIC TAC TOE game to iOS and Android devices using Apache Cordova.

## Prerequisites

### For iOS Development (macOS only):
- macOS system
- Xcode (latest version from Mac App Store)
- iOS SDK (bundled with Xcode)
- Node.js and npm
- Apache Cordova CLI: `npm install -g cordova`
- CocoaPods: `sudo gem install cocoapods`
- ios-deploy: `npm install -g ios-deploy`

### For Android Development:
- Node.js and npm
- Apache Cordova CLI: `npm install -g cordova`
- Android Studio with Android SDK
- Java Development Kit (JDK) 8 or higher

## Project Structure

```
├── src/                    # Phaser.js source files
│   ├── main.js            # Main game logic
│   ├── index.html         # HTML template
│   └── assets/            # Game assets
├── dist/                  # Built web files (auto-generated)
├── cordova-app/           # Cordova project structure
│   ├── config.xml         # Cordova configuration
│   ├── www/               # Web assets (will be replaced during build)
│   ├── platforms/         # Platform-specific code
│   └── plugins/           # Cordova plugins
├── webpack.config.js      # Webpack build configuration
└── CORDOVA_DEPLOYMENT.md  # This file
```

## Development Workflow

### 1. Web Development Mode
```bash
# Start development server with hot-reloading
npm run dev
# or manually:
./node_modules/.bin/webpack serve --mode=development --host=0.0.0.0 --port=5000

# Visit http://localhost:5000 to test the game
```

### 2. Production Build
```bash
# Build optimized version for mobile deployment
./node_modules/.bin/webpack --mode=production
```

## Mobile Deployment Steps

### Step 1: Initialize Cordova Project
```bash
# Create new Cordova project (if starting fresh)
cordova create mobile-app com.yourcompany.megatictactoe "MEGA TIC TAC TOE"
cd mobile-app

# Add platforms
cordova platform add ios
cordova platform add android
```

### Step 2: Copy Game Files
```bash
# Build the game for production
./node_modules/.bin/webpack --mode=production

# Copy built files to Cordova www directory
rm -rf mobile-app/www/*
cp -r dist/* mobile-app/www/

# Copy our custom config.xml
cp cordova-app/config.xml mobile-app/
```

### Step 3: iOS Deployment

#### For iOS Simulator:
```bash
cd mobile-app
cordova build ios
cordova emulate ios
```

#### For iOS Device:
```bash
cd mobile-app
cordova build ios --device

# Open in Xcode for signing and deployment
open platforms/ios/MEGA\ TIC\ TAC\ TOE.xcworkspace
```

**In Xcode:**
1. Select your development team in Project Settings
2. Configure signing certificates
3. Select target device
4. Click Run to install on device

#### For App Store Distribution:
```bash
cd mobile-app
cordova build ios --release

# Open in Xcode and use Archive for App Store submission
open platforms/ios/MEGA\ TIC\ TAC\ TOE.xcworkspace
```

### Step 4: Android Deployment

#### For Android Emulator:
```bash
cd mobile-app
cordova build android
cordova emulate android
```

#### For Android Device (Debug):
```bash
cd mobile-app
cordova build android
cordova run android --device
```

#### For Google Play Store:
```bash
cd mobile-app
cordova build android --release

# Sign the APK (you'll need to generate a keystore first)
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name

# Align the APK
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk MEGA-TIC-TAC-TOE.apk
```

## Configuration Details

### Key Cordova Configuration (config.xml)
- **App ID**: `com.example.megatictactoe`
- **iOS Deployment Target**: iOS 15.0+
- **Android SDK**: API 24+ (Android 7.0+)
- **WebView**: WKWebView for iOS (optimized performance)
- **Permissions**: Minimal permissions required

### Game-Specific Optimizations
- **No scrolling**: `DisallowOverscroll`, `webviewbounce` disabled
- **Fullscreen**: Optimized status bar handling
- **Touch-friendly**: Multi-touch support enabled
- **Performance**: Hardware acceleration enabled

## Testing Checklist

### Functionality Tests:
- [ ] Game loads correctly on mobile
- [ ] All 9 grids are visible and clickable
- [ ] Touch interactions work smoothly
- [ ] Game logic functions correctly (grid restrictions, win conditions)
- [ ] Reset button works
- [ ] Game over modal displays properly

### Device-Specific Tests:
- [ ] Portrait and landscape orientations
- [ ] Different screen sizes (phones, tablets)
- [ ] Performance on older devices
- [ ] Memory usage stays reasonable during gameplay

### Platform-Specific Tests:
- [ ] iOS: Status bar appearance
- [ ] iOS: Home indicator behavior
- [ ] Android: Back button behavior
- [ ] Android: Hardware menu button

## Troubleshooting

### Common iOS Issues:
1. **"Address already in use" error**: Check if webpack-dev-server is still running
2. **Code signing errors**: Ensure Apple Developer account is properly configured
3. **Touch not working**: Verify `DisallowOverscroll` is set in config.xml

### Common Android Issues:
1. **Build failures**: Ensure Android SDK is properly configured
2. **App crashes**: Check for memory issues with large bundle size
3. **Touch delays**: Verify `android-windowSoftInputMode` is set correctly

### Performance Issues:
1. **Large bundle size**: Phaser.js creates ~1.15MB bundle - consider code splitting for production
2. **Memory usage**: Monitor for memory leaks during extended gameplay
3. **Touch responsiveness**: Ensure multi-touch is properly configured

## Distribution

### iOS App Store:
1. Archive in Xcode
2. Upload to App Store Connect
3. Submit for review (typical review time: 1-7 days)

### Google Play Store:
1. Generate signed APK
2. Upload to Google Play Console
3. Submit for review (typical review time: few hours to 3 days)

## Support

For development issues:
- Check Cordova documentation: https://cordova.apache.org/docs/
- Phaser.js documentation: https://phaser.io/learn
- Platform-specific guides for iOS and Android deployment

Remember to test thoroughly on physical devices before submitting to app stores!