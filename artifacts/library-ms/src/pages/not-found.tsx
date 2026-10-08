import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[70dvh] w-full flex items-center justify-center bg-background px-5">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-primary" />
            <h1 className="font-serif text-3xl">That shelf is empty.</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">We couldn’t find the page you were looking for. Let’s get you back to the collection.</p>
          <div className="mt-6 flex flex-wrap gap-2"><Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="not-found-home"><ArrowLeft size={14}/> Go home</Link><Link href="/books" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-secondary" data-testid="not-found-catalog"><Search size={14}/> Browse books</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
