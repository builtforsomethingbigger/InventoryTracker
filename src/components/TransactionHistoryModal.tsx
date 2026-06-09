"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";

type Transaction = {
  rowIndex: number;
  transactionDate: string;
  clientName: string;
  itemName: string;
  quantity: number;
  price: number;
  totalCost: number;
};

export function TransactionHistoryModal({
  open,
  onClose,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`/api/transactions?clientName=${encodeURIComponent(clientName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) setError(data.error);
        else if (Array.isArray(data)) setTransactions(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [open, clientName]);

  const total = transactions.reduce((s, t) => s + (t.totalCost || 0), 0);

  return (
    <Modal open={open} onClose={onClose} title={`Transactions — ${clientName}`}>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted">No transactions for this client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.rowIndex} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{t.transactionDate}</td>
                    <td className="px-3 py-2">{t.itemName}</td>
                    <td className="px-3 py-2">{t.quantity}</td>
                    <td className="px-3 py-2">${t.price.toFixed(2)}</td>
                    <td className="px-3 py-2">${(t.totalCost || (t.price * t.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="flex justify-end">
            <p className="text-sm font-medium">Grand Total: ${total.toFixed(2)}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
