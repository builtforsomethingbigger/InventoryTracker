"use client";

import { useCallback, useEffect, useState } from "react";

type InventoryItem = {
  rowIndex: number;
  itemName: string;
  quantity: number;
  price: number;
};

const emptyForm = { itemName: "", quantity: "", price: "" };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setItems(data);
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
      itemName: form.itemName,
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    const res = await fetch("/api/inventory", {
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

  function startEdit(item: InventoryItem) {
    setEditing(item);
    setForm({
      itemName: item.itemName,
      quantity: String(item.quantity),
      price: String(item.price),
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="text-sm font-medium">
          {editing ? "Edit Item" : "Add Item"}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            placeholder="Item name"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            placeholder="Quantity"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
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
              <th className="px-4 py-3 font-medium">Item Name</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Price</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No items yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.rowIndex} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{item.itemName}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-sm text-accent hover:text-accent-hover"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
