import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export function UrlCrawlForm({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  }

  return (
    <form className="url-form" onSubmit={handleSubmit}>
      <input
        className="url-form__input"
        type="url"
        placeholder="Paste a page URL to scan for addresses…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button className="url-form__submit" type="submit" disabled={loading}>
        {loading ? "Scanning…" : "Scan"}
      </button>
    </form>
  );
}
