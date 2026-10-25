# My Clean Navsari (S.W.A.C.H. Navsari)

> **Clean City • Stronger Community**  
> *Navsari Municipal Corporation (NMC) Civic Sanitation Platform*  
> Modern PWA & Desktop Operations Deck for Navsari, Gujarat, India.

---

## 1. Overview & Objective

**My Clean Navsari** is an AI-powered civic cleanliness management platform tailored to the municipal jurisdiction of Navsari, Gujarat (covering all 13 municipal civic wards including Dudhia Talav, Lunsikui, Dandi Heritage Corridor, Station Road, and Kaliawadi).

The platform establishes an end-to-end civic ecosystem connecting three core personas with tailored interfaces:
1. **Navsari Citizens (Mobile/PWA):** High-fidelity mobile experience featuring 1-tap reporting, AI category classification with confidence scoring, interactive GPS ward map, citizen impact points, and progress tracking timeline (`NMC202610120457`).
2. **Municipal Officials (Desktop Operations Deck):** Executive light workspace (`#F8FAFC`, white cards, deep navy sidebar) with top KPI metrics, Reports Trend chart, Category Distribution donut with total counts, Recent Reports triage, and City Map Hotspots ranking.
3. **Field Sanitation Workers (Mobile Portal):** Task board (`Assigned`, `In Progress`, `Completed`), turn-by-turn directions, real-time status transitions, and photo evidence upload for supervisor verification.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript in strict mode
- **Bundler / Dev Server:** Vite 7
- **Styling:** Tailwind CSS with custom civic green (`swach`), warm saffron (`gujarat`), and pure light theme architecture (soft grey `#F8FAFC` page backdrop, crisp `#FFFFFF` cards, `#E2E8F0` borders, `#0F172A` typography, and deep navy executive sidebar)
- **Routing:** React Router v7 (`createBrowserRouter`) with role-based route guards (`AdminGuard`, `WorkerGuard`)
- **Icons:** Lucide React
- **Validation:** Zod schemas integrated with React Hook Form
- **Server State Management:** TanStack Query v5 (React Query)
- **Testing:** Vitest, React Testing Library, jsdom, ESLint

