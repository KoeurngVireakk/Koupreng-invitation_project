import { PageSkeleton } from '@/shared/ui/LoadingState';
import { useUiCopy } from "@/shared/i18n/useUiCopy";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  IoPersonAddOutline,
  IoBriefcaseOutline,
  IoHomeOutline,
  IoChevronForwardOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoCalendarOutline,
} from "react-icons/io5";


import { Crown } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorState, toast } from "@/shared/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import QuotaProgress from '@/shared/access/QuotaProgress';
import { useAccountEntitlements } from '@/shared/access/entitlementContext';
import { useOrganizationMembers } from "./hooks/useOrganizationMembers";
import MemberTable from "./components/MemberTable";
import InviteMemberModal from "./components/InviteMemberModal";
import ChangeRoleModal from "./components/ChangeRoleModal";
import { ORGANIZATION_ROLES } from "./model/organizationConstants";
import { canManageOrganization } from "./model/organizationPermissions";
import "./OrganizationPage.css";

export default function OrganizationDetailPage() {
  const uiCopy = useUiCopy();
  const { organizationId } = useParams();
  const { user } = useAuth();
  const account = useAccountEntitlements();
  const {
    organization,
    members,
    loading,
    error,
    actionError,
    saving,
    loadOrganization,
    addMember,
    updateRole,
    removeMember,
  } = useOrganizationMembers(organizationId);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);

  const isOwner = canManageOrganization(organization?.ownerUserId, user?.id);

  const handleInvite = async (email, role) => {
    const success = await addMember(email, role);
    if (success) {
      toast.success(uiCopy("បានបង្កើតការអញ្ជើញ។ ចែករំលែកកូដជាឯកជន។", "Invitation created. Share the code privately."));
    }
    return success;
  };

  const handleUpdateRole = async (memberId, role) => {
    const success = await updateRole(memberId, role);
    if (success) {
      setEditingMember(null);
      toast.success(uiCopy("បានផ្លាស់ប្តូរតួនាទីសមាជិកជោគជ័យ", "Member role updated"));
    }
    return success;
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    const success = await removeMember(removingMember.id);
    if (success) {
      setRemovingMember(null);
      toast.success(uiCopy("បានដកសមាជិកចេញពីកន្លែងធ្វើការជោគជ័យ", "Member removed from workspace"));
    }
  };

  return (
    <div role="main" className="dash-main k-org-page">
      <div className="k-org-container">
        {isOwner && account.verified && <QuotaProgress usage={account.value?.quotas?.teamMembers} resource="teamMembers" scope="ACCOUNT" />}
        {/* Breadcrumb Navigation */}
        <nav className="k-org-breadcrumb" aria-label={uiCopy("ទីតាំងទំព័រ", "Breadcrumb")}>
          <Link to="/app/events" className="k-org-breadcrumb-link">
            <IoHomeOutline aria-hidden="true" />
            <span>{uiCopy("កម្មវិធីរបស់ខ្ញុំ", "My events")}</span>
          </Link>
          <IoChevronForwardOutline className="k-org-breadcrumb-sep" aria-hidden="true" />
          <Link to="/app/organizations" className="k-org-breadcrumb-link">
            <span>{uiCopy("ក្រុមការងារ", "Teams")}</span>
          </Link>
          <IoChevronForwardOutline className="k-org-breadcrumb-sep" aria-hidden="true" />
          <span className="k-org-breadcrumb-active">
            {organization?.name || uiCopy("ព័ត៌មានកន្លែងធ្វើការ", "Workspace details")}
          </span>
        </nav>

        {error ? (
          <ErrorState message={error} onRetry={loadOrganization} />
        ) : loading && !organization ? (
        <PageSkeleton layout="list" />
      ) : !organization ? (
        <EmptyState
          title={uiCopy("រកមិនឃើញកន្លែងធ្វើការនេះទេ", "Workspace not found")}
          description={uiCopy("កន្លែងធ្វើការនេះប្រហែលជាត្រូវបានលុប ឬអ្នកមិនមានសិទ្ធិចូលមើលឡើយ។", "This workspace may have been deleted or you no longer have access to it.")}
          actionLabel={uiCopy("ត្រឡប់ទៅបញ្ជីក្រុមការងារ", "Back to teams")}
          onAction={() => window.history.back()}
        />
      ) : (
          <>
            {actionError && (
              <div className="k-org-inline-alert" role="alert">
                {actionError}
              </div>
            )}
            {/* Header Banner */}
            <header className="k-org-header-banner">
              <div className="k-org-header-info">
                <div className="k-org-header-tag">
                  <IoBriefcaseOutline aria-hidden="true" />
                  <span>{uiCopy("ព័ត៌មានកន្លែងធ្វើការ", "WORKSPACE DETAILS")}</span>
                </div>
                <h1 className="k-org-header-title">
                  {organization.name}
                  <span className="k-org-badge-status">
                    <IoShieldCheckmarkOutline aria-hidden="true" /> {uiCopy(({ ACTIVE: "កំពុងដំណើរការ", INACTIVE: "អសកម្ម" })[organization.status || "ACTIVE"] || "មិនស្គាល់", organization.status || "ACTIVE")}
                  </span>
                </h1>
                <p className="k-org-header-desc">
                  {uiCopy("គ្រប់គ្រងសមាជិកក្រុម សិទ្ធិចូលប្រើប្រាស់ និងការសហការរៀបចំកម្មវិធីក្នុងកន្លែងធ្វើការ", "Manage team members, access permissions and event collaboration in your workspace")} <strong>@{organization.slug}</strong>
                </p>
              </div>

              <div className="k-org-header-actions">
                {isOwner && (
                  <button
                    type="button"
                    className="k-org-btn-create"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    <IoPersonAddOutline style={{ fontSize: "1.2rem" }} aria-hidden="true" />
                    <span>{uiCopy("អញ្ជើញសមាជិក", "Invite member")}</span>
                  </button>
                )}
              </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="k-org-stats-grid">
              <div className="k-org-stat-card">
                <div className="k-org-stat-icon">
                  <IoPeopleOutline aria-hidden="true" />
                </div>
                <div>
                  <span className="k-org-stat-label">{uiCopy("សមាជិកសរុប", "Total members")}</span>
                  <strong className="k-org-stat-value">{members.length} {uiCopy("នាក់", members.length === 1 ? "person" : "people")}</strong>
                </div>
              </div>

              <div className="k-org-stat-card">
                <div className="k-org-stat-icon">
                  <IoShieldCheckmarkOutline aria-hidden="true" />
                </div>
                <div>
                  <span className="k-org-stat-label">{uiCopy("សិទ្ធិគ្រប់គ្រងរបស់អ្នក", "Your access")}</span>
                  <strong className="k-org-stat-value k-org-stat-value--icon">
                    {isOwner ? (
                      <>
                        <Crown size={16} aria-hidden="true" />
                        <span>{uiCopy("ម្ចាស់កន្លែងធ្វើការ", "Workspace owner")}</span>
                      </>
                    ) : (
                      uiCopy("សមាជិកក្រុម", "Workspace member")
                    )}
                  </strong>
                </div>
              </div>

              <div className="k-org-stat-card">
                <div className="k-org-stat-icon">
                  <IoCalendarOutline aria-hidden="true" />
                </div>
                <div>
                  <span className="k-org-stat-label">{uiCopy("បង្កើតនៅថ្ងៃ", "Created at")}</span>
                  <strong className="k-org-stat-value">
                    {organization.createdAt && !Number.isNaN(new Date(organization.createdAt).getTime())
                      ? new Date(organization.createdAt).toLocaleDateString(uiCopy("km-KH", "en-US"))
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Members Section Card */}
            <section className="k-org-detail-card">
              <div className="k-org-section-header">
                <div>
                  <h2 className="k-org-section-title">
                    {uiCopy("បញ្ជីសមាជិកក្រុម", "Team members")}
                  </h2>
                  <p className="k-org-section-desc">
                    {uiCopy("អ្នករៀបចំការ បុគ្គលិកកត់ត្រាចងដៃ និងបុគ្គលិកកត់ត្រាវត្តមានក្នុងក្រុម", "Planners, gift recorders and check-in staff in your team")}
                  </p>
                </div>
                <span className="k-org-count-badge">{members.length} {uiCopy("សមាជិក", members.length === 1 ? "Member" : "Members")}</span>
              </div>

              {members.length === 0 ? (
                <EmptyState
                  title={uiCopy("មិនទាន់មានសមាជិកក្នុងក្រុមនៅឡើយទេ", "No team members yet")}
                  description={uiCopy("អញ្ជើញសហការី ឬបុគ្គលិកដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើមធ្វើការរួមគ្នា។", "Invite your first collaborator or staff member to start working together.")}
                  actionLabel={isOwner ? uiCopy("អញ្ជើញសមាជិកថ្មី", "Invite member") : undefined}
                  onAction={isOwner ? () => setInviteModalOpen(true) : undefined}
                />
              ) : (
                <div className="k-org-table-wrapper">
                  <MemberTable
                    members={members}
                    ownerUserId={organization.ownerUserId}
                    currentUserId={user?.id}
                    onEditRole={(m) => setEditingMember(m)}
                    onRemove={(m) => setRemovingMember(m)}
                    isOwner={isOwner}
                  />
                </div>
              )}
            </section>

            {/* Role Permissions Breakdown */}
            <section className="k-org-detail-card k-org-roles-guide" aria-label={uiCopy("សេចក្ដីពន្យល់តួនាទី និងសិទ្ធិ", "Role permissions guide")}>
              <div className="k-org-section-header">
                <div>
                  <h2 className="k-org-section-title">
                    {uiCopy("តួនាទី និងដែនកំណត់សិទ្ធិ", "Roles and permission boundaries")}
                  </h2>
                  <p className="k-org-section-desc">
                    {uiCopy("មានតែម្ចាស់កន្លែងធ្វើការប៉ុណ្ណោះ ដែលអាចគ្រប់គ្រងការផ្សព្វផ្សាយ ហិរញ្ញវត្ថុ ការទូទាត់ និងសមាជិកក្រុម។", "Only the workspace owner manages publishing, finances, payments, and team membership.")}
                  </p>
                </div>
              </div>
              <div className="k-org-roles-grid">
                {ORGANIZATION_ROLES.map((roleItem) => (
                  <article key={roleItem.value} className="k-org-role-card">
                    <strong>{uiCopy(roleItem.labelKm, roleItem.label)}</strong>
                    <p>{uiCopy(roleItem.descriptionKm, roleItem.description)}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Invite Member Modal */}
        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          saving={saving}
          onInvite={handleInvite}
          serverError={actionError}
        />

        {/* Change Role Modal */}
        <ChangeRoleModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          saving={saving}
          onUpdateRole={handleUpdateRole}
        />

        {/* Confirm Delete Member Dialog */}
        <ConfirmDialog
          isOpen={Boolean(removingMember)}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleRemoveMember}
          title={uiCopy("ដកសមាជិកចេញពីកន្លែងធ្វើការ", "Remove workspace member")}
          message={uiCopy(`តើអ្នកពិតជាចង់ដក ${removingMember?.email || "សមាជិកនេះ"} ចេញពីក្រុមការងារមែនទេ?`, `Remove ${removingMember?.email || "this member"} from the team?`)}
          confirmLabel={uiCopy("ដកសមាជិកចេញ", "Remove member")}
          cancelLabel={uiCopy("បោះបង់", "Cancel")}
          isDestructive={true}
          isLoading={saving}
        />
      </div>
    </div>
  );
}
