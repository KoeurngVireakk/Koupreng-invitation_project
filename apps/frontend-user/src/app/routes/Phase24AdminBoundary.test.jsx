import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { isPublicCatalogTemplate } from "@/features/templates/model/catalogPolicy";
import { accessFailure, safeReturnTo } from "@/shared/access/accessDecision";
import AccessFailureState from "@/shared/access/AccessFailureState";
import ProfileFeature from "@/features/auth/ProfileFeature";
import { userService } from "@/features/auth/api/userApi";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      fullName: "Customer User",
      email: "customer@example.test",
      role: "SUPER_ADMIN",
      adminNote: "INTERNAL_MODERATION_ONLY",
      auditLogId: "AUD-999",
    },
    logout: vi.fn(),
    updateUser: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock("@/features/auth/api/userApi", () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadProfileImage: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/features/auth/components/SocialAuthButtons", () => ({
  default: () => <div data-testid="social-auth-buttons" />,
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  useLanguageStore.setState({ lang: "en" });
  userService.getProfile.mockResolvedValue({
    fullName: "Customer User",
    phone: "012345678",
    role: "SUPER_ADMIN",
    adminNote: "INTERNAL_MODERATION_ONLY",
  });
});

describe("Phase 24 — Admin Platform Compatibility Boundary", () => {
  it("excludes admin-disabled or non-ACTIVE catalog entries from public catalog listing", () => {
    expect(isPublicCatalogTemplate({ id: 5, code: "silk-heritage", status: "ACTIVE" })).toBe(true);
    expect(isPublicCatalogTemplate({ id: 5, code: "silk-heritage", status: "INACTIVE" })).toBe(false);
    expect(isPublicCatalogTemplate({ id: 5, code: "silk-heritage", status: "DRAFT" })).toBe(false);
    expect(isPublicCatalogTemplate({ id: 5, code: "silk-heritage", status: "ARCHIVED" })).toBe(false);
  });

  it("blocks /admin redirects and keeps safeReturnTo restricted to customer routes", () => {
    expect(safeReturnTo("/admin/users")).toBe("/app/events");
    expect(safeReturnTo("/admin/audit-logs")).toBe("/app/events");
    expect(safeReturnTo("//evil.test/admin")).toBe("/app/events");
    expect(safeReturnTo("/app/packages")).toBe("/app/packages");
  });

  it("maps 403/404 access errors cleanly without rendering internal admin or moderation metadata", () => {
    const decision = accessFailure(
      {
        status: 403,
        data: {
          code: "PACKAGE_FEATURE_REQUIRED",
          details: { feature: "SEATING" },
          moderationNote: "Flagged by admin #42",
          auditTrace: "internal-stack",
        },
      },
      { feature: "SEATING" }
    );
    expect(decision).toEqual({ reason: "PACKAGE_FEATURE_REQUIRED", feature: "SEATING" });

    render(
      <AccessFailureState
        error={{ status: 403, message: "Forbidden" }}
        feature="SEATING"
      />
    );
    expect(screen.queryByText(/Flagged by admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal-stack/i)).not.toBeInTheDocument();
  });

  it("never exposes admin roles or internal moderation strings inside customer profile UI", async () => {
    render(<ProfileFeature />);
    await screen.findByRole("heading", { name: /Your profile/i });
    expect(screen.queryByText(/SUPER_ADMIN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/INTERNAL_MODERATION_ONLY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AUD-999/i)).not.toBeInTheDocument();
  });
});
