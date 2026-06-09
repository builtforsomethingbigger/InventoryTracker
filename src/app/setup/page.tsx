"use client";

import { useState } from "react";
import { Providers } from "@/components/Providers";

const TEMPLATE = `Create a Google Sheet with these 3 tabs and header rows:

Tab "Inventory":     Item Name | Quantity | Price
Tab "Clients":       Client Name | Phone Number | Email
Tab "Transactions":  Transaction Date | Client Name | Item Name | Quantity | Price | Total Cost`;

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Unexpected server response. Refresh the page and try again."
    );
  }
}

function SetupForm() {
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);

  async function handleValidate() {
    setValidating(true);
    setErrors([]);
    setValidated(false);

    try {
      const res = await fetch("/api/spreadsheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl: url }),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setErrors([String(data.error || "Validation failed")]);
        return;
      }

      if (data.valid) {
        setValidated(true);
        setErrors([]);
      } else {
        setErrors((data.errors as string[]) || ["Validation failed"]);
      }
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Validation failed",
      ]);
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    setSaving(true);
    setErrors([]);

    try {
      const res = await fetch("/api/spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl: url }),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setErrors([String(data.error || "Failed to connect")]);
        return;
      }

      window.location.href = "/";
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Failed to connect",
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Setup</h1>
        <p className="mt-2 text-sm text-muted">
          Link your Google Sheet to get started.
        </p>

        <pre className="mt-6 whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-xs text-muted">
          {TEMPLATE}
        </pre>

        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium">Spreadsheet URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setValidated(false);
              setErrors([]);
            }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
        </div>

        {errors.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-danger">
            {errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        )}

        {validated && (
          <p className="mt-4 text-sm text-green-600">
            Spreadsheet validated successfully.
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleValidate}
            disabled={!url || validating}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-card disabled:opacity-50"
          >
            {validating ? "Checking…" : "Validate"}
          </button>
          <button
            onClick={handleConnect}
            disabled={!url || saving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Connecting…" : "Connect Spreadsheet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Providers>
      <SetupForm />
    </Providers>
  );
}
