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

The admin password must be at least 12 characters. To seed an admin account, set `DEFAULT_ADMIN_PASSWORD` to a private value of at least 12 characters, then run `npm run seed:default-admin`. It creates or resets the username `admin` in the configured MongoDB.

The administrator can create student accounts from **Students** and teacher accounts from **Teacher Accounts**. Teachers sign in with their username and can view the roster for their assigned BSED major. Keep staff passwords private.

### Open the portal on a phone over Wi-Fi

Connect the computer and phone to the same Wi-Fi network. Start MongoDB, then open two terminals in the project folder and run `npm run server` in one and `npm run dev:lan` in the other. On the computer, run `ipconfig` and find the Wi-Fi adapter's IPv4 address. On the phone, open `http://<computer-ip>:5173` (for example, `http://192.168.100.187:5173`). If Windows asks, allow Node.js on your private network. This is for local development; do not expose the development server to the public internet.

## Deploy for your group (Render + MongoDB Atlas)

The Express service serves the built Vite app, so one Render web service can host both the portal and API.

1. Create a MongoDB Atlas cluster and a database user with a strong password. Add your computer's current public IP to the Atlas project's IP access list for the one-time seed, and add the Render service's outbound IP addresses for runtime access. Atlas only accepts connections from listed addresses. If you use a broad allowlist for a short class demo, use a strong database-only user and sample data; do not store real student records.
2. Seed the administrator in that Atlas database from your computer. Copy the Atlas connection string and run these PowerShell commands in the project folder, replacing the values privately:

   ```powershell
   $env:MONGODB_URI = "mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER/bsed_portal?retryWrites=true&w=majority"
   $env:DEFAULT_ADMIN_PASSWORD = "choose-a-private-password-of-12-or-more-characters"
   npm run seed:default-admin
   Remove-Item Env:DEFAULT_ADMIN_PASSWORD
   Remove-Item Env:MONGODB_URI
   ```

   URL-encode special characters in the database username or password within the connection string. Do not put this URI or password in GitHub.
3. In Render, create a **Web Service** connected to `Jynxnanana/CHCC-BSED-PORTAL`, branch `main`. Set the build command to `npm ci && npm run build` and the start command to `npm run server`. Set health check path to `/api/health`.
4. In the Render service's environment variables, add `MONGODB_URI` with the Atlas connection string and `NODE_ENV` with `production`. Render provides the `PORT` value automatically.
5. Deploy. Share the service's `onrender.com` URL with your groupmates. Sign in as `admin` using the private password set in step 2, then create student and teacher accounts from their respective administration pages.

Render deploys a new version when changes are pushed to the connected GitHub branch. Free service plans may sleep or have usage limits; check the plan details in Render before relying on it for a presentation.

## Portal modules

The signed-in portal includes the student overview, weekly schedule, enrolled subjects, enrollment history, report of grades, curriculum evaluation, student ledger, registration draft, payment preview, FAQ assistant, community forum, library resources, clinic information, notifications, and BSED major directory. Schedule, grade, and ledger views can print or export CSV. The overview includes sample subject-status and GWA-trend charts.

Academic profile, curriculum, grade, attendance, ledger, announcement, and event details are sample data; they are not yet loaded from each student record. Online registration saves only an in-page draft. Payment does not collect money. Connect the school's Registrar, cashier/payment provider, and network system before using those flows operationally.
