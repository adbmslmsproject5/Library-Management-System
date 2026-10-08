import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import {
  CreateBookBody,
  CreateBookResponse,
  DeleteBookParams,
  GetBookParams,
  GetBookResponse,
  GetDashboardResponse,
  IssueBookBody,
  IssueBookResponse,
  ListBooksQueryParams,
  ListBooksResponse,
  ListIssuesQueryParams,
  ListIssuesResponse,
  ListMembersResponse,
  ReturnBookParams,
  ReturnBookResponse,
  UpdateBookBody,
  UpdateBookParams,
  UpdateBookResponse,
} from "@workspace/api-zod";

type SupabaseRow = Record<string, unknown>;

class SupabaseRestError extends Error {
  readonly code: string | undefined;

  constructor(
    readonly status: number,
    message: string,
    code?: string,
  ) {
    super(message);
    this.name = "SupabaseRestError";
    this.code = code;
  }
}

const router: IRouter = Router();

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new SupabaseRestError(
      503,
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return { url, anonKey };
}

async function supabaseRequest(
  req: Request,
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const { url, anonKey } = getSupabaseConfig();
  const authorization = req.get("authorization") ?? `Bearer ${anonKey}`;
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("authorization", authorization);
  headers.set("accept", "application/json");
  if (init.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const endpoint = path.startsWith("auth/v1/")
    ? `${url}/${path}`
    : `${url}/rest/v1/${path}`;
  const response = await fetch(endpoint, {
    ...init,
    headers,
  });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.details === "string" && record.details) ||
      `Supabase request failed with status ${response.status}`;
    throw new SupabaseRestError(
      response.status,
      message,
      typeof record.code === "string" ? record.code : undefined,
    );
  }

  return payload;
}

function asRow(value: unknown): SupabaseRow {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SupabaseRow)
    : {};
}

function firstRow(value: unknown): SupabaseRow | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.length ? asRow(value[0]) : undefined;
}

function relation(value: unknown): SupabaseRow {
  return Array.isArray(value) ? asRow(value[0]) : asRow(value);
}

function normalizeIssue(value: unknown): SupabaseRow {
  const row = asRow(value);
  const book = relation(row.books ?? row.book);
  const member = relation(row.profiles ?? row.profile);
  return {
    id: row.id,
    book_id: row.book_id,
    user_id: row.user_id,
    issue_date: row.issue_date,
    due_date: row.due_date,
    return_date: row.return_date ?? null,
    status: row.status,
    book_title: row.book_title ?? book.title ?? "Untitled book",
    member_name: row.member_name ?? member.full_name ?? "Library member",
    member_email: row.member_email ?? member.email ?? "unknown@example.com",
  };
}

function reportError(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof SupabaseRestError) {
    req.log.warn(
      { status: error.status, code: error.code },
      "Supabase request rejected",
    );
    const status =
      error.code === "23505"
        ? 409
        : error.code === "23503"
          ? 409
          : error.code === "PGRST116" || error.code === "P0002"
            ? 404
            : error.status === 401 || error.status === 403
              ? error.status
              : error.status >= 400 && error.status < 500
                ? error.status
                : 502;
    res.status(status).json({
      error:
        error.code === "23505"
          ? "A book with this ISBN already exists."
          : error.code === "23503"
            ? "This book has circulation history and cannot be deleted."
            : status === 401
              ? "Please sign in to continue."
              : status === 403
                ? "Your account does not have permission to do that."
                : error.message,
    });
    return;
  }

  req.log.error({ err: error }, "Library API request failed");
  res.status(500).json({ error: "The library service could not complete the request." });
}

