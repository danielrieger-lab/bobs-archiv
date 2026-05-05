# Bobs Archiv Das ???-Fallometer

A mobile-first PWA for rating radioplays on iPhone and iPad.

## Features
- Radioplay rating cards
- Local-only storage for ratings and notes
- iOS-friendly PWA meta tags
- Offline caching with a service worker

## Data Safety
- All user data is saved in browser localStorage only.
- Existing stored entries are kept and migrated to a stable storage key on app updates.
- No cloud sync is used, so data stays on the device/browser profile.
- The archive page includes JSON backup export/import actions for manual restore on iOS and Android.
- The archive page also includes a merge-import mode (same episode ID = update, missing ID = keep, new ID = add).
- Before merge-import is applied, the app shows a preview (updates, new entries, unchanged entries).

## Development
1. Install Node.js.
2. Run the app with the Vite scripts in package.json.

## Cover Optimization
1. Run `npm install`.
2. Run `npm run covers:optimize` to convert all files in `public/covers` from PNG to WebP.
3. The script resizes covers to max 400x400 and removes original PNG files to reduce bundle size.

## Deploy to GitHub Pages
1. Push this project to a GitHub repository.
2. In GitHub, open repository Settings → Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to the `main` branch (or run the workflow manually in Actions).
5. Wait for the `Deploy to GitHub Pages` workflow to finish.

The app will be published at:
`https://<your-github-username>.github.io/<repository-name>/`

Notes:
- `vite.config.ts` is already configured to use the correct base path on GitHub Actions.
- For Pages deploys, keep the workflow file at `.github/workflows/deploy-gh-pages.yml`.

## Notes
- The included icon files are placeholders and can be replaced with final artwork later.
