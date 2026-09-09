# Casework website

Official public website, help, support, privacy policy and terms for the Casework iPad app.

- Canonical website: https://www.casework.work/
- Support: https://www.casework.work/support
- Privacy Policy: https://www.casework.work/privacy
- Terms: https://www.casework.work/terms

Cloudflare Workers hosts the static files in `public/`. Production deploys from the GitHub `main` branch using `npx wrangler deploy`; no build command or secrets are required in this repository. Custom domains: `www.casework.work` and `casework.work`. The bare domain redirects to www.

The help, app privacy policy and terms are generated from the app's `HelpCenterView.swift`, so the public copy follows the app. Regenerate from the private Casework app repository:

```sh
python3 Scripts/build_public_site.py --output /path/to/casework-site/public
```

Review the generated diff, commit it in this website repository, and push `main` to deploy. No app source, customer data, provisioning profiles, signing keys, or build archives belong in this public repository.

The app is preparing for its initial App Store release. Add the verified App Store link after the listing becomes available; the website does not invent a download destination.
