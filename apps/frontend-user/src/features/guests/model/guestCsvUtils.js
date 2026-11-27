/**
 * Guest & Delivery CSV Export and Import Utilities
 * Supports UTF-8 BOM encoding for Khmer Unicode text display in Microsoft Excel
 * and sanitizes spreadsheet formula injection via safeCsvCell.
 */
import { safeCsvCell } from "./guestImport";

function triggerCsvDownload(headers, rows, filePrefix, eventTitle) {
  const csvContent = "\uFEFF" + [headers.map(safeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedTitle = (eventTitle || "wedding")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, "_");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filePrefix}_${sanitizedTitle}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportGuestsToCsv(guests = [], eventTitle = "guests") {
  if (!guests.length) return false;

  const headers = [
    "ឈ្មោះភ្ញៀវ (Guest Name)",
    "លេខទូរស័ព្ទ (Phone)",
    "អ៊ីមែល (Email)",
    "ក្រុម (Group)",
    "ផ្នែក (Side)",
    "លេខតុ (Table)",
    "ស្ថានភាព RSVP (RSVP)",
    "ចំនួនអ្នកចូលរួម (Attendees)",
    "កំណត់ចំណាំឯកជន (Owner Private Note)",
  ];

  const rows = guests.map((g) => [
    safeCsvCell(g.name || g.guestName || ""),
    safeCsvCell(g.phone || ""),
    safeCsvCell(g.email || ""),
    safeCsvCell(g.group || g.guestGroup || ""),
    safeCsvCell(g.side || g.sideType || ""),
    safeCsvCell(g.tableNumber || g.seat || ""),
    safeCsvCell(g.rsvpStatus || (g.attending ? "Attending" : "Pending")),
    safeCsvCell(g.seatCount || g.pax || g.count || 1),
    safeCsvCell(g.note || g.wishes || ""),
  ]);

  return triggerCsvDownload(headers, rows, "guests", eventTitle);
}

export function exportDeliveryReportCsv(guests = [], eventTitle = "delivery-report") {
  if (!guests.length) return false;

  const headers = [
    "Guest Name",
    "Phone",
    "Email",
    "Send Status",
    "Last Sent At",
    "Responded",
    "Last Send Error",
  ];

  const rows = guests.map((g) => [
    safeCsvCell(g.guestName || g.name || ""),
    safeCsvCell(g.phone || ""),
    safeCsvCell(g.email || ""),
    safeCsvCell(g.sendStatus || "PENDING"),
    safeCsvCell(g.lastSentAt || ""),
    safeCsvCell(g.responded ? "YES" : "NO"),
    safeCsvCell(g.lastSendError || ""),
  ]);

  return triggerCsvDownload(headers, rows, "delivery_report", eventTitle);
}

export function exportRsvpsToCsv(rsvps = [], eventTitle = "rsvp-responses") {
  if (!rsvps.length) return false;

  const headers = [
    "Guest Name",
    "Phone",
    "Response Status",
    "Attendee Count",
    "Responded At",
    "Wish / Message",
  ];

  const rows = rsvps.map((r) => [
    safeCsvCell(r.guestName || r.name || ""),
    safeCsvCell(r.phone || ""),
    safeCsvCell(r.responseStatus || r.status || "PENDING"),
    safeCsvCell(r.pendingInvitation ? 0 : (r.attendeeCount ?? r.partySize ?? 0)),
    safeCsvCell(r.respondedAt || r.updatedAt || r.createdAt || ""),
    safeCsvCell(r.wish || r.message || ""),
  ]);

  return triggerCsvDownload(headers, rows, "rsvps", eventTitle);
}

export function downloadSampleGuestTemplateCsv() {
  const sampleHeaders = [
    "ឈ្មោះភ្ញៀវ",
    "លេខទូរស័ព្ទ",
    "អ៊ីមែល",
    "ក្រុម",
    "ផ្នែក",
    "លេខតុ",
  ];

  const sampleRows = [
    ['"ជា វណ្ណដា"', '"012345678"', '"vanda@example.com"', '"មិត្តភក្តិ"', '"ខាងកូនកំលោះ"', '"01"'],
    ['"សុខ ស្រីពេជ្រ"', '"098765432"', '"sreypich@example.com"', '"សាច់ញាតិ"', '"ខាងកូនក្រមុំ"', '"02"'],
    ['"ហេង សុវណ្ណ"', '"077123456"', '"heng@example.com"', '"ភ្ញៀវកិត្តិយស VIP"', '"ខាងកូនកំលោះ"', '"VIP-A"'],
  ];

  const csvContent = "\uFEFF" + [sampleHeaders.join(","), ...sampleRows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "sample_guests_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseGuestCsvText(text) {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  let startIndex = 0;
  const firstLineLower = lines[0].toLowerCase();
  if (
    firstLineLower.includes("name") ||
    firstLineLower.includes("ឈ្មោះ") ||
    firstLineLower.includes("phone") ||
    firstLineLower.includes("លេខ")
  ) {
    startIndex = 1;
  }

  const results = [];
  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const regex = /(?:^|,)("(?:[^"]+|"")*"|[^,]*)/g;
    const parts = [];
    let match;
    while ((match = regex.exec(rawLine)) !== null) {
      let val = match[1] || "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      parts.push(val.trim());
    }

    const name = parts[0] || "";
    if (!name) continue;

    results.push({
      name,
      phone: parts[1] || "",
      email: parts[2] && parts[2].includes("@") ? parts[2] : "",
      group: parts[3] || "Groom Side",
      side: parts[4] || "Groom",
      tableNumber: parts[5] || "",
      category: parts[3] || "General",
    });
  }

  return results;
}
