# Library Management System

LibraryMS is a React and TypeScript app backed by Supabase Auth and PostgreSQL. Public visitors can search the catalog; student accounts can see their own loans; administrators can manage the catalog and process circulation.

## Setup

1. In your Supabase project, open **SQL Editor**, paste and run `supabase/migrations/20261009000000_library_init.sql`.
2. Sign up for the first account in the app.
3. In Supabase SQL Editor, promote that account to administrator. Replace the example email with the account you just created:

   ```sql
   update public.user_roles
   set role = 'admin'
   where user_id = (
     select id from auth.users where lower(email) = lower('admin@example.com')
   );
   ```

   New accounts are always students. The first registrant is deliberately **not** granted administrator access automatically.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Replit Secrets. The anon key is intended for browser use; never add a Supabase service-role key to this app.
5. Restart the Library Management System web workflow.

The migration creates 30 sample titles. It uses Row Level Security for all table access; book issue and return actions run through transactional PostgreSQL functions, so two admins cannot issue the last copy at the same time.

## Roles and circulation

- Anyone can read the catalog.
- Authenticated users can read their own profile, role, and loans.
- Administrators can manage catalog records and view members and circulation history.
- Direct client writes to circulation records are blocked. `issue_book` locks the selected title and decrements its available quantity; `return_book` locks the loan, refuses a duplicate return, and restores one available copy.
- Book `quantity` represents copies currently available to issue. Total copies in the dashboard include active loans plus available copies.
- Deleting a title with circulation history is rejected so the loan records remain intact.

## Local checks

- `pnpm --filter @workspace/library-ms run typecheck`
- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm run typecheck`

The Supabase migration runs in the Supabase SQL Editor, not against the separate Replit development database.

### Update Unsplash covers

`supabase/migrations/20261009000001_update_unsplash_book_covers.sql` assigns a distinct, category-matched Unsplash CDN image to each of the 30 catalog records. Run it in the Supabase SQL Editor after those records exist. The transaction checks that all 30 IDs matched and all 30 cover URLs are distinct before committing.
