
# The Pool Bud — Supabase Starter (React + Vite + TS)

## Quickstart
1. Copy `.env.example` to `.env` and fill in your Supabase anon key.
2. In Supabase: open **SQL Editor** and run `supabase_schema.sql` to create tables & policies.
3. Create a Storage bucket named `photos` and set it to **public**.
4. Run:
   ```bash
   npm install
   npm run dev
   ```

## Env
See `.env.example`.

## Deploy
- Push to GitHub and connect the repo on Vercel
- Add env vars on Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
