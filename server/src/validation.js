import { parseDate } from "./days.js";

const MAX_TEXT = 500;

export function validateCreate(body) {
  const errors = {};
  const raw = body && typeof body === "object" ? body : {};

  const employeeName =
    typeof raw.employeeName === "string" ? raw.employeeName.trim() : "";
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
  const dateFrom = typeof raw.dateFrom === "string" ? raw.dateFrom.trim() : "";
  const dateTo = typeof raw.dateTo === "string" ? raw.dateTo.trim() : "";

  if (!employeeName) errors.employeeName = "Укажите ФИО сотрудника";
  else if (employeeName.length > 200)
    errors.employeeName = "ФИО не длиннее 200 символов";

  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);

  if (!dateFrom) errors.dateFrom = "Дата «с» обязательна";
  else if (!from) errors.dateFrom = "Некорректная дата (ожидается ГГГГ-ММ-ДД)";

  if (!dateTo) errors.dateTo = "Дата «по» обязательна";
  else if (!to) errors.dateTo = "Некорректная дата (ожидается ГГГГ-ММ-ДД)";

  if (from && to && to < from) {
    errors.dateTo = "Дата «по» не может быть раньше даты «с»";
  }

  if (!reason) errors.reason = "Причина обязательна";
  else if (reason.length > MAX_TEXT)
    errors.reason = `Причина не длиннее ${MAX_TEXT} символов`;

  return { errors, value: { employeeName, dateFrom, dateTo, reason } };
}

export function validateReject(body) {
  const raw = body && typeof body === "object" ? body : {};
  const rejectionReason =
    typeof raw.rejectionReason === "string" ? raw.rejectionReason.trim() : "";
  const errors = {};
  if (!rejectionReason)
    errors.rejectionReason = "Причина отклонения обязательна";
  else if (rejectionReason.length > MAX_TEXT)
    errors.rejectionReason = `Причина не длиннее ${MAX_TEXT} символов`;
  return { errors, value: { rejectionReason } };
}
