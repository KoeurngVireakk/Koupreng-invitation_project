import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

function BrowserRouter({ children }) { return <MemoryRouter initialEntries={["/app/events/1"]}><Routes><Route path="/app/events/:eventId" element={children} /></Routes></MemoryRouter>; }
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ExpensesFeature from "./ExpensesFeature";
import { expensesApi } from "./api/expensesApi";
import { toExpensePayload } from "./hooks/useExpenses";
import { buildFilteredExpensesCsv, exportFilteredExpensesCsv } from "./expenseCsv";

describe("Expenses Feature", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders expenses overview with summary totals and expense records", async () => {
        vi.spyOn(expensesApi, "listMineInvitations").mockResolvedValue([
            { id: 1, name: "Wedding", status: "PUBLISHED" },
        ]);

        vi.spyOn(expensesApi, "listExpenses").mockResolvedValue([
            {
                id: 1,
                itemName: "Venue Rental",
                category: "Venue & Transport",
                estimatedCost: 2000,
                actualCost: 2000,
                status: "PAID",
                expenseDate: "2026-11-20",
                vendorName: "Grand Ballroom",
            },
            {
                id: 2,
                itemName: "Wedding Cake",
                category: "Food & Catering",
                estimatedCost: 300,
                actualCost: 350,
                status: "PENDING",
                expenseDate: "2026-11-20",
                vendorName: "Sweet Bakery",
            },
        ]);

        render(
            <BrowserRouter>
                <ExpensesFeature />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Venue Rental")).toBeInTheDocument();
            expect(screen.getByText("Wedding Cake")).toBeInTheDocument();
            expect(screen.getByText("Grand Ballroom")).toBeInTheDocument();
            expect(screen.getByText("$2,300")).toBeInTheDocument();
        });
    });

    it("opens add expense modal on add button click", async () => {
        vi.spyOn(expensesApi, "listMineInvitations").mockResolvedValue([
            { id: 1, name: "Wedding", status: "PUBLISHED" },
        ]);

        vi.spyOn(expensesApi, "listExpenses").mockResolvedValue([]);

        render(
            <BrowserRouter>
                <ExpensesFeature />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /បន្ថែមចំណាយ|Add Expense/i })).toBeInTheDocument();
        });

        const addBtn = screen.getByRole("button", { name: /បន្ថែមចំណាយ|Add Expense/i });
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /បោះបង់|Cancel/i })).toBeInTheDocument();
        });
    });

    it("derives totals and payment progress from installment rows", async () => {
        vi.spyOn(expensesApi, "listMineInvitations").mockResolvedValue([
            { id: 1, name: "Wedding", status: "PUBLISHED" },
        ]);
        vi.spyOn(expensesApi, "listExpenses").mockResolvedValue([]);

        render(
            <BrowserRouter>
                <ExpensesFeature />
            </BrowserRouter>
        );

        const addExpenseButton = await screen.findByRole("button", { name: /បន្ថែមចំណាយ|Add Expense/i });
        fireEvent.click(addExpenseButton);

        fireEvent.change(screen.getByLabelText(/ថវិកាគ្រោង|Estimated Budget/i), { target: { value: "100" } });

        const actualInput = screen.getByLabelText(/ចំណាយពិត|Actual Amount/i);
        const remainingInput = screen.getByLabelText(/នៅខ្វះ|Remaining Balance/i);
        expect(actualInput).toHaveAttribute("readonly");
        expect(actualInput).toHaveValue(0);
        expect(remainingInput).toHaveValue(100);

        fireEvent.click(screen.getByRole("button", { name: /បន្ថែមការបង់ប្រាក់|Add Payment/i }));
        fireEvent.change(screen.getByRole("dialog").querySelector(".exp-payment-amount"), { target: { value: "40" } });
        fireEvent.change(screen.getByRole("dialog").querySelector(".exp-payment-date"), { target: { value: "2026-11-20" } });

        expect(actualInput).toHaveValue(40);
        expect(remainingInput).toHaveValue(60);
        expect(screen.getByRole("dialog").querySelector(".exp-payment-progress-track")).toHaveAttribute("aria-valuenow", "40");
        expect(screen.getByRole("dialog").querySelector(".exp-payment-status").textContent).toMatch(/Partial|បង់បានខ្លះ/);
        expect(screen.getByRole("dialog").querySelector(".exp-payment-date")).toHaveValue("2026-11-20");

        fireEvent.change(screen.getByRole("dialog").querySelector(".exp-payment-amount"), { target: { value: "125" } });
        expect(actualInput).toHaveValue(125);
        expect(remainingInput).toHaveValue(-25);
        expect(screen.getByRole("alert").textContent).toMatch(/exceed|លើសពីថវិកា/);
    });

    it("persists dates and totals only valid nonnegative installment amounts", () => {
        const payload = toExpensePayload({
            name: "Catering",
            budget: "100",
            date: "2026-11-20",
            payments: [
                { desc: "Deposit", amount: "30", date: "2026-10-01" },
                { desc: "Invalid", amount: "not a number", date: "" },
                { desc: "Negative", amount: "-5", date: "" },
            ],
        });

        expect(payload.amount).toBe(30);
        expect(payload.status).toBe("PENDING");
        expect(JSON.parse(payload.notes).payments[0]).toEqual({
            desc: "Deposit",
            amount: "30",
            date: "2026-10-01",
        });
        expect(toExpensePayload({ name: "No payments", budget: "0", payments: [] }).status).toBe("PENDING");
    });

    it("filters mixed USD/KHR records by currency and exports formula-safe filtered CSV with separate subtotals", async () => {
        vi.spyOn(expensesApi, "listMineInvitations").mockResolvedValue([
            { id: 1, name: "Wedding", status: "PUBLISHED" },
        ]);
        vi.spyOn(expensesApi, "listExpenses").mockResolvedValue([
            { id: 1, itemName: "Catering", category: "Food & Catering", estimatedCost: 2000, actualCost: 1500, currency: "USD", status: "PENDING" },
            { id: 2, itemName: "Lotus Arch", category: "Decor & Flowers", estimatedCost: 1200000, actualCost: 1500000, currency: "KHR", status: "PAID" },
        ]);

        render(
            <BrowserRouter>
                <ExpensesFeature />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Catering")).toBeInTheDocument();
            expect(screen.getByText("Lotus Arch")).toBeInTheDocument();
        });

        const currencySelect = screen.getByLabelText(/តម្រៀបតាមរូបិយប័ណ្ណ|Filter by currency/i);
        fireEvent.change(currencySelect, { target: { value: "KHR" } });

        expect(screen.queryByText("Catering")).not.toBeInTheDocument();
        expect(screen.getByText("Lotus Arch")).toBeInTheDocument();

        const csv = buildFilteredExpensesCsv([
            { name: "=SUM(A1:A2)", vendorName: "@EvilVendor", category: "Food & Catering", currency: "USD", budget: 100, amount: 80, status: "PENDING" },
            { name: "Floral", vendorName: "Flora", category: "Decor & Flowers", currency: "KHR", budget: 400000, amount: 400000, status: "PAID" },
        ]);
        expect(csv.startsWith("\uFEFF")).toBe(true);
        expect(csv).toContain("\"'=SUM(A1:A2)\"");
        expect(csv).toContain("\"'@EvilVendor\"");
        expect(csv).toContain("\"Subtotal (USD)\"");
        expect(csv).toContain("\"Subtotal (KHR)\"");
    });

    it("guards CSV quotes, commas, CR/LF newlines, USD float precision, and empty export sets", () => {
        expect(exportFilteredExpensesCsv([], "EmptyEvent")).toBe(false);

        const csv = buildFilteredExpensesCsv([
            { name: "Stage \"Main\", Hall\r\nSetup", vendorName: "\t+1+1", category: "Decor & Flowers", currency: "USD", budget: 12.3, amount: 0.1, status: "PENDING" },
            { name: "Lighting", vendorName: "\n-2*3", category: "Decor & Flowers", currency: "USD", budget: 0.1, amount: 0.2, status: "PAID" },
        ]);

        expect(csv).toContain("\"Stage \"\"Main\"\", Hall\r\nSetup\"");
        expect(csv).toContain("\"'\t+1+1\"");
        expect(csv).toContain("\"'\n-2*3\"");
        expect(csv).toContain("\"Subtotal (USD)\",\"\",\"Summary (no currency mixing)\",\"USD\",\"12.4\",\"0.3\"");
    });
});
