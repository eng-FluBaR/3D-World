# AI Agent Instructions — Capstone Project (Software Technologies with AI)

## Goal

Build a fully functional multi-page web app using ONLY:

* HTML
* CSS
* **Vanilla JavaScript (NO frameworks, NO TypeScript)**
* Bootstrap
* Vite
* Supabase (DB, Auth, Storage)
* Node.js + npm
* GitHub

---

## Hard Constraints (Do NOT violate)

❌ Do NOT use:

* React, Vue, Angular or any frameworks
* TypeScript
* Single Page Application approach
* Express or other servers
* Firebase or other backends
* LocalStorage as main database

✅ MUST use:

* Vanilla JavaScript only
* Multi-page architecture (separate HTML files)
* Supabase as the only backend
* Modular JS files
* Static hosting compatibility

---

## Architecture

Client: Static JS app
Backend: Supabase (Database + Auth + Storage)

Each screen MUST be a separate HTML file.

---

## Required Pages (minimum 5)

1. Register page
2. Login page
3. Dashboard (main page)
4. Entity management page (CRUD)
5. Admin panel

Rules:

* Separate HTML file per page
* Responsive (Bootstrap)
* Navigation via links (no SPA behavior)

---

## Authentication & Roles

Use Supabase Auth only.

Must implement:

* Register
* Login
* Logout
* Session check on every page

Roles:

* user
* admin

Store roles in `user_roles` table.

Use Row Level Security (RLS) for permissions.
Admin features must be server-protected.

---

## Database (minimum 4 tables)

Example structure:

* profiles (linked to auth.users)
* main entities (e.g., tasks/posts/products)
* comments or secondary data
* user_roles
* attachments (optional but recommended)

Use foreign keys and timestamps.

---

## File Storage

Must support upload & download via Supabase Storage
(e.g., images or attachments).

Store file URLs in the database.

---

## Code Organization

Use modular Vanilla JS.

src/

* services → Supabase communication
* utils → helpers & validation
* components → reusable UI logic

No business logic inside HTML.

---

## Navigation & Security

* Use standard links between pages
* Validate session on page load
* Redirect unauthenticated users to login

---

## Deployment

App must run as a static site (Netlify, Vercel, etc.).

Provide demo credentials for testing.

---

## Git Requirements

* At least 15 commits
* Commits on 3 different days
* Clear commit messages

---

## Documentation

Repository must include:

* Project description
* Architecture overview
* Database schema
* Setup instructions (npm install, npm run dev)
* Live URL
* Demo account

---

## Definition of Done

A feature is complete only if:

* Works with Supabase backend
* Uses Vanilla JS
* Follows multi-page architecture
* Is responsive
* Has no console errors
* Respects authentication and RLS rules
