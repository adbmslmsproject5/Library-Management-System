import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getListBooksQueryKey, useListBooks } from '@workspace/api-client-react';
import type { ListBooksParams } from '@workspace/api-client-react';
import { BookCard } from '@/components/book-card';
import { Button, ErrorState, LoadingBlock, PageHeader, StatusPill } from '@/components/ui';

const categories = ['All subjects', 'Arts', 'Business', 'History', 'Literature', 'Science', 'Technology'];
export default function BooksPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const params: ListBooksParams = { ...(query.trim() ? { q: query.trim() } : {}), ...(category ? { category } : {}), ...(availableOnly ? { availableOnly: true } : {}) };
  const books = useListBooks(params, { query: { queryKey: getListBooksQueryKey(params) } });
  const data = books.data || [];
  return <div className="page-enter mx-auto max-w-[1440px] px-5 py-11 md:px-10 md:py-16">
    <PageHeader eyebrow="The open shelves" title="Explore the collection" description="Search across subjects and follow your curiosity to something worth reading."/>
    <div className="mb-8 rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center"><label className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles, authors, subjects…" className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" aria-label="Search catalog" data-testid="input-search-books"/>{query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary" aria-label="Clear search" data-testid="button-clear-search"><X size={15}/></button>}</label>
        <div className="flex flex-wrap items-center gap-2"><span className="mr-1 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground"><SlidersHorizontal size={13}/> Subject</span>{categories.map(item => <button key={item} onClick={() => setCategory(item === 'All subjects' || category === item ? '' : item)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${(!category && item === 'All subjects') || category === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`} data-testid={`filter-category-${item.toLowerCase().replaceAll(' ','-')}`}>{item}</button>)}</div>
      </div>
      <button className="mt-4 flex items-center gap-2 text-xs text-muted-foreground" onClick={() => setAvailableOnly(!availableOnly)} aria-pressed={availableOnly} data-testid="toggle-available-only"><span className={`flex h-[18px] w-8 items-center rounded-full p-0.5 transition ${availableOnly ? 'bg-primary' : 'bg-border'}`}><span className={`h-3.5 w-3.5 rounded-full bg-background transition-transform ${availableOnly ? 'translate-x-3.5' : ''}`}/></span>Show available titles only</button>
    </div>
    <div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted-foreground"><strong className="text-foreground" data-testid="text-book-count">{books.isLoading ? '—' : data.length}</strong> titles in this view</p>{(category || query || availableOnly) && <Button variant="quiet" className="min-h-8 px-2 text-xs" onClick={() => { setCategory(''); setQuery(''); setAvailableOnly(false); }} data-testid="button-clear-filters">Clear filters</Button>}</div>
    {books.isLoading ? <LoadingBlock label="Loading the book catalog"/> : books.isError ? <ErrorState message="We couldn’t reach the catalog." retry={() => void books.refetch()}/> : !data.length ? <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-secondary"><Search size={19} className="text-primary"/></div><h2 className="mt-4 font-serif text-2xl">Nothing on this shelf yet</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Try another title, author or subject. There’s always another path to explore.</p><Button variant="outline" className="mt-5" onClick={() => { setQuery(''); setCategory(''); setAvailableOnly(false); }} data-testid="button-reset-search">Reset search</Button></div> : <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-7">{data.map((book, index) => <BookCard key={book.id} book={book} index={index}/>)}</div>}
    <div className="mt-14 flex flex-col items-start justify-between gap-3 rounded-xl bg-secondary/75 p-5 sm:flex-row sm:items-center"><div><p className="font-serif text-xl">Looking for a title we don’t have?</p><p className="mt-1 text-xs text-muted-foreground">Ask a librarian at the campus desk.</p></div><StatusPill tone="neutral">Campus collection</StatusPill></div>
  </div>;
}
