import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// PUT /api/dev/upload?key=listings/...
// Development-only: saves uploaded files to public/dev-uploads/ so they can
// be served by Next.js static file handling. Returns 404 in production.
export async function PUT(req: NextRequest) {
  // Dev only: never reachable in production (NODE_ENV guard)
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return Response.json({ error: "Missing key", code: "MISSING_KEY" }, { status: 400 });
  }

  // Prevent path traversal
  const normalised = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(process.cwd(), "public", "dev-uploads", normalised);

  const buffer = Buffer.from(await req.arrayBuffer());
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return new Response(null, { status: 200 });
}
