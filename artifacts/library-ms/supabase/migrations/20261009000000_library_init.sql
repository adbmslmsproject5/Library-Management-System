-- Library Management System schema for Supabase PostgreSQL.
-- All authorization is enforced by RLS and security-definer circulation RPCs.

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category text not null,
  quantity integer not null default 1 check (quantity >= 0),
  isbn text not null unique,
  description text,
  cover_url text,
  created_at timestamptz not null default now()
);

comment on column public.books.quantity is
  'Copies currently available to issue. The issue and return functions decrement and increment this value transactionally.';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'student'))
);

create table if not exists public.issued_books (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null
    constraint issued_books_book_id_fkey references public.books(id) on delete restrict,
  user_id uuid not null
    constraint issued_books_user_id_fkey references public.profiles(id) on delete cascade,
  issue_date timestamptz not null default now(),
  due_date timestamptz not null default (now() + interval '14 days'),
  return_date timestamptz,
  status text not null default 'issued' check (status in ('issued', 'returned'))
);

create index if not exists issued_books_user_status_idx
  on public.issued_books (user_id, status, due_date);
create index if not exists issued_books_book_status_idx
  on public.issued_books (book_id, status);
create index if not exists books_category_title_idx
  on public.books (category, title);

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = p_user_id and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Library Member'),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  -- New signups are always students. An administrator must promote the first
  -- administrator explicitly from the Supabase SQL editor.
  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.books enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.issued_books enable row level security;

drop policy if exists "Anyone can view books" on public.books;
create policy "Anyone can view books"
  on public.books for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books"
  on public.books for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books"
  on public.books for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books"
  on public.books for delete
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can view own profile or admins view all" on public.profiles;
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own role or admins read all" on public.user_roles;
create policy "Users can read own role or admins read all"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can view own loans or admins view all" on public.issued_books;
create policy "Users can view own loans or admins view all"
  on public.issued_books for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Clients cannot directly create, edit, or delete circulation rows. These
-- security-definer functions validate admin access and serialize copy checks.
create or replace function public.issue_book(p_book_id uuid, p_user_id uuid)
returns setof public.issued_books
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quantity integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select quantity into v_quantity
  from public.books
  where id = p_book_id
  for update;

  if not found then
    raise exception 'Book not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = 'student'
  ) then
    raise exception 'Select an active student account' using errcode = '22023';
  end if;

  if v_quantity <= 0 then
    raise exception 'No available copies of this book' using errcode = '22023';
  end if;

  update public.books
  set quantity = quantity - 1
  where id = p_book_id;

  return query
    insert into public.issued_books (book_id, user_id)
    values (p_book_id, p_user_id)
    returning *;
end;
$$;

create or replace function public.return_book(p_issue_id uuid)
returns setof public.issued_books
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_issue public.issued_books;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into v_issue
  from public.issued_books
  where id = p_issue_id
  for update;

  if not found then
    raise exception 'Loan not found' using errcode = 'P0002';
  end if;
  if v_issue.status = 'returned' then
    raise exception 'This book has already been returned' using errcode = '22023';
  end if;

  update public.books
  set quantity = quantity + 1
  where id = v_issue.book_id;

  return query
    update public.issued_books
    set status = 'returned', return_date = now()
    where id = p_issue_id
    returning *;
end;
$$;

revoke all on function public.issue_book(uuid, uuid) from public;
revoke all on function public.return_book(uuid) from public;
grant execute on function public.issue_book(uuid, uuid) to authenticated;
grant execute on function public.return_book(uuid) to authenticated;

grant select on public.books to anon, authenticated;
grant insert, update, delete on public.books to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.issued_books to authenticated;

