import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardQueryKey, getListBooksQueryKey, getListIssuesQueryKey, getListMembersQueryKey, useIssueBook, useListBooks, useListIssues, useListMembers, useReturnBook } from '@workspace/api-client-react';
import type { Issue } from '@workspace/api-client-react';
import { AdminGate } from '@/components/admin-gate';
import { Button, EmptyState, ErrorState, LoadingBlock, PageHeader, StatusPill } from '@/components/ui';
import { ArrowDownToLine, ArrowUpFromLine, Search, UserRound } from 'lucide-react';

function CirculationContent() {
  const client = useQueryClient();
  const books = useListBooks(undefined, { query: { queryKey: getListBooksQueryKey() } });
  const members = useListMembers({ query: { queryKey: getListMembersQueryKey() } });
  const issues = useListIssues(undefined, { query: { queryKey: getListIssuesQueryKey() } });
  const issueBook = useIssueBook();
  const returnBook = useReturnBook();
  const [bookId, setBookId] = useState('');
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const availableBooks = (books.data || []).filter(book => book.quantity > 0);
  const rows = (issues.data || []).filter(issue => (filter === 'all' || issue.status === 'issued') && `${issue.book_title} ${issue.member_name} ${issue.member_email}`.toLowerCase().includes(query.toLowerCase()));
  const invalidate = async () => Promise.all([client.invalidateQueries({ queryKey: getListIssuesQueryKey() }), client.invalidateQueries({ queryKey: getListBooksQueryKey() }), client.invalidateQueries({ queryKey: getGetDashboardQueryKey() })]);
  const submitIssue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFeedback(null);
    try { await issueBook.mutateAsync({ data: { book_id: bookId, user_id: userId } }); await invalidate(); setFeedback({ text: 'Book issued. The loan has been recorded.', error: false }); setBookId(''); setUserId(''); }
    catch (err) { setFeedback({ text: err instanceof Error ? err.message : 'The book could not be issued.', error: true }); }
  };
  const doReturn = async (issue: Issue) => {
    setBusyId(issue.id); setFeedback(null);
    try { await returnBook.mutateAsync({ id: issue.id }); await invalidate(); setFeedback({ text: `${issue.book_title} has been marked as returned.`, error: false }); }
    catch (err) { setFeedback({ text: err instanceof Error ? err.message : 'The return could not be recorded.', error: true }); }
    finally { setBusyId(null); }
  };
  return <div className="page-enter mx-auto max-w-[1440px] px-5 py-11 md:px-10 md:py-14"><PageHeader eyebrow="Staff desk / circulation" title="Issue. Return. Repeat." description="A focused desk for keeping titles moving and return records up to date."/>
    <div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
      <section className="h-fit rounded-xl border border-border bg-card"><div className="border-b border-border px-5 py-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">New loan</p><h2 className="mt-2 font-serif text-3xl">Issue a book</h2><p className="mt-1 text-xs text-muted-foreground">Select a member and an available title.</p></div>
        <form onSubmit={submitIssue} className="space-y-5 p-5">
          <label className="block"><span className="mb-2 block text-xs font-semibold">Book</span><select required value={bookId} onChange={e => setBookId(e.target.value)} className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" data-testid="select-issue-book"><option value="">Choose an available title</option>{availableBooks.map(book=><option key={book.id} value={book.id}>{book.title} · {book.quantity} available</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold">Member</span><select required value={userId} onChange={e => setUserId(e.target.value)} className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" data-testid="select-issue-member"><option value="">Choose a member</option>{(members.data || []).map(member=><option key={member.id} value={member.id}>{member.full_name} · {member.email}</option>)}</select></label>
          {members.isError && <p className="text-xs text-destructive" role="alert">Members could not be loaded. Try refreshing this page.</p>}
          {!members.isLoading && members.data?.length === 0 && <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">No members are available to issue a book to yet.</p>}
          {!books.isLoading && availableBooks.length === 0 && <p className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100">There are no available copies at this time.</p>}
          <div className="flex items-start gap-3 rounded-lg bg-secondary/70 p-3.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-primary"><ArrowUpFromLine size={15}/></span><p className="pt-0.5 text-xs leading-5 text-muted-foreground">Issue and due dates are recorded by the library system when the loan is created.</p></div>
          <Button type="submit" className="w-full" disabled={!bookId || !userId || issueBook.isPending || availableBooks.length === 0} data-testid="button-submit-issue">{issueBook.isPending ? 'Recording loan…' : <>Issue selected title <ArrowUpFromLine size={15}/></>}</Button>
        </form>
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">Circulation log</p><h2 className="mt-2 font-serif text-3xl">Loans & returns</h2></div><div className="flex gap-1 rounded-lg bg-secondary p-1"><button onClick={() => setFilter('active')} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === 'active' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid="tab-active-loans">Active</button><button onClick={() => setFilter('all')} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid="tab-all-loans">All loans</button></div></div>
        <div className="border-b border-border px-5 py-3"><label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a book or member" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" data-testid="input-search-loans"/></label></div>
        {feedback && <div role="status" className={`mx-5 mt-4 rounded-lg border px-3.5 py-3 text-xs ${feedback.error ? 'border-destructive/25 bg-destructive/10 text-rose-200' : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'}`} data-testid="status-circulation-feedback">{feedback.text}</div>}
        {issues.isLoading || books.isLoading || members.isLoading ? <div className="p-5"><LoadingBlock label="Loading circulation records"/></div> : issues.isError ? <div className="p-5"><ErrorState message="Circulation records couldn’t be loaded." retry={() => void issues.refetch()}/></div> : rows.length === 0 ? <div className="p-5"><EmptyState title={query ? 'No matching loans.' : filter === 'active' ? 'All caught up.' : 'No loan records yet.'} description={query ? 'Try another book title or member name.' : filter === 'active' ? 'There are no books currently out with members.' : 'New loans will appear here once issued.'}/></div> : <div className="divide-y divide-border">{rows.map(issue => {
          const overdue = issue.status === 'issued' && new Date(issue.due_date).getTime() < Date.now();
          return <article key={issue.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid={`circulation-row-${issue.id}`}><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-serif text-xl">{issue.book_title}</p><StatusPill tone={issue.status === 'returned' ? 'good' : overdue ? 'bad' : 'warn'}>{issue.status === 'returned' ? 'Returned' : overdue ? 'Overdue' : 'On loan'}</StatusPill></div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound size={12}/>{issue.member_name} · {issue.member_email}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">Issued {new Date(issue.issue_date).toLocaleDateString()} · Due {new Date(issue.due_date).toLocaleDateString()}{issue.return_date ? ` · Returned ${new Date(issue.return_date).toLocaleDateString()}` : ''}</p></div>{issue.status === 'issued' && <Button variant={overdue ? 'primary' : 'outline'} className="shrink-0" disabled={busyId === issue.id} onClick={() => void doReturn(issue)} data-testid={`button-return-${issue.id}`}>{busyId === issue.id ? 'Recording…' : <><ArrowDownToLine size={14}/> Record return</>}</Button>}</article>;
        })}</div>}
        <div className="border-t border-border bg-secondary/35 px-5 py-3 font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground">{rows.length} {rows.length === 1 ? 'record' : 'records'} in view</div>
      </section>
    </div>
  </div>;
}
export default function AdminIssuePage() { return <AdminGate><CirculationContent/></AdminGate>; }
