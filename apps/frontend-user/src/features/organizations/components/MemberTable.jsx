import { useUiCopy } from "@/shared/i18n/useUiCopy";
import { Crown } from "lucide-react";
import { IoPencilOutline, IoTrashOutline, IoPersonOutline } from "react-icons/io5";
import { ResponsiveTable, StatusBadge } from "@/shared/ui";
import RoleBadge from "./RoleBadge";

function formatMemberDate(value, locale) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(locale);
}

export default function MemberTable({
  members = [],
  ownerUserId,
  onEditRole,
  onRemove,
  isOwner,
}) {
  const uiCopy = useUiCopy();
  const locale = uiCopy("km-KH", "en-US");
  return (
    <ResponsiveTable ariaLabel={uiCopy("តារាងសមាជិកក្រុម", "Organization members table")}>
      <thead>
        <tr>
          <th>{uiCopy("សមាជិក", "Member")}</th>
          <th>{uiCopy("តួនាទី", "Role")}</th>
          <th>{uiCopy("ស្ថានភាព", "Status")}</th>
          <th>{uiCopy("កាលបរិច្ឆេទចូលរួម", "Joined date")}</th>
          {isOwner && <th>{uiCopy("សកម្មភាព", "Actions")}</th>}
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          const isMemberOwner =
            member.role === "OWNER" ||
            (member.userId && String(member.userId) === String(ownerUserId));
          const normalizedStatus = (member.status || "ACTIVE").toUpperCase();

          return (
            <tr key={member.id}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="k-org-member-avatar">
                    <IoPersonOutline aria-hidden="true" />
                  </div>
                  <div>
                    <strong className="k-org-member-email">{member.email}</strong>
                    {isMemberOwner && (
                      <span className="k-org-owner-tag">
                        <Crown size={12} aria-hidden="true" />
                        <span>{uiCopy("ម្ចាស់", "Owner")}</span>
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <RoleBadge role={member.role} />
              </td>
              <td>
                <StatusBadge status={normalizedStatus} />
                {!isMemberOwner && normalizedStatus === "PENDING" && (
                  <p className="k-org-invite-status-note">
                    {uiCopy("កំពុងរង់ចាំសមាជិកទទួលយកកូដអញ្ជើញ។", "Waiting for invitee to accept invitation code.")}
                  </p>
                )}
                {!isMemberOwner && (normalizedStatus === "EXPIRED" || normalizedStatus === "REVOKED") && (
                  <p className="k-org-invite-status-note">
                    {uiCopy("ការអញ្ជើញនេះមិនមានសុពលភាពទៀតទេ។ សូមបង្កើតកូដថ្មីប្រសិនបើត្រូវការ។", "This invitation is no longer valid. Issue a new code if access is still needed.")}
                  </p>
                )}
                {!isMemberOwner && normalizedStatus === "ACTIVE" && !member.inviteAcceptedAt && !member.joinedAt && (
                  <p className="k-org-invite-status-note">
                    {uiCopy("សិទ្ធិកម្មវិធីត្រូវការការអញ្ជើញថ្មី និងការទទួលយក។", "Event access needs a new accepted invitation.")}
                  </p>
                )}
              </td>
              <td className="k-org-member-date">
                {member.joinedAt
                  ? formatMemberDate(member.joinedAt, locale)
                  : member.invitedAt
                  ? `${uiCopy("បានអញ្ជើញ", "Invited")} ${formatMemberDate(member.invitedAt, locale)}`
                  : "—"}
              </td>
              {isOwner && (
                <td>
                  {!isMemberOwner ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="k-org-action-btn edit"
                        onClick={() => onEditRole(member)}
                        title={uiCopy("ប្តូរតួនាទី", "Change role")}
                        aria-label={uiCopy("ប្តូរតួនាទី", "Change role")}
                      >
                        <IoPencilOutline aria-hidden="true" />
                        <span>{uiCopy("ប្តូរតួនាទី", "Change role")}</span>
                      </button>
                      <button
                        type="button"
                        className="k-org-action-btn danger"
                        onClick={() => onRemove(member)}
                        title={uiCopy("ដកសមាជិកចេញ", "Remove member")}
                        aria-label={uiCopy("ដកសមាជិកចេញ", "Remove member")}
                      >
                        <IoTrashOutline aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <span className="k-org-owner-protected">
                      {uiCopy("មិនអាចដកម្ចាស់ចេញ", "Owner protected")}
                    </span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </ResponsiveTable>
  );
}
