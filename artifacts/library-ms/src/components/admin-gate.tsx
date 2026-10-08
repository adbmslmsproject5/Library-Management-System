import { Link } from 'wouter';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10"><div className="h-10 w-64 rounded-lg skeleton"/><div className="mt-7 h-56 rounded-2xl skeleton"/></div>;
  if (!user) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><ShieldAlert className="mx-auto text-primary" size={28}/><h1 className="mt-5 font-serif text-4xl">Staff sign-in required</h1><p className="mt-3 text-sm text-muted-foreground">Sign in with an account that has library staff access to continue.</p><Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-admin-signin">Sign in <ArrowRight size={15}/></Link></div>;
  if (role !== 'admin') return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><ShieldAlert className="mx-auto text-primary" size={28}/><h1 className="mt-5 font-serif text-4xl">This desk is for library staff</h1><p className="mt-3 text-sm text-muted-foreground">Your account is signed in, but it doesn’t have staff permissions.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold" data-testid="link-admin-home">Return to the library <ArrowRight size={15}/></Link></div>;
  return <>{children}</>;
}
