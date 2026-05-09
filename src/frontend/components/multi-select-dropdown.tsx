import { useEffect, useRef, useState } from 'react';

type MultiSelectDropdownProps = {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
};

export function MultiSelectDropdown({
  id,
  label,
  options,
  selected,
  onToggle,
  placeholder = 'Select…'
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayText = selected.length > 0
    ? selected.join(', ')
    : placeholder;

  return (
    <div className="filter-field" ref={containerRef}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="multiselect-wrapper">
        <button
          id={id}
          type="button"
          className="field-input multiselect-trigger"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="multiselect-trigger-text">{displayText}</span>
          <span className="multiselect-trigger-arrow">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="multiselect-dropdown">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <label key={option} className="multiselect-option">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
