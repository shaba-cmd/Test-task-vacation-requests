import cors from "cors";
import express from "express";
import { countDays } from "./days.js";
import { createStore } from "./store.js";
import { validateCreate, validateReject } from "./validation.js";

export const STATUSES = ["pending", "approved", "rejected"];

function toDto(request) {
  return { ...request, days: countDays(request.dateFrom, request.dateTo) };
}

export function createApp({ store = createStore() } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));

  const asyncRoute = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.get(
    "/api/requests",
    asyncRoute(async (req, res) => {
      const status = req.query.status;
      if (status !== undefined && status !== "" && status !== "all") {
        if (!STATUSES.includes(status)) {
          return res.status(400).json({
            message: "Неизвестный статус",
            errors: { status: "Неизвестный статус" },
          });
        }
        const items = await store.list({ status });
        return res.json({ items: items.map(toDto) });
      }
      const items = await store.list();
      res.json({ items: items.map(toDto) });
    }),
  );

  app.post(
    "/api/requests",
    asyncRoute(async (req, res) => {
      const { errors, value } = validateCreate(req.body);
      if (Object.keys(errors).length > 0) {
        return res
          .status(400)
          .json({ message: "Проверьте поля формы", errors });
      }
      const created = await store.create(value);
      res.status(201).json(toDto(created));
    }),
  );

  app.get(
    "/api/requests/:id",
    asyncRoute(async (req, res) => {
      const found = await store.findById(req.params.id);
      if (!found) return res.status(404).json({ message: "Заявка не найдена" });
      res.json(toDto(found));
    }),
  );

  app.post(
    "/api/requests/:id/approve",
    asyncRoute(async (req, res) => {
      const found = await store.findById(req.params.id);
      if (!found) return res.status(404).json({ message: "Заявка не найдена" });
      if (found.status !== "pending") {
        return res
          .status(409)
          .json({ message: "Решение по заявке уже принято" });
      }
      const updated = await store.update(found.id, {
        status: "approved",
        rejectionReason: null,
        decidedAt: new Date().toISOString(),
      });
      res.json(toDto(updated));
    }),
  );

  app.post(
    "/api/requests/:id/reject",
    asyncRoute(async (req, res) => {
      const found = await store.findById(req.params.id);
      if (!found) return res.status(404).json({ message: "Заявка не найдена" });
      if (found.status !== "pending") {
        return res
          .status(409)
          .json({ message: "Решение по заявке уже принято" });
      }
      const { errors, value } = validateReject(req.body);
      if (Object.keys(errors).length > 0) {
        return res
          .status(400)
          .json({ message: "Укажите причину отклонения", errors });
      }
      const updated = await store.update(found.id, {
        status: "rejected",
        rejectionReason: value.rejectionReason,
        decidedAt: new Date().toISOString(),
      });
      res.json(toDto(updated));
    }),
  );

  app.use((req, res) => res.status(404).json({ message: "Not found" }));

  app.use((err, req, res, next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ message: "Некорректный JSON" });
    }
    console.error(err);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  });

  return app;
}
