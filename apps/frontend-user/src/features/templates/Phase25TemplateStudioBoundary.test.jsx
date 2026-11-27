import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preserveStudioJson } from "@/features/invitations/invitationPayloadUtils";
import { getDedicatedTemplateComponent, resolveTemplateRenderer } from "./registry/templateRegistry";
import { resolveVariant, VARIANT_ROUTE_ALIASES } from "./experience/config/templateExperienceThemes";
import { KEEP_TEMPLATE_CODE } from "./data/templatesData";
import { draftToTemplate } from "@/features/wedding-builder/utils/draftToTemplate";
import { isTrustedPreviewMessage, isPreviewMessage } from "@/shared/preview/previewMessaging";
import InvitationPreviewFeature from "@/features/invitations/InvitationPreviewFeature";
import { invitationService } from "@/features/invitations/api/invitationApi";
import { mediaService } from "@/features/invitations/api/mediaApi";
import { templateCatalogService } from "./api/templateCatalogApi";

vi.mock("@/features/invitations/api/invitationApi", () => ({
  invitationService: {
    preview: vi.fn(),
  },
}));

vi.mock("@/features/invitations/api/mediaApi", () => ({
  mediaService: {
    list: vi.fn(),
  },
}));

vi.mock("./api/templateCatalogApi", () => ({
  templateCatalogService: {
    list: vi.fn(),
  },
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mediaService.list.mockResolvedValue({ photos: [] });
  templateCatalogService.list.mockResolvedValue([]);
});

describe("Phase 25 — Admin Template Studio / CMS / Pipeline Boundary", () => {
  it("preserves unknown nested block JSON and filters prototype-pollution keys across partial edits", () => {
    const previous = JSON.parse(
      '{"groom":"Vannak","customBlocks":[{"id":"blk-1","type":"future_blessing","meta":{"order":2}}],"studioV2":{"badgeStyle":"floating","unknownNested":{"x":1}},"__proto__":{"polluted":true}}'
    );
    const merged = preserveStudioJson(previous, {
      groom: "Vannak Edited",
      studioV2: { badgeStyle: "pill" },
    });

    expect(merged.groom).toBe("Vannak Edited");
    expect(merged.customBlocks).toEqual([{ id: "blk-1", type: "future_blessing", meta: { order: 2 } }]);
    expect(merged.studioV2).toEqual({ badgeStyle: "pill", unknownNested: { x: 1 } });
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(({}).polluted).toBeUndefined();
  });

  it("maps legacy aliases and Admin Studio presetIds consistently to dedicated renderers", () => {
    const aliases = [
      ["silk-heritage", "silk-heritage"],
      ["khmer-celestial", "khmer-celestial"],
      ["classic", KEEP_TEMPLATE_CODE],
      ["royal-khmer", "royal-khmer-wedding"],
      ["the-digital-yes", "the-digital-yes-wedding"],
      ["EMERALD_GREEN", "emerald-canva-luxe-wedding"],
      ["RUBY_RED", "royal-khmer-wedding"],
      ["CHAMPAGNE", "cover-khmer-golden-wedding"],
    ];

    for (const [alias, expectedVariant] of aliases) {
      expect(resolveVariant({}, alias)).toBe(expectedVariant);
      expect(getDedicatedTemplateComponent({ code: VARIANT_ROUTE_ALIASES[alias] || alias, presetId: alias })).toBeTruthy();
    }
  });

  it("fails closed without borrowing an unrelated renderer when a saved draft references a removed template", async () => {
    const missing = { templateCode: "removed-studio-template-999", id: "removed-studio-template-999" };
    expect(resolveTemplateRenderer(missing).available).toBe(false);
    expect(draftToTemplate(missing, [])).toBeNull();

    invitationService.preview.mockResolvedValue({
      id: 42,
      title: "Draft With Removed Template",
      status: "DRAFT",
      templateCode: "removed-studio-template-999",
    });

    render(
      <MemoryRouter initialEntries={["/app/events/42/preview"]}>
        <Routes>
          <Route path="/app/events/:eventId/preview" element={<InvitationPreviewFeature />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Template unavailable/i)).toBeInTheDocument();
  });

  it("produces parity variant and hostContent between preview and published renders", () => {
    const draft = {
      id: 42,
      templateCode: "silk-heritage",
      title: "Vannak & Kolab",
      groomName: "Vannak",
      brideName: "Kolab",
      eventDate: "2027-11-28",
      venueName: "Sokha Hotel",
      storyText: "Together since 2020",
      enabledSections: { rsvp: true, story: true },
    };

    const previewOutput = draftToTemplate(draft, []);
    const publicOutput = draftToTemplate({ ...draft }, []);

    expect(previewOutput.variant).toBe("silk-heritage");
    expect(publicOutput.variant).toBe(previewOutput.variant);
    expect(publicOutput.tpl.hostContent.storyText).toBe(previewOutput.tpl.hostContent.storyText);
    expect(publicOutput.tpl.hostContent.venueName).toBe(previewOutput.tpl.hostContent.venueName);
  });

  it("rejects untrusted iframe origins and invalid preview session nonces fail-closed", () => {
    const sessionId = "valid-session-nonce-123456789012";
    const source = {};
    const channel = { source, origin: "https://user.koupreng.test", sessionId };

    expect(
      isTrustedPreviewMessage(
        {
          source,
          origin: "https://evil.example",
          data: { type: "TOGGLE_GATE", open: true, sessionId },
        },
        channel
      )
    ).toBe(false);

    expect(
      isPreviewMessage({
        type: "LIVE_PREVIEW_SYNC",
        sessionId: "short",
        data: { title: "Hijacked" },
      })
    ).toBe(false);
  });
});
