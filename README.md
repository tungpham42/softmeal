# Softmeal (Bếp nhà Tùng) 🍜

A modern Vietnamese recipe-sharing web application built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Firebase**, and **Cloudinary**.

Softmeal is a rebuilt and modernized version of the legacy recipe project, preserving the familiar recipe and user flows while moving to a typed, component-driven architecture.

> Replace this section with a short description specific to your deployment.

---

## ✨ Features

- **Recipe Discovery** – Browse, search, filter by category, sort, and paginate recipes.
- **Recipe Details** – View recipe videos, share links, read comments, and see related recipes.
- **Weekly Suggestions** – Curated meal ideas for the week.
- **User Accounts** – Email/password and Google login, profile management, password changes.
- **Admin Panel** – Create, edit, and moderate recipes.
- **Image Uploads** – Browser uploads to Cloudinary using an unsigned upload preset.
- **Responsive UI** – Mobile-friendly layout with Tailwind CSS and inline SVG icons.
- **Vietnamese Culinary Theme** – Warm colors and a family-kitchen notebook feel.

---

## 🧰 Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js (App Router)                |
| Language       | TypeScript                          |
| UI             | React, Tailwind CSS                 |
| Backend / Auth | Firebase Authentication + Firestore |
| Media          | Cloudinary                          |
| Icons          | Inline SVG                          |

---

## 📋 Prerequisites

- Node.js **18.17** or later
- npm **9** or later
- A Firebase project with:
  - Authentication enabled
  - Email/Password provider enabled
  - Google provider enabled
  - Firestore database created
- A Cloudinary account with an **unsigned upload preset**

---

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tungpham42/softmeal.git
   cd softmeal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the required values.

   ```bash
   cp .env.example .env
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**

   ```bash
   npm run build
   npm start
   ```

---

## 🔧 Environment Variables

Create a `.env` file in the project root and add the following variables.

> **Note:** `.env` is git-ignored. Never commit real credentials. Use `.env.example` as the deployment template.

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

All `NEXT_PUBLIC_*` variables are exposed to the browser, as required for client-side Firebase and Cloudinary flows. Do not add a Cloudinary API secret to browser code.

---

## 🔥 Firebase Setup

The app expects a Firestore structure similar to the legacy project:

```text
recipes/{recipeId}
  ├── comments/{commentId}
  └── ...

users/{userId}
```

Enable the following authentication providers in the Firebase Console:

- Email/Password
- Google

Make sure Firestore security rules are configured for your deployment.

---

## ☁️ Cloudinary Setup

Recipe images are uploaded directly from the browser using an **unsigned upload preset**.

Configure the preset to accept the image formats and size limits used by the application.

Required environment variables:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## 📜 Available Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the development server                 |
| `npm run build`      | Build the production application             |
| `npm start`          | Start the production server                  |
| `npm run lint`       | Run the linter                               |
| `npm run type-check` | Run TypeScript type checking (if configured) |

---

## 📁 Project Structure

```text
softmeal/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/                # API routes
│   ├── cong-thuc/          # Recipe detail pages
│   ├── dang-nhap/          # Login
│   ├── dang-ky/            # Registration
│   ├── goi-y/              # Weekly meal suggestions
│   ├── ho-so/              # Profile
│   ├── huong-dan/          # Usage guide
│   ├── quan-tri/           # Admin moderation
│   ├── sua-cong-thuc/      # Admin recipe editing
│   ├── them/               # Create recipe
│   └── ...
├── components/             # Reusable UI components
│   ├── auth/               # Authentication components
│   ├── home/               # Homepage sections
│   ├── recipe/             # Recipe-related components
│   ├── recipes/            # Recipe list and filters
│   ├── site/               # Site-wide components (header, footer, ads)
│   └── ui/                 # Generic UI primitives
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and service configs
│   ├── firebase/           # Firebase helpers
│   ├── recipes/            # Recipe logic
│   ├── adsense.ts
│   ├── category.ts
│   ├── cloudinary.ts
│   ├── contact.ts
│   ├── device.ts
│   ├── nutrition.ts
│   └── ...
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── styles/                 # Global and theme styles
├── .env.example
├── LICENSE
└── README.md
```

---

## 🗺️ Routes

| Route                   | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `/`                     | Recipe discovery, search, category filters, sorting, pagination |
| `/cong-thuc/[slug]`     | Recipe detail, video, sharing, comments, related recipes        |
| `/goi-y`                | Weekly meal suggestions                                         |
| `/them`                 | Create a new recipe                                             |
| `/sua-cong-thuc/[slug]` | Admin recipe editing                                            |
| `/dang-nhap`            | Login with email/password or Google                             |
| `/dang-ky`              | Account registration                                            |
| `/ho-so`                | Profile and password management                                 |
| `/quan-tri`             | Admin recipe moderation                                         |
| `/huong-dan`            | Usage guide                                                     |
| `/chinh-sach-bao-mat`   | Privacy policy                                                  |
| `/gioi-thieu`           | About page                                                      |
| `/lien-he`              | Contact page                                                    |

---

## ☁️ Deployment

The project can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a Node.js server.

Ensure all environment variables are set in your hosting provider’s dashboard.

**Build command**

```bash
npm run build
```

**Start command**

```bash
npm start
```

---

## 🔄 Migration Notes

- **Bootstrap → Tailwind CSS** – UI rebuilt with Tailwind CSS and inline SVG icons.
- **JavaScript → TypeScript** – Codebase converted to TypeScript for type safety.
- **App Router** – Page composition uses the Next.js App Router.
- **Client-side Data Layer** – Firebase Auth/Firestore and Cloudinary unsigned uploads remain browser-side to avoid introducing a server-admin credential model.
- **Data Model** – Firestore structure and core routes preserved from the legacy project.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. Commit your changes.

   ```bash
   git commit -m "Add some amazing feature"
   ```

4. Push to the branch.

   ```bash
   git push origin feature/amazing-feature
   ```

5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

> Replace this section if the repository uses a different license.

---

## 📬 Contact

**Tung Pham**

- GitHub: [@tungpham42](https://github.com/tungpham42)
- Repository: [tungpham42/softmeal](https://github.com/tungpham42/softmeal)

---

## 🙏 Acknowledgements

- Original legacy recipe project
- Firebase
- Cloudinary
- Next.js
- Tailwind CSS
