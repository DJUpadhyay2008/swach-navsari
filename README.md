# S.W.A.C.H. Navsari

> **Systematic Waste Action & Cleanliness Hub**  
> *Report. Resolve. Revive.*  
> Civic cleanliness and community participation platform for Navsari, Gujarat, India.

---

## 1. Overview & Objective

**S.W.A.C.H. Navsari** is an AI-assisted civic cleanliness management platform tailored to the municipal jurisdiction of Navsari, Gujarat (covering all 13 civic wards including Dudhia Talav, Lunsikui, Dandi Heritage Corridor, Station Road, and Kaliawadi).

This repository contains the **Phase 1: Project Foundation & Database Architecture**, establishing:
- A maintainable, feature-oriented React + TypeScript application shell.
- A secure PostgreSQL schema with complete Row Level Security (RLS) policies.
- A protected role-based authorization model preventing client privilege escalation.
- Documented complaint lifecycle state machine enforced at the database level.
- Private storage bucket policies for citizen and worker photographic evidence.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript in strict mode
- **Bundler / Dev Server:** Vite
- **Styling:** Tailwind CSS with custom civic green (`swach`) & warm saffron (`gujarat`) theme
- **Routing:** React Router v7 (`createBrowserRouter`)
- **Icons:** Lucide React
- **Validation:** Zod schemas integrated with React Hook Form
- **Server State Management:** TanStack Query (React Query)
- **Testing:** Vitest, React Testing Library, jsdom, ESLint

### Backend & Database
- **Platform:** Supabase (Auth, PostgreSQL, Storage, CLI)
- **Database:** PostgreSQL with `uuid-ossp`, `pgcrypto`, custom enums, and foreign key constraints
- **Security:** PostgreSQL Row Level Security (RLS) on 100% of tables
- **Storage:** Private Supabase Storage buckets with granular `storage.objects` RLS policies
- **Migrations:** Sequential Supabase CLI SQL migrations (`supabase/migrations/`)

---

## 3. Application Directory Structure

```
swach-navsari/
├── .env.example                      # Public environment variable template
├── .gitignore                        # Git ignore rules for node, dist, and local Supabase
├── eslint.config.js                  # ESLint 9 configuration with TS and React hooks
├── index.html                        # HTML entry point with SEO tags and Inter font
├── package.json                      # Dependency manifest
├── postcss.config.js                 # PostCSS setup for Tailwind CSS
├── tailwind.config.js                # Tailwind configuration with Navsari civic palette
├── tsconfig.json                     # Strict TypeScript compiler options with @/* aliases
├── vite.config.ts                    # Vite bundler & Vitest test configuration
├── src/
│   ├── app/
│   │   ├── providers.tsx             # TanStack Query Client provider wrapper
│   │   └── router.tsx                # Client-side routing configuration
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Master shell: Header, ConfigBanner, Outlet, Footer
│   │   │   ├── ConfigBanner.tsx      # Diagnostic alert when Supabase env is unconfigured
│   │   │   ├── Footer.tsx            # Civic municipal footer
│   │   │   └── Header.tsx            # Sticky navigation with live backend badge
│   │   └── ui/
│   │       ├── Alert.tsx             # Alert component (info, warning, success, error)
│   │       ├── Badge.tsx             # Status and role badges
│   │       ├── Button.tsx            # Action button with loading spinners and icons
│   │       └── Card.tsx              # Glassmorphic card compound component
│   ├── features/
│   │   ├── analytics/                # SLA calculations and ward cleanliness metrics
│   │   ├── assignments/              # Worker dispatch contracts and payloads
│   │   ├── auth/                     # Role authorization checks and permissions
│   │   ├── community/                # Cleanup drives and volunteer registration
│   │   └── reports/                  # Complaint state machine and transition rules
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts             # Typed Supabase client with safe unconfigured fallback
│   │   ├── utils/
│   │   │   └── index.ts              # Navsari wards, category labels, status configs, formatters
│   │   └── validation/
│   │       └── reports.ts            # Zod validation schemas for complaints and feedback
│   ├── pages/
│   │   ├── CommunityPage.tsx         # Volunteer cleanup drives across Navsari landmarks
│   │   ├── LandingPage.tsx           # Hero, 4-pillar overview, ward directory
│   │   ├── MunicipalAdminPage.tsx    # Official triage, worker dispatch, and SLA board
│   │   ├── NotFoundPage.tsx          # 404 handler
│   │   ├── ReportIssuePage.tsx       # Citizen waste reporting form wizard
│   │   ├── TrackComplaintPage.tsx    # Public tracking by safe Complaint ID (NAV-YYYY-XXXXX)
│   │   └── WorkerPortalPage.tsx      # Sanitation worker mobile field task board
│   ├── styles/
│   │   └── index.css                 # Tailwind directives, glassmorphism, design tokens
│   ├── test/
│   │   └── setup.ts                  # Vitest setup with jest-dom matchers
│   ├── types/
│   │   ├── database.types.ts         # Generated Supabase database TypeScript definitions
│   │   └── index.ts                  # Application domain models
│   └── main.tsx                      # React root rendering entrypoint
└── supabase/
    ├── migrations/
    │   ├── 20260224000001_initial_schema.sql         # 10 domain entities, enums, sequences
    │   ├── 20260224000002_lifecycle_and_functions.sql# Lifecycle transitions & functions
    │   ├── 20260224000003_rls_policies.sql           # Row Level Security on all tables
    │   └── 20260224000004_storage_security.sql       # Storage buckets and storage RLS
    └── seed.sql                      # Mock Navsari profiles, complaints, and community drive
```

