# CHCC-BSED-PORTAL

## EduPortal — BSED Student Portal

A starter dashboard for Bachelor of Secondary Education students, with a focus on their majors and college community.

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

The administrator can create, view, edit, and delete student accounts from **Students**, teacher accounts from **Teacher Accounts**, and official class schedule records from **Class Schedules**. Add each student's section in their account, then assign each class to the matching BSED major and section and, when known, a teacher. Students only see their section's classes (plus classes marked for all sections). Teachers sign in with their username, search and export their major roster, view assigned classes, record attendance, and enter grades only for students in their assigned classes. New grades remain hidden from students until approved in **Grade Approvals**. Teachers can publish major-specific updates in **Major Advisories**. Keep staff passwords private and have the Registrar verify all academic records before treating them as official.

The administrator can add verified degree requirements under **Curriculum Catalog**, review student requests under **Enrollment Review**, post cashier-verified charges and payments under **Student Ledger Admin**, and publish campus dates under **Campus Events**. A payment entry is a manual cashier record and requires a receipt reference; the portal does not collect money. Students can submit a request from **Online Registration** using available schedules, see its review state in **Enrollment History**, and view posted attendance, approved grades, curriculum progress, ledger entries, and campus events.

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

The signed-in portal includes the student overview, weekly schedule, enrolled subjects, enrollment history, attendance records, report of grades, curriculum evaluation, student ledger, registration requests, campus events, FAQ assistant, student community, library resources, clinic information, notifications, and BSED major directory. Teachers can record class attendance and grades for assigned sections. Schedule, attendance, grade, and ledger views can print or export CSV.

Academic schedules, curriculum requirements, registration decisions, attendance, grades, ledger entries, student posts, and events are stored in MongoDB. They remain empty until authorized staff enter verified information. Student-submitted registration requests require administrator/Registrar review; teacher-entered grades require administrator/Registrar approval. Cashier staff must verify payments before recording them. No payment gateway, student information system, official library portal, or school notification provider is connected. The portal is not a substitute for those systems or their official records.
