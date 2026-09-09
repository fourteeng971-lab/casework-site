# Casework website

Official website, help, privacy policy, and terms for the Casework iPad app.

- Website: https://www.casework.work/
- Support guides: https://www.casework.work/support
- Contact: https://www.casework.work/contact
- Privacy: https://www.casework.work/privacy
- Terms: https://www.casework.work/terms

## Deployment

Cloudflare Worker `casework-site` deploys `main` through the existing GitHub connection. Leave the build command empty; deploy with `npx wrangler deploy` from `/`. The site uses static assets only, with no contact backend, email binding, or database. Contact is a normal email link that opens the visitor's email app.

Custom domains are `www.casework.work` and `casework.work`. Cloudflare Redirect Rules upgrade HTTP to HTTPS and redirect the bare domain to www while preserving paths and query strings. Domain-level sources cannot be placed in Workers assets' `_redirects` file.

## Updating public pages

From the private Casework app repository:

```sh
python3 Scripts/build_public_site.py --output /path/to/casework-site/public
```

The generator uses `Scripts/website/` for the design, CSS, and browser JavaScript. Help and app policy copy come from `HelpCenterView.swift`. Supplied app screenshots live in `public/assets/screenshots/` and are preserved by regeneration. Update templates along with generated output to prevent regressions on the next run.

The layout uses actual app screenshots, responsive sections, keyboard-operable tabs and screenshot dialogs, and a motion toggle that respects the operating system's reduced-motion preference. No external fonts, third-party UI scripts, analytics, or client-side storage are required.

Run `npx wrangler deploy --dry-run`, review generated content and links, commit, and push `main`. Check the resulting Cloudflare build and live site.

The app is preparing for its initial App Store release. Add the verified App Store listing link when available. Never add app source, customer data, signing files, or build archives to this public repository.

## Screen recordings

Three recordings are served in `public/assets/videos/`. The H.264 MP4 playback files retain the recordings’ 2360 × 1640 landscape resolution. They are encoded for browser compatibility; the downloadable MOV originals are unchanged byte-for-byte. PNG posters are full-resolution frames extracted from the recordings. Native playback controls support pause, seeking, and fullscreen; videos do not autoplay or preload their full content. Switching away from the room tab pauses its video. These supplied clips have silent audio tracks.

Keep every static asset under Cloudflare’s per-file size limit. Regenerating pages preserves the video assets.
