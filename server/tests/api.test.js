import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
import { countDays } from "../src/days.js";

let server;
let baseUrl;
let dataDir;
let dataFile;
let store;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "vacation-test-"));
  dataFile = path.join(dataDir, "requests.json");
  store = createStore({ file: dataFile });
  const app = createApp({ store });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(dataDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await store.reset();
});

const api = (url, options) => fetch(`${baseUrl}${url}`, options);

const postJson = (url, body) =>
  api(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validPayload = {
  employeeName: "Иванов Иван Иванович",
  dateFrom: "2026-10-01",
  dateTo: "2026-10-10",
  reason: "Ежегодный оплачиваемый отпуск",
};

test("countDays считает дни включительно", () => {
  assert.equal(countDays("2026-10-01", "2026-10-01"), 1);
  assert.equal(countDays("2026-10-01", "2026-10-10"), 10);
  assert.equal(countDays("2026-02-27", "2026-03-02"), 4);
});

test("POST /api/requests создаёт заявку со статусом pending и посчитанными днями", async () => {
  const res = await postJson("/api/requests", validPayload);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.status, "pending");
  assert.equal(body.days, 10);
  assert.equal(body.rejectionReason, null);
  assert.ok(body.id);

  const listRes = await api("/api/requests");
  const list = await listRes.json();
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, body.id);
});

test("POST /api/requests отклоняет дату «по» раньше даты «с»", async () => {
  const res = await postJson("/api/requests", {
    ...validPayload,
    dateFrom: "2026-10-10",
    dateTo: "2026-10-01",
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.dateTo);
});

test("POST /api/requests требует ФИО, даты и причину", async () => {
  const res = await postJson("/api/requests", {
    employeeName: "   ",
    dateFrom: "",
    dateTo: "",
    reason: "  ",
  });
  assert.equal(res.status, 400);
  const { errors } = await res.json();
  assert.ok(errors.employeeName);
  assert.ok(errors.dateFrom);
  assert.ok(errors.dateTo);
  assert.ok(errors.reason);
});

test("approve переводит заявку в approved, повторное решение даёт 409", async () => {
  const created = await (await postJson("/api/requests", validPayload)).json();

  const approved = await (
    await postJson(`/api/requests/${created.id}/approve`)
  ).json();
  assert.equal(approved.status, "approved");
  assert.ok(approved.decidedAt);

  const again = await postJson(`/api/requests/${created.id}/reject`, {
    rejectionReason: "Поздно",
  });
  assert.equal(again.status, 409);
});

test("reject без причины — 400, с причиной — причина сохраняется и видна в списке", async () => {
  const created = await (await postJson("/api/requests", validPayload)).json();

  const noReason = await postJson(`/api/requests/${created.id}/reject`, {
    rejectionReason: " ",
  });
  assert.equal(noReason.status, 400);
  const noReasonBody = await noReason.json();
  assert.ok(noReasonBody.errors.rejectionReason);

  const ok = await postJson(`/api/requests/${created.id}/reject`, {
    rejectionReason: "Пересечение с отпуском коллеги",
  });
  assert.equal(ok.status, 200);

  const list = await (await api("/api/requests?status=rejected")).json();
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].rejectionReason, "Пересечение с отпуском коллеги");
});

test("GET /api/requests?status=... фильтрует, неизвестный статус — 400", async () => {
  const a = await (await postJson("/api/requests", validPayload)).json();
  await postJson("/api/requests", {
    ...validPayload,
    employeeName: "Петров Пётр",
  });
  await postJson(`/api/requests/${a.id}/approve`);

  const pending = await (await api("/api/requests?status=pending")).json();
  assert.equal(pending.items.length, 1);
  assert.equal(pending.items[0].employeeName, "Петров Пётр");

  const approved = await (await api("/api/requests?status=approved")).json();
  assert.equal(approved.items.length, 1);
  assert.equal(approved.items[0].id, a.id);

  const bad = await api("/api/requests?status=whatever");
  assert.equal(bad.status, 400);
});

test("данные переживают перезапуск процесса (читаются из файла заново)", async () => {
  const created = await (await postJson("/api/requests", validPayload)).json();
  const freshStore = createStore({ file: dataFile });
  const items = await freshStore.list();
  assert.equal(items.length, 1);
  assert.equal(items[0].id, created.id);
});

test("решение по несуществующей заявке — 404", async () => {
  const res = await postJson("/api/requests/does-not-exist/approve");
  assert.equal(res.status, 404);
});
