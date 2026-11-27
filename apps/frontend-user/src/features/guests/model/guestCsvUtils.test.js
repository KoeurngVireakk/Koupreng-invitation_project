import { afterEach, describe, expect, it, vi } from "vitest";
import { exportDeliveryReportCsv, exportGuestsToCsv } from "./guestCsvUtils";

describe("guestCsvUtils CSV sanitization and exports", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function captureDownloadedCsv() {
    let capturedBlob = null;
    const createObjectURL = vi.fn((blob) => {
      capturedBlob = blob;
      return "blob:mock-csv";
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === "a") el.click = click;
      return el;
    });
    return {
      readCsvText: async () => await capturedBlob.text(),
      click,
      revokeObjectURL,
    };
  }

  it("exports guests with UTF-8 BOM, sanitized formula injection cells, and Owner Private Note header", async () => {
    const { readCsvText, click, revokeObjectURL } = captureDownloadedCsv();
    const result = exportGuestsToCsv(
      [
        {
          name: "=HYPERLINK(\"http://evil\",\"Click\")",
          phone: "+1-555-0100",
          email: "@admin@example.com",
          group: "VIP",
          side: "Bride",
          tableNumber: "-2",
          rsvpStatus: "Attending",
          seatCount: 2,
          note: "Private gift info",
        },
      ],
      "Sokha & Dara"
    );
    expect(result).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-csv");

    const raw = await readCsvText();
    expect(raw).toContain("Owner Private Note");
    expect(raw).toContain("\"'=HYPERLINK");
    expect(raw).toContain("\"'+1-555-0100\"");
    expect(raw).toContain("\"'@admin@example.com\"");
    expect(raw).toContain("\"'-2\"");
  });

  it("exports delivery report with neutralized error formulas and returns false when empty", async () => {
    expect(exportDeliveryReportCsv([], "Empty")).toBe(false);
    const { readCsvText } = captureDownloadedCsv();
    const result = exportDeliveryReportCsv(
      [
        {
          guestName: "សុខ ដារ៉ា",
          phone: "012345678",
          email: "dara@example.com",
          sendStatus: "FAILED",
          lastSentAt: "2026-11-27T08:00:00Z",
          responded: false,
          lastSendError: "=cmd|' /C calc'!A0",
        },
      ],
      "Delivery Audit"
    );
    expect(result).toBe(true);
    const raw = await readCsvText();
    expect(raw).toContain("Send Status");
    expect(raw).toContain("\"'=cmd|' /C calc'!A0\"");
  });
});
