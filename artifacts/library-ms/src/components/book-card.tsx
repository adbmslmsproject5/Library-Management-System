import { BookOpen } from 'lucide-react';
import type { Book } from '@workspace/api-client-react';
import { StatusPill } from '@/components/ui';

const colors = [
  'from-[#243b5a] to-[#56728b]', 'from-[#814f4c] to-[#bc8875]', 'from-[#315b57] to-[#82a28e]',
  'from-[#a08043] to-[#d2b871]', 'from-[#554765] to-[#9180a2]', 'from-[#456783] to-[#a2b7c4]',
];
export function BookCover({ book, index = 0, compact = false }: { book: Pick<Book, 'title' | 'author' | 'cover_url' | 'category'>; index?: number; compact?: boolean }) {
  return <div className={`book-spine relative isolate flex overflow-hidden rounded-md bg-gradient-to-br ${colors[index % colors.length]} ${compact ? 'h-28 w-[76px]' : 'aspect-[.72] w-full'}`}>
    {book.cover_url ? <img src={book.cover_url} alt={`${book.title} cover`} className="absolute inset-0 h-full w-full object-cover"/> : <>
      <span className="absolute inset-y-0 left-[9px] w-px bg-white/20"/><span className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,rgba(255,255,255,.18),transparent_55%)]"/>
      <div className="relative z-10 flex h-full w-full flex-col justify-between px-4 py-5 text-[#fff9e9]"><span className="font-mono text-[8px] uppercase tracking-[.18em] opacity-75">{book.category}</span><div><BookOpen size={15} className="mb-3 opacity-70"/><p className={`font-serif leading-[1.02] ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}>{book.title}</p><p className="mt-3 font-mono text-[8px] uppercase tracking-[.1em] opacity-75">{book.author}</p></div></div>
    </>}
  </div>;
}
export function BookCard({ book, index = 0 }: { book: Book; index?: number }) {
  return <article className="block" data-testid={`card-book-${book.id}`}><div className="relative mb-4"><BookCover book={book} index={index}/><div className="absolute right-3 top-3"><StatusPill tone={book.quantity > 0 ? 'good' : 'bad'}>{book.quantity > 0 ? 'Available' : 'On loan'}</StatusPill></div></div><p className="mb-1 font-mono text-[9px] uppercase tracking-[.16em] text-primary">{book.category}</p><h3 className="line-clamp-1 font-serif text-[21px] leading-tight">{book.title}</h3><p className="mt-1 text-xs text-muted-foreground">{book.author}</p></article>;
}
