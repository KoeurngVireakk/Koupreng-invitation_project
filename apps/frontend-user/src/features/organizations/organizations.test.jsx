import { useLanguageStore } from "@/stores/useLanguageStore";
import { cleanup, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);
beforeEach(() => useLanguageStore.setState({ lang: "en" }));
import OrganizationCard from "./components/OrganizationCard";
import MemberTable from "./components/MemberTable";
import RoleBadge from "./components/RoleBadge";
import { canManageOrganization } from "./model/organizationPermissions";

describe("Organization Feature Module", () => {
  it("fails closed when ownership data is missing", () => {
    expect(canManageOrganization(undefined, 101)).toBe(false);
    expect(canManageOrganization(101, undefined)).toBe(false);
    expect(canManageOrganization(101, "101")).toBe(true);
  });

  describe("RoleBadge", () => {
    it("renders role badges with normalized role names", () => {
      render(<RoleBadge role="CHECK_IN_STAFF" />);
      expect(screen.getByText("CHECK IN STAFF")).toBeInTheDocument();
    });

    it("defaults to VIEWER role if unprovided", () => {
      render(<RoleBadge role="" />);
      expect(screen.getByText("VIEWER")).toBeInTheDocument();
    });
  });

  describe("OrganizationCard", () => {
    it("renders organization details and workspace link", () => {
      const sampleOrg = {
        id: 12,
        name: "Koupreng Planners",
        slug: "koupreng-planners",
        status: "ACTIVE",
        members: [{ id: 1 }, { id: 2 }],
      };

      render(
        <BrowserRouter>
          <OrganizationCard organization={sampleOrg} />
        </BrowserRouter>
      );

      expect(screen.getByText("Koupreng Planners")).toBeInTheDocument();
      expect(screen.getByText("@koupreng-planners")).toBeInTheDocument();
      expect(screen.getByText("2 Members")).toBeInTheDocument();
      expect(screen.getByText(/Workspace/i)).toBeInTheDocument();
    });

  });

  describe("MemberTable", () => {
    it("renders organization members and protects owner action buttons", () => {
      const sampleMembers = [
        {
          id: 1,
          userId: 101,
          email: "owner@koupreng.com",
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: 2,
          userId: 102,
          email: "staff@koupreng.com",
          role: "CHECK_IN_STAFF",
          status: "ACTIVE",
          joinedAt: "2026-02-01T00:00:00Z",
        },
      ];

      const handleEdit = vi.fn();
      const handleRemove = vi.fn();

      render(
        <MemberTable
          members={sampleMembers}
          ownerUserId={101}
          currentUserId={101}
          onEditRole={handleEdit}
          onRemove={handleRemove}
          isOwner={true}
        />
      );

      expect(screen.getByText("owner@koupreng.com")).toBeInTheDocument();
      expect(screen.getByText("staff@koupreng.com")).toBeInTheDocument();
      expect(screen.getByText(/owner protected/i)).toBeInTheDocument();
      expect(screen.getAllByText("CHECK IN STAFF").length).toBeGreaterThan(0);
      expect(screen.queryByText(/👑/)).not.toBeInTheDocument();
    });

    it("explains INVITED, expired INVITED, revoked, and legacy unaccepted ACTIVE statuses", () => {
      render(
        <MemberTable
          ownerUserId={101}
          isOwner={true}
          onEditRole={vi.fn()}
          onRemove={vi.fn()}
          members={[
            {
              id: 1,
              userId: null,
              email: "invited@koupreng.com",
              role: "DESIGNER",
              status: "INVITED",
              invitedAt: "2026-11-25T00:00:00Z",
              inviteExpiresAt: "2099-01-01T00:00:00Z",
            },
            {
              id: 2,
              userId: null,
              email: "expired@koupreng.com",
              role: "CHECK_IN_STAFF",
              status: "INVITED",
              invitedAt: "2026-01-01T00:00:00Z",
              inviteExpiresAt: "2026-01-08T00:00:00Z",
            },
            {
              id: 3,
              userId: 103,
              email: "revoked@koupreng.com",
              role: "VIEWER",
              status: "REVOKED",
              invitedAt: "2026-01-15T00:00:00Z",
            },
            {
              id: 4,
              userId: 104,
              email: "legacy@koupreng.com",
              role: "MANAGER",
              status: "ACTIVE",
              joinedAt: "2026-01-05T00:00:00Z",
              inviteAcceptedAt: null,
            },
          ]}
        />
      );

      expect(screen.getAllByText(/Waiting for invitee to accept invitation code/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/This invitation is no longer valid/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/Event access needs a new accepted invitation/i).length).toBeGreaterThan(0);
    });

  });
});
