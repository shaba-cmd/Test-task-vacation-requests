import { useState } from 'react';

export default function RejectDialog({ onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Причина отклонения обязательна');
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <form className="reject-box" onSubmit={handleSubmit}>
      <div className="field">
        <label>Причина отклонения</label>
        <textarea
          rows={2}
          autoFocus
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          placeholder="Например: пересечение с отпуском коллеги"
          aria-invalid={Boolean(error)}
        />
        {error && <span className="field-error">{error}</span>}
      </div>
      <div className="actions">
        <button type="submit" className="btn btn-danger" disabled={busy}>
          {busy ? 'Сохранение…' : 'Отклонить заявку'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Отмена
        </button>
      </div>
    </form>
  );
}