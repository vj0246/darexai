import { getSession } from "@/lib/session";
import { getMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return new Response("Unauthorized", { status: 401 });
  return Response.json(await getMetrics(s.tid));
}
