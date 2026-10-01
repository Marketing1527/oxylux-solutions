# OxyLux Solutions website

Static site (plain HTML/CSS/JS, no build step). Hosted on Vercel, domain at GoDaddy.

- Live: https://www.oxyluxsolutions.com (bare domain redirects to www)
- Repo: Marketing1527/oxylux-solutions, and every push to `main` deploys automatically

## Current mode: coming soon
`index.html` is the coming-soon page. The full site is built and reachable at
`/home.html`, `/services.html`, etc., but marked `noindex` so Google doesn't list it yet.

## Fill in before launch
Search the project for `[` placeholders:
- [ ] `[PHONE]`, `[ADDRESS]`, `[HOURS]` in the footer and on contact.html (edit the generator or every page)
- [ ] `[PRICE]`, `[PACKAGE OPTIONS AND PRICES]`, `[MEMBERSHIP DETAILS]` on services.html
- [ ] `[FOUNDER STORY]`, `[CERTIFICATIONS / TRAINING DETAILS]` on about.html
- [ ] `[INSURANCE POLICY]` on faq.html
- [ ] Confirm hello@oxyluxsolutions.com exists. The notify and booking forms open an email to it.
  Recommended: swap the forms to a real form backend (Formspree, Basin, etc.) so leads aren't lost.
- [ ] Real photos of the chambers and space

## Launch day (switch from coming soon to the full site)
1. `git mv index.html coming-soon.html && git mv home.html index.html`
2. Replace `/home.html` links with `/` in every page (`sed -i '' 's#/home.html#/#g' *.html`)
3. Remove the `<meta name="robots" content="noindex, follow">` lines from every page except 404.html
4. Add all pages to `sitemap.xml`
5. Commit and push. Vercel deploys automatically.
