import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "web");
const port = Number(process.env.CONTROL_PANEL_PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function resolvePublicFile(requestUrl) {
  const rawPath = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const relativePath = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
  const candidate = path.resolve(publicRoot, relativePath);
  if (candidate !== publicRoot && !candidate.startsWith(`${publicRoot}${path.sep}`)) {
    return null;
  }
  return candidate;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  const filePath = resolvePublicFile(request.url || "/");
  if (!filePath) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad Request");
    return;
  }

  try {
    const body = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "content-type": contentTypes[extension] || "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
    response.end(status === 404 ? "Not Found" : "Internal Server Error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Facebook group control panel: http://127.0.0.1:${port}`);
});
