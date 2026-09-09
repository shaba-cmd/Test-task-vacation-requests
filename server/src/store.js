import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_FILE = path.resolve(process.cwd(), "data/requests.json");

export function createStore({ file = DEFAULT_FILE } = {}) {
  let cache = null;
  let writeChain = Promise.resolve();

  async function load() {
    if (cache) return cache;
    try {
      const text = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(text);
      cache = Array.isArray(parsed?.requests) ? parsed.requests : [];
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      cache = [];
    }
    return cache;
  }

  function persist() {
    const snapshot = JSON.stringify({ requests: cache }, null, 2);
    writeChain = writeChain.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, "utf8");
      await fs.rename(tmp, file);
    });
    return writeChain;
  }

  return {
    async list({ status } = {}) {
      const items = await load();
      const filtered = status
        ? items.filter((r) => r.status === status)
        : items.slice();
      return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async findById(id) {
      const items = await load();
      return items.find((r) => r.id === id) ?? null;
    },

    async create(data) {
      const items = await load();
      const now = new Date().toISOString();
      const request = {
        id: randomUUID(),
        employeeName: data.employeeName,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        reason: data.reason,
        status: "pending",
        rejectionReason: null,
        createdAt: now,
        decidedAt: null,
      };
      items.push(request);
      await persist();
      return request;
    },

    async update(id, patch) {
      const items = await load();
      const index = items.findIndex((r) => r.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...patch };
      await persist();
      return items[index];
    },

    async reset() {
      cache = [];
      await persist();
    },
  };
}
