import { useMemo, useState } from "react";
import { PageSkeleton, LoadingRegion } from '@/shared/ui/LoadingState';
import { useUiCopy } from "@/shared/i18n/useUiCopy";
import { useNotifications } from "./hooks/useNotifications";
import { NotificationList } from "./components/NotificationList";
import { NotificationStatsGrid } from "./components/NotificationStatsGrid";
import { ErrorState, LoadingButton } from "@/shared/ui";
import TelegramNotificationSettings from "./components/TelegramNotificationSettings";
import "./NotificationPages.css";

export default function NotificationsPage() {
  const uiCopy = useUiCopy();
  const [filter, setFilter] = useState("all");
  const {
    notifications,
    summary,
    loading,
    error,
    actionError,
    busyId,
    loadData,
    markRead,
    markAllRead,
  } = useNotifications();

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.readAt);
    }
    if (filter === "failed") {
      return notifications.filter((item) => String(item.status || "").toUpperCase() === "FAILED" || Boolean(item.errorMessage));
    }
    return notifications;
  }, [filter, notifications]);

  return (
    <main className="dash-main notif-page">
      <header className="dash-page-header notif-header">
        <div>
          <span className="dash-kicker">{uiCopy("ការជូនដំណឹង", "Notifications")}</span>
          <h1>{uiCopy("ការជូនដំណឹង", "Notifications")}</h1>
        </div>
        <div className="notif-header-actions">
          <button
            type="button"
            className="dash-btn notif-refresh-btn"
            disabled={loading}
            onClick={loadData}
          >
            {uiCopy("ផ្ទុកឡើងវិញ", "Refresh")}
          </button>
          <LoadingButton
            type="button"
            className="dash-btn dash-btn-primary"
            disabled={!summary?.unread}
            isLoading={busyId === "all"}
            onClick={markAllRead}
          >
            {uiCopy("សម្គាល់ទាំងអស់ថាបានអាន", "Mark all read")}
          </LoadingButton>
        </div>
      </header>

      <TelegramNotificationSettings />
      {loading && summary && <LoadingRegion />}
      {summary && <NotificationStatsGrid summary={summary} />}

      {actionError && (
        <div className="notif-alert" role="alert">
          {actionError}
        </div>
      )}

      {!error && summary && (
        <div className="notif-filters" role="group" aria-label={uiCopy("ត្រងការជូនដំណឹង", "Filter notifications")}>
          {[
            { id: "all", label: uiCopy("ទាំងអស់", "All notifications") },
            { id: "unread", label: uiCopy("មិនទាន់អាន", "Unread only") },
            { id: "failed", label: uiCopy("បរាជ័យ", "Failed delivery") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`notif-filter-btn${filter === tab.id ? " is-active" : ""}`}
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading && !summary ? (
        <PageSkeleton layout="list" />
      ) : (
        <NotificationList notifications={filteredNotifications} onRead={markRead} busyId={busyId} />
      )}
    </main>
  );
}
