import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';

function AuthFrame({ children, title, description, mode }: { children: React.ReactNode; title: string; description: string; mode: 'login' | 'signup' }) {
  return <div className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1440px] md:grid-cols-[.95fr_1.05fr]">
    <div className="relative hidden overflow-hidden bg-sidebar px-12 py-16 text-sidebar-foreground md:flex md:flex-col md:justify-between lg:px-16"><div className="absolute -right-36 -top-16 h-[470px] w-[470px] rounded-full border border-white/10"/><div className="absolute -right-20 top-16 h-[340px] w-[340px] rounded-full border border-white/10"/><Link href="/" className="relative inline-flex items-center gap-3 font-serif text-xl" data-testid="auth-brand-link"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><BookOpen size={20}/></span>The Reading Room</Link><div className="relative max-w-lg"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">Your campus, between the covers</p><h1 className="mt-5 font-serif text-6xl leading-[.97] lg:text-[76px]">{mode === 'login' ? <>Come in.<br/><em>Pick up where<br/>you left off.</em></> : <>Make room<br/>for your next<br/><em>big idea.</em></>}</h1><p className="mt-6 max-w-sm text-sm leading-7 text-white/80">A thoughtful collection for curious minds. Your next discovery is closer than you think.</p></div><div className="relative flex items-center justify-between border-t border-white/15 pt-5 font-mono text-[9px] uppercase tracking-[.15em] text-white/65"><span>Campus Library</span><span>01 — Keep exploring</span></div></div>
    <div className="flex items-center justify-center px-5 py-12 md:px-12 lg:px-20"><div className="w-full max-w-[440px] page-enter"><Link href="/" className="mb-9 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary md:hidden" data-testid="auth-mobile-home"><ArrowLeft size={14}/> Back to the library</Link><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">{mode === 'login' ? 'Your desk is waiting' : 'A membership for curious minds'}</p><h2 className="font-serif text-[42px] leading-none">{title}</h2><p className="mt-3 text-sm text-muted-foreground">{description}</p>{children}<p className="mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">{mode === 'login' ? 'New to the Reading Room?' : 'Already have an account?'}{' '}<Link href={mode === 'login' ? '/signup' : '/login'} className="font-bold text-primary hover:underline" data-testid="link-auth-switch">{mode === 'login' ? 'Join the library' : 'Sign in'}</Link></p></div></div>
  </div>;
}

export function LoginPage() {
  const { signIn, error, clearError } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return <AuthFrame mode="login" title="Welcome back." description="Sign in with your campus library account.">
    <form className="mt-8 space-y-5" onSubmit={async e => { e.preventDefault(); clearError(); setPending(true); try { await signIn(email, password); setLocation('/my-books'); } catch { /* error is rendered from auth context */ } finally { setPending(false); } }}>
      <label className="block"><span className="mb-2 block text-xs font-semibold">Campus email</span><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campus.edu" className="h-12 w-full rounded-lg border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-login-email"/></label>
      <label className="block"><span className="mb-2 block text-xs font-semibold">Password</span><span className="relative block"><input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="h-12 w-full rounded-lg border border-input bg-card px-4 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-login-password"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-secondary" aria-label={showPassword ? 'Hide password' : 'Show password'} data-testid="button-toggle-password">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive" data-testid="status-login-error">{error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full" data-testid="button-login-submit">{pending ? 'Signing you in…' : 'Sign in'} {!pending && <ArrowRight size={15}/>}</Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><KeyRound size={12}/> Your account is secured by campus authentication.</p>
    </form>
  </AuthFrame>;
}

export function SignupPage() {
  const { signUp, error, clearError } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return <AuthFrame mode="signup" title="Join the library." description="A few details, and you’re on your way to a bigger reading list.">
    {submitted ? <div className="mt-8 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-5" role="status" data-testid="status-signup-success"><p className="font-serif text-2xl">Check your inbox.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">We’ve sent a confirmation link to <strong className="text-foreground">{email}</strong>. Follow it to activate your account.</p><Link href="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary" data-testid="link-signup-login">Return to sign in <ArrowRight size={14}/></Link></div> : <form className="mt-8 space-y-5" onSubmit={async e => { e.preventDefault(); clearError(); setPending(true); try { await signUp(name, email, password); setSubmitted(true); } catch { /* context surfaces errors */ } finally { setPending(false); } }}>
      <label className="block"><span className="mb-2 block text-xs font-semibold">Full name</span><input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-12 w-full rounded-lg border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-signup-name"/></label>
      <label className="block"><span className="mb-2 block text-xs font-semibold">Campus email</span><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campus.edu" className="h-12 w-full rounded-lg border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-signup-email"/></label>
      <label className="block"><span className="mb-2 block text-xs font-semibold">Create a password</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="h-12 w-full rounded-lg border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" data-testid="input-signup-password"/></label>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive" data-testid="status-signup-error">{error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full" data-testid="button-signup-submit">{pending ? 'Creating your account…' : 'Create account'} {!pending && <ArrowRight size={15}/>}</Button>
      <p className="text-center text-[11px] leading-5 text-muted-foreground">By creating an account, you’ll join the campus library as a member.</p>
    </form>}
  </AuthFrame>;
}
