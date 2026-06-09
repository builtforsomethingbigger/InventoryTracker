"use client";

import { useEffect, useState } from "react";

type LowStockItem = {
  itemName: string;
  quantity: number;
  price: number;
};

export default function DashboardPage() {
  const [monthlySales, setMonthlySales] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMonthlySales(data.monthlySales);
          setLowStock(data.lowStock);
        }
        setLoading(false);
      });
  }, []);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-muted">{monthName} Sales</p>
            <p className="mt-1 text-3xl font-semibold">
              ${monthlySales?.toFixed(2) ?? "0.00"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium">Low Stock Alert</h2>
            <p className="mt-0.5 text-xs text-muted">
              Items with quantity below 10
            </p>

            {lowStock.length === 0 ? (
              <p className="mt-4 text-sm text-muted">All items are well stocked.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {lowStock.map((item) => (
                  <li
                    key={item.itemName}
                    className="flex items-center justify-between py-2.5 first:pt-0"
                  >
                    <span className="text-sm font-medium">{item.itemName}</span>
                    <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-medium text-danger">
                      {item.quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
