# CHCC-BSED-PORTAL

## EduPortal — BSED Student Portal

A portal for Bachelor of Secondary Education students, focused on school announcements, academics, and their majors.

## Stack

- React and Vite for the student portal
- Tailwind CSS for utility styling, with a small custom stylesheet for the dashboard layout
- Express and MongoDB driver for the API

## Run locally

1. Install Node.js 20 or newer and MongoDB Community Server. Make sure the **MongoDB** Windows service is running.
2. Run `npm install`.
3. In PowerShell, copy `.env.example` to `.env` if you do not already have one:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```
4. In PowerShell, prepare the local database and admin account:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\server\use-local-database.ps1
   ```

   Enter a private admin password of at least 12 characters when prompted. This switches `.env` to the local MongoDB database at `127.0.0.1:27017`; local records are separate from Atlas.
5. Start the API with `npm run server`.
6. In another terminal, start the portal with `npm run dev`, then open the local URL Vite prints (usually `http://localhost:5173`). Sign in as `admin` with the password you entered.

The web app is served by Vite. The API exposes health, sign-in/session, account administration, teacher roster/gradebook, and student grade report endpoints on port 4000. Vite proxies `/api` requests to the API during development.

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

The administrator can create, edit, and delete student and teacher accounts, maintain class schedules, add verified curriculum requirements, and publish, edit, or delete school-wide announcements. Teachers sign in with their username, search and export their assigned-major roster, view assigned classes, record attendance, enter grades for students in their assigned classes, and publish major-specific updates in **Major Advisories**. Student accounts can view school announcements and advisories for their major. Keep staff passwords private and have the Registrar verify academic records before treating them as official.

Teacher-entered grades are saved with a pending approval status, and students only see approved grades. The approval page is currently not linked in the administrator navigation, so student grade publishing is incomplete until that review flow is restored or redesigned. The portal does not currently offer online registration or a payment gateway.

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
3. In Render, create a **Web Service** connected to `Jynxnanana/CHCC-BSED-PORTAL`, branch `main`. Set the build command to `npm ci --include=dev && npm run build` and the start command to `npm run server`. Set health check path to `/api/health`.
4. In the Render service's environment variables, add `MONGODB_URI` with the Atlas connection string and `NODE_ENV` with `production`. Render provides the `PORT` value automatically.
5. Deploy. Share the service's `onrender.com` URL with your groupmates. Sign in as `admin` using the private password set in step 2, then create student and teacher accounts from their respective administration pages.

Render deploys a new version when changes are pushed to the connected GitHub branch. Free service plans may sleep or have usage limits; check the plan details in Render before relying on it for a presentation.

## Portal modules

Current navigation is role-specific. Students see **Overview**, **Notifications**, **Account Settings**, **Class Schedule**, **Academic Evaluation**, **Announcements**, and **BSED Majors**. Teachers see **Teacher Dashboard**, **My Schedule**, **Attendance**, **Gradebook**, **Major Advisories**, and **Account Settings**. Administrators see **Students**, **Teacher Accounts**, **Class Schedules**, **Curriculum Catalog**, **Announcements**, and **Account Settings**. The Virtual Assistant, student community feed, and removed student-service pages are not part of the current portal navigation.

Academic schedules, curriculum requirements, attendance, grades, teacher advisories, school announcements, and legacy event records are stored in MongoDB. They remain empty until authorized staff enter verified information. Teacher advisories reach students by matching BSED major, while administrator announcements are visible to all students. Student community posts are not available in the current portal. No payment gateway, student information system, official library portal, or school notification provider is connected. The portal is not a substitute for those systems or their official records.
