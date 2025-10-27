# Pool Bud – Roles, Permissions, and Onboarding Model

## Roles we support
We have 5 internal roles and 1 external surface:

- platform_admin
  - Used ONLY by Pool Bud staff (internal integrator / onboarding specialist).
  - Can create new companies and seed their first owner.
  - Can view companies for support.
  - NOT the legal/billing owner. Should NOT be billed as that company. May not control payouts.

- owner
  - The actual business owner for that specific pool company.
  - Can manage company billing/Stripe payouts, edit company settings, invite/remove anyone (admin/dispatcher/tech).
  - Can manage subscription.
  - Only one true “primary owner” per company.

- admin
  - Day-to-day operations manager.
  - Can do almost everything except billing/Stripe/subscription and cannot delete the company.
  - Can invite/remove dispatchers and techs.

- dispatcher
  - Office/scheduler/customer service.
  - Can create jobs, edit jobs, assign techs, reschedule work, update customer info, mark jobs complete.
  - Cannot change billing/subscription.
  - Cannot invite/remove other users.

- tech
  - Field worker.
  - Sees assigned jobs.
  - Logs chemicals, photos, notes.
  - Marks job complete.
  - Cannot change schedule globally, cannot manage users, cannot see billing.

- customer (external portal user, not in profiles)
  - Can view visit history, before/after photos, chemistry logs, invoices.
  - Can pay outstanding invoices.
  - Cannot see internal notes or other customers.
  - Surface: `/customer/:customerId`.

## Database shape related to roles

Table: `companies`
- `id uuid primary key`
- `name text`
- `stripe_account_id text`
- etc.

Table: `profiles`
- `id uuid primary key references auth.users`
- `company_id uuid references companies(id)`
- `role text check (role in ('platform_admin', 'owner', 'admin', 'dispatcher', 'tech'))`
- `created_at timestamptz default now()`

Notes:
- `platform_admin` can have `company_id = NULL` (they’re Pool Bud staff, not tied to one specific company).
- Everyone else MUST have a `company_id`.

Customers are NOT in `profiles`. They live in `customers` and access the public portal.

## Access / permissions summary

- Owner:
  - Can do billing (Stripe payout setup, subscription plan)
  - Can invite/remove Admin, Dispatcher, Tech
  - Sees business-wide reporting and invoices
  - Owns the account legally

- Admin:
  - Can manage schedules, jobs, techs, customers
  - Can invite/remove Dispatcher and Tech
  - Cannot change billing/Stripe/subscription
  - Cannot delete the entire company

- Dispatcher:
  - Can create/edit jobs
  - Can assign techs
  - Can reschedule work
  - Can talk to customers
  - Cannot invite/remove users
  - Cannot access payouts/billing

- Tech:
  - Can view and close their assigned jobs
  - Can upload before/after photos
  - Can fill chemical logs
  - Cannot invite/remove users
  - Cannot access company settings / billing

- Platform_admin:
  - Can create a new company
  - Can create the first Owner for that company
  - Can seed initial data
  - Cannot act as the company’s Owner for billing/payout

- Customer:
  - Only sees their own portal: service history, chemistry data, photos, invoices, “pay now”
  - Not in internal dashboard

## Onboarding flow we support

We support a white-glove onboarding flow run by a Pool Bud internal integrator:

1. `platform_admin` logs in to an internal setup screen (future dashboard).
2. They create a new `companies` row.
3. They also create the first user for that company:
   - Insert user in `auth.users` (Supabase).
   - Add a `profiles` row for that user:
     - `role = 'owner'`
     - `company_id = <that company>`
4. That owner gets an invite email, sets password, and logs in.

Result:
- Every company always has an Owner.
- Owner is the only one allowed to connect Stripe and handle payouts.
- Admins/Dispatchers/Techs get invited later by the Owner (or Admin).

Self-serve signup (later):
- If someone signs up through pricing directly:
  - We create a new `companies` row.
  - We create a `profiles` row that makes that first user `owner` of that new company.

## UI direction

- Public marketing site:
  - `/` (Landing w/ hero, testimonials, etc)
  - `/features`
  - `/services`
  - `/pricing`
  - `/about`
  - `/login`

- Internal dashboard for staff:
  - `/app` is protected.
  - Long-term we will branch dashboards by role:
    - Owner/Admin: full ops + billing settings
    - Dispatcher: schedule and job board
    - Tech: “My Jobs Today”, mobile-first
  - Customer Portal stays public at `/customer/:customerId`.

## Non-negotiables:
- Only `owner` can manage Stripe payout / subscription.
- Only `platform_admin` (Pool Bud staff) can create a new company and assign its first owner.
- Dispatcher cannot delete users.
- Tech cannot see company-wide schedule by default.
