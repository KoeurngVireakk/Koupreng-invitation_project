import {
    IoPeopleOutline,
    IoStarOutline,
    IoStatsChartOutline,
    IoWalletOutline,
} from "react-icons/io5";
import { budgetMoney } from "@/features/budget/currencyTotals";

export function GiftStatsCards({ gifts = [], t }) {
    const groups = gifts.reduce((result, gift, index) => {
        const currency = gift.currency || "USD";
        const amount = Number(gift.amount) || 0;
        const contributorKey = gift.guestId != null
            ? `guest:${gift.guestId}`
            : `gift:${gift.id ?? index}`;
        const group = result[currency] ||= { total: 0, contributors: new Map() };
        group.total += amount;
        group.contributors.set(contributorKey, (group.contributors.get(contributorKey) || 0) + amount);
        return result;
    }, {});
    const contributorCount = new Set(gifts.map((gift, index) => gift.guestId != null
        ? `guest:${gift.guestId}`
        : `gift:${gift.id ?? index}`)).size;
    const amountParts = (kind) => Object.entries(groups).map(([currency, group]) => {
        const contributorAmounts = [...group.contributors.values()];
        const value = kind === "total"
            ? group.total
            : kind === "average"
                ? group.total / contributorAmounts.length
                : Math.max(...contributorAmounts);
        if (Object.keys(groups).length === 1 && currency === "USD") return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        return budgetMoney(value, currency);
    });
    const renderAmount = (kind) => {
        const parts = amountParts(kind);
        if (!parts.length) return "$0";
        if (parts.length === 1) return parts[0];
        return parts.map((part) => <span className="wg-sum-currency-line" key={part}>{part}</span>);
    };

    return (
        <div className="wg-summary">
            <div className="wg-sum-card wg-sum-total">
                <div className="wg-sum-icon"><IoWalletOutline aria-hidden="true" /></div>
                <div>
                    <span className="wg-sum-label">{t ? t("sumTotal") : "Total Gifts"}</span>
                    <span className="wg-sum-value wg-sum-value--stacked">{renderAmount("total")}</span>
                </div>
            </div>
            <div className="wg-sum-card">
                <div className="wg-sum-icon"><IoPeopleOutline aria-hidden="true" /></div>
                <div>
                    <span className="wg-sum-label">{t ? t("sumCount") : "Contributors"}</span>
                    <span className="wg-sum-value">{t ? t("countPersons", { count: contributorCount }) : `${contributorCount}`}</span>
                </div>
            </div>
            <div className="wg-sum-card">
                <div className="wg-sum-icon"><IoStatsChartOutline aria-hidden="true" /></div>
                <div>
                    <span className="wg-sum-label">{t ? t("sumAverage") : "Average"}</span>
                    <span className="wg-sum-value wg-sum-value--stacked">{renderAmount("average")}</span>
                </div>
            </div>
            <div className="wg-sum-card">
                <div className="wg-sum-icon"><IoStarOutline aria-hidden="true" /></div>
                <div>
                    <span className="wg-sum-label">{t ? t("sumMax") : "Highest"}</span>
                    <span className="wg-sum-value wg-sum-value--stacked">{renderAmount("max")}</span>
                </div>
            </div>
        </div>
    );
}

export default GiftStatsCards;
