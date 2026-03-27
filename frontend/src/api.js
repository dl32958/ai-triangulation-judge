export async function runPipelineUpload({ file, docCategory, fieldsText, debug }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_category", docCategory);
  formData.append("fields", fieldsText);
  formData.append("debug", String(debug));

  const response = await fetch("/pipeline/run", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Upload pipeline request failed");
  }

  return response.json();
}

export async function runPipelineFromPath({ imagePath, docCategory, fields, debug }) {
  const response = await fetch("/pipeline/run-from-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_path: imagePath,
      doc_category: docCategory,
      fields,
      debug
    })
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Path pipeline request failed");
  }

  return response.json();
}
