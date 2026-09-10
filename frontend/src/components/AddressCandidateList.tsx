import { useState, type FormEvent } from "react";
import type { AddressCandidate } from "../lib/types";

interface Props {
  candidates: AddressCandidate[];
  onToggle: (id: string) => void;
  onAddManual: (text: string) => void;
  onDelete: (id: string) => void;
}

export function AddressCandidateList({
  candidates,
  onToggle,
  onAddManual,
  onDelete,
}: Props) {
  const [manualText, setManualText] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (manualText.trim()) {
      onAddManual(manualText.trim());
      setManualText("");
    }
  }

  return (
    <div className="candidate-list">
      <h3>Stops</h3>
      {candidates.length === 0 && (
        <p className="candidate-list__empty">
          Add a stop below, click the map, or scan a page for addresses
          further down.
        </p>
      )}
      <ul>
        {candidates.map((c) => (
          <li key={c.id} className="candidate-list__item">
            <label>
              <input
                type="checkbox"
                checked={c.selected}
                onChange={() => onToggle(c.id)}
              />
              <span className="candidate-list__letter">{c.letter}</span>
              {c.text}
            </label>
            <button
              type="button"
              className="candidate-list__delete"
              onClick={() => onDelete(c.id)}
              aria-label={`Remove ${c.text}`}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="candidate-list__add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add a stop by address…"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
