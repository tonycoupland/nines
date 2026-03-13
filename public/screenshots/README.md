# Screenshots for the marketing site

Copy the generated App Store screenshots here before deploying:

    npm run build:web
    npm run screenshots
    cp ../../screenshots/home-iphone-65-large.png ./
    cp ../../screenshots/game-iphone-65-large.png ./
    cp ../../screenshots/game-won-iphone-65-large.png ./
    cp ../../screenshots/stats-iphone-65-large.png ./

The site gracefully shows a placeholder if any image is missing (onerror fallback).
