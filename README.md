# CHCC-BSED-PORTAL

## EduPortal — BSED Student Portal

A starter dashboard for Bachelor of Secondary Education students, with a focus on their majors and college community.

## Stack

- React and Vite for the student portal
- Tailwind CSS for utility styling, with a small custom stylesheet for the dashboard layout
- Express and MongoDB driver for the API

## Run locally

1. Install Node.js 20 or newer and MongoDB Community Server.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` if MongoDB is not using its local default.
4. Start the API with `npm run server`.
5. In another terminal, start the portal with `npm run dev`.

The web app is served by Vite. The API exposes `GET /api/health`, `GET /api/majors`, and student sign-in/session endpoints on port 4000. Vite proxies `/api` requests to the API during development.

## Create a student account

Student accounts are created by a school operator; there is no public self-registration. With MongoDB running, use an interactive terminal:

```sh
npm run create:student -- 61212024 "Jamie Mendoza" "English"
```

The command prompts for a password without echoing it. Passwords are stored as salted scrypt hashes. Students sign in with their 8-digit ID and that password. The API sets an HTTP-only session cookie; signing out deletes the session.

To create the first administrator, use the same interactive terminal:

```sh
npm run create:admin -- 60000001 "Portal Administrator"
```

The admin password must be at least 12 characters. To add the local preview account, run `npm run seed:default-admin`; it creates username `admin` with password `admin123` in the local MongoDB. Sign in and change it before exposing the portal to other users. After signing in, the admin sees **Students** in the sidebar and can create accounts from the student directory.

To create or reset the local superadmin account, run `npm run seed:default-superadmin`. It creates username `superadmin` with password `superadmin123`. The superadmin can create admin accounts from **Admin Accounts** and student accounts from **Students**. Admin accounts can create student accounts. Change the default password after signing in.

### Open the portal on a phone over Wi-Fi

Connect the computer and phone to the same Wi-Fi network. Start MongoDB, then open two terminals in the project folder and run `npm run server` in one and `npm run dev:lan` in the other. On the computer, run `ipconfig` and find the Wi-Fi adapter's IPv4 address. On the phone, open `http://<computer-ip>:5173` (for example, `http://192.168.100.187:5173`). If Windows asks, allow Node.js on your private network. This is for local development; do not expose the development server to the public internet.

## Portal modules

The signed-in portal includes the student overview, weekly schedule, enrolled subjects, enrollment history, report of grades, curriculum evaluation, student ledger, registration draft, payment preview, sample WiFi code generator, FAQ assistant, community forum, library resources, clinic information, notifications, and BSED major directory. Schedule, grade, and ledger views can print or export CSV. The overview includes sample subject-status and GWA-trend charts.

Academic profile, curriculum, grade, attendance, ledger, announcement, and event details are sample data; they are not yet loaded from each student record. Online registration saves only an in-page draft. Payment does not collect money, and generated WiFi codes do not authenticate with a campus network. Connect the school's Registrar, cashier/payment provider, and network system before using those flows operationally.
