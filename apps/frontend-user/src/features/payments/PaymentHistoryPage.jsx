import { PageSkeleton } from '@/shared/ui/LoadingState';
import { useUiCopy } from "@/shared/i18n/useUiCopy";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../enterprise/EnterprisePages.css";
import paymentService from "./paymentService";
import { StatusBadge } from "@/shared/ui";
import { packagePrice } from "../marketing/model/packagePresentation";

function money(amount, currency, lang) {
    return packagePrice({ price: amount, currency }, lang) || (lang === "en" ? "Amount unavailable" : "មិនមានចំនួនទឹកប្រាក់");
}

function dateTime(value, lang) {
    if (!value) return "—";
    return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function PaymentHistoryPage() {
  const uiCopy = useUiCopy();
    const [payments, setPayments] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setPayments(await paymentService.paymentHistory());
        } catch (err) {
            setError(err.message || "Could not load payments");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return <main className="enterprise-page"><PageSkeleton layout="table" /></main>;
    }

    const visiblePayments = payments.filter((payment) => {
        if (statusFilter === "ALL") return true;
        if (statusFilter === "PAID") return payment.status === "PAID";
        if (statusFilter === "PENDING") return ["PENDING", "CREATED", "QR_CREATED", "CHECKOUT_CREATED", "PAID_PENDING_REVIEW", "CONFIRMED"].includes(payment.status);
        return ["FAILED", "CANCELLED", "EXPIRED", "REJECTED"].includes(payment.status);
    });

    return (
        <main className="enterprise-page">
            <header className="enterprise-head">
                <div>
                    <span className="enterprise-eyebrow">{uiCopy("ការទូទាត់", "Payments")}</span>
                    <h1>{uiCopy("ប្រវត្តិការទូទាត់", "Payment history")}</h1>
                    <p>{uiCopy("ពិនិត្យការទូទាត់គំរូ ការបញ្ជាទិញកំពុងរង់ចាំ និងបង្កាន់ដៃ។ ចំនួនទឹកប្រាក់ត្រូវបានបង្ហាញតាមរូបិយប័ណ្ណដើម (USD ឬ KHR) ដោយមិនបូកបញ្ចូលគ្នា។", "Review template payments, pending orders, and receipts. Amounts remain in their original order currency (USD or KHR).")}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <select
                        aria-label={uiCopy("ត្រងតាមស្ថានភាព", "Filter by status")}
                        className="enterprise-btn secondary"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">{uiCopy("ទាំងអស់", "All orders")}</option>
                        <option value="PAID">{uiCopy("បានបង់ប្រាក់", "Verified / Paid")}</option>
                        <option value="PENDING">{uiCopy("កំពុងរង់ចាំ / ពិនិត្យ", "Pending / Review")}</option>
                        <option value="CLOSED">{uiCopy("ផុតកំណត់ / បរាជ័យ", "Expired / Failed")}</option>
                    </select>
                    <button type="button" className="enterprise-btn secondary" onClick={load}>
                        {uiCopy("ផ្ទុកឡើងវិញ", "Refresh")}
                    </button>
                </div>
            </header>

            {error && <div className="enterprise-error">{error}</div>}

            <section className="enterprise-panel">
                {visiblePayments.length ? (
                    <div className="enterprise-table-wrap" tabIndex={0} role="region" aria-label={uiCopy("ប្រវត្តិការទូទាត់", "Payment history")}>
                        <table className="enterprise-table">
                            <thead>
                                <tr><th>{uiCopy("ការបញ្ជាទិញ", "Order")}</th><th>{uiCopy("មុខទំនិញ", "Item")}</th><th>{uiCopy("ស្ថានភាព", "Status")}</th><th>{uiCopy("ចំនួនទឹកប្រាក់", "Amount")}</th><th>{uiCopy("បានបង្កើត", "Created")}</th><th></th></tr>
                            </thead>
                            <tbody>
                                {visiblePayments.map((payment) => (
                                    <tr key={payment.orderCode}>
                                        <td>{payment.orderCode}</td>
                                        <td>
                                            <strong>{payment.templateName || payment.packageName || "Payment"}</strong>
                                            <div className="enterprise-muted">{payment.itemType || payment.packageName}</div>
                                        </td>
                                        <td><StatusBadge status={payment.status} /></td>
                                        <td>{money(payment.paidAmount ?? payment.amount, payment.currency, uiCopy("km", "en"))}</td>
                                        <td>{dateTime(payment.createdAt, uiCopy("km", "en"))}</td>
                                        <td><Link className="enterprise-btn secondary" to={`/dashboard/payments/${payment.orderCode}`}>{uiCopy("បង្កាន់ដៃ", "Receipt")}</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="enterprise-empty">{uiCopy("មិនទាន់មានការបញ្ជាទិញទេ។", "No payment orders yet.")}</div>
                )}
            </section>
        </main>
    );
}
