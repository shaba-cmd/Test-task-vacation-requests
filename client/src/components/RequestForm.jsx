import { useState } from 'react';
import { api } from '../api.js';

const EMPTY = { employeeName: '', dateFrom: '', dateTo: '', reason: '' };

function validate(values) {
  const errors = {};
  if (!values.employeeName.trim()) errors.employeeName = 'Укажите ФИО сотрудника';
  if (!values.dateFrom) errors.dateFrom = 'Дата «с» обязательна';
  if (!values.dateTo) errors.dateTo = 'Дата «по» обязательна';
  if (values.dateFrom && values.dateTo && values.dateTo < values.dateFrom) {
    errors.dateTo = 'Дата «по» не может быть раньше даты «с»';
  }
  if (!values.reason.trim()) errors.reason = 'Причина обязательна';
  return errors;
}

export default function RequestForm({ onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccess(false);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      await api.create({
        employeeName: values.employeeName.trim(),
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
        reason: values.reason.trim(),
      });
      setValues(EMPTY);
      setErrors({});
      setSuccess(true);
      onCreated?.();
    } catch (err) {
      setErrors(err.errors ?? {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="employeeName">ФИО сотрудника</label>
        <input
          id="employeeName"
          value={values.employeeName}
          onChange={setField('employeeName')}
          placeholder="Иванов Иван Иванович"
          aria-invalid={Boolean(errors.employeeName)}
        />
        {errors.employeeName && <span className="field-error">{errors.employeeName}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="dateFrom">Дата с</label>
          <input
            id="dateFrom"
            type="date"
            value={values.dateFrom}
            onChange={setField('dateFrom')}
            aria-invalid={Boolean(errors.dateFrom)}
          />
          {errors.dateFrom && <span className="field-error">{errors.dateFrom}</span>}
        </div>
        <div className="field">
          <label htmlFor="dateTo">Дата по</label>
          <input
            id="dateTo"
            type="date"
            value={values.dateTo}
            min={values.dateFrom || undefined}
            onChange={setField('dateTo')}
            aria-invalid={Boolean(errors.dateTo)}
          />
          {errors.dateTo && <span className="field-error">{errors.dateTo}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="reason">Причина</label>
        <textarea
          id="reason"
          rows={3}
          value={values.reason}
          onChange={setField('reason')}
          placeholder="Ежегодный оплачиваемый отпуск"
          aria-invalid={Boolean(errors.reason)}
        />
        {errors.reason && <span className="field-error">{errors.reason}</span>}
      </div>

      {formError && <div className="alert">{formError}</div>}
      {success && <div className="notice">Заявка отправлена.</div>}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Отправка…' : 'Подать заявку'}
        </button>
      </div>
    </form>
  );
}