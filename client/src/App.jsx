import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import RequestForm from "./components/RequestForm.jsx";
import RequestList from "./components/RequestList.jsx";
import StatusFilter from "./components/StatusFilter.jsx";

export default function App() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (nextStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list(nextStatus);
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [load, status]);

  return (
    <div className="wrap">
      <header className="mark">
        <span className="mark-text">
          <b>HR</b> / внутренний сервис
        </span>
      </header>

      <span className="eyebrow">Отпуска</span>
      <h1>Заявки на отпуск</h1>
      <p className="lede">
        Сотрудник подаёт заявку, руководитель одобряет или отклоняет. Количество
        дней считается автоматически.
      </p>

      <section>
        <span className="sec-label">Новая заявка</span>
        <RequestForm onCreated={() => load(status)} />
      </section>

      <section>
        <span className="sec-label">Заявки</span>
        <StatusFilter value={status} onChange={setStatus} />
        {error && (
          <div className="alert" role="alert">
            {error}{" "}
            <button
              type="button"
              className="btn-link"
              onClick={() => load(status)}
            >
              Повторить
            </button>
          </div>
        )}
        <RequestList
          items={items}
          loading={loading}
          onChanged={() => load(status)}
          onConflict={() => load(status)}
        />
      </section>

      <footer>
        Тестовое задание · React 18 + Express · хранилище — JSON-файл на сервере
      </footer>
    </div>
  );
}
