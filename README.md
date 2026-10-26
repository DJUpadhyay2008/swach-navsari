# S.W.A.C.H. Navsari

<p align="center">
  <strong>Systematic Waste Action & Cleanliness Hub</strong><br />
  <em>Report. Resolve. Revive.</em>
</p>

<p align="center">
  A civic cleanliness platform concept for Navsari, Gujarat, connecting residents, municipal officials, and sanitation workers through one complaint-to-resolution workflow.
</p>

<p align="center">
  <a href="https://swach-navsari.vercel.app/"><strong>🌐 Live Demo</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/DJUpadhyay2008/swach-navsari"><strong>💻 Source Code</strong></a>
</p>

---

## ✨ About the project

S.W.A.C.H. Navsari is designed to make local cleanliness issues easier to report, assign, resolve, and verify. It brings the key people involved in civic sanitation into a shared digital workflow, with role-specific experiences and a Supabase-powered data layer.

The project is built for a hackathon demonstration and further development. It is **not an official Navsari Municipal Corporation service**, unless formally adopted by the relevant authority.

## 🎯 The problem we're addressing

Civic waste and cleanliness complaints can be difficult to track from the moment they are reported to the moment work is completed. A useful system should help answer:

- Where was an issue reported?
- Has the complaint been reviewed and assigned?
- Who is responsible for the field task?
- Was completion evidence submitted and reviewed?
- Can the reporter follow the complaint's progress?

S.W.A.C.H. brings these steps into one workflow.

## 🚀 Key features

### 🙋 Citizen portal
- Submit cleanliness complaints with category, description, location, and optional photo evidence.
- View personal reports and follow status changes.
- Track a complaint using its public complaint reference.
- Explore community cleanup activities.

### 🏛️ Municipal operations
- Review and filter incoming complaints.
- Assign work to sanitation staff and monitor active assignments.
- Inspect citizen-submitted and worker-submitted evidence.
- Approve completed work or request rework.
- View operational summaries, ward information, and audit history.

### 🧹 Sanitation worker portal
- View tasks assigned to the signed-in worker.
- Open navigation directions to a reported location.
- Update work progress and submit completion photos and notes.
- See tasks awaiting review and completed tasks.

### 🔐 Security-oriented design
- Supabase Authentication and role-aware application routes.
- PostgreSQL Row Level Security (RLS) policies for data access.
- Separate citizen and worker evidence buckets intended to remain private.
- Database functions for controlled complaint status transitions.
- Public tracking designed to return limited complaint information.

> Security depends on the policies and configuration actually applied to the deployed Supabase project. These design goals should not be treated as an independent security certification.

## 🔄 Complaint lifecycle

The central workflow connects residents, municipal officials, and field workers:

```text
Citizen submits complaint
          │
          ▼
Municipal review and assignment
          │
          ▼
Worker starts the field task
          │
          ▼
Worker submits completion evidence
          │
          ▼
Municipal verification
       ┌──┴──┐
       ▼     ▼
   Resolved  Rework requested
                 │
                 └──► Worker continues the task
```

The database contains status-transition logic intended to enforce allowed transitions and record status history. The exact live behaviour depends on the migrations deployed to the connected Supabase project.

## 🧰 Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 18, TypeScript | User interface and role-specific portals |
| Build tooling | Vite | Development server and production build |
| Styling | Tailwind CSS | Responsive interface and design system |
| Routing | React Router | Client-side navigation and route guards |
| Forms & validation | React Hook Form, Zod | Form state and input validation |
| Server state | TanStack Query | Query and mutation state |
| Backend platform | Supabase | Authentication, PostgreSQL, Storage, and database functions |
| Testing | Vitest, React Testing Library, jsdom | Automated frontend tests |
| Linting | ESLint | Code-quality checks |
| Hosting | Vercel | Production frontend hosting |

**Architecture:** React/Vite frontend → Supabase Auth, database APIs, PostgreSQL, and Storage. A separate FastAPI/Render service is not required by the current core architecture.

