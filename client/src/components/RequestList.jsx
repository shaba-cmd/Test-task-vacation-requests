import { useState } from 'react';
import { api } from '../api.js';
import RejectDialog from './RejectDialog.jsx';

const STATUS_LABEL = {
  pending: 'Ожидает',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function pluralDays(n) {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

export default function RequestList({ items, loading, onChanged }) {
  const [rejectingId, setRejectingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState({});

  async function run(id, action) {
    setBusyId(id);
    setRowError((prev) => ({ ...prev, [id]: undefined }));
    try {
      await action();
      setRejectingId(null);
      onChanged?.();
    } catch (err) {
      setRowError((prev) => ({ ...prev, [id]: err.message }));
      if (err.status === 409 || err.status === 404) onChanged?.();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="empty">Загрузка…</p>;
  if (items.length === 0) return <p className="empty">Заявок нет.</p>;

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id} className="card request">
          <div className="request-head">
            <div>
              <div className="request-name">{item.employeeName}</div>
              <div className="request-period">
                {formatDate(item.dateFrom)} — {formatDate(item.dateTo)}
                <span className="dot">·</span>
                {item.days} {pluralDays(item.days)}
              </div>
            </div>
            <span className={`badge badge-${item.status}`}>{STATUS_LABEL[item.status]}</span>
          </div>

          <dl className="request-meta">
            <dt>Причина</dt>
            <dd>{item.reason}</dd>
            {item.status === 'rejected' && (
              <>
                <dt>Причина отклонения</dt>
                <dd className="rejection">{item.rejectionReason}</dd>
              </>
            )}
          </dl>

          {rowError[item.id] && <div className="alert">{rowError[item.id]}</div>}

          {item.status === 'pending' && rejectingId !== item.id && (
            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === item.id}
                onClick={() => run(item.id, () => api.approve(item.id))}
              >
                Одобрить
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busyId === item.id}
                onClick={() => setRejectingId(item.id)}
              >
                Отклонить
              </button>
            </div>
          )}

          {item.status === 'pending' && rejectingId === item.id && (
            <RejectDialog
              busy={busyId === item.id}
              onCancel={() => setRejectingId(null)}
              onConfirm={(reason) => run(item.id, () => api.reject(item.id, reason))}
            />
          )}
        </li>
      ))}
    </ul>
  );
}