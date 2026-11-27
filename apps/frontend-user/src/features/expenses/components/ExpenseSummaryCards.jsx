import {
    IoCashOutline,
    IoStatsChartOutline,
    IoTimeOutline,
    IoWalletOutline,
    IoWarningOutline,
} from "react-icons/io5";

export function ExpenseSummaryCards({ totalBudget = 0, totalSpent = 0, isOver, diff = 0, percent = 0, byCurrency = {}, currencyCode, t }) {
    if (Object.keys(byCurrency).length > 1) return <div>{Object.entries(byCurrency).map(([currency, totals]) =>
        <section key={currency} aria-label={`${currency} expense summary`}><h3>{currency}</h3><ExpenseSummaryCards {...totals} currencyCode={currency} t={t} /></section>
    )}</div>;
    const money = (value) => `${currencyCode === "KHR" ? "KHR " : currencyCode && Object.keys(byCurrency).length === 0 ? "USD " : "$"}${Number(value ?? 0).toLocaleString()}`;
    return (
        <div className="exp-summary">
            <div className="exp-sum-card exp-sum-total">
                <div className="exp-sum-icon"><IoWalletOutline aria-hidden="true" /></div>
                <div>
                    <span className="exp-sum-label">{t ? t("sumTotal") : "Total Budget Planned"}</span>
                    <span className="exp-sum-value">{money(totalBudget)}</span>
                </div>
            </div>
            <div className="exp-sum-card">
                <div className="exp-sum-icon"><IoCashOutline aria-hidden="true" /></div>
                <div>
                    <span className="exp-sum-label">{t ? t("sumSpent") : "Total Actual Spent"}</span>
                    <span className="exp-sum-value">{money(totalSpent)}</span>
                </div>
            </div>
            <div className={`exp-sum-card ${isOver ? "exp-sum-over" : ""}`}>
                <div className="exp-sum-icon">
                    {isOver ? <IoWarningOutline aria-hidden="true" /> : <IoTimeOutline aria-hidden="true" />}
                </div>
                <div>
                    <span className="exp-sum-label">
                        {isOver ? (t ? t("sumOverBudget") : "Over Budget") : (t ? t("sumRemaining") : "Remaining Budget")}
                    </span>
                    <span className={`exp-sum-value${isOver ? " is-over" : ""}`}>
                        {isOver ? `+${money(diff)}` : money(diff)}
                    </span>
                </div>
            </div>
            <div className="exp-sum-card">
                <div className="exp-sum-icon"><IoStatsChartOutline aria-hidden="true" /></div>
                <div style={{ flex: 1 }}>
                    <span className="exp-sum-label">{t ? t("sumPercent") : "Budget Used %"}</span>
                    <span className="exp-sum-value">{percent ?? 0}%</span>
                    <div
                        className="exp-progress-track"
                        role="progressbar"
                        aria-valuenow={Math.min(percent ?? 0, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t ? t("sumPercent") : "Budget Used %"}
                    >
                        <div
                            className={`exp-progress-fill${isOver ? " is-over" : ""}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpenseSummaryCards;
