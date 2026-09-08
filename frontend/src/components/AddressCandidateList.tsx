import { useState, type FormEvent } from "react";
import type { AddressCandidate } from "../lib/types";

interface Props {
  candidates: AddressCandidate[];
  onToggle: (id: string) => void;
  onAddManual: (text: string) => void;
}

export function AddressCandidateList({
  candidates,
  onToggle,
  onAddManual,
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
          Scan a URL above, click the map, or add a stop manually below.
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
              {c.text}
            </label>
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
