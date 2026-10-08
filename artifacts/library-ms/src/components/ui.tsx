import type { ReactNode } from 'react';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[.22em] text-primary">{eyebrow}</p>}<h1 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-[48px]">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}
export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'quiet' | 'danger' }) {
  const variants = { primary: 'bg-primary text-primary-foreground hover:bg-primary/90', outline: 'border border-border bg-card hover:border-primary hover:text-primary', quiet: 'text-muted-foreground hover:bg-secondary hover:text-foreground', danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' };
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}
export function Field({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-xs font-semibold text-foreground">{label}</span><input className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/20" {...props}/></label>;
}
export function LoadingBlock({ label = 'Loading your library' }: { label?: string }) {
  return <div className="space-y-4" role="status" aria-label={label}><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-28 rounded-xl skeleton"/>)}</div><div className="h-52 rounded-xl skeleton"/></div>;
}
export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-7 text-center"><span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive"><AlertCircle size={19}/></span><h3 className="font-semibold">We couldn’t load this just now</h3><p className="mt-1 text-sm text-muted-foreground">{message || 'Check your connection and try again.'}</p>{retry && <Button variant="outline" className="mt-4" onClick={retry}><RefreshCw size={14}/> Try again</Button>}</div>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><LoaderCircle size={20}/></div><h3 className="font-serif text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const colors = { neutral: 'bg-secondary text-secondary-foreground', good: 'bg-emerald-400/15 text-emerald-200', warn: 'bg-amber-400/15 text-amber-100', bad: 'bg-rose-400/15 text-rose-200' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${colors[tone]}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{children}</span>;
}
