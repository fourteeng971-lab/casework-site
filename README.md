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

The App Store listing is https://apps.apple.com/app/id6794541279 (Casework: Cabinet Design, live since September 27, 2026). Every page carries it in the header, footer and a Smart App Banner, and the homepage in the hero, pricing and closing calls to action; the ID lives in `APP_STORE_ID` in the generator. Never add app source, customer data, signing files, or build archives to this public repository.

## Background motion

The hero and three feature previews use muted, looping inline H.264 video at 2360 × 1640. Playback begins automatically when a section is visible and pauses offscreen, in a hidden browser tab, or when the visitor pauses motion. The operating system’s reduced-motion preference shows still previews. The persistent motion button controls both videos and page animations. A small play button appears if the browser blocks automatic playback.

There are no video download links, native player controls, or publicly deployed MOV originals. The original recordings remain in the private Marketing folder. MP4 files are served as playback media; this is not DRM or a guarantee against saving browser-accessible media.

PNG posters are full-resolution extracted frames. Page regeneration preserves video assets.
