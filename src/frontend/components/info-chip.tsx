type InfoChipProps = {
  label: string;
  description: string;
};

export function InfoChip({ label, description }: InfoChipProps) {
  return (
    <span className="info-chip">
      <span>{label}</span>
      <button
        type="button"
        className="info-chip-badge"
        aria-label={`${label}: ${description}`}
      >
        i
      </button>
      <span role="tooltip" className="info-chip-tooltip">
        {description}
      </span>
    </span>
  );
}
