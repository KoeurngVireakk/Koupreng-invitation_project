import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { paymentService } from "./paymentService";
import PaymentSuccessPage from "./PaymentSuccessPage";

vi.mock("./paymentService", () => ({
  paymentService: { getTemplateOrder: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useLanguageStore.setState({ lang: "en" });
});

afterEach(() => {
  cleanup();
});

it("keeps CONFIRMED orders in non-unlocked verification state until backend confirms PAID", async () => {
  paymentService.getTemplateOrder.mockResolvedValue({
    orderCode: "ORD-CONF-1",
    templateName: "Royal Khmer",
    status: "CONFIRMED",
  });

  render(
    <MemoryRouter initialEntries={["/payments/return?orderCode=ORD-CONF-1"]}>
      <Routes>
        <Route path="/payments/return" element={<PaymentSuccessPage />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
    /verifying template access/i
  );
  expect(screen.queryByRole("link", { name: "Go to paid templates" })).toBeNull();
  expect(screen.getByRole("button", { name: "Copy reference" })).toBeInTheDocument();
});

it("renders unlocked link and verified heading only when backend confirms PAID", async () => {
  paymentService.getTemplateOrder.mockResolvedValue({
    orderCode: "ORD-PAID-1",
    templateName: "Royal Khmer",
    status: "PAID",
  });

  render(
    <MemoryRouter initialEntries={["/payments/return?orderCode=ORD-PAID-1"]}>
      <Routes>
        <Route path="/payments/return" element={<PaymentSuccessPage />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
    /Payment verified — template unlocked!/i
  );
  expect(screen.getByRole("link", { name: "Go to paid templates" })).toBeInTheDocument();
});
