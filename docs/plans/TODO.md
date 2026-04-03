# TurboLogs - Project TODO + PRD

## Product Summary

TurboLogs is an all-in-one racing garage platform for drag strip and track enthusiasts.  
Users can manage garages and cars, store datalogs/tunes, collaborate with tuners/workers, track run history, and visualize performance trends over time.

## Vision

Build the most practical data and collaboration platform for racers so they can:

- organize car/run/tune data in one place
- collaborate safely with tuners and crew
- improve performance through analytics and predictions

## Core Personas

1. Garage Owner (primary admin)
2. Tuner (external collaborator, full or limited access)
3. Crew/Worker (maintenance + updates)
4. Viewer/Supporter (future social features)

## Primary User Stories

- As a racer, I can create an account and a garage.
- As a garage owner, I can add cars and detailed car data.
- As a garage owner, I can invite tuners/workers and set permissions globally or per-car.
- As a tuner, I can view assigned cars, review datalogs, and upload tunes.
- As a crew member, I can update maintenance and setup changes.
- As a racer, I can upload datalogs and time slip photos.
- As a racer, I can view visualizations and trend analysis from my runs.
- As a racer, I can get basic predictions based on weather + prior runs + tune history.

## Scope (Phased)

### Phase 1 - MVP (must ship first)

- Auth + account onboarding + garage creation
- Garage and car management
- Role-based permissions and invites
- File storage for datalogs and tunes (S3)
- Manual run entry + maintenance/setup entry
- Basic weather capture and linking to runs
- Baseline charts + run history dashboards

### Phase 2 - Smart Data Features

- Time slip image ingestion (computer vision/OCR extraction)
- Datalog parsing pipeline (auto-extract sensor metrics from uploads)
- Run prediction recommendations
- Tune-to-result correlation insights

### Phase 3 - Community Features

- Forums / Q&A
- Marketplace (parts/cars listings)
- Social profile + badges/awards/leaderboards

## Functional Requirements

### 1) Authentication & Accounts

- Email/password + social auth using Better Auth
- Secure session handling
- Profile management
- Garage owner auto-created during onboarding

### 2) Garage Management

- Create/edit garage details
- Garage stats (e.g., fastest 1/4 mile, best trap MPH)
- Multi-user membership model
- Invite flow via email or share link

### 3) Car Management

- Add/edit cars under a garage
- Car profile fields (year/make/model/engine/trans/tire/weight/etc.)
- Car-level access controls (all cars vs specific cars)
- Assign tuner(s) and worker(s) per car

### 4) Roles & Permissions

- Owner: full control
- Admin/Manager: high-level management (optional in MVP)
- Tuner: view datalogs/tunes + upload tunes + add tuning notes
- Worker: maintenance + setup updates
- Viewer: read-only (future)
- Fine-grained policies:
  - Garage-level permissions
  - Car-level overrides
  - File-level visibility where needed

### 5) Data Capture (Manual + Automated)

- Manual run details:
  - 60ft
  - 330ft (optional)
  - 1/8 ET + MPH (optional)
  - 1000ft (optional)
  - 1/4 ET + MPH
  - date/time + track/event metadata
- Engine run tracking:
  - total passes
  - run hours (if available)
  - engine refresh/rebuild history
- Maintenance logs:
  - oil changes
  - service intervals
  - notes/tasks
- Suspension/setup logs:
  - bar angle
  - shock settings
  - tire pressure
  - launch settings and notes
- Weather data linked to each run:
  - temperature
  - humidity
  - barometric pressure
  - DA (density altitude)
  - wind (optional)

### 6) File Storage (S3)

- Upload datalogs and tune files
- Metadata tagging:
  - file type
  - car
  - run/date
  - uploader
  - tune version
- Secure signed URL upload/download
- Retention and lifecycle policy
- Audit log for file uploads/replacements/deletes

### 7) Datalog + Time Slip Intelligence

- Parse known datalog formats after upload
- Extract key sensor metrics into normalized run records
- OCR/computer vision to parse photo of time slip
- Confidence scoring + manual review before save

### 8) Analytics & Visualization

- Car performance dashboard
- Trend lines by weather, tune, and setup changes
- Run comparison (best pass vs selected pass)
- Maintenance impact overlays
- Export views for sharing with tuners/crew

### 9) Predictions (AI-Assisted)

- Predict likely ET/MPH from weather + previous similar setups
- Explain prediction factors (interpretable output)
- "What changed?" summary between runs
- AI notes assistant (optional) for tune/run review

## Non-Functional Requirements

- Secure multi-tenant data isolation per garage
- Fast dashboard response for common queries
- Reliable uploads for large datalog files
- Observability: logs, metrics, alerts
- Auditable history of key changes
- Mobile-friendly UI for track-side usage