insert into public.books (title, author, category, quantity, isbn, description, cover_url)
values
  ('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Programming', 5, '9780132350884', 'A practical guide to writing readable, maintainable software.', 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg'),
  ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 'Programming', 4, '9780201616224', 'Timeless techniques for working effectively as a software developer.', 'https://covers.openlibrary.org/b/isbn/9780201616224-M.jpg'),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 'Web Development', 3, '9780596517748', 'A focused look at the reliable, expressive parts of JavaScript.', 'https://covers.openlibrary.org/b/isbn/9780596517748-M.jpg'),
  ('Learning React', 'Alex Banks, Eve Porcello', 'Web Development', 6, '9781491954621', 'Modern patterns for building interactive React applications.', 'https://covers.openlibrary.org/b/isbn/9781491954621-M.jpg'),
  ('Database System Concepts', 'Abraham Silberschatz, Henry Korth, S. Sudarshan', 'Database', 4, '9780073523323', 'Core ideas behind database design, transactions, and query systems.', 'https://covers.openlibrary.org/b/isbn/9780073523323-M.jpg'),
  ('Designing Data-Intensive Applications', 'Martin Kleppmann', 'Database', 5, '9781449373320', 'An in-depth guide to reliable, scalable data systems.', 'https://covers.openlibrary.org/b/isbn/9781449373320-M.jpg'),
  ('Computer Networking: A Top-Down Approach', 'James Kurose, Keith Ross', 'Networking', 3, '9780133594140', 'A layered introduction to modern computer networks and protocols.', 'https://covers.openlibrary.org/b/isbn/9780133594140-M.jpg'),
  ('Network Security Essentials', 'William Stallings', 'Networking', 2, '9780134523699', 'Foundations of network security, cryptography, and secure protocols.', 'https://covers.openlibrary.org/b/isbn/9780134523699-M.jpg'),
  ('Operating System Concepts', 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', 'Operating Systems', 5, '9781118063330', 'Processes, memory, file systems, and other operating-system foundations.', 'https://covers.openlibrary.org/b/isbn/9781118063330-M.jpg'),
  ('Modern Operating Systems', 'Andrew S. Tanenbaum', 'Operating Systems', 3, '9780133591620', 'A broad survey of operating-system design and implementation.', 'https://covers.openlibrary.org/b/isbn/9780133591620-M.jpg'),
  ('Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', 'Artificial Intelligence', 4, '9780134610993', 'A comprehensive textbook on AI methods, learning, and applications.', 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg'),
  ('Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 'Artificial Intelligence', 3, '9780262035613', 'The mathematical foundations and architectures behind deep learning.', 'https://covers.openlibrary.org/b/isbn/9780262035613-M.jpg'),
  ('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald Rivest, Clifford Stein', 'Algorithms', 7, '9780262033848', 'A thorough reference for algorithms, data structures, and analysis.', 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg'),
  ('Data Structures and Algorithms in Java', 'Robert Lafore', 'Algorithms', 4, '9780672324536', 'Visual explanations and Java examples for essential data structures.', 'https://covers.openlibrary.org/b/isbn/9780672324536-M.jpg'),
  ('HTML and CSS: Design and Build Websites', 'Jon Duckett', 'Web Development', 5, '9781118871645', 'A visual introduction to building and styling web pages.', 'https://covers.openlibrary.org/b/isbn/9781118871645-M.jpg'),
  ('You Don''t Know JS Yet: Get Started', 'Kyle Simpson', 'Web Development', 4, '9781660144150', 'A careful exploration of JavaScript scope, values, and types.', 'https://covers.openlibrary.org/b/isbn/9781660144150-M.jpg'),
  ('Calculus: Early Transcendentals', 'James Stewart', 'Mathematics', 5, '9781285741550', 'A clear introduction to differential and integral calculus.', 'https://covers.openlibrary.org/b/isbn/9781285741550-M.jpg'),
  ('Linear Algebra and Its Applications', 'David C. Lay', 'Mathematics', 4, '9780321982384', 'Linear algebra concepts with applications to science and computing.', 'https://covers.openlibrary.org/b/isbn/9780321982384-M.jpg'),
  ('Fundamentals of Physics', 'David Halliday, Robert Resnick, Jearl Walker', 'Physics', 4, '9781118230718', 'A wide-ranging introduction to classical and modern physics.', 'https://covers.openlibrary.org/b/isbn/9781118230718-M.jpg'),
  ('Concepts of Physics', 'H. C. Verma', 'Physics', 8, '9788177091877', 'Concept-driven physics explanations and problem-solving practice.', 'https://covers.openlibrary.org/b/isbn/9788177091877-M.jpg'),
  ('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 3, '9780061120084', 'A classic story about justice, empathy, and growing up.', 'https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg'),
  ('1984', 'George Orwell', 'Fiction', 5, '9780451524935', 'A dystopian novel about surveillance, truth, and individual freedom.', 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg'),
  ('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 4, '9780743273565', 'A portrait of ambition and longing in the Jazz Age.', 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg'),
  ('Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', 'Programming', 5, '9780596007126', 'An approachable visual guide to reusable object-oriented patterns.', 'https://covers.openlibrary.org/b/isbn/9780596007126-M.jpg'),
  ('Python Crash Course', 'Eric Matthes', 'Programming', 6, '9781593279288', 'A hands-on introduction to Python, projects, and practical coding.', 'https://covers.openlibrary.org/b/isbn/9781593279288-M.jpg'),
  ('SQL in 10 Minutes, Sams Teach Yourself', 'Ben Forta', 'Database', 5, '9780135182796', 'Short lessons covering SQL queries, joins, and data updates.', 'https://covers.openlibrary.org/b/isbn/9780135182796-M.jpg'),
  ('Zero to One', 'Peter Thiel, Blake Masters', 'Business', 4, '9780804139298', 'Notes on innovation, startups, and building something new.', 'https://covers.openlibrary.org/b/isbn/9780804139298-M.jpg'),
  ('The Algorithm Design Manual', 'Steven S. Skiena', 'Algorithms', 3, '9781848000698', 'Practical algorithm design with real-world problem-solving examples.', 'https://covers.openlibrary.org/b/isbn/9781848000698-M.jpg'),
  ('Machine Learning Yearning', 'Andrew Ng', 'Artificial Intelligence', 5, '9780999231203', 'A strategy guide for building and improving machine-learning systems.', 'https://covers.openlibrary.org/b/isbn/9780999231203-M.jpg'),
  ('Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', 'Mathematics', 4, '9781259676512', 'Logic, proofs, graph theory, and other discrete mathematics essentials.', 'https://covers.openlibrary.org/b/isbn/9781259676512-M.jpg')
on conflict (isbn) do nothing;
