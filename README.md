# OxyLux Solutions website

Static site plus a few Vercel serverless functions for booking. No build step.

- Live: https://www.oxyluxsolutions.com (bare domain redirects to www)
- Repo: Marketing1527/oxylux-solutions. Every push to `main` deploys automatically.
- Clinic: 14361 Commerce Way, Suite 201, Hialeah, FL 33016 · (305) 205-2738 · frontdesk@oxyluxsolutions.com · Mon–Fri 8–5

## Pages
| Path | What it is |
|---|---|
| `/` | Homepage (full site, launched Oct 29, 2026) |
| Other pages | Treatment, What to expect, Dr. Morales, FAQ, Contact, Privacy |
| `/services.html` | Services hub; each service has its own page (hyperbaric-oxygen-therapy, iv-therapy, lymphatic-massage, venus-legacy, botox) |
| `/reserve` | Booking: choose a day and time, then a service, then sign that service's consent form. `?service=botox` preselects a service |
| `/consent.html` | Consent form on its own: pick a service first (already-booked clients, in-clinic iPad) |
| `/admin` | Front-desk dashboard: appointments, patient info, signed PDFs |

## How booking works
1. Patient picks a slot on `/reserve` (`/api/availability`). Schedule lives in `api/_lib/schedule.js`:
   Mon–Fri 8 AM–5 PM, 90-minute slots, one appointment per service per slot, first bookable day Nov 2, 2026.
   Services are in `api/_lib/services.js`; consent text is in `consent-forms.js`.
2. They complete and sign the consent form. The browser builds the signed PDF.
3. `/api/book` reserves the slot (no double booking), stores the PDF and a JSON record.
4. The front desk sees it in `/admin`, can download the PDF, mark completed / no-show, or cancel (frees the slot).

## Storage (`api/_lib/storage.js`)
Chosen automatically from environment variables:
- **Google Drive** (production): set `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`.
- **Vercel Blob, private** (demo only): `BLOB_READ_WRITE_TOKEN`, from the `oxylux-demo-bookings` store. **Test data only.**
- Local files in `.data/` when running `npm run dev`.

Google Drive wins when its variables are set, so connecting Drive switches over automatically.

### Connect Google Drive (do this before real patients book)
Patient health information must be stored with a provider that has signed a BAA.
1. In Google Workspace Admin, accept Google's HIPAA BAA (Account settings → Legal and compliance).
2. In Google Drive, create a **Shared drive** named "OxyLux Patient Records". A Shared drive is required, because service accounts can't own files in My Drive.
3. In Google Cloud Console (logged in as an OxyLux Workspace admin): create a project, enable the **Google Drive API**,
   create a **service account**, and add a JSON key.
4. Add the service account's email to the Shared drive as **Content manager**.
5. Copy the Shared drive's folder ID from its URL (`drive.google.com/drive/folders/<ID>`).
6. Run `npm run setup-drive` in this folder. It asks for the JSON key file and the Shared drive link, tests a real read and write, and only then saves the settings to Vercel.
7. Run `vercel --prod`. Files land in `slots/`, `bookings/` and `consents/` folders inside the Shared drive.
8. Delete the JSON key file from your computer, then remove the demo store: `vercel blob delete-store` (after deleting any test bookings).

## Admin login
The login is stored only as a hash in Vercel environment variables. It is never in the code, which is public.
```
npm install
npm run setup-admin
vercel --prod
```
`setup-admin` asks for the email and password (hidden) and sets `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`.
Run it again any time to change the password.

## Opening popup and logo intro
- Popup: in `site.js`; stops showing automatically after Nov 2, 2026 (Eastern).
- Logo intro: `.intro` in `styles.css`. Plays on every arrival or refresh on public pages, and skips when moving between pages on the site (script in each page's `<head>`).

## Help chat
- Lux is an original illustrated AI assistant (`assets/assistant/`), not a real staff member.
- `chat.js` (widget), `api/chat.js` (Claude with availability and booking tools), `api/_lib/assistant.js` (everything the assistant knows; update this when services change).
- Needs the `ANTHROPIC_API_KEY` environment variable in Vercel. Without it, the widget offers the phone number.
- Chat bookings appear in `/admin` as "Consent needed", with a private consent link. Conversations themselves are not saved.

## SEO and search files
- Structured data (JSON-LD `@graph`) on every public page: MedicalClinic (address, geo, hours, phone, Google Maps link, languages, reserve action), WebSite, Physician (Dr. Morales), MedicalTherapy (HBOT), FAQPage, ContactPage, ProfilePage, BreadcrumbList. Generated once; edit the JSON in each page's `<head>`.
- `sitemap.xml` (with image entries), `robots.txt` (search engines and AI crawlers allowed, `/api/` blocked), `llms.txt` and `llms-full.txt` (summaries for AI assistants), `site.webmanifest`, `favicon.ico`, custom `404.html`.
- noindex: `/admin`, `/reserve`, `/consent.html`, 404.
- Google Analytics: add the GA4 tag to every page's `<head>` (not yet installed).

## Local development
```
npm install
npm run dev        # http://localhost:3010, uses .data/ and .env.dev (both gitignored)
```

## Launch
The site launched on Oct 29, 2026: the coming-soon page was removed (it is in git history) and the full site is `index.html`. `/home.html` redirects to `/`.

## Still to confirm with the owner
- Attorney review of the consent form wording (rebranded from the Moreau PT template; the "no insurance" line was removed because OxyLux accepts insurance)
- Which insurance plans are accepted (site says "most major insurance plans")
- Medical Director and attorney review of the IV, lymphatic massage, Venus Legacy and Botox consent drafts in `consent-forms.js`
- Florida massage establishment (MM) and therapist (MA) license numbers must appear in massage advertising
- Medical Director approval of the IV drip menu names, uses and ingredients on `iv-therapy.html`
- Service images are custom AI-generated scenes with the real logo added; replace with real photos of the rooms and equipment when available (`assets/services/`)
- Images must not imply a specific drug product or device brand; the Venus Legacy and Botox images use generic items
- Real photos of the space (only the chamber and Dr. Morales are photos today)