### Backend & Database
- **Platform:** Supabase (Auth, PostgreSQL, Storage, Functions)
- **Database:** PostgreSQL with `uuid-ossp`, `pgcrypto`, custom enums, and foreign key constraints
- **Security:** PostgreSQL Row Level Security (RLS) on 100% of tables with zero client privilege escalation
- **Storage:** Private Supabase Storage buckets (`report-evidence`, `resolution-evidence`) with strict path-based RLS
- **Migrations:** Sequential SQL migrations (`supabase/migrations/`) and declarative composite migration (`combined_migrations.sql`)

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
│   │   └── router.tsx                # Client-side routing with role-guarded routes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Master shell: Header, ConfigBanner, Outlet, Footer
│   │   │   ├── ConfigBanner.tsx      # Diagnostic alert when Supabase env is unconfigured
│   │   │   ├── Footer.tsx            # Civic municipal footer
│   │   │   └── Header.tsx            # Sticky navigation with live backend badge and role switch
│   │   └── ui/
│   │       ├── Alert.tsx             # Alert component (info, warning, success, error)
│   │       ├── Badge.tsx             # Status and role badges
│   │       ├── Button.tsx            # Action button with loading spinners and icons
│   │       └── Card.tsx              # Glassmorphic card compound component
│   ├── features/
│   │   ├── admin/                    # Municipal dashboard services, queries, and modal dialogs
│   │   ├── analytics/                # SLA calculations and ward cleanliness metrics
│   │   ├── assignments/              # Worker dispatch contracts and payloads
│   │   ├── auth/                     # Role authorization checks, AuthContext, AdminGuard, WorkerGuard
│   │   ├── community/                # Cleanup drives and volunteer registration
│   │   ├── reports/                  # Citizen reporting services, file upload, and signed URLs
│   │   └── worker/                   # Sanitation worker task board, GPS navigation, and resolution service
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts             # Typed Supabase client with safe unconfigured fallback
│   │   ├── utils/
│   │   │   └── index.ts              # Navsari wards, category labels, status configs, formatters
│   │   └── validation/
│   │       └── reports.ts            # Zod validation schemas for complaints and feedback
│   ├── pages/
│   │   ├── admin/                    # Municipal Command Center Pages:
│   │   │   ├── AdminOverviewPage.tsx # KPI summary, SLA alerts, ward breakdown
│   │   │   ├── AdminReportsPage.tsx  # Paginated queue with category & ward filters
│   │   │   ├── AdminReportDetailPage.tsx # Report inspection, dispatch, approval/rework dialog
│   │   │   ├── AdminAssignmentsPage.tsx  # Active assignments & worker reassignments
│   │   │   ├── AdminVerificationsPage.tsx# Post-cleanup proof review queue
│   │   │   ├── AdminMapPage.tsx      # Geospatial map with GPS coordinates
│   │   │   ├── AdminAnalyticsPage.tsx# SLA performance charts and statistics
│   │   │   ├── AdminStaffPage.tsx    # Municipal official and worker directory
│   │   │   └── AdminAuditPage.tsx    # Immutable state transition audit trail
│   │   ├── AuthPage.tsx              # Unified multi-persona authentication (Citizen/Official/Worker)
│   │   ├── CommunityPage.tsx         # Volunteer cleanup drives across Navsari landmarks
│   │   ├── LandingPage.tsx           # Hero, 4-pillar overview, ward directory
│   │   ├── MyReportsPage.tsx         # Citizen personal report tracking dashboard
│   │   ├── NotFoundPage.tsx          # 404 handler
│   │   ├── ReportDetailPage.tsx      # Public complaint detail with lifecycle history
│   │   ├── ReportIssuePage.tsx       # Citizen waste reporting form wizard
│   │   ├── TrackComplaintPage.tsx    # Public tracking by safe Complaint ID (NAV-YYYY-XXXXX)
│   │   └── WorkerPortalPage.tsx      # Mobile-responsive field sanitation task board
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
    │   ├── 20260224000002_lifecycle_and_functions.sql# State machine & transition functions
    │   ├── 20260224000003_rls_policies.sql           # Row Level Security on all tables
    │   ├── 20260224000004_storage_security.sql       # Storage buckets and storage RLS
    │   ├── 20260224000005_phase2_citizen_reporting.sql# Composite location and initial status trigger
    │   └── 20260224000006_role_registration_support.sql# Safe multi-role auth helper functions
    ├── combined_migrations.sql       # Consolidated executable SQL migration schema
    └── seed.sql                      # Mock Navsari profiles, complaints, and community drive
