import { useState, type FormEvent } from "react";
import type { Stop } from "../lib/types";

interface Props {
  centralPoint: Stop | null;
  onSetByAddress: (address: string) => void;
  onUseCurrentLocation: () => void;
  loading: boolean;
}

export function CentralPointInput({
  centralPoint,
  onSetByAddress,
  onUseCurrentLocation,
  loading,
}: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) onSetByAddress(text.trim());
  }

  return (
    <div className="central-point">
      <h3>Central point</h3>
      {centralPoint ? (
        <p className="central-point__current">📍 {centralPoint.label}</p>
      ) : (
        <p className="central-point__empty">Not set yet.</p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a starting address…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Set
        </button>
      </form>
      <button
        type="button"
        className="central-point__geolocate"
        onClick={onUseCurrentLocation}
        disabled={loading}
      >
        Use my current location
      </button>
    </div>
  );
}
