"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";

type InventoryItem = {
  itemName: string;
  quantity: number;
  price: number;
};

export function TransactionModal({
  open,
  onClose,
  clientName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
  onSuccess: () => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      });
    setItemName("");
    setQuantity("1");
    setPrice("");
    setError("");
  }, [open]);

  useEffect(() => {
    const item = items.find((i) => i.itemName === itemName);
    if (item) setPrice(String(item.price));
  }, [itemName, items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        itemName,
        quantity: Number(quantity),
        price: Number(price),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to record transaction");
      return;
    }

    onSuccess();
    onClose();
  }

  const selectedItem = items.find((i) => i.itemName === itemName);

  return (
    <Modal open={open} onClose={onClose} title={`Log Transaction — ${clientName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Item</label>
          <select
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.itemName} value={item.itemName}>
                {item.itemName} (stock: {item.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min="1"
              max={selectedItem?.quantity ?? undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {quantity && price && (
          <p className="text-sm text-muted">
            Total: ${(Number(quantity) * Number(price)).toFixed(2)}
          </p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Saving…" : "Record Sale"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
