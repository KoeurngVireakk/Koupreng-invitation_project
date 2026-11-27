import { useLanguageStore } from "@/stores/useLanguageStore";
import { budgetMoney, isMixedBudget } from "../currencyTotals";

export default function BudgetProgress({ budget }) {
  const isEn = useLanguageStore((state) => state.lang) === "en";
  if (!budget) return null;
  if (isMixedBudget(budget)) {
    return (
      <p role="status">
        {isEn
          ? "Budget comparison unavailable: USD and KHR amounts remain separate. The budget goal currency is not recorded; no exchange rate is applied."
          : "មិនអាចប្រៀបធៀបថវិកាបានទេ៖ ចំនួនទឹកប្រាក់ USD និង KHR ត្រូវរក្សាដាច់ដោយឡែកពីគ្នា។ មិនមានការអនុវត្តអត្រាប្តូរប្រាក់ទេ។"}
      </p>
    );
  }
  const money = (value) => budgetMoney(value, budget.currency || "USD");

  const total = Number(budget.totalBudget || 0);
  const actual = Number(budget.totalActual || budget.totalSpent || 0);
  const isOver = budget.overBudget || (total > 0 && actual > total);
  const percentage = total > 0 ? Math.min(Math.round((actual / total) * 100), 100) : 0;
  const overAmount = actual - total;

  return (
    <div className={`budget-progress-card${isOver ? " is-over" : ""}`}>
      <div className="budget-progress-header">
        <strong className="budget-progress-title">
          {isOver
            ? isEn
              ? `Over budget by ${money(overAmount)}`
              : `លើសថវិកាចំនួន ${money(overAmount)}`
            : isEn
            ? "Budget Progress"
            : "វឌ្ឍនភាពថវិកា"}
        </strong>
        <span className="budget-progress-ratio">
          {money(actual)} / {money(total)} ({percentage}%)
        </span>
      </div>

      <div
        className="budget-progress-track"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isEn ? "Budget Progress" : "វឌ្ឍនភាពថវិកា"}
      >
        <div className="budget-progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
