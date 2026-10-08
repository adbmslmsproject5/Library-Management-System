import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, Menu, X, Search, ArrowUpRight, Library, ClipboardList, ChartNoAxesCombined, BookCopy, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const publicLinks = [{ href: '/', label: 'Home' }, { href: '/books', label: 'Explore catalog' }];
const adminLinks = [{ href: '/admin', label: 'Overview', icon: ChartNoAxesCombined }, { href: '/admin/books', label: 'Catalog', icon: BookCopy }, { href: '/admin/issue', label: 'Circulation', icon: ClipboardList }];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const admin = role === 'admin';
  return <div className="grain min-h-[100dvh] bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link href="/" className="group flex items-center gap-3" data-testid="link-home-brand">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><BookOpen size={20}/></span>
          <span className="leading-none"><span className="block font-serif text-[22px] tracking-tight">The Reading Room</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[.24em] text-muted-foreground">Campus Library</span></span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {publicLinks.map(link => <Link key={link.href} href={link.href} className={`text-[13px] font-semibold transition-colors hover:text-primary ${location === link.href ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}>{link.label}</Link>)}
          {user && <Link href="/my-books" className={`text-[13px] font-semibold transition-colors hover:text-primary ${location === '/my-books' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-my-books">My loans</Link>}
          {admin && <Link href="/admin" className={`text-[13px] font-semibold transition-colors hover:text-primary ${location.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-admin">Staff desk</Link>}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/books" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Search catalog" data-testid="link-search-catalog"><Search size={17}/></Link>
          {user ? <><Link href={admin ? '/admin' : '/my-books'} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-semibold" data-testid="link-account"><UserRound size={15}/>{user.user_metadata.full_name || user.email?.split('@')[0]}</Link><button onClick={() => void signOut()} className="rounded-full p-2 text-muted-foreground hover:bg-secondary" aria-label="Sign out" data-testid="button-sign-out"><LogOut size={16}/></button></>
            : <Link href="/login" className="group flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90" data-testid="link-sign-in">Sign in <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></Link>}
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
      {menuOpen && <div className="border-t border-border bg-card px-5 py-4 md:hidden">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1">{publicLinks.map(link => <Link onClick={() => setMenuOpen(false)} key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary" data-testid={`mobile-link-${link.label}`}>{link.label}</Link>)}{user && <Link onClick={() => setMenuOpen(false)} href="/my-books" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary" data-testid="mobile-link-my-books">My loans</Link>}{admin && adminLinks.map(link => <Link onClick={() => setMenuOpen(false)} key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary" data-testid={`mobile-link-${link.label}`}>{link.label}</Link>)}{user ? <button onClick={() => { void signOut(); setMenuOpen(false); }} className="px-3 py-3 text-left text-sm font-semibold text-destructive" data-testid="mobile-button-sign-out">Sign out</button> : <Link onClick={() => setMenuOpen(false)} href="/login" className="rounded-lg px-3 py-3 text-sm font-semibold text-primary" data-testid="mobile-link-sign-in">Sign in</Link>}</div>
      </div>}
    </header>
    {admin && <div className="hidden border-b border-border bg-card md:block"><div className="mx-auto flex max-w-[1440px] items-center gap-1 px-10 py-2">{adminLinks.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${location === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`admin-tab-${label.toLowerCase().replaceAll(' ','-')}`}><Icon size={14}/>{label}</Link>)}</div></div>}
    <main className="min-h-[calc(100dvh-72px)]">{children}</main>
    <footer className="border-t border-border bg-card"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-5 py-8 md:flex-row md:items-center md:px-10"><div className="flex items-center gap-3"><Library size={17} className="text-primary"/><span className="font-serif text-lg">The Reading Room</span><span className="hidden text-xs text-muted-foreground sm:inline">A good place to begin.</span></div><div className="flex gap-5 text-xs text-muted-foreground"><Link href="/books" className="hover:text-primary" data-testid="footer-link-catalog">Catalog</Link>{user ? <Link href="/my-books" className="hover:text-primary" data-testid="footer-link-my-books">My loans</Link> : <Link href="/signup" className="hover:text-primary" data-testid="footer-link-join">Become a member</Link>}</div></div></footer>
  </div>;
}
