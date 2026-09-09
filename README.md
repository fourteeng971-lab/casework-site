# Casework website

Official website, help, contact form, privacy policy, and terms for the Casework iPad app.

- Website: https://www.casework.work/
- Support guides: https://www.casework.work/support
- Contact form: https://www.casework.work/contact
- Privacy: https://www.casework.work/privacy
- Terms: https://www.casework.work/terms

## Deployment

Cloudflare Worker `casework-site` deploys `main` through the existing GitHub connection. Leave the build command empty; deploy with `npx wrangler deploy` from `/`. Static files are served directly by Cloudflare; only `/api/*` runs the Worker. Custom domains are `www.casework.work` and `casework.work`. The zone's Redirect Rules upgrade HTTP to HTTPS and redirect the bare domain to www while preserving paths and query strings. Domain-level sources cannot be placed in Workers assets' `_redirects` file.

The contact endpoint requires:

- Email Routing enabled for `casework.work`, with the support mailbox verified as a destination.
- Worker secret `CONTACT_TO`: the verified recipient address. Set in Cloudflare Worker Settings → Variables and Secrets. Never add it to public assets or this repository.
- `EMAIL` send binding and `CONTACT_RATE_LIMITER` binding, declared in `wrangler.jsonc`.

The Worker always sends to `CONTACT_TO`, from `website@casework.work`, with the visitor's validated email as Reply-To. It never accepts a caller-provided recipient. The sender address is not an incoming support mailbox. There are no autoresponses, file uploads, application database, or application logs of submission content. Delivery configuration and provider failures return an error, never a success confirmation. The rate limiter allows three submissions per minute per IP at each Cloudflare location; it is abuse mitigation, not a global quota guarantee.

Cloudflare's email binding defaults to verified account destinations. The code restricts delivery to the configured support mailbox. Do not use this Worker as a general mail relay.

## Updating public pages

From the private Casework app repository:

```sh
python3 Scripts/build_public_site.py --output /path/to/casework-site/public
```

The generator uses `Scripts/website/` for the design, CSS, and browser JavaScript. Help and app policy copy come from `HelpCenterView.swift`; public contact references point to the support form. The website policy separately documents form delivery and support data. Supplied app screenshots live in `public/assets/screenshots/` and are preserved by regeneration. Update templates along with generated output to prevent regressions on the next run.

The layout uses actual app screenshots, responsive sections, keyboard-operable tabs and screenshot dialogs, and a motion toggle that also respects the operating system's reduced-motion preference. No external fonts, third-party UI scripts, analytics, or client-side storage are required. The contact form supports progressive enhancement and normal HTML submission.

Validate the backend with `node --test tests/contact.test.mjs`, then run `npx wrangler deploy --dry-run`. Review generated content and links, commit, and push `main`. Check the resulting Cloudflare build and live contact delivery before considering a release complete.

The app is preparing for its initial App Store release. Add the verified App Store listing link when available. Never add app source, customer data, signing files, or build archives to this public repository.
