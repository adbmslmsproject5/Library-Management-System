-- Set one distinct, category-matched Unsplash image for each of the 30
-- current catalog records. Run in the Supabase SQL Editor as a database admin.
begin;

create temporary table library_cover_updates (
  book_id uuid primary key,
  title text not null,
  category text not null,
  cover_url text not null
) on commit drop;

insert into library_cover_updates (book_id, title, category, cover_url)
values
  ('384b561a-9efd-4de7-a4b8-8f955ca13e51', 'Discrete Mathematics and Its Applications', 'Mathematics', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('4c5f2b5a-ef85-4708-9b32-fdab3c883962', '1984', 'Novels', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('1c78f21f-98b2-4994-bd9b-e446ad9af33a', 'The Great Gatsby', 'Novels', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('105dfca9-3d51-41d0-84f5-293713da55a0', 'Head First Design Patterns', 'Programming', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('96830b3a-d079-49db-b5a2-f140261324f6', 'Python Crash Course', 'Programming', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('e76fae53-84ec-4cfb-ab58-6cede190cf76', 'SQL in 10 Minutes', 'Database', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('0b6f2d21-682b-4718-8d7e-53c9e40b3adb', 'Zero to One', 'Novels', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('37853119-47ef-412c-afaa-a177069d91d6', 'The Algorithm Design Manual', 'Data Structures', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('cf4e315b-0644-4585-928e-398890470afc', 'Machine Learning Yearning', 'AI', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('a8c7f298-dd45-4db7-9d7e-c846690c1378', 'JavaScript: The Good Parts', 'Web Development', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('a92718f2-30e7-47fe-b02f-720420f1785e', 'Designing Data-Intensive Applications', 'Database', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('ef0af548-5186-4c1e-ac92-d2e78f59c95c', 'Network Security Essentials', 'Networking', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('ac1ebe71-9446-452b-bb32-463e1c50cbb2', 'Modern Operating Systems', 'Operating System', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('10261987-dc58-4871-b186-7645b31a73c9', 'Deep Learning', 'AI', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('e2c48318-a259-4542-bedd-a3f60bfc439c', 'Data Structures and Algorithms in Java', 'Data Structures', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('43d0b52c-d05a-4c7a-9502-4a7a2666928f', 'HTML and CSS: Design and Build Websites', 'Web Development', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('f1a3cb67-199b-494f-8320-9b12cd3834b2', 'You Don''t Know JS Yet: Get Started', 'Web Development', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('53f72ddf-eb9f-4bfd-9eb8-027176eca051', 'Calculus: Early Transcendentals', 'Mathematics', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('f56f3d9b-7e30-4602-bc7c-f8281cd87d6b', 'Linear Algebra and Its Applications', 'Mathematics', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('9704376d-9729-44bb-847d-f023d073747d', 'Fundamentals of Physics', 'Physics', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('9204820d-3e10-4dff-91df-b785f996a7b4', 'Concepts of Physics (Vol 1 & 2)', 'Physics', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('1dd5cecf-2ad9-43b2-b11d-36767922d051', 'To Kill a Mockingbird', 'Novels', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('26cd99ca-13b6-41b6-8bbc-e0009938ee37', 'The Pragmatic Programmer', 'Programming', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('216cff05-4506-4366-87e7-8689341acc0a', 'Database System Concepts', 'Database', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('dc4c9e46-5faf-4058-8ec4-4e83f29db0db', 'Computer Networking', 'Networking', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('0cf00af7-f01d-4f09-89a4-5c69666caed2', 'Operating System Concepts', 'Operating System', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('ec2b6a60-8021-4330-982f-53daa3b7f942', 'Artificial Intelligence', 'AI', 'https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('eff54a34-4c70-4348-8e7c-20ec939dda22', 'Introduction to Algorithms', 'Data Structures', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('dd6b13b9-6b3a-4d22-8c03-92d1938abfb8', 'Learning React', 'Web Development', 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85'),
  ('cb8059c4-b302-4f3e-8a61-896abeedd010', 'Clean Code', 'Programming', 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&crop=entropy&w=900&h=1200&q=85');

update public.books as b
set cover_url = u.cover_url
from library_cover_updates as u
where b.id = u.book_id;

do $$
declare
  v_matched integer;
  v_distinct_covers integer;
  v_invalid_urls integer;
begin
  select
    count(b.id),
    count(distinct b.cover_url),
    count(*) filter (
      where b.id is null
        or coalesce(b.cover_url, '') not like 'https://images.unsplash.com/photo-%'
    )
  into v_matched, v_distinct_covers, v_invalid_urls
  from library_cover_updates as u
  left join public.books as b on b.id = u.book_id;

  if v_matched <> 30 or v_distinct_covers <> 30 or v_invalid_urls <> 0 then
    raise exception
      'Cover update check failed: matched %, distinct covers %, invalid URLs %; expected 30 of each',
      v_matched, v_distinct_covers, v_invalid_urls;
  end if;
end;
$$;

select
  count(*) as updated_books,
  count(distinct b.cover_url) as distinct_unsplash_covers
from public.books as b
join library_cover_updates as u on u.book_id = b.id;

commit;
