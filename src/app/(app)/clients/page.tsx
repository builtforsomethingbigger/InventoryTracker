"use client";

import { useCallback, useEffect, useState } from "react";
import { TransactionModal } from "@/components/TransactionModal";
import { TransactionHistoryModal } from "@/components/TransactionHistoryModal";

type Client = {
  rowIndex: number;
  clientName: string;
  phoneNumber: string;
  email: string;
};

const emptyForm = { clientName: "", phoneNumber: "", email: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [txClient, setTxClient] = useState<string | null>(null);
  const [txHistoryClient, setTxHistoryClient] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClients(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      clientName: form.clientName,
      phoneNumber: form.phoneNumber,
      email: form.email,
    };

    const res = await fetch("/api/clients", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editing ? { ...payload, rowIndex: editing.rowIndex } : payload
      ),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }

    setForm(emptyForm);
    setEditing(null);
    load();
  }

  function startEdit(client: Client) {
    setEditing(client);
    setForm({
      clientName: client.clientName,
      phoneNumber: client.phoneNumber,
      email: client.email,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="text-sm font-medium">
          {editing ? "Edit Client" : "Add Client"}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            placeholder="Client name"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone number"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Client Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No clients yet.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.rowIndex}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setTxHistoryClient(client.clientName)}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      {client.clientName}
                    </button>
                  </td>
                  <td className="px-4 py-3">{client.phoneNumber || "—"}</td>
                  <td className="px-4 py-3">{client.email || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setTxClient(client.clientName)}
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        Log Sale
                      </button>
                      <button
                        onClick={() => startEdit(client)}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TransactionModal
        open={!!txClient}
        onClose={() => setTxClient(null)}
        clientName={txClient ?? ""}
        onSuccess={load}
      />

      <TransactionHistoryModal
        open={!!txHistoryClient}
        onClose={() => setTxHistoryClient(null)}
        clientName={txHistoryClient ?? ""}
      />
    </div>
  );
}
