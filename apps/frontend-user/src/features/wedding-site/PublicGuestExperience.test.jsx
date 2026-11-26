import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publicInvitationToDraft } from "../wedding-builder/utils/invitationDraftAdapter";
import { draftToTemplate } from "../wedding-builder/utils/draftToTemplate";
import CoverBackground from "../templates/shared/Openings/CoverBackground";

const mocks = vi.hoisted(() => ({
  auth: { current: { user: null, isAuthenticated: false } },
  publicBySlug: vi.fn(),
  listMine: vi.fn(),
  verifyPublicAccess: vi.fn(),
  publicGuestView: vi.fn(),
  publicMedia: vi.fn(),
  publicCinematicContent: vi.fn(),
  listTemplates: vi.fn(),
  publicWishes: vi.fn(),
  submitPublic: vi.fn(),
  submitPublicWithToken: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => mocks.auth.current,
}));

vi.mock("@/features/invitations/api/invitationApi", () => ({
  invitationService: {
    listMine: mocks.listMine,
    publicBySlug: mocks.publicBySlug,
    verifyPublicAccess: mocks.verifyPublicAccess,
    publicGuestView: mocks.publicGuestView,
  },
}));

vi.mock("@/features/invitations/api/mediaApi", () => ({
  mediaService: {
    publicBySlug: mocks.publicMedia,
    publicCinematicContent: mocks.publicCinematicContent,
  },
}));

vi.mock("@/features/templates/api/templateCatalogApi", () => ({
  templateCatalogService: { list: mocks.listTemplates },
}));

vi.mock("@/features/rsvp/api/rsvpApi", () => ({
  rsvpService: {
    publicWishes: mocks.publicWishes,
    submitPublic: mocks.submitPublic,
    submitPublicWithToken: mocks.submitPublicWithToken,
  },
}));

// Keep the authority/locale tests focused on PublicInvitationFeature. The real
// engine owns its own test surface; the guest shell only has to preserve the
// identity of the RSVP subtree.
vi.mock("@/features/templates/experience/TemplateExperience", () => ({
  default: ({ tpl, children }) => createElement(
    "div",
    { "data-testid": "public-template", "data-code": tpl?.code },
    createElement("span", { "data-testid": "public-template-title" }, tpl?.title),
    children,
  ),
}));

import PublicInvitationFeature from "./PublicInvitationFeature";

afterEach(cleanup);

const enCopy = {
  title: "English celebration",
  groomName: "Dara",
  brideName: "Sophea",
  hostName: "Dara",
  partnerName: "Sophea",
  messageText: "Please join our celebration.",
  venueName: "Grand Hall",
  venueAddress: "Phnom Penh",
  eventDateText: "20 December 2027",
};
const kmCopy = {
  title: "ពិធីសាកល្បង",
  groomName: "តារា",
  brideName: "សុភា",
  hostName: "តារា",
  partnerName: "សុភា",
  messageText: "សូមអញ្ជើញចូលរួម។",
  venueName: "រោងធំ",
  venueAddress: "ភ្នំពេញ",
  eventDateText: "២០ ធ្នូ ២០២៧",
};

