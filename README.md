# 3D World

Уеб платформа за 3D услуги (принтиране, моделиране, сканиране) с публичен сайт, потребителски портал и админ панел.

## Съдържание
- [Преглед](#преглед)
- [Основни функционалности](#основни-функционалности)
- [Технологичен стек](#технологичен-стек)
- [Архитектура и структура](#архитектура-и-структура)
- [Страници и достъп](#страници-и-достъп)
- [Локално стартиране](#локално-стартиране)
- [Supabase конфигурация](#supabase-конфигурация)
- [База данни и RLS](#база-данни-и-rls)
- [Storage (качване на файлове)](#storage-качване-на-файлове)
- [Build и Deploy (Netlify)](#build-и-deploy-netlify)
- [Troubleshooting](#troubleshooting)
- [Полезни файлове](#полезни-файлове)

## Преглед
Проектът е изграден като **Vite Multi-Page Application (MPA)** и използва **Supabase** за:
- автентикация;
- база данни;
- storage за качени 3D файлове;
- role-based достъп (user / moderator / super_admin).

Системата включва:
- публични страници (услуги, материали, галерия, контакти и др.);
- потребителски flow (регистрация, вход, upload, заявки, профил);
- административен flow (поръчки, потребители, материали, запитвания, CMS).

## Основни функционалности

### Публична част
- Презентационни страници: `index`, `services`, `materials`, `how-it-works`, `gallery`, `contacts`.
- Контактна форма -> запис в `contact_inquiries`.
- Галерия с визуализация на STL/OBJ (Three.js) и SVG preview.

### Потребителска част
- Регистрация и вход със Supabase Auth.
- Качване на файлове (STL / OBJ / SVG) в storage bucket `uploads`.
- Създаване на заявки с материал, количество, бележки и избрани услуги (`scan`, `model`, `print`).
- Преглед/редакция на собствени заявки (според статус).
- Профилна страница.

### Админ част
- Dashboard с KPI стойности.
- Поръчки: статус, цена, срок, изтриване, publish към галерия.
- Потребители: роли, disable/enable, изтриване (само `super_admin`).
- Материали: добавяне, редакция на цена, изтриване.
- Контактни запитвания: преглед и маркиране като прочетени.
- CMS за управление на статични страници (super admin).

## Технологичен стек
- **Frontend:** Vanilla JavaScript (ES Modules), HTML, CSS
- **Bundler:** Vite 5 (MPA build)
- **UI:** Bootstrap 5 + custom styles (`src/styles/main.css`)
- **Backend services:** Supabase (Auth, Postgres, Storage)
- **3D rendering:** Three.js + STLLoader/OBJLoader

`package.json` scripts:
- `npm run dev` – development server
- `npm run build` – production build
- `npm run preview` – preview на production build

## Архитектура и структура
```text
.
├─ app/                    # потребителски страници (login/register/dashboard/upload/requests/profile)
├─ admin-panel/            # админ страници
├─ pages/                  # публични страници (вторични entry html)
├─ src/
│  ├─ core/
│  │  ├─ components/       # nav + core UI логика
│  │  ├─ services/         # supabase/auth wrappers
│  │  └─ utils/            # auth/role guards + DOM helpers
│  ├─ pages/               # page-specific JS
│  ├─ services/            # re-export wrappers към core services
│  └─ styles/              # глобални стилове
├─ database/               # SQL схеми и storage setup скриптове
├─ supabase/migrations/    # версионирани миграции
├─ docs/                   # вътрешни технически инструкции
├─ vite.config.js
└─ netlify.toml
```

## Страници и достъп

### Публични
- `/pages/index.html`
- `/pages/services.html`
- `/pages/materials.html`
- `/pages/how-it-works.html`
- `/pages/gallery.html`
- `/pages/contacts.html`

### Потребителски (изискват login)
- `/app/dashboard.html`
- `/app/upload.html`
- `/app/requests.html`
- `/app/profile.html`

### Админ (изискват admin role)
- `/admin-panel/admin.html`
- `/admin-panel/admin-orders.html`
- `/admin-panel/admin-materials.html`
- `/admin-panel/admin-inquiries.html`
- `/admin-panel/admin-cms.html`

### Само super admin
- `/admin-panel/admin-users.html`
- CMS управление (`admin-cms`) също е ограничено до `super_admin`.

## Локално стартиране

## 1) Изисквания
- Node.js 18+ (препоръчително 20+)
- npm
- Supabase проект с активни таблици/политики

## 2) Инсталация
```bash
npm install
```

## 3) Environment променливи
Създай `.env` файл в root (може да копираш от `.env.example`):
```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

## 4) Стартиране
```bash
npm run dev
```

## 5) Production build локално
```bash
npm run build
npm run preview
```

## Supabase конфигурация

## Задължителни компоненти
- Auth (email/password)
- Таблици и RLS политики
- Storage bucket `uploads`

## Източници за setup
- Миграции: `supabase/migrations/`
- Базов schema snapshot: `database/supabase-schema.sql`
- Storage инструкции: `database/STORAGE_SETUP.sql` + `docs/STORAGE_ИНСТРУКЦИИ.md`

> Препоръка: използвай миграциите в `supabase/migrations/` като source of truth.

## База данни и RLS
Основните таблици са:
- `profiles` – потребителски профили, роли, disabled статус;
- `requests` – заявки за услуги;
- `materials` – налични материали и базови цени;
- `cms_pages` – CMS съдържание за публични страници;
- `gallery_projects` – публикувани завършени проекти;
- `contact_inquiries` – контактни запитвания.

Роли:
- `user`
- `moderator`
- `super_admin`

RLS е активиран и достъпът е role-based (вкл. админ четене/редакция на заявки и материали).

## Storage (качване на файлове)
Upload flow:
1. Потребител качва STL/OBJ/SVG.
2. Файлът се записва в `uploads` bucket (папка по потребител).
3. В `requests` се записват metadata (path, url, материал, количество, услуги).

Ако upload дава 400/403:
- изпълни `database/STORAGE_SETUP.sql` в Supabase SQL Editor;
- провери RLS политики в storage;
- виж `docs/БЪРЗА_НАСТРОЙКА.md` и `docs/STORAGE_ИНСТРУКЦИИ.md`.

## Build и Deploy (Netlify)
Проектът използва:
- build command: `npm run build`
- publish directory: `dist`
- redirects: `netlify.toml`

### Важно за MPA страници
За да се публикува страница, тя трябва да е включена във `vite.config.js` -> `build.rollupOptions.input`.

Пример: ако липсва entry за admin страница, в Netlify ще има 404, дори локално да работи.

### Manual deploy (когато auto deploy е изключен)
1. Пусни локално build:
   ```bash
   npm run build
   ```
2. В Netlify -> Site -> Deploys -> **Trigger deploy** (или drag & drop на `dist`).
3. Потвърди, че новият deploy е active.

## Troubleshooting

### 1) `Page not found` в Netlify за конкретна страница
- Провери дали страницата е в `vite.config.js` inputs.
- Провери дали има нужния redirect в `netlify.toml`.
- Направи нов deploy (при изключен auto deploy, старият build остава активен).

### 2) `Supabase env vars missing`
- Липсват `VITE_SUPABASE_URL` и/или `VITE_SUPABASE_ANON_KEY` в `.env`.

### 3) Няма достъп до админ страници
- Потребителят няма `moderator`/`super_admin` роля в `profiles`.

### 4) Upload грешки при файлове
- Провери MIME/extension validation (STL/OBJ/SVG).
- Провери RLS storage policies.

## Полезни файлове
- `vite.config.js` – MPA входни точки
- `netlify.toml` – redirects + deploy настройки
- `src/main.js` – глобална инициализация и guards
- `src/core/components/nav.js` – динамична навигация по роля
- `src/core/services/supabase.js` – Supabase client config
- `src/core/services/auth.js` – auth операции
- `database/supabase-schema.sql` – schema snapshot
- `database/STORAGE_SETUP.sql` – storage policy setup
- `docs/БЪРЗА_НАСТРОЙКА.md`
- `docs/STORAGE_ИНСТРУКЦИИ.md`

---

Ако качваш този проект в GitHub, този README е достатъчен за:
- onboarding на нов разработчик;
- локално стартиране;
- Supabase setup;
- deploy и поддръжка.
