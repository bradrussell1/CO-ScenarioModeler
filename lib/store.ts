import { get, list, put } from "@vercel/blob";
import type { ChangeRequest } from "./types";

const PREFIX = "requests/";

function pathFor(id: string) {
  return `${PREFIX}${id}.json`;
}

export async function saveRequest(r: ChangeRequest): Promise<void> {
  await put(pathFor(r.id), JSON.stringify(r, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getRequest(id: string): Promise<ChangeRequest | null> {
  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  const res = await get(pathFor(id), { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  const text = await new Response(res.stream).text();
  return JSON.parse(text) as ChangeRequest;
}

export async function listRequests(): Promise<ChangeRequest[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const m = b.pathname.match(/^requests\/([a-z0-9-]+)\.json$/i);
      if (m) ids.push(m[1]);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const items = await Promise.all(ids.map((id) => getRequest(id)));
  return items
    .filter((r): r is ChangeRequest => r !== null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
