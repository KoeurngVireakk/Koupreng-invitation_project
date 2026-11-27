import { safeCsvCell } from "@/features/guests/model/guestImport";

export function buildFilteredExpensesCsv(expenses = []) {
  const headers = [
    "Expense Item",
    "Vendor",
    "Category",
    "Currency",
    "Estimated Budget",
    "Actual Spent",
    "Date",
    "Status",
  ];

  const rows = expenses.map((item) => [
    safeCsvCell(item.name || item.itemName || ""),
    safeCsvCell(item.vendorName || ""),
    safeCsvCell(item.category || "Other"),
    safeCsvCell(item.currency || "USD"),
    safeCsvCell(Number(item.budget ?? item.estimatedCost ?? 0)),
    safeCsvCell(Number(item.amount ?? item.actualCost ?? 0)),
    safeCsvCell(item.date || item.expenseDate || ""),
    safeCsvCell((item.status || "pending").toUpperCase()),
  ]);

  const byCurrency = new Map();
  for (const item of expenses) {
    const currency = item.currency || "USD";
    const entry = byCurrency.get(currency) || { budget: 0, spent: 0 };
    entry.budget += Number(item.budget ?? item.estimatedCost ?? 0) || 0;
    entry.spent += Number(item.amount ?? item.actualCost ?? 0) || 0;
    byCurrency.set(currency, entry);
  }

  for (const [currency, totals] of byCurrency.entries()) {
    rows.push([
      safeCsvCell(`Subtotal (${currency})`),
      safeCsvCell(""),
      safeCsvCell("Summary (no currency mixing)"),
      safeCsvCell(currency),
      safeCsvCell(totals.budget),
      safeCsvCell(totals.spent),
      safeCsvCell(""),
      safeCsvCell(""),
    ]);
  }

  return "\uFEFF" + [headers.map(safeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export function exportFilteredExpensesCsv(expenses = [], eventTitle = "expenses") {
  if (!expenses.length) return false;
  const csv = buildFilteredExpensesCsv(expenses);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = String(eventTitle || "expenses")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, "_");
  const stamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `expenses_filtered_${slug}_${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