## Tech Stack (Confirmed)

- Frontend: TanStack Start, React, React Query, Zod
- Backend/DB: Convex
- Auth: Better Auth
- UI: shadcn/ui + charting components
- Storage: AWS S3 (signed URL flow)
- AI: AI SDK (optional for predictions + assistants)

## Suggested Architecture

- TanStack Start routes + server functions for app-level flows
- Convex for core domain data, real-time updates, and permissions logic
- Better Auth for authentication/session management
- S3 for binary file storage; Convex stores metadata references
- Background processing worker(s) for datalog parsing and OCR pipelines
- Analytics layer generated from normalized run + weather + tune data

## Draft Domain Model (Convex-first)

- users
- garages
- garageMembers
- cars
- carAssignments (member to car with role)
- runs
- weatherSnapshots
- maintenanceLogs
- suspensionSetupLogs
- datalogFiles
- tuneFiles
- parsedDatalogMetrics
- timeSlipExtractions
- predictions
- auditEvents

## Delivery Checklist (Detailed TODO)

### A) Product & Planning

- [ ] Finalize MVP feature boundaries and define explicit "not in MVP"
- [ ] Write acceptance criteria for each MVP epic
- [ ] Define data retention and privacy policy
- [ ] Define role permission matrix (garage vs car scope)
- [ ] Create initial UX flows (onboarding, upload, assign tuner, run detail)

### B) Project Setup

- [ ] Initialize app structure for TanStack Start + Convex integration
- [ ] Configure Better Auth
- [ ] Set up shared Zod schemas for client/server validation
- [ ] Add shadcn/ui primitives and chart foundations
- [ ] Configure environment management for local/dev/prod

### C) Auth + Multi-Tenancy

- [ ] Implement sign-up/sign-in/sign-out
- [ ] Auto-create garage for first-time owner
- [ ] Implement membership invites + acceptance flow
- [ ] Implement role-based authorization checks
- [ ] Add per-car access restrictions

### D) Garage + Car Core

- [ ] Garage CRUD + stats cards
- [ ] Car CRUD + profile details
- [ ] Assign members to all cars or selected cars
- [ ] Car archive/deactivate behavior

### E) Runs, Maintenance, Setup

- [ ] Build run entry forms with validation
- [ ] Build maintenance and suspension setup logs
- [ ] Link runs to weather snapshots
- [ ] Build timeline view per car

### F) File Storage & Collaboration

- [ ] Provision S3 bucket(s) and IAM strategy
- [ ] Implement signed upload/download endpoints
- [ ] Store file metadata in Convex
- [ ] Build datalog and tune library UI per car
- [ ] Tune versioning + notes workflow

### G) Data Processing

- [ ] Define supported datalog formats for v1
- [ ] Build parser pipeline for uploaded datalogs
- [ ] Normalize extracted sensor metrics
- [ ] Build time slip OCR prototype (upload image -> extracted fields)
- [ ] Add human review/edit before final save

### H) Visualization + Insights

- [ ] Build per-car performance dashboard
- [ ] Add ET/MPH trend charts with filters
- [ ] Add weather-adjusted comparison views
- [ ] Add tune-to-result correlation views
- [ ] Add baseline prediction service (phase-gated)

### I) Quality, Security, and Ops

- [ ] Add test plan (unit + integration + critical e2e)
- [ ] Add audit logging for sensitive actions
- [ ] Add rate limiting and abuse protections
- [ ] Add monitoring and alerting
- [ ] Prepare backup/recovery strategy

### J) Launch Readiness

- [ ] Internal alpha with sample garages/cars/data
- [ ] Closed beta with real racers and tuners
- [ ] Feedback triage and iteration pass
- [ ] Production checklist and release runbook
- [ ] Post-launch KPI review cadence

## MVP Acceptance Criteria (High-Level)

- A new user can sign up and create a garage in under 3 minutes.
- Owner can add at least one car and invite at least one tuner.
- Tuner can access assigned car(s), view datalogs, and upload tune files.
- Owner/worker can log runs, maintenance, and suspension changes.
- Dashboard can visualize historical run performance with weather context.
- All sensitive operations enforce role and scope permissions.

## KPIs / Success Metrics

- Activation: % of new users who create garage + first car
- Collaboration: % of garages with invited members
- Data depth: average runs per car per month
- Engagement: weekly active garages
- Insight value: % of users viewing analytics weekly
- Retention: month-1 and month-3 returning garages

## Open Questions / Decisions Needed

- Which specific ECU/datalog formats are in MVP?
- Will weather come from a third-party API or manual-first?
- Do we need paid tiers at launch (storage + advanced analytics)?
- Should tuner uploads require owner approval before "active tune" status?
- What are legal/compliance considerations for marketplace + social phases?