router.get("/books", async (req, res, next): Promise<void> => {
  try {
    const parsed = ListBooksQueryParams.safeParse({
      ...req.query,
      availableOnly: req.query.availableOnly === "true",
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const query = new URLSearchParams({
      select: "*",
      order: "created_at.desc",
    });
    if (parsed.data.category) query.set("category", `eq.${parsed.data.category}`);
    if (parsed.data.availableOnly) query.set("quantity", "gt.0");
    if (parsed.data.q?.trim()) {
      const safeTerm = parsed.data.q.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const term = `"*${safeTerm}*"`;
      query.set("or", `(title.ilike.${term},author.ilike.${term},isbn.ilike.${term})`);
    }

    const data = await supabaseRequest(req, `books?${query.toString()}`);
    res.json(ListBooksResponse.parse(data));
  } catch (error) {
    next(error);
  }
});

router.post("/books", async (req, res, next): Promise<void> => {
  try {
    const parsed = CreateBookBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const data = await supabaseRequest(
      req,
      "books?select=*",
      {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(parsed.data),
      },
    );
    const created = firstRow(data);
    if (!created) {
      res.status(502).json({ error: "Supabase did not return the created book." });
      return;
    }
    res.status(201).json(CreateBookResponse.parse(created));
  } catch (error) {
    next(error);
  }
});

router.get("/books/:id", async (req, res, next): Promise<void> => {
  try {
    const params = GetBookParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = new URLSearchParams({
      id: `eq.${params.data.id}`,
      select: "*",
      limit: "1",
    });
    const book = firstRow(await supabaseRequest(req, `books?${query.toString()}`));
    if (!book) {
      res.status(404).json({ error: "Book not found." });
      return;
    }
    res.json(GetBookResponse.parse(book));
  } catch (error) {
    next(error);
  }
});

router.patch("/books/:id", async (req, res, next): Promise<void> => {
  try {
    const params = UpdateBookParams.safeParse(req.params);
    const parsed = UpdateBookBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "Provide at least one field to update." });
      return;
    }
    const query = new URLSearchParams({
      id: `eq.${params.data.id}`,
      select: "*",
    });
    const data = await supabaseRequest(req, `books?${query.toString()}`, {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    const book = firstRow(data);
    if (!book) {
      res.status(404).json({ error: "Book not found or not available to update." });
      return;
    }
    res.json(UpdateBookResponse.parse(book));
  } catch (error) {
    next(error);
  }
});

router.delete("/books/:id", async (req, res, next): Promise<void> => {
  try {
    const params = DeleteBookParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = new URLSearchParams({
      id: `eq.${params.data.id}`,
      select: "id",
    });
    const data = await supabaseRequest(req, `books?${query.toString()}`, {
      method: "DELETE",
      headers: { prefer: "return=representation" },
    });
    if (!firstRow(data)) {
      res.status(404).json({ error: "Book not found or not available to delete." });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

router.get("/members", async (req, res, next): Promise<void> => {
  try {
    const query = new URLSearchParams({
      select: "id,full_name,email",
      order: "full_name.asc",
    });
    const data = await supabaseRequest(req, `profiles?${query.toString()}`);
    res.json(ListMembersResponse.parse(data));
  } catch (error) {
    next(error);
  }
});

router.get("/issues", async (req, res, next): Promise<void> => {
  try {
    const parsed = ListIssuesQueryParams.safeParse({
      ...req.query,
      mine: req.query.mine === "true",
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const query = new URLSearchParams({
      select:
        "id,book_id,user_id,issue_date,due_date,return_date,status,books(title),profiles(full_name,email)",
      order: "issue_date.desc",
      limit: "200",
    });
    if (parsed.data.mine) {
      const auth = await supabaseRequest(req, "auth/v1/user");
      const user = asRow(auth);
      if (typeof user.id !== "string") {
        res.status(401).json({ error: "Please sign in to view your loans." });
        return;
      }
      query.set("user_id", `eq.${user.id}`);
    }
    const rows = await supabaseRequest(req, `issued_books?${query.toString()}`);
    const data = Array.isArray(rows) ? rows.map(normalizeIssue) : [];
    res.json(ListIssuesResponse.parse(data));
  } catch (error) {
    next(error);
  }
});

router.post("/issues", async (req, res, next): Promise<void> => {
  try {
    const parsed = IssueBookBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const issued = await supabaseRequest(req, "rpc/issue_book", {
      method: "POST",
      body: JSON.stringify({
        p_book_id: parsed.data.book_id,
        p_user_id: parsed.data.user_id,
      }),
    });
    const issuedRow = firstRow(issued);
    if (!issuedRow || typeof issuedRow.id !== "string") {
      res.status(502).json({ error: "Supabase did not return the new loan." });
      return;
    }
    const query = new URLSearchParams({
      select:
        "id,book_id,user_id,issue_date,due_date,return_date,status,books(title),profiles(full_name,email)",
      id: `eq.${issuedRow.id}`,
      limit: "1",
    });
    const hydrated = firstRow(
      await supabaseRequest(req, `issued_books?${query.toString()}`),
    );
    if (!hydrated) {
      res.status(502).json({ error: "The loan was created, but its details could not be loaded." });
      return;
    }
    res.status(201).json(IssueBookResponse.parse(normalizeIssue(hydrated)));
  } catch (error) {
    next(error);
  }
});

router.post("/issues/:id/return", async (req, res, next): Promise<void> => {
  try {
    const params = ReturnBookParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const returned = await supabaseRequest(req, "rpc/return_book", {
      method: "POST",
      body: JSON.stringify({ p_issue_id: params.data.id }),
    });
    const returnedRow = firstRow(returned);
    if (!returnedRow || typeof returnedRow.id !== "string") {
      res.status(404).json({ error: "Loan not found or already returned." });
      return;
    }
    const query = new URLSearchParams({
      select:
        "id,book_id,user_id,issue_date,due_date,return_date,status,books(title),profiles(full_name,email)",
      id: `eq.${returnedRow.id}`,
      limit: "1",
    });
    const hydrated = firstRow(
      await supabaseRequest(req, `issued_books?${query.toString()}`),
    );
    if (!hydrated) {
      res.status(502).json({ error: "The return was recorded, but its details could not be loaded." });
      return;
    }
    res.json(ReturnBookResponse.parse(normalizeIssue(hydrated)));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (req, res, next): Promise<void> => {
  try {
    const [booksResult, issuesResult, membersResult] = await Promise.all([
      supabaseRequest(req, "books?select=id,quantity&order=created_at.desc"),
      supabaseRequest(
        req,
        "issued_books?select=id,book_id,user_id,issue_date,due_date,return_date,status,books(title),profiles(full_name,email)&order=issue_date.desc&limit=8",
      ),
      supabaseRequest(req, "profiles?select=id"),
    ]);

    const books = Array.isArray(booksResult) ? booksResult.map(asRow) : [];
    const issues = Array.isArray(issuesResult)
      ? issuesResult.map(normalizeIssue)
      : [];
    const members = Array.isArray(membersResult) ? membersResult : [];
    const now = Date.now();
    const allLoans = await supabaseRequest(
      req,
      "issued_books?select=id,due_date,status&status=eq.issued",
    );
    const allActive = Array.isArray(allLoans) ? allLoans.map(asRow) : [];

    res.json(
      GetDashboardResponse.parse({
        total_titles: books.length,
        total_copies: books.reduce(
          (sum, book) =>
            sum + (typeof book.quantity === "number" ? book.quantity : 0),
          0,
        ) + allActive.length,
        available_copies: books.reduce(
          (sum, book) =>
            sum + (typeof book.quantity === "number" ? book.quantity : 0),
          0,
        ),
        active_loans: allActive.length,
        overdue_loans: allActive.filter(
          (issue) =>
            typeof issue.due_date === "string" &&
            new Date(issue.due_date).getTime() < now,
        ).length,
        member_count: members.length,
        recent_issues: issues,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.use(reportError);

export default router;