function makeInvitation({ slug = "slug-a", id = "inv-public", kmTitle = kmCopy.title, enTitle = enCopy.title, overrides = {} } = {}) {
  const content = {
    ...kmCopy,
    title: kmTitle,
    localizedContentV1: {
      version: 1,
      km: { ...kmCopy, title: kmTitle },
      en: { ...enCopy, title: enTitle },
      enabledLocales: ["km", "en"],
      defaultLocale: "km",
    },
  };
  return {
    id,
    slug,
    title: kmTitle,
    status: "PUBLISHED",
    templateCode: "event-essential",
    languageMode: "KH",
    contentJson: JSON.stringify(content),
    enabledSections: JSON.stringify({ rsvp: true, gallery: false, gift: false }),
    ...overrides,
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function renderPublicRoute(initialEntry, path = "/w/:slug") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={path} element={<PublicInvitationFeature />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.auth.current = { user: null, isAuthenticated: false };
  mocks.publicBySlug.mockReset();
  mocks.publicBySlug.mockRejectedValue(Object.assign(new Error("Invitation not found"), { status: 404 }));
  mocks.listMine.mockReset();
  mocks.listMine.mockResolvedValue([]);
  mocks.verifyPublicAccess.mockReset();
  mocks.publicGuestView.mockReset();
  mocks.publicGuestView.mockResolvedValue(null);
  mocks.publicMedia.mockReset();
  mocks.publicMedia.mockResolvedValue(null);
  mocks.publicCinematicContent.mockReset();
  mocks.publicCinematicContent.mockResolvedValue(null);
  mocks.listTemplates.mockReset();
  mocks.listTemplates.mockResolvedValue([]);
  mocks.publicWishes.mockReset();
  mocks.publicWishes.mockResolvedValue([]);
  mocks.submitPublic.mockReset();
  mocks.submitPublicWithToken.mockReset();
});

describe("Phase 08 Public Guest Experience & Photo Mapping", () => {
  it("maps couplePhoto and coverFocalPoint in publicInvitationToDraft", () => {
    const rawInvitation = {
      id: "inv-888",
      slug: "channa-sophea",
      title: "Channa & Sophea Wedding",
      coverUrl: "https://example.com/channa-sophea.jpg",
      contentJson: JSON.stringify({
        couplePhoto: "https://example.com/channa-sophea.jpg",
        coverFocalPoint: "top",
        groomName: "Channa",
        brideName: "Sophea",
      }),
      designJson: JSON.stringify({
        coverFocalPoint: "top",
      }),
      templateCode: "khmer-floral-gold",
    };

    const draft = publicInvitationToDraft(rawInvitation, null);
    expect(draft.couplePhoto).toBe("https://example.com/channa-sophea.jpg");
    expect(draft.coverFocalPoint).toBe("top");
  });

  it("forwards couplePhoto and coverFocalPoint through draftToTemplate", () => {
    const draft = {
      id: "inv-888",
      templateCode: "bliss-editorial-wedding",
      title: "Vogue Wedding",
      coverImage: "https://example.com/hero.jpg",
      couplePhoto: "https://example.com/hero.jpg",
      coverFocalPoint: "top",
      couple: { groom: "Dara", bride: "Bopha" },
      enabledSections: { rsvp: true },
    };

    const result = draftToTemplate(draft);
    expect(result).not.toBeNull();
    expect(result.tpl.couplePhoto).toBe("https://example.com/hero.jpg");
    expect(result.tpl.coverFocalPoint).toBe("top");
    expect(result.tpl.hostContent.couplePhoto).toBe("https://example.com/hero.jpg");
    expect(result.tpl.hostContent.coverFocalPoint).toBe("top");
  });

  it("applies focal point positioning (objectPosition) in CoverBackground", () => {
    const content = {
      templateCode: "bliss-editorial-wedding",
      couplePhoto: "https://example.com/bliss-cover.jpg",
      coverFocalPoint: "top",
    };

    const { container } = render(
      <CoverBackground
        content={content}
        templateDefault={{ src: "/default.jpg", type: "image" }}
      />
    );

    const img = container.querySelector("img.cover-bg-media");
    expect(img).toBeInTheDocument();
    expect(img.style.objectPosition).toBe("50% 15%");
  });

  it("preserves decorative artwork for silk-heritage in CoverBackground", () => {
    const content = {
      templateCode: "silk-heritage",
      couplePhoto: "https://example.com/owner-photo.jpg",
      coverFocalPoint: "center",
    };

    const { container } = render(
      <CoverBackground
        content={content}
        templateDefault={{ src: "/templates/silk-heritage/silk-tapestry.webp", type: "image" }}
      />
    );

    const img = container.querySelector("img.cover-bg-media");
    expect(img).toBeInTheDocument();
    // Default silk tapestry must be preserved, not overwritten by couplePhoto
    expect(img.src).toContain("/templates/silk-heritage/silk-tapestry.webp");
  });

  it("renders public state unavailable view when invitation is not found or unpublished", async () => {
    render(
      <MemoryRouter initialEntries={["/w/non-existent-slug"]}>
        <PublicInvitationFeature />
      </MemoryRouter>
    );

    // Initial loading or not found state
    expect(
      await screen.findByText(/រកសន្លឹកការមិនឃើញ|សន្លឹកការមិនទាន់បានផ្សព្វផ្សាយ|Loading/i)
    ).toBeInTheDocument();
  });
});

describe("Phase 16 public guest authority", () => {
  it("never grants owner chrome from location.state alone", async () => {
    mocks.auth.current = { user: { id: 7 }, isAuthenticated: true };
    mocks.listMine.mockResolvedValue([]); // authenticated, but not the owner of this slug
    mocks.publicBySlug.mockRejectedValue(Object.assign(new Error("Invitation not found"), { status: 404 }));

    const { container } = renderPublicRoute({
      pathname: "/w/owner-hint",
      state: { backTo: "/dashboard" },
    });

    await screen.findByRole("heading", { name: /Invitation unavailable|រកសន្លឹកការមិនឃើញ/ });
    await waitFor(() => expect(mocks.listMine).toHaveBeenCalled());
    // The old code treated state.backTo === "/dashboard" as ownership.
    expect(container.querySelector('a[href="/dashboard"]')).toBeNull();
    expect(screen.queryByText(/Go to Dashboard|ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង/)).toBeNull();
  });

  it("does not render an ownerless local draft on the public /w/:slug route", async () => {
    localStorage.setItem("koupreng.wedding.drafts", JSON.stringify({
      "wed-leak": {
        id: "wed-leak",
        ownerUserId: null,
        slug: "local-leak",
        title: "Local Leak Title",
        templateId: "silk-heritage",
        templateCode: "silk-heritage",
        status: "PUBLISHED",
        published: true,
        couple: { groom: "Leak Groom", bride: "Leak Bride" },
        enabledSections: { rsvp: false },
        extras: { languageMode: "en" },
      },
    }));
    mocks.publicBySlug.mockRejectedValue(Object.assign(new Error("Invitation not found"), { status: 404 }));

    const { container } = renderPublicRoute("/w/local-leak");

    await screen.findByRole("heading", { name: /Invitation unavailable|រកសន្លឹកការមិនឃើញ/ });
    expect(container.querySelector('[data-testid="public-template"]')).toBeNull();
    expect(screen.queryByText("Local Leak Title")).toBeNull();
    expect(screen.queryByText("Leak Groom")).toBeNull();
  });

  it("keeps a typed RSVP draft mounted across a ?lang= switch", async () => {
    mocks.publicBySlug.mockResolvedValue(makeInvitation());

    const { container, unmount } = renderPublicRoute("/w/slug-a?lang=km");

    const textarea = await waitFor(() => {
      const node = container.querySelector(".pub-rsvp-form textarea");
      expect(node).toBeTruthy();
      return node;
    });
    const shell = screen.getByTestId("public-template");

    fireEvent.change(textarea, { target: { value: "Retained private guest message" } });
    expect(textarea).toHaveValue("Retained private guest message");

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    // No loading state, no remount: the same form node keeps the guest's text.
    expect(screen.getByTestId("public-template")).toBe(shell);
    expect(container.querySelector(".pub-rsvp-form textarea")).toBe(textarea);
    expect(textarea).toHaveValue("Retained private guest message");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    // A locale switch is a view transform, not a new identity fetch.
    expect(mocks.publicBySlug).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("ignores a stale response for slug A after switching to slug B", async () => {
    const first = deferred();
    const invitationA = makeInvitation({ slug: "slug-a", kmTitle: "A Guest Secret" });
    const invitationB = makeInvitation({ slug: "slug-b", kmTitle: "B Guest Title" });
    mocks.publicBySlug.mockImplementation((requestedSlug) => (
      requestedSlug === "slug-a" ? first.promise : Promise.resolve(invitationB)
    ));

    render(
      <MemoryRouter initialEntries={["/w/slug-a"]}>
        <Link to="/w/slug-b">go to b</Link>
        <Routes>
          <Route path="/w/:slug" element={<PublicInvitationFeature />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("go to b"));

    expect(await screen.findByText("B Guest Title")).toBeInTheDocument();

    await act(async () => {
      first.resolve(invitationA);
      await first.promise;
    });

    // The slow slug-A response must never paint over slug B.
    expect(screen.queryByText("A Guest Secret")).toBeNull();
    expect(screen.getByText("B Guest Title")).toBeInTheDocument();
  });
});
