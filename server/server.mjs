// Minimal progress-sync API. Node stdlib only, no dependencies.
// Stores one JSON file per user under DATA_DIR.
// Auth: X-Auth header must match the user's SHA-256 password hash
// (same hashes as src/auth/auth.ts).
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = process.env.DATA_DIR ?? "/data";
const MAX_BODY = 10 * 1024 * 1024; // 10 MB

const USERS = {
  nuno: "0b682ba04b77fbec8ff17b8b8fb1ddb9c6d5a34ef7d0d719a268f92c34ed9d82",
  chloe: "f5bd323fe4cfd46e3724ad716f1f321f4ae602436f64ff4835318fa0c8fd118a"
};

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(json);
}

function userFile(user) {
  return path.join(DATA_DIR, `${user}.json`);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = http.createServer(async (req, res) => {
  const match = req.url?.match(/^\/api\/progress\/([a-z0-9_-]+)$/);
  if (!match) return send(res, 404, { error: "not found" });

  const user = match[1];
  const expectedHash = USERS[user];
  if (!expectedHash) return send(res, 404, { error: "unknown user" });
  if (req.headers["x-auth"] !== expectedHash) {
    return send(res, 401, { error: "unauthorized" });
  }

  try {
    if (req.method === "GET") {
      try {
        const text = await fs.readFile(userFile(user), "utf8");
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        return res.end(text);
      } catch (e) {
        if (e.code === "ENOENT") return send(res, 404, { error: "no progress yet" });
        throw e;
      }
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const data = JSON.parse(body); // reject invalid JSON
      if (typeof data.version !== "number" || !Array.isArray(data.attempts)) {
        return send(res, 400, { error: "invalid progress format" });
      }
      await fs.mkdir(DATA_DIR, { recursive: true });
      // atomic write: tmp file then rename
      const tmp = userFile(user) + ".tmp";
      await fs.writeFile(tmp, body, "utf8");
      await fs.rename(tmp, userFile(user));
      return send(res, 200, { ok: true, savedAt: Date.now() });
    }

    return send(res, 405, { error: "method not allowed" });
  } catch (e) {
    return send(res, e.message === "body too large" ? 413 : 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`progress-sync API on :${PORT}, data dir ${DATA_DIR}`);
});