```

---

## 4. Domain Model & Database Schema

The database design encompasses 11 core entities:

| Table | Purpose | Primary Key | Key Foreign Keys & Constraints | Deletion Policy |
| :--- | :--- | :--- | :--- | :--- |
| `user_roles` | Protected role storage | UUID | `user_id` &rarr; `auth.users(id)` | `CASCADE` on user deletion |
| `profiles` | Public profile info | UUID | `id` &rarr; `auth.users(id)` | `CASCADE` on user deletion |
| `reports` | Waste complaints | UUID | `reporter_id` &rarr; `auth.users(id)`, safe `complaint_id` | `SET NULL` (preserves civic history) |
| `report_media` | Citizen photo metadata | UUID | `report_id` &rarr; `reports(id)` | `CASCADE` on report deletion |
| `assignments` | Worker dispatches | UUID | `report_id`, `worker_id`, `assigned_by` | `RESTRICT` (prevents deleting active work) |
| `report_status_history` | Lifecycle audit trail | UUID | `report_id`, `actor_id` | `RESTRICT` (strictly immutable) |
| `resolution_evidence` | Worker completion photos | UUID | `report_id`, `worker_id`, `assignment_id` | `RESTRICT` (evidence cannot be purged) |
| `report_feedback` | Citizen rating & reopening | UUID | `report_id` (UNIQUE), `citizen_id` | `RESTRICT` |
| `cleanup_events` | Community civic drives | UUID | `organizer_id` &rarr; `auth.users(id)` | `RESTRICT` |
| `event_participants` | Volunteer registrations | UUID | `event_id`, `user_id` | `CASCADE` |
| `audit_logs` | Admin action audits | UUID | `actor_id` | `SET NULL` (immutable log) |

### Non-Enumerable Complaint Identifiers
Reports are identified internally via UUIDs for database operations, but display IDs are generated using PostgreSQL sequences and triggers:
```
NAV-YYYY-XXXXX  (e.g., NAV-2026-00001, NAV-2026-00101)
```
This prevents enumeration attacks and avoids exposing internal database primary keys to the public.

---

## 5. Roles & Authorization (Security Architecture)

### Application Roles
- `citizen`: Submitting reports, tracking complaints, giving feedback, participating in drives.
- `municipal_official`: Reviewing complaints, assigning field workers, overriding triage, approving resolutions, viewing audit logs.
- `sanitation_worker`: Receiving field task assignments, GPS navigation, and uploading resolution photo proof.

### Protected Privilege Principle
- **No Client Privilege Escalation:** Role assignments are stored in the protected `public.user_roles` table, NOT in client-editable `profiles` or Supabase user metadata.
- **Default Citizen Role:** Public registrations automatically receive only the `citizen` role through database triggers. Elevated roles (`municipal_official`, `sanitation_worker`) can only be provisioned through administrative authorization.
- **Client Route Guards:** Routes are guarded by role-aware components:
  - `<AdminGuard>`: Restricts `/admin/*` strictly to `municipal_official`.
  - `<WorkerGuard>`: Restricts `/worker` strictly to `sanitation_worker` and `municipal_official`.
- **Role-Aware Post-Login Routing:** Authenticated sessions immediately route to their persona-specific portal:
  - Municipal Officials &rarr; `/admin`
  - Sanitation Workers &rarr; `/worker`
  - Citizens &rarr; `/my-reports`

---

## 6. Complaint Lifecycle State Machine

The complaint lifecycle is governed by the trusted PostgreSQL function `public.transition_report_status()`. Transitions cannot be bypassed by direct client updates:

```
[ submitted ] ──(official: triage)──> [ under_review ] ──(official: assign)──> [ assigned ]
      │                                       │                                      │
      │ (official reject w/ reason)           │ (official reject w/ reason)          │ (worker: start work)
      ▼                                       ▼                                      ▼
[ rejected ]                            [ rejected ]                           [ in_progress ]
                                                                                      │
                                                                                      │ (worker: submit photo proof)
                                                                                      ▼
[ resolved ] <──(official: verify)── [ resolution_submitted ] <───────────────────────┘
      │                                       │
      │                                       └──(official: request rework)──> [ in_progress ]
      │
      └──(citizen dispute within 72h)──> [ reopened ] ──(official triage)──> [ under_review ]
```

### Transition Enforcement Rules
- **Rejection Reason:** Rejection requires an explicit `p_rejection_reason` string (minimum 5 characters).
- **Atomic Audit Trail:** Every status change writes an immutable record to `public.report_status_history` with the acting user's ID, previous status, new status, note, and timestamp.
- **Concurrency Protection:** Row-level locks (`FOR UPDATE`) prevent race conditions during simultaneous status updates.
- **Worker Visibility Continuity:** Assignments maintain active linkage during `resolution_submitted` so both the worker and municipal official preserve complete visibility under PostgreSQL RLS throughout the verification window.

---

## 7. Storage Security Strategy

Evidence files are stored in **private Supabase Storage buckets**:

1. `report-evidence`: Citizen initial complaint submissions.
   - Storage path convention: `report-evidence/{user_id}/{report_id}/{filename}`
   - Citizens can only upload to their own user directory.
   - Files are accessible only to the uploader, the assigned worker, and municipal officials.
2. `resolution-evidence`: Worker post-cleanup completion proof.
   - Storage path convention: `resolution-evidence/{worker_id}/{report_id}/{filename}`
   - Submissions require minimum 5-character audited cleanup summary notes (`CHECK (char_length(trim(notes)) >= 5)`).
   - Evidence is accessible to officials, the submitting worker, and the reporting citizen.

### File Restrictions
- Maximum size: **10 MB**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Direct public URLs are disabled. Access requires authenticated sessions or time-limited signed URLs (`createSignedUrl`).

---

## 8. Implemented Portals & Workflows

### 1. Citizen Portal (`/`, `/report`, `/my-reports`, `/track`)
- **Reporting Wizard (`/report`):** Category picker with Gujarati terminology, optional GPS geolocation with manual address fallback, photo evidence uploader with rollback on error.
- **My Reports (`/my-reports`):** Live complaint status cards, signed image previews, category and SLA indicators.
- **Public Complaint Tracking (`/track`):** Public status lookup using safe complaint reference (`NAV-YYYY-XXXXX`) without leaking private reporter identities.

### 2. Municipal Admin Command Center (`/admin`)
- **Queue Overview (`/admin`):** Real-time KPI summary (Total, Pending, Overdue, Average Resolution Hours, Ward Distribution).
- **Triage & Queue Board (`/admin/reports`):** Multi-filter queue (category, ward, priority, status) with pagination and SLA warnings.
- **Inspection & Verification (`/admin/reports/:id`):** Dual evidence photo gallery (citizen vs worker), assignment dispatch modal, priority updates, one-click **"Approve & Mark Resolved"** and **"Request Rework"** actions.
- **Active Field Assignments (`/admin/assignments`):** Live worker allocation table, workload monitoring, and crew reassignment.
- **Geospatial Map (`/admin/map`):** Interactive GPS map plotting complaints across Navsari's 13 wards with urgency coloring.
- **Operational Analytics (`/admin/analytics`):** SLA compliance metrics, ward performance distribution, and category breakdowns.
- **Civic Audit Trail (`/admin/audit`):** Immutable log of every status transition, timestamps, actor IDs, and audit notes.

### 3. Field Sanitation Worker Board (`/worker`)
- **Scoped Queue:** Isolated strictly to tasks dispatched to the logged-in worker ID via database RLS.
- **Turn-by-Turn GPS Directions:** One-click Google Maps navigation directly to the incident coordinates.
- **Field State Machine:** "Start Work on Site" (`in_progress`) and photo evidence upload (`resolution_submitted`).
- **Real-Time Polling & Live Lifecycle Sync:** Automatic 3-second background polling and window-focus synchronization ensures supervisor approvals ("Approve & Mark Resolved") dynamically transition tasks to the **Completed** tab with verified badges and completion notes without requiring manual page refreshes.
- **Quick-Fill Note Presets:** Touch-friendly buttons (`+ Done & site cleared`, `+ Waste collected and sanitized`, `+ Area completely cleaned`) satisfying statutory minimum character constraints.
- **Task Categorization:** Live filter tabs for **Active Tasks**, **Under Review**, and **Completed** with instant tab routing on submission.
- **Demo Mode Fallback:** Interactive seeded task (`NAV-2026-00101`) available when no live assignments are dispatched, allowing end-to-end testing of photo capture and submissions.

---

## 8. UI & UX Architecture (Design Spec Implementation)

### A. Citizen App (Mobile / PWA - 10 Screens)
1. **Home Screen (`/`):**
   - Brand banner: "My Clean Navsari" with green leaf icon and NMC badge.
   - Welcome Hero Card: "Together for a Cleaner, Greener Navsari" with prominent "Report an Issue" CTA button.
   - 2x2 Quick Action Cards:
     - `My Reports`: 5 Active
     - `Nearby Issues`: 12 in 2 km
     - `Community`: 3 Events
     - `My Impact`: 120 Points
   - Nearby Issues feed with category badges and time indicators.
   - Fixed Mobile Bottom Navigation bar (`BottomNav`): Home, Report, Map, Community, Profile.
2. **Report an Issue Wizard (`/report`):**
   - **Step 1 (Photo Evidence):** Camera capture (`capture="environment"`), gallery selector, 5MB validation, and responsive preview container.
   - **Step 2 (Category Selection):** AI Suggestion card ("Open Garbage Dumping, Confidence: 87%"), interactive radio cards for Open Garbage Dumping, Overflowing Bin, Street Litter, Drainage Waste, and Other.
   - **Step 3 (Location Confirmation):** Visual map container with GPS pin, "Use Current Location" button, landmark field, and detailed description.
   - **Step 4 (Submission Confirmation):** Green circular checkmark, Complaint ID card (`NMC202610120457`), View Details link, and 4-stage lifecycle timeline (Review by NMC &rarr; Assigned to team &rarr; Cleaned and verified &rarr; You will be notified).
3. **Issue Map View (`/map`):**
   - Real-time GPS plotting of local ward issues, search bar, and floating report preview drawer with GPS coordinates and direction navigation.
4. **Community Events (`/community`):**
   - Upcoming cleanup drives (e.g. Navsari River Cleanup Drive, College Community Cleanliness) with participant count, registration buttons, and impact points.
5. **Profile & Settings (`/profile`):**
   - Citizen avatar, impact points card (120 Points, 5 Reports, 3 Events), language toggle (English / Gujarati), notification controls, and portal shortcuts.

### B. Municipal Dashboard (Desktop Operations Deck)
1. **Executive Workspace Theme:**
   - Pure light workspace (`#F8FAFC` / `bg-slate-50`), pure white cards (`#FFFFFF`, `border-slate-200`), dark navy sidebar (`#0F172A`), and official header (`Rakesh Desai • Ward Officer`).
   - Clean light palette across all portals (Citizen, Municipal, and Worker) matching the design mockups with zero dark-mode overrides.
2. **Overview Dashboard (`/admin`):**
   - Top 4 KPI Cards: **Open Reports (124)**, **Unassigned (28)**, **Overdue (16)**, **Resolved This Month (312)**.
   - **Reports Trend Chart:** Smooth SVG line chart comparing Submitted vs. Resolved incident flow with Y-axis scale (0, 100, 200) and exact dates (5 Oct, 10 Oct, 15 Oct).
   - **Category Distribution Chart:** Donut chart with Total **523** center callout and proportional breakdown matching mockup (Garbage Dumping 38%, Overflowing Bin 26%, Street Litter 18%, Drain Waste 11%, Other 7%).
   - **Recent Reports Table:** Real-time table with Complaint ID (`NMC202610120457`), Category, Location, Status pill badges, Priority tags, and dates.
3. **City Map & Hotspots (`/admin/map`):**
   - Geospatial SVG map canvas coupled with a **Hotspots** ranking sidebar (Bus Stand Area, GIDC Area, Market Area, College Road, Lunsikui Area) highlighting unresolved counts and urgency tiers.

---

## 9. Safe Synthetic Demo Mode

S.W.A.C.H. Navsari includes an **isolated, deterministic synthetic dataset** designed specifically for hackathon demonstrations, client walkthroughs, and jury presentations without contaminating real municipal operations.

### Key Guarantees & Isolation Principles
- **Zero Database Pollution:** Synthetic records are never written to, updated, or deleted from real PostgreSQL complaint tables.
- **Explicit Mode Selection:** Evaluators can toggle between **Live Operations** and **Demo Mode (Simulated)** via the sticky header or navigation controls.
- **Prominent Visual Indicators:** Every component displaying simulated information renders an unmissable banner:
  ```
  [DEMO DATA — SIMULATED: Showing synthetic hackathon demonstration data across Navsari's 13 municipal wards. No real civic complaints are modified.]
  ```
- **No Silent Fallbacks:** When running in Live Operations mode, the application displays strictly authentic database records. If a query returns zero records, it displays an honest empty state rather than silently falling back to mock records.
- **13-Ward Plausible Coverage:** Synthetic reports deterministically cover all 13 municipal wards of Navsari (including Dudhia Talav, Lunsikui, Station Road, Junathana, Viraval, and GIDC) with authentic Gujarati localities and simulated GPS coordinates.
- **Privacy Minimization:** No real citizen identities, personal emails, or telephone numbers are contained in the synthetic dataset.

---

## 10. Security Audit & Hardening Report

| Security Surface | Audit Assessment | Implemented Mitigation / Hardening |
| :--- | :--- | :--- |
| **Secrets & Keys** | Verified | Zero private keys or `service_role` secrets exposed. Browser bundle only accesses public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `.env` is ignored by Git; `.env.example` contains placeholders only. |
| **Search Path Security** | Hardened | `generate_complaint_id()` and `set_updated_at()` functions updated with explicit `SET search_path = public` in additive migration `20261025000001_security_hardening.sql`. |
| **Privilege Escalation** | Protected | Public signups automatically receive only the `citizen` role in `public.user_roles`. Elevated roles (`municipal_official`, `sanitation_worker`) can only be assigned by existing municipal officials. |
| **Route Guards & Sessions** | Verified | `<AdminGuard>` and `<WorkerGuard>` verify cryptographic sessions against the database `user_roles` table before rendering protected routes. Session signout clears all client state. |
| **Lifecycle State Machine** | Hardened | Transitions strictly governed by `public.transition_report_status()`. Enforces minimum 5-character rejection reasons and enforces the 72-hour dispute window for citizen complaint reopening. |
| **Worker History Access** | Fixed | Updated `public.is_assigned_worker()` to include `'completed'` assignments, allowing workers to retain read access to their resolved task history without client-side permission workarounds. |
| **Private Object Storage** | Verified | Buckets `report-evidence` and `resolution-evidence` are private (`public = false`). Storage RLS restricts object read/write access to verified report stakeholders. 10MB limit and MIME type validation (`jpeg`, `png`, `webp`) enforced. |
| **Public Complaint Tracking** | Hardened | `public.track_complaint()` returns strictly minimized public fields (no reporter identity, phone, exact coordinates, or private photos). Added high-entropy `tracking_token UUID` column and client-side 500ms lookup throttling to prevent brute-force enumeration. |
| **Data Privacy Policy** | Documented | Added interactive `<PrivacyNoticeModal />` accessible from the footer and reporting wizard detailing camera/location consent, private evidence lifecycle, and retention guidelines. |

---

## 11. Production Deployment & Hosting Setup

### Recommended Architecture
- **Frontend Hosting:** [Vercel](https://vercel.com/) (configured with `vercel.json` SPA routing rewrites and HTTP security headers)
- **Database & Storage:** Supabase managed cloud project (PostgreSQL 15+, RLS, Auth, and Storage)

### Vercel Deployment Configuration (`vercel.json`)
The repository includes a production-ready `vercel.json` providing:
1. **SPA Client Routing:** Rewrites all deep links (`/report`, `/track`, `/my-reports`, `/admin/*`, `/worker`) to `/index.html`.
2. **Security Response Headers:**
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`
   - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...`
3. **Immutable Static Asset Caching:** 1-year cache headers on `/assets/*` bundles.

### Pre-Launch Production Checklist for Project Owner
- [ ] **Supabase Cloud Project:** Create a new project in the desired cloud region (e.g., AWS Mumbai `ap-south-1`).
- [ ] **Apply Migrations:** Run sequential migrations (`01` through `06`) or paste `supabase/combined_migrations.sql` in the Supabase SQL Editor.
- [ ] **Verify Storage Buckets:** Confirm `report-evidence` and `resolution-evidence` exist with `public = false`.
- [ ] **Site & Redirect URLs:** In Supabase Auth &rarr; URL Configuration, add your production Vercel domain (e.g. `https://swach-navsari.vercel.app`) as the Site URL and Redirect URLs.
- [ ] **Environment Variables:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel Project Settings &rarr; Environment Variables.
- [ ] **Initial Municipal Official Provisioning:** Seed or assign the first municipal official user via Supabase SQL:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('<your-admin-user-uuid>', 'municipal_official')
  ON CONFLICT DO NOTHING;
  ```
- [ ] **Database Backup & Recovery:** Enable daily automated backups and point-in-time recovery (PITR) in Supabase project settings.

---

## 12. Verification & Test Suite

| Command | Action | Results |
| :--- | :--- | :--- |
| `npm test` | Run Vitest test suite | **84 of 84 tests passing** across 12 test suites |
| `npm run lint` | Run ESLint across code and configs | **0 errors, 0 warnings** |
| `npm run build` | TypeScript compile (`tsc -b`) & Vite production bundle | **Build successful** (dist bundle generated with 0 errors) |
| `npm run dev` | Launch local Vite development server | Ready for local interaction |

---

## 13. Local Setup & Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Supabase project parameters:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
VITE_APP_NAME="S.W.A.C.H. Navsari"
VITE_MUNICIPALITY_NAME="Navsari Municipal Corporation / Municipality"
VITE_CITY_NAME="Navsari"
VITE_STATE_NAME="Gujarat"
```

### 3. Database Migrations
Execute the migrations in sequential order or apply `supabase/combined_migrations.sql`:
1. `supabase/migrations/20260224000001_initial_schema.sql` (Tables, types, sequences, initial user trigger)
2. `supabase/migrations/20260224000002_lifecycle_and_functions.sql` (Role checks, status transitions, assignment)
3. `supabase/migrations/20260224000003_rls_policies.sql` (100% table RLS policies, tracking function)
4. `supabase/migrations/20260224000004_storage_security.sql` (Private storage buckets, path-based storage RLS)
5. `supabase/migrations/20260224000005_phase2_citizen_reporting.sql` (Location flexibility, initial audit triggers)
6. `supabase/migrations/20261025000001_security_hardening.sql` (search_path hardening, tracking token, 72h reopen rule, worker history access)

---

## 14. License & Civic Tech Attribution

Developed for the citizens and municipal administration of Navsari, Gujarat, India.  
**S.W.A.C.H. Navsari** — *Report. Resolve. Revive.*

