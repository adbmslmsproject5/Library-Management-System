import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetBookQueryKey, getGetDashboardQueryKey, getListBooksQueryKey, useCreateBook, useDeleteBook, useGetBook, useListBooks, useUpdateBook } from '@workspace/api-client-react';
import type { BookInput } from '@workspace/api-client-react';
import { AdminGate } from '@/components/admin-gate';
import { BookCover } from '@/components/book-card';
import { Button, EmptyState, ErrorState, Field, LoadingBlock, PageHeader, StatusPill } from '@/components/ui';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

type Draft = { title: string; author: string; category: string; quantity: string; isbn: string; description: string; cover_url: string };
const blank: Draft = { title: '', author: '', category: '', quantity: '1', isbn: '', description: '', cover_url: '' };
function BookEditor({ editId, close }: { editId: string | null; close: () => void }) {
  const client = useQueryClient();
  const detail = useGetBook(editId || '', { query: { enabled: !!editId, queryKey: getGetBookQueryKey(editId || '') } });
  const create = useCreateBook();
  const update = useUpdateBook();
  const [draft, setDraft] = useState<Draft>(blank);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (editId && detail.data) setDraft({ title: detail.data.title, author: detail.data.author, category: detail.data.category, quantity: String(detail.data.quantity), isbn: detail.data.isbn, description: detail.data.description || '', cover_url: detail.data.cover_url || '' });
    if (!editId) setDraft(blank);
  }, [editId, detail.data]);
  const pending = create.isPending || update.isPending;
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body: BookInput = { title: draft.title.trim(), author: draft.author.trim(), category: draft.category.trim(), quantity: Number(draft.quantity), isbn: draft.isbn.trim(), description: draft.description.trim() || null, cover_url: draft.cover_url.trim() || null };
    try {
      if (editId) await update.mutateAsync({ id: editId, data: body });
      else await create.mutateAsync({ data: body });
      await Promise.all([client.invalidateQueries({ queryKey: getListBooksQueryKey() }), client.invalidateQueries({ queryKey: getGetDashboardQueryKey() })]);
      close();
    } catch (err) { setMessage(err instanceof Error ? err.message : 'The book could not be saved.'); }
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10233a]/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="book-form-title" data-testid="dialog-book-editor"><div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-7">
    <div className="mb-6 flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary">{editId ? 'Update the catalog' : 'Grow the collection'}</p><h2 id="book-form-title" className="mt-2 font-serif text-3xl">{editId ? 'Edit book details' : 'Add a title'}</h2></div><button onClick={close} className="rounded-full p-2 text-muted-foreground hover:bg-secondary" aria-label="Close editor" data-testid="button-close-book-editor"><X size={17}/></button></div>
    {editId && detail.isLoading ? <div className="space-y-3"><div className="h-11 rounded-lg skeleton"/><div className="h-11 rounded-lg skeleton"/><div className="h-11 rounded-lg skeleton"/></div> : <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <Field label="Title" required value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} placeholder="A book title" className="sm:col-span-2" data-testid="input-book-title"/>
      <Field label="Author" required value={draft.author} onChange={e => setDraft({...draft,author:e.target.value})} placeholder="Author name" data-testid="input-book-author"/>
      <Field label="Subject / category" required value={draft.category} onChange={e => setDraft({...draft,category:e.target.value})} placeholder="e.g. History" data-testid="input-book-category"/>
      <Field label="ISBN" required value={draft.isbn} onChange={e => setDraft({...draft,isbn:e.target.value})} placeholder="ISBN" data-testid="input-book-isbn"/>
      <Field label="Available copies" type="number" min="0" required value={draft.quantity} onChange={e => setDraft({...draft,quantity:e.target.value})} data-testid="input-book-quantity"/>
      <Field label="Cover image URL" type="url" value={draft.cover_url} onChange={e => setDraft({...draft,cover_url:e.target.value})} placeholder="https://…" className="sm:col-span-2" data-testid="input-book-cover"/>
      <label className="block sm:col-span-2"><span className="mb-2 block text-xs font-semibold">Description</span><textarea value={draft.description} onChange={e => setDraft({...draft,description:e.target.value})} rows={3} placeholder="A short description for readers" className="w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-book-description"/></label>
      {message && <p role="alert" className="text-xs text-destructive sm:col-span-2" data-testid="status-book-save-error">{message}</p>}
      <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={close} data-testid="button-cancel-book">Cancel</Button><Button disabled={pending || (editId !== null && detail.isLoading)} type="submit" data-testid="button-save-book">{pending ? 'Saving…' : <><Check size={15}/>{editId ? 'Save changes' : 'Add to catalog'}</>}</Button></div>
    </form>}
  </div></div>;
}

