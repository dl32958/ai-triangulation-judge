import { useState } from "react";
import { runPipelineFromPath, runPipelineUpload } from "./api";

const DEFAULT_DOC_CATEGORY = "receipt";
const DEFAULT_FIELDS = "company,date,address,total,phone number";

function parseFields(fieldsText) {
  return fieldsText
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
}

export default function App() {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [imagePath, setImagePath] = useState("../data/dev/X00016469612.jpg");
  const [docCategory, setDocCategory] = useState(DEFAULT_DOC_CATEGORY);
  const [fieldsText, setFieldsText] = useState(DEFAULT_FIELDS);
  const [debug, setDebug] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data =
        mode === "upload"
          ? await runPipelineUpload({ file, docCategory, fieldsText, debug })
          : await runPipelineFromPath({
              imagePath,
              docCategory,
              fields: parseFields(fieldsText),
              debug
            });
      setResult(data);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <h1>Triangulation Judgment</h1>
        <p className="hint">Minimal API integration shell.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Input mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="upload">Upload file</option>
              <option value="path">Use image_path</option>
            </select>
          </label>

          {mode === "upload" ? (
            <label>
              Upload image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <label>
              image_path
              <input
                type="text"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
              />
            </label>
          )}

          <label>
            doc_category
            <input
              type="text"
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
            />
          </label>

          <label>
            fields
            <input
              type="text"
              value={fieldsText}
              onChange={(e) => setFieldsText(e.target.value)}
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
            />
            debug
          </label>

          <button type="submit" disabled={loading || (mode === "upload" && !file)}>
            {loading ? "Running..." : "Run Pipeline"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Response</h2>
        <pre>{result ? JSON.stringify(result, null, 2) : "No result yet."}</pre>
      </section>
    </main>
  );
}
