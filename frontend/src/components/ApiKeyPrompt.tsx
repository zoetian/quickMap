import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (key: string) => void;
  /** "quota": the shared demo key hit its daily Cloud Console limit.
   *  "none": there's no demo key configured at all (e.g. local dev). */
  reason?: "quota" | "none";
}

export function ApiKeyPrompt({ onSubmit, reason = "none" }: Props) {
  const [key, setKey] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (key.trim()) onSubmit(key.trim());
  }

  return (
    <div className="landing landing--static">
      <div className="landing__content">
        <div className="hero-card">
          <h1 className="hero-card__title">QuickMap</h1>
          <p className="hero-card__subtitle">
            {reason === "quota"
              ? "You've used up today's free demo searches — add your own free key to keep going."
              : "Find the shortest route to visit a list of addresses."}
          </p>
          <form className="api-key-prompt" onSubmit={handleSubmit}>
            <label htmlFor="api-key-input">Your Google Maps API key</label>
            <input
              id="api-key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="AIza…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
            <button type="submit">Continue</button>
          </form>
          <p className="api-key-prompt__hint">
            QuickMap runs entirely in your browser, so it needs a key to call
            Google Maps — yours is stored only in this browser
            (<code>localStorage</code>) and never sent anywhere else. Don't
            have one? See{" "}
            <a
              href="https://github.com/zoetian/quickMap#bring-your-own-google-maps-api-key"
              target="_blank"
              rel="noreferrer"
            >
              how to get a free key
            </a>{" "}
            (takes about 5 minutes).
          </p>
        </div>
      </div>
    </div>
  );
}
