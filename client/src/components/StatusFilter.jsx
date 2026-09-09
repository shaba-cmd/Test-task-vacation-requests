const OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'approved', label: 'Одобрена' },
  { value: 'rejected', label: 'Отклонена' },
];

export default function StatusFilter({ value, onChange }) {
  return (
    <div className="filter" role="group" aria-label="Фильтр по статусу">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`chip${value === option.value ? ' chip-active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}