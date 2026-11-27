import { PageSkeleton, LoadingRegion } from '@/shared/ui/LoadingState';
import { Link, useParams } from "react-router-dom";
import { Download, Users } from "lucide-react";
import { useEventWorkspace } from "@/features/events/workspace/EventContext";
import { exportRsvpsToCsv } from "@/features/guests/model/guestCsvUtils";
import { useBackendMessages } from "@/shared/i18n/useBackendMessages";
import { useRsvpDashboard } from "./hooks/useRsvpDashboard";
import { RsvpKpiCards } from "./components/RsvpKpiCards";
import { RsvpWishesWall } from "./components/RsvpWishesWall";
import { RsvpGuestTable } from "./components/RsvpGuestTable";
import { ErrorState, toast } from "@/shared/ui";
import "./RsvpDashboardPage.css";

export default function RsvpDashboardPage() {
  const { eventId, invitationId = eventId } = useParams();
  const { text: t, lang } = useBackendMessages("rsvp");
  const en = lang === "en";
  const workspace = useEventWorkspace();
  const canManageGuests = workspace?.access
    ? workspace.access.owner === true || Boolean(workspace.access.permissions?.includes("MANAGE_GUESTS"))
    : workspace?.isOwner !== false;
  const {
    invitation,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    loading,
    error,
    filteredRsvps,
    wishesList,
    attendingCount,
    declinedCount,
    pendingCount,
    attendeeCount,
    load,
  } = useRsvpDashboard(invitationId);

  if (loading && !invitation) return <PageSkeleton layout="dashboard" />;

  if (error && !invitation) {
    return (
      <main className="dash-main" aria-busy={loading}>
        {loading && invitation && <LoadingRegion />}
        <div className="rsvp-page">
          <ErrorState message={t("loadError")} onRetry={load} />
        </div>
      </main>
    );
  }

  const backLink = invitationId
    ? `/app/events/${invitationId}/guests`
    : "/app/events";

  return (
    <main className="dash-main" aria-busy={loading}>
        {loading && invitation && <LoadingRegion />}
      <div className="rsvp-page">
        <header className="rsvp-header">
          <div className="rsvp-header-info">
            <span className="rsvp-kicker">{t("kicker")}</span>
            <h1>{t("title")}</h1>
            <p className="rsvp-subtitle">{invitation?.title}</p>
          </div>
          <div className="rsvp-actions">
            {filteredRsvps.length > 0 && (
              <button
                type="button"
                className="rsvp-back-btn"
                onClick={() => {
                  if (exportRsvpsToCsv(filteredRsvps, invitation?.title)) {
                    toast.success(en ? "RSVP list exported (CSV)" : "បាននាំចេញបញ្ជី RSVP (CSV)");
                  }
                }}
              >
                <Download size={17} aria-hidden="true" />
                <span>{en ? "Export CSV" : "នាំចេញ CSV"}</span>
              </button>
            )}
            <Link to={backLink} className="rsvp-back-btn">
              <Users size={18} aria-hidden="true" />
              <span>{t("guests")}</span>
            </Link>
          </div>
        </header>

        {error && <ErrorState message={t("loadError")} onRetry={load} />}

        {/* Summary KPI Cards */}
        <RsvpKpiCards
          attendingCount={attendingCount}
          declinedCount={declinedCount}
          pendingCount={pendingCount}
          wishesCount={wishesList.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          t={t}
        />
        <p className="rsvp-count-context">{t('countContext', { count: attendeeCount })}</p>

        {/* Conditional: Wishes Wall View or Standard Table */}
        {viewMode === "WISHES" ? (
          <RsvpWishesWall wishesList={wishesList} setViewMode={setViewMode} t={t} lang={lang} />
        ) : (
          <RsvpGuestTable
            invitationId={invitationId}
            canManage={canManageGuests}
            onSaved={() => load({ background: true })}
            filteredRsvps={filteredRsvps}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            wishesListCount={wishesList.length}
            setViewMode={setViewMode}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </main>
  );
}
