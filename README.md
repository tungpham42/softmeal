# Món Ăn — modern Next.js / App Router rebuild

A modernized Vietnamese culinary recipe-sharing application based on the legacy `tungpham42/monan` project.

## Stack

- Next.js 16 + App Router
- TypeScript
- React 19
- Tailwind CSS 4
- AlpineJS for lightweight DOM state (navigation/account menus)
- Firebase Authentication + Firestore
- Cloudinary unsigned image uploads
- Inline SVG icons (no Font Awesome / Bootstrap)

## Vietnamese culinary direction

The UI uses a warm traditional Vietnamese palette inspired by lacquer red, old paper/cream, turmeric gold and bamboo green. Typography, borders, cards and copy are designed around a family-kitchen / recipe-notebook feel while remaining responsive and modern.

## Preserved routes

- `/` — recipe discovery, search, category filters, sorting and pagination
- `/cong-thuc/[slug]` — recipe detail, video, sharing, comments and related recipes
- `/goi-y` — weekly meal suggestions
- `/them` — create recipe
- `/sua-cong-thuc/[slug]` — admin recipe editing
- `/dang-nhap` — email/password and Google login
- `/dang-ky` — account registration
- `/ho-so` — profile and password management
- `/quan-tri` — admin recipe moderation
- `/huong-dan` — usage guide
- `/chinh-sach-bao-mat` — privacy page

## Environment

`.env` is included for the credentials/configuration recovered from the legacy client-side project. It is ignored by Git.

Use `.env.example` as the deployment template. Public Firebase web config values and Cloudinary unsigned-upload settings use `NEXT_PUBLIC_` because they are required in browser-side Firebase/Cloudinary flows. Do not add a Cloudinary API secret to browser code.

Required environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=
```

## Install and run

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Firebase setup

The app expects the same Firestore structure used by the legacy project:

- `recipes`
- `users`
- `recipes/{recipeId}/comments`

Authentication providers used by the UI are Email/Password and Google.

## Cloudinary setup

Recipe images are uploaded directly from the browser with an unsigned Cloudinary upload preset. The preset must be configured to accept the image uploads used by the application.

## Git safety

`.gitignore` excludes `.env`, local environment variants, build output, dependency folders, IDE metadata and common local logs. Commit `.env.example`, not `.env`.

## Migration notes

The migration replaces Bootstrap/React-Bootstrap and Font Awesome with Tailwind utility classes and inline SVG icons, converts JavaScript files to TypeScript, keeps the Firebase data model and core routes, and moves page composition to the App Router. The data layer remains browser-side because the legacy application uses client-side Firebase Auth/Firestore and Cloudinary unsigned uploads; this avoids introducing a new server-admin Firebase credential model that would change the deployment/security setup.

## Verification

The source tree was statically reviewed and type-checked as far as the offline environment permits. Full dependency installation/build could not be executed in this environment because npm package downloads are unavailable, so run `npm install` followed by `npm run build` in an online Node.js environment before deployment.
