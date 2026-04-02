# Bobs Archiv Das ???-Fallometer

A mobile-first PWA for rating radioplays on iPhone and iPad.

## Features
- Radioplay rating cards
- Local storage for ratings and notes
- iOS-friendly PWA meta tags
- Offline caching with a service worker

## Development
1. Install Node.js.
2. Run the app with the Vite scripts in package.json.

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