function CatalogAdminContent() {
  const client = useQueryClient();
  const books = useListBooks(undefined, { query: { queryKey: getListBooksQueryKey() } });
  const remove = useDeleteBook();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const rows = (books.data || []).filter(book => `${book.title} ${book.author} ${book.category} ${book.isbn}`.toLowerCase().includes(search.toLowerCase()));
  const deleteRecord = async (id: string, title: string) => {
    if (!window.confirm(`Remove “${title}” from the catalog?`)) return;
    setFeedback('');
    try { await remove.mutateAsync({ id }); await Promise.all([client.invalidateQueries({ queryKey: getListBooksQueryKey() }), client.invalidateQueries({ queryKey: getGetDashboardQueryKey() })]); }
    catch (err) { setFeedback(err instanceof Error ? err.message : 'Could not remove this title.'); }
  };
  return <div className="page-enter mx-auto max-w-[1440px] px-5 py-11 md:px-10 md:py-14"><PageHeader eyebrow="Staff desk / catalog" title="Care for the collection" description="Add titles, keep book details accurate, and see the copy count at a glance." action={<Button onClick={() => setCreating(true)} data-testid="button-add-book"><Plus size={16}/> Add a title</Button>}/>
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><label className="relative block w-full max-w-md"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author or ISBN" className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-primary" aria-label="Search catalog management" data-testid="input-admin-catalog-search"/></label><p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{books.isLoading ? 'Loading titles' : `${rows.length} titles shown`}</p></div>
    {feedback && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="status-admin-catalog-error">{feedback}</div>}
    {books.isLoading ? <LoadingBlock label="Loading catalog management"/> : books.isError ? <ErrorState message="The catalog could not be loaded." retry={() => void books.refetch()}/> : rows.length === 0 ? <EmptyState title={search ? 'No matching titles.' : 'The catalog is ready to grow.'} description={search ? 'Try a different title, author or ISBN.' : 'Add the first title to make it available to readers.'} action={!search && <Button onClick={() => setCreating(true)} data-testid="button-add-first-book"><Plus size={15}/> Add a title</Button>}/> : <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[minmax(230px,1.8fr)_1fr_.65fr_.6fr_120px] gap-4 bg-secondary/65 px-5 py-3 font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground md:grid"><span>Title</span><span>Subject</span><span>ISBN</span><span>Available</span><span className="text-right">Actions</span></div>
      {rows.map((book,index)=><div key={book.id} className="grid gap-3 border-b border-border px-4 py-4 last:border-0 md:grid-cols-[minmax(230px,1.8fr)_1fr_.65fr_.6fr_120px] md:items-center md:gap-4 md:px-5" data-testid={`row-admin-book-${book.id}`}>
        <div className="flex min-w-0 items-center gap-3"><BookCover book={book} index={index} compact/><div className="min-w-0"><p className="truncate font-serif text-xl">{book.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{book.author}</p></div></div><div className="flex items-center justify-between md:block"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground md:hidden">Subject</span><span className="text-xs">{book.category}</span></div><div className="flex items-center justify-between md:block"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground md:hidden">ISBN</span><span className="font-mono text-[10px] text-muted-foreground">{book.isbn}</span></div><div className="flex items-center justify-between md:block"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground md:hidden">Available</span><StatusPill tone={book.quantity ? 'good' : 'bad'}>{book.quantity} available</StatusPill></div>
        <div className="flex justify-end gap-1 border-t border-border pt-2 md:border-0 md:pt-0"><Button variant="quiet" className="min-h-9 px-3" onClick={() => setEditId(book.id)} aria-label={`Edit ${book.title}`} data-testid={`button-edit-book-${book.id}`}><Pencil size={14}/><span className="md:hidden">Edit</span></Button><Button variant="quiet" className="min-h-9 px-3 text-destructive hover:text-destructive" disabled={remove.isPending} onClick={() => void deleteRecord(book.id,book.title)} aria-label={`Delete ${book.title}`} data-testid={`button-delete-book-${book.id}`}><Trash2 size={14}/><span className="md:hidden">Remove</span></Button></div>
      </div>)}
    </div>}
    {(creating || editId) && <BookEditor editId={editId} close={() => { setCreating(false); setEditId(null); }}/>}
  </div>;
}
export default function AdminBooksPage() { return <AdminGate><CatalogAdminContent/></AdminGate>; }