---

## 4. Domain Model & Database Schema

The database design encompasses 10 core entities:

| Table | Purpose | Primary Key | Key Foreign Keys & Constraints | Deletion Policy |
| :--- | :--- | :--- | :--- | :--- |
| `user_roles` | Protected role storage | UUID | `user_id` &rarr; `auth.users(id)` | `CASCADE` on user deletion |
| `profiles` | Public profile info | UUID | `id` &rarr; `auth.users(id)` | `CASCADE` on user deletion |
| `reports` | Waste complaints | UUID | `reporter_id` &rarr; `auth.users(id)`, safe `complaint_id` | `SET NULL` on user deletion (preserves civic history) |
| `report_media` | Citizen photo metadata | UUID | `report_id` &rarr; `reports(id)` | `CASCADE` on report deletion |
| `assignments` | Worker dispatches | UUID | `report_id`, `worker_id`, `assigned_by` | `RESTRICT` (prevents deleting active assignments) |
| `report_status_history` | Lifecycle audit trail | UUID | `report_id`, `actor_id` | `RESTRICT` (strictly immutable) |
| `resolution_evidence` | Worker completion photos | UUID | `report_id`, `worker_id`, `assignment_id` | `RESTRICT` (evidence cannot be purged) |
| `report_feedback` | Citizen rating & reopening | UUID | `report_id` (UNIQUE), `citizen_id` | `RESTRICT` |
| `cleanup_events` | Community civic drives | UUID | `organizer_id` &rarr; `auth.users(id)` | `RESTRICT` |
| `event_participants` | Volunteer registrations | UUID | `event_id`, `user_id` | `CASCADE` |
| `audit_logs` | Admin action audits | UUID | `actor_id` | `SET NULL` (immutable log) |

### Non-Enumerable Complaint Identifiers
Reports are identified internally via UUIDs for database operations, but display IDs are generated using PostgreSQL sequences and triggers:
```
NAV-YYYY-XXXXX  (e.g., NAV-2026-00101)
```
This prevents enumeration attacks and avoids exposing internal database primary keys to the public.

---

## 5. Roles & Authorization (Security Architecture)

### Application Roles
- `citizen`: Standard user submitting reports, tracking complaints, giving feedback, participating in drives.
- `municipal_official`: Authority reviewing complaints, assigning field workers, overriding triage, viewing audit logs.
- `sanitation_worker`: Field unit receiving task assignments, viewing locations, and submitting resolution proof.

### Protected Privilege Principle
- **No Client Privilege Escalation:** Role assignments are stored in the protected `public.user_roles` table, NOT in client-editable `profiles` or Supabase user metadata.
- **Default Citizen Role:** When a new user signs up in Supabase Auth, a database trigger (`public.handle_new_user()`) automatically creates their profile and grants the default `citizen` role.
- **Elevated Roles:** Elevated roles (`municipal_official`, `sanitation_worker`) can only be granted by existing municipal officials through direct database authorization.

### Row Level Security (RLS) Policy Summary

| Table | Citizen | Sanitation Worker | Municipal Official | Anonymous |
| :--- | :--- | :--- | :--- | :--- |
| `reports` | Read & edit own reports in `submitted` state | Read reports assigned to worker | Full SELECT / UPDATE / DELETE | Safe public lookup via `track_complaint()` RPC |
| `report_media` | Upload and view own evidence | View evidence for assigned reports | Full access | Denied |
| `assignments` | View status of own report's worker | View and accept assigned tasks | Create, reassign, cancel | Denied |
| `resolution_evidence` | View verified proof for own report | Submit photo proof for assigned task | Full inspection access | Denied |
| `report_feedback` | Submit feedback for own resolved report | Denied | Read all citizen feedback | Denied |
| `audit_logs` | Denied | Denied | Full read access | Denied |

---

## 6. Complaint Lifecycle State Machine

The complaint lifecycle is governed by the trusted PostgreSQL function `public.transition_report_status()`. Transitions cannot be initiated arbitrarily by the frontend:

```
[ submitted ] ──(official: triage)──> [ under_review ] ──(official: assign)──> [ assigned ]
      │                                       │                                      │
      │ (official reject w/ reason)           │ (official reject w/ reason)          │ (worker start)
      ▼                                       ▼                                      ▼
[ rejected ]                            [ rejected ]                           [ in_progress ]
                                                                                     │
                                                                                     │ (worker submit evidence)
                                                                                     ▼
[ resolved ] <──(official verify)── [ resolution_submitted ] ─────────────────────────┘
      │
      └──(citizen dispute within 72h)──> [ reopened ] ──(official triage)──> [ under_review ]
```

### Transition Enforcement Rules
- **Rejection Reason:** Rejection requires an explicit `p_rejection_reason` string (minimum 5 characters).
- **Atomic Audit Trail:** Every status change writes an immutable record to `public.report_status_history` with the acting user's ID and timestamp.
- **Concurrency Protection:** Row-level locks (`FOR UPDATE`) prevent race conditions during simultaneous status updates.

---

## 7. Storage Security Strategy

Evidence files (garbage accumulation photos, completion photos) are stored in **private Supabase Storage buckets**:

1. `report-evidence`: Citizen complaint submissions.
   - Storage path convention: `report-evidence/{user_id}/{report_id}/{filename}`
   - Citizens can only upload to their own user directory.
   - Files are accessible only to the uploader, the assigned worker, and municipal officials.
2. `resolution-evidence`: Worker post-cleanup proof.
   - Storage path convention: `resolution-evidence/{worker_id}/{report_id}/{filename}`
   - Workers upload verified resolution photos.
   - Accessible to officials and the citizen who reported the issue.

### File Restrictions
- Maximum size: **10 MB**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Direct public URLs are disabled. Access requires authenticated session or time-limited signed URLs.

---

## 8. Local Setup & Migrations

### Prerequisites
- Node.js (v18+) and npm
- (Optional) Supabase CLI & Docker for running a local Supabase stack

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project URL and anon public key:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 3. Applying Database Migrations

#### Option A: Using Supabase CLI (Recommended for Local Dev)
```bash
# Start local Supabase containers
supabase start

# Apply all migrations in sequence
supabase migration up

# Seed initial Navsari sample data
supabase db reset
```

#### Option B: Using Supabase Cloud Dashboard
Navigate to the **SQL Editor** in your Supabase dashboard and run the migration scripts in this order:
1. `supabase/migrations/20260224000001_initial_schema.sql`
2. `supabase/migrations/20260224000002_lifecycle_and_functions.sql`
3. `supabase/migrations/20260224000003_rls_policies.sql`
4. `supabase/migrations/20260224000004_storage_security.sql`
5. `supabase/migrations/20260224000005_phase2_citizen_reporting.sql`
6. `supabase/seed.sql`

---

## 9. Verification & Scripts

| Command | Action | Current Status |
| :--- | :--- | :--- |
| `npm run test` | Run Vitest test suite | **30 of 30 tests passing** across 6 test suites |
| `npm run lint` | Run ESLint across code and configs | **0 errors, 0 warnings** |
| `npm run build` | Compile TypeScript and produce production bundle | **Build successful** (Vite built in ~2.2s) |
| `npm run dev` | Launch local Vite development server | Ready for local interaction |

---

## 10. Phase 2: Citizen Complaint Reporting Implementation

Phase 2 completes the first vertical slice of S.W.A.C.H. Navsari:
1. **Supabase Auth Integration (`useAuth`, `AuthProvider`):** Real user sessions with reactive state change listeners, sign-in, sign-up with Navsari ward and profile registration, and derived identity directly from `session.user`.
2. **Citizen Complaint Reporting Form (`/report`):**
   - Category selector with Navsari civic context and Gujarati labels.
   - Geolocation integration: optional browser GPS acquisition with error/denial fallback to manual street/locality address. Never mandates GPS.
   - Private photo evidence uploader: max 3 photos, 10MB limit, JPEG/PNG/WEBP.
   - Atomic rollback: cleans up uploaded storage objects if the subsequent database operation encounters an error.
3. **My Reports Dashboard (`/my-reports`):**
   - Lists reports submitted by the authenticated citizen.
   - Fetches and displays secure image thumbnails generated via time-limited signed URLs (`createSignedUrl`) from the private `report-evidence` bucket.
   - Status badges, priority indicators, and responsive card layouts.
4. **Report Detail & Tracking (`/reports/:id`):**
   - Real-time complaint detail, photo lightbox gallery, Google Maps navigation coordinate link.
   - Status history lifecycle trail from `report_status_history`.
   - Accessible tracking from safe Complaint Reference (e.g. `NAV-2026-00101`).
5. **Database Migration 05 (`20260224000005_phase2_citizen_reporting.sql`):**
   - Relaxes GPS coordinate not-null constraints with a composite location check (`chk_report_location_provided`).
   - Trigger `trg_record_initial_report_status` auto-recording initial 'submitted' audit trail on report insert.
   - Storage cleanup policy `report_evidence_owner_delete_policy` allowing citizens to delete their own uploaded files in case of aborts.