## 🗺️ Application areas

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/auth` | Sign in and citizen registration |
| `/report` | Submit a cleanliness complaint |
| `/my-reports` | View personal complaints |
| `/track` | Public complaint tracking |
| `/community` | Community cleanup activities |
| `/admin` | Municipal overview |
| `/admin/reports` | Complaint queue |
| `/admin/assignments` | Assignment management |
| `/admin/verifications` | Completion review |
| `/admin/map` | Geographic complaint view |
| `/admin/analytics` | Operational analytics |
| `/admin/audit` | Audit history |
| `/worker` | Sanitation worker task board |

Some routes and capabilities may depend on the signed-in role and the data available in the connected Supabase project.

## 🏗️ Repository structure

```text
swach-navsari/
├── src/
│   ├── app/                 # Providers and application routing
│   ├── components/          # Shared layout and UI components
│   ├── features/            # Auth, reports, admin, worker, analytics
│   ├── lib/                 # Supabase client and utilities
│   ├── pages/               # Route-level pages
│   ├── styles/              # Global styles and design tokens
│   ├── test/                # Test setup
│   └── types/               # Domain and database types
├── supabase/
│   ├── migrations/          # Ordered SQL migrations
│   ├── combined_migrations.sql
│   └── seed.sql             # Development/demo seed script
├── .env.example
├── vercel.json
├── package.json
└── README.md
```

## 💻 Run locally

### Prerequisites

- Node.js and npm
- Access to a Supabase project, or a local Supabase environment

### 1. Clone the repository

```bash
git clone https://github.com/DJUpadhyay2008/swach-navsari.git
cd swach-navsari
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Set the values for your Supabase project in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_APP_NAME="S.W.A.C.H. Navsari"
VITE_MUNICIPALITY_NAME="Navsari Municipal Corporation / Municipality"
VITE_CITY_NAME="Navsari"
VITE_STATE_NAME="Gujarat"
```

Use the publishable/anon client key with correctly configured RLS. **Never put a Supabase service-role key, database password, or other server secret in a `VITE_*` variable or browser code.** Environment files containing real values must not be committed.

### 4. Configure the database

Review the SQL files in `supabase/migrations/` and apply the required migrations to the intended Supabase project in their documented order. Confirm the deployed schema, RLS policies, Storage buckets, and Auth redirect URLs before using the app.

`supabase/combined_migrations.sql` is provided as a consolidated schema file; do not blindly re-run it against a database that already contains production data. Back up important data and verify migration history before applying database changes.

The `supabase/seed.sql` file contains sample data for development/demo use. **Inspect it before running it, and never seed placeholder accounts or synthetic records into a live environment unintentionally.**

### 5. Start the development server

```bash
npm run dev
```

Vite prints the local URL in the terminal.

## 🧪 Quality checks

Run the project's available checks before submitting changes:

```bash
npm test
npm run lint
npm run build
```

- `npm test` runs the Vitest suite.
- `npm run lint` runs ESLint.
- `npm run build` runs the configured TypeScript build and creates the production bundle.

Test counts and build status can change as the project evolves; run the commands locally or in CI for current results.

## 🚢 Deployment

The frontend is deployed on Vercel:

**[https://swach-navsari.vercel.app/](https://swach-navsari.vercel.app/)**

The application uses Supabase for authentication, database access, and evidence storage. To maintain a safe deployment:

1. Configure the required `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in Vercel for the correct environment.
2. Configure Supabase Auth Site URL and allowed redirect URLs for the deployed domain.
3. Verify that all required migrations are applied to the intended Supabase project.
4. Confirm that evidence buckets are private and storage policies restrict access to authorized users.
5. Test citizen, municipal official, and sanitation worker workflows using separate test accounts.
6. Review RLS policies and database function permissions independently of frontend route guards.
7. Check the Vercel build result after each production change.

## 🧭 Demo data and privacy

Use synthetic data only when it is clearly labelled as simulated. Keep demonstration data separate from real complaint records, assignments, notifications, and audit history. Do not present simulated counts or locations as live municipal statistics.

Before using the platform with real residents, establish appropriate consent, retention, access-control, backup, and incident-response practices. Avoid collecting personal information that the workflow does not need.

## 🤝 Contributing

Contributions and feedback are welcome.

1. Create a branch for your change.
2. Keep changes focused and explain the reason for them.
3. Run tests, lint, and build checks.
4. Document any database migration and security implications.
5. Open a pull request with a clear summary and testing notes.

Never commit credentials, real resident information, or production database exports.

## 📄 Project status and attribution

S.W.A.C.H. Navsari is a civic-tech project developed for demonstration and further development. It is not an official municipal service or an endorsement by Navsari Municipal Corporation.

**Built with the goal of making civic reporting more transparent, actionable, and accountable.**

<p align="center">
  <strong>S.W.A.C.H. Navsari</strong><br />
  <em>Report. Resolve. Revive.</em>
</p>
