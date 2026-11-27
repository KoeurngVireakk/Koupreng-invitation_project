import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Download, QrCode, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { useBackendMessages } from "@/shared/i18n/useBackendMessages";
import { feedback } from "@/shared/feedback/feedback";
import { ErrorState, SkeletonTable, toast } from "@/shared/ui";
import { useGuests } from "./hooks/useGuests";
import { useGuestMutations } from "./hooks/useGuestMutations";
import { useGuestFilters } from "./hooks/useGuestFilters";
import { useDebouncedGuestQuery } from './hooks/useDebouncedGuestQuery';
import { useEventWorkspace } from '../events/workspace/EventContext';
import { DEFAULT_CATEGORIES, DEFAULT_GROUPS } from "./model/guestConstants";
import { copyText } from "./model/guestMappers";
import { matchesGuestStatus } from "./model/guestStatus";
import GuestStats from "./components/GuestStats";
import GuestFilters from "./components/GuestFilters";
import GuestTable from "./components/GuestTable";
import GuestDeleteDialog from "./components/GuestDeleteDialog";
import GuestQrModal from "./components/GuestQrModal";
import TicketModal from "@/features/tickets/TicketModal";
const GuestImportModal = lazy(() => import('./components/GuestImportModal'));
import GuestInlineForm from "./components/GuestInlineForm";
import { guestService } from "./api/guestApi";
import { exportGuestsToCsv } from "./model/guestCsvUtils";
import { saveManualGuests } from "@/shared/storage/hostPlanningStorage";
import "./GuestsPage.css";
import "./GuestWorkspace.css";

function scopedKey(base, eventId) {
  return eventId ? `${base}.${eventId}` : base;
}

function readList(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function GuestsPage() {
  const { text: t, lang } = useBackendMessages("guests");
  const en = lang === "en";
  const workspace = useEventWorkspace();
  const ownerTools = workspace?.isOwner !== false;
  const canManageGuests = workspace?.access
    ? workspace.access.owner === true || Boolean(workspace.access.permissions?.includes("MANAGE_GUESTS"))
    : ownerTools;
  const [serverQuery, setServerQuery] = useState({ page: 0, size: 25, search: '', group: '', category: '', status: '' });
  const debouncedQuery = useDebouncedGuestQuery(serverQuery);
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const {
    eventId,
    draftMatch,
    backendInvitation,
    backendInvitationId: hookBackendInvitationId,
    publicInvitation,
    guests,
    manualGuests,
    setManualGuests,
    backendGuests,
    setBackendGuests,
    loading,
    error,
    refreshData,
    pageInfo, overview,
  } = useGuests({ paged: true, query: debouncedQuery });

  const rawBackendId =
    hookBackendInvitationId ||
    backendInvitation?.id ||
    backendInvitation?.invitationId ||
    publicInvitation?.id ||
    publicInvitation?.invitationId ||
    draftMatch?.backendInvitationId;
  const backendInvitationId =
    rawBackendId != null && /^\d+$/.test(String(rawBackendId))
      ? Number(rawBackendId)
      : null;

  const {
    saving,
    error: mutationError,
    saveGuest,
    deleteGuest,
    importGuests,
    markGuestAsSent,
  } = useGuestMutations({
    eventId,
    backendInvitation,
    manualGuests,
    setManualGuests,
    backendGuests,
    setBackendGuests,
    refreshData,
  });

  const groups = readList(scopedKey("koupreng.host.guestGroups", eventId), DEFAULT_GROUPS);
  const categories = readList(scopedKey("koupreng.host.guestCategories", eventId), DEFAULT_CATEGORIES);

  useEffect(() => {
    setSelectedIds([]);
    setEditingGuest(null);
    setBulkBusy(false);
  }, [eventId]);

  const localFilters = useGuestFilters(guests);
  const serverMode = Boolean(backendInvitationId || /^[1-9]\d*$/.test(String(eventId || '')));
  const queryPending = serverMode && serverQuery !== debouncedQuery;
  const changeQuery = patch => { setSelectedIds([]); setServerQuery(current => ({ ...current, ...patch, page: 0 })); };
  const { search, setSearch, groupFilter, setGroupFilter, categoryFilter, setCategoryFilter, statusFilter, setStatusFilter, clearFilters, filteredGuests } = serverMode ? {
    search: serverQuery.search, setSearch: search => changeQuery({ search }), groupFilter: serverQuery.group, setGroupFilter: group => changeQuery({ group }),
    categoryFilter: serverQuery.category, setCategoryFilter: category => changeQuery({ category }), statusFilter: serverQuery.status, setStatusFilter: status => changeQuery({ status }),
    clearFilters: () => changeQuery({ search: '', group: '', category: '', status: '' }), filteredGuests: guests,
  } : localFilters;
  const currentSelected = selectedIds.filter(id => guests.some(guest => String(guest.backendId || guest.id) === id && !guest.pending));
  const selectedGuestRecords = guests.filter(guest => currentSelected.includes(String(guest.backendId || guest.id)));
  const totalRecords = serverMode ? overview?.guestRecords : guests.length;
  const matchingRecords = serverMode ? pageInfo?.totalElements : filteredGuests.length;
  const statusCount = value => serverMode ? overview?.[({ '': 'guestRecords', pending: 'toInviteRecords', responded: 'respondedRecords', checkedIn: 'checkedInRecords', attending: 'attendingRecords', declined: 'declinedRecords', maybe: 'maybeRecords', unanswered: 'unansweredRecords' })[value]] ?? '—' : guests.filter(guest => matchesGuestStatus(guest, value)).length;
  async function exportSelected() {
    if (!currentSelected.length || exporting) return;
    setExporting(true);
    try { await guestService.exportSelection(backendInvitationId, currentSelected.map(Number)); toast.success(en ? 'Selected guest records exported' : 'បាននាំចេញកំណត់ត្រាភ្ញៀវដែលបានជ្រើស'); }
    catch (error) { toast.error(error.message || (en ? 'Could not export selected guests' : 'មិនអាចនាំចេញភ្ញៀវដែលបានជ្រើស')); }
    finally { setExporting(false); }
  }

  async function handleBulkMarkShared() {
    if (!canManageGuests || !ownerTools || bulkBusy || !selectedGuestRecords.length) return;
    const targets = selectedGuestRecords.filter(guest => !['SENT', 'OPENED', 'RESPONDED'].includes(guest.sendStatus));
    if (!targets.length) {
      toast.info(en ? 'All selected guests are already marked sent or responded' : 'ភ្ញៀវដែលបានជ្រើសទាំងអស់ត្រូវបានសម្គាល់ផ្ញើរួចហើយ');
      return;
    }
    const confirmed = await feedback.confirm({
      title: en ? 'Mark selected guests as sent?' : 'សម្គាល់ភ្ញៀវដែលបានជ្រើសថាបានផ្ញើ?',
      message: en
        ? `Mark ${targets.length} selected guest invitation(s) as sent? Existing links will stay valid.`
        : `តើអ្នកចង់សម្គាល់ការអញ្ជើញចំនួន ${targets.length} ថាបានផ្ញើមែនទេ?`,
      confirmText: en ? 'Mark sent' : 'សម្គាល់បានផ្ញើ',
      cancelText: en ? 'Cancel' : 'បោះបង់',
    });
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      let updated = 0;
      for (const guest of targets) {
        if (await markGuestAsSent(guest)) updated += 1;
      }
      if (updated > 0) {
        setSelectedIds([]);
        if (serverMode) await refreshData();
        toast.success(en ? `Marked ${updated} guest(s) as sent` : `បានសម្គាល់ភ្ញៀវចំនួន ${updated} ថាបានផ្ញើ`);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    if (!canManageGuests || bulkBusy || !selectedGuestRecords.length) return;
    const confirmed = await feedback.confirm({
      title: en ? 'Delete selected guests?' : 'លុបឈ្មោះភ្ញៀវដែលបានជ្រើស?',
      message: en
        ? `Remove ${selectedGuestRecords.length} selected guest record(s) from this invitation? This cannot be undone.`
        : `តើអ្នកប្រាកដថាចង់លុបកំណត់ត្រាភ្ញៀវចំនួន ${selectedGuestRecords.length} មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      confirmText: en ? 'Delete selected' : 'លុបដែលបានជ្រើស',
      cancelText: en ? 'Cancel' : 'បោះបង់',
      destructive: true,
    });
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      let deleted = 0;
      for (const guest of selectedGuestRecords) {
        if (await deleteGuest(guest)) deleted += 1;
      }
      if (deleted > 0) {
        setSelectedIds([]);
        if (serverMode) setServerQuery(current => ({ ...current, page: 0 }));
        toast.success(en ? `Removed ${deleted} guest(s)` : `បានលុបភ្ញៀវចំនួន ${deleted}`);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  const [deleteGuestTarget, setDeleteGuestTarget] = useState(null);
  const [qrGuestTarget, setQrGuestTarget] = useState(null);
  const [ticketGuest, setTicketGuest] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [guestFormFocus, setGuestFormFocus] = useState(0);

  const handleOpenEditGuest = (guest) => {
    setEditingGuest(guest);
    setGuestFormFocus(value => value + 1);
  };

  const handleSaveGuest = async (form, editingId = null) => {
    const success = await saveGuest(form, editingId);
    if (success) {
      setSelectedIds([]);
      if (serverMode) await refreshData();
      toast.success(
        editingId
          ? (t ? t("toastUpdated") : "កែប្រែព័ត៌មានភ្ញៀវបានជោគជ័យ")
          : (t ? t("toastAdded") : "បន្ថែមភ្ញៀវបានជោគជ័យ")
      );
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!deleteGuestTarget) return;
    const success = await deleteGuest(deleteGuestTarget);
    if (success) {
      setDeleteGuestTarget(null);
      setSelectedIds([]);
      if (serverMode) setServerQuery(current => ({ ...current, page: 0 }));
      toast.success(t ? t("toastDeleted") : "លុបឈ្មោះភ្ញៀវបានជោគជ័យ");
    }
  };

  const handleCopyLink = async (text) => {
    try {
      if (await copyText(text)) {
        toast.success(t("messageCopied"));
        return true;
      }
    } catch { /* Clipboard access can be denied by the browser. */ }
    toast.error(t("linkCopyFailed"));
    return false;
  };

  const handleMarkAsSent = async (guest) => {
    if (!guest) return false;
    const success = await markGuestAsSent(guest);
    if (success) {
      toast.success(t("statusSent"));
    }
    return success;
  };

  const handleGuestSynced = useCallback(
    (updatedGuest) => {
      if (!updatedGuest) return;
      setQrGuestTarget(updatedGuest);

      setBackendGuests((current) => {
        const exists = current.some(
          (g) =>
            String(g.id) === String(updatedGuest.id) ||
            String(g.backendId) === String(updatedGuest.backendId) ||
            (g.name === updatedGuest.name && (g.phone || "") === (updatedGuest.phone || ""))
        );
        if (exists) {
          return current.map((g) =>
            String(g.id) === String(updatedGuest.id) ||
            String(g.backendId) === String(updatedGuest.backendId) ||
            (g.name === updatedGuest.name && (g.phone || "") === (updatedGuest.phone || ""))
              ? { ...g, ...updatedGuest }
              : g
          );
        }
        return [...current, updatedGuest];
      });

      setManualGuests((current) => {
        const next = current.map((g) =>
          String(g.id) === String(updatedGuest.id) || g.name === updatedGuest.name
            ? { ...g, ...updatedGuest }
            : g
        );
        saveManualGuests(next, eventId);
        return next;
      });
    },
    [eventId, setBackendGuests, setManualGuests]
  );

  const handleExportCsv = async () => {
    if (backendInvitationId) {
      try {
        await exportSelected();

      } catch (failure) {
        toast.error(failure.message || "Could not export guests");
      }
      return;
    }
    if (!guests || !guests.length) {
      toast.error(t ? t("noGuestsToExport") : "មិនមានទិន្នន័យភ្ញៀវសម្រាប់ទាញយកទេ");
      return;
    }
    const eventTitle = backendInvitation?.title || draftMatch?.title || "wedding";
    const success = exportGuestsToCsv(guests, eventTitle);
    if (success) {
      toast.success(t ? t("exportSuccess") : "បានទាញយកបញ្ជីភ្ញៀវដោយជោគជ័យ (CSV)");
    }
  };

  const eventTitle = draftMatch?.title || backendInvitation?.title || null;
  const hasFilters = Boolean(search || groupFilter || categoryFilter || statusFilter);
  const statusOptions = [
    { value: "", label: "allGuests" },
    { value: "pending", label: "toInvite" },
    { value: "responded", label: "statResponded" },
    { value: "checkedIn", label: "checkedIn" },
    ...(serverMode ? [
      { value: 'attending', text: en ? 'Confirmed RSVP' : 'RSVP ចូលរួម' },
      { value: 'declined', text: en ? 'Declined RSVP' : 'RSVP មិនចូលរួម' },
      { value: 'maybe', text: en ? 'Maybe' : 'ប្រហែលចូលរួម' },
      { value: 'unanswered', text: en ? 'No RSVP response' : 'មិនទាន់មាន RSVP' },
    ] : []),
  ];
  const checkInUrl = backendInvitationId
    ? `/dashboard/invitations/${backendInvitationId}/check-in`
    : "/dashboard/check-in";

  return (
    <main className="dash-main pe-guests-page guest-workspace">
      <header className="guest-page-header" role="presentation">
        <div>
          {eventTitle && <p className="guest-event-name"><span aria-hidden="true" />{eventTitle}</p>}
          <h1>{t ? t("title") : "បញ្ជីភ្ញៀវកិត្តិយស"}</h1>
        </div>
        {canManageGuests && (
          <div className="guest-header-actions">
            <button
              type="button"
              className="guest-button guest-button-primary guest-add-btn"
              onClick={() => {
                setEditingGuest(null);
                setGuestFormFocus((v) => v + 1);
                const nameInput = document.getElementById("guestForm-name");
                if (nameInput) {
                  nameInput.focus();
                  nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            >
              <UserPlus size={17} aria-hidden="true" />
              <span>{t ? t("addGuestAction") : "បន្ថែមភ្ញៀវ"}</span>
            </button>
            <button type="button" className="guest-button guest-button-secondary" disabled={loading || !backendInvitationId} onClick={() => setImportModalOpen(true)}>
              <Upload size={17} aria-hidden="true" /><span>{t("importBtn")}</span>
            </button>
          </div>
        )}
      </header>

      {(!serverMode || overview) && <GuestStats guests={guests} summary={serverMode ? overview : undefined} t={key => serverMode ? ({ statTotalGuests: en ? 'Guest records' : 'កំណត់ត្រាភ្ញៀវ', statTotalSeats: en ? 'Reserved seats' : 'កៅអីកក់', statSent: en ? 'Marked sent / opened' : 'បានសម្គាល់ផ្ញើ / បើក' })[key] || t(key) : t(key)} />}

      <section className="guest-list-panel" aria-labelledby="guest-list-heading" aria-busy={loading || queryPending}>
        <div className="guest-list-heading">
          <div className="guest-list-title"><Users size={20} aria-hidden="true" /><h2 id="guest-list-heading">{t("listTitle")}</h2><span className="guest-total-badge">{totalRecords ?? "—"}</span></div>
          <div className="guest-list-tools">
            <Link to={checkInUrl} className="guest-text-button"><QrCode size={17} aria-hidden="true" />{t("checkInAction")}</Link>
            <button type="button" className="guest-text-button" disabled={serverMode && (!currentSelected.length || loading || queryPending || exporting)} onClick={handleExportCsv}><Download size={17} aria-hidden="true" />{serverMode ? (en ? `Export selected (${currentSelected.length})` : `នាំចេញដែលបានជ្រើស (${currentSelected.length})`) : t("exportBtn")}</button>
          </div>
        </div>
        <div className="guest-status-filters" role="group" aria-label={t("filterByStatus")}>
          {statusOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={statusFilter === option.value} onClick={() => setStatusFilter(option.value)}>
              {option.text || t(option.label)}<span>{statusCount(option.value)}</span>
            </button>
          ))}
        </div>
        <GuestFilters
        search={search}
        setSearch={setSearch}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        groups={groups}
        categories={categories}
        onClear={clearFilters}
        t={t}
      />

      {(error || mutationError) && (
        <ErrorState message={error || mutationError} onRetry={refreshData} />
      )}

      <div className="guest-results-summary" role="status" aria-live="polite">{loading || queryPending ? t("loadingGuests") : serverMode ? (en ? `${filteredGuests.length} / ${matchingRecords ?? '—'} guests` : `${filteredGuests.length} / ${matchingRecords ?? '—'} ភ្ញៀវ`) : t("resultsCount", { shown: filteredGuests.length, total: guests.length })}{hasFilters && <button type="button" className="guest-text-button" onClick={clearFilters}>{t("clearFilters")}</button>}</div>
      {serverMode && pageInfo && (pageInfo.totalElements > 25 || serverQuery.size !== 25 || serverQuery.page > 0) && <nav className="guest-page-controls" aria-label={en ? 'Guest pages' : 'ទំព័រភ្ញៀវ'}>
        <label>{en ? 'Per page' : 'ក្នុងមួយទំព័រ'}<select aria-label={en ? 'Records per page' : 'កំណត់ត្រាក្នុងមួយទំព័រ'} value={serverQuery.size} onChange={event => changeQuery({ size: Number(event.target.value) })}>{[25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
        {(pageInfo.totalPages > 1 || serverQuery.page > 0) && <>
          <button type="button" aria-label={en ? 'Previous page' : 'ទំព័រមុន'} className="guest-button guest-button-secondary" disabled={loading || queryPending || serverQuery.page === 0} onClick={() => { setSelectedIds([]); setServerQuery(current => ({ ...current, page: current.page - 1 })); }}>{en ? 'Previous' : 'មុន'}</button>
          <span>{serverQuery.page + 1} / {Math.max(1, pageInfo.totalPages)}</span>
          <button type="button" aria-label={en ? 'Next page' : 'ទំព័របន្ទាប់'} className="guest-button guest-button-secondary" disabled={loading || queryPending || serverQuery.page + 1 >= pageInfo.totalPages} onClick={() => { setSelectedIds([]); setServerQuery(current => ({ ...current, page: current.page + 1 })); }}>{en ? 'Next' : 'បន្ទាប់'}</button>
        </>}
      </nav>}
      {serverMode && currentSelected.length > 0 && (
        <div
          className="guest-bulk-bar"
          role="region"
          aria-live="polite"
          aria-label={en ? "Selected guest bulk actions" : "សកម្មភាពជាក្រុមសម្រាប់ភ្ញៀវដែលបានជ្រើស"}
        >
          <span className="guest-bulk-bar-count">
            {en ? `${currentSelected.length} selected` : `បានជ្រើសរើស ${currentSelected.length} នាក់`}
          </span>
          <div className="guest-bulk-bar-actions">
            <button
              type="button"
              className="guest-button guest-button-secondary"
              disabled={loading || queryPending || exporting || bulkBusy}
              onClick={handleExportCsv}
            >
              <Download size={15} aria-hidden="true" />
              <span>{en ? "Export CSV" : "នាំចេញ CSV"}</span>
            </button>
            {canManageGuests && ownerTools && (
              <button
                type="button"
                className="guest-button guest-button-secondary"
                disabled={saving || loading || queryPending || bulkBusy}
                onClick={handleBulkMarkShared}
              >
                <Check size={15} aria-hidden="true" />
                <span>{en ? "Mark sent" : "សម្គាល់បានផ្ញើ"}</span>
              </button>
            )}
            {canManageGuests && (
              <button
                type="button"
                className="guest-button guest-button-danger"
                disabled={saving || loading || queryPending || bulkBusy}
                onClick={handleBulkDelete}
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>{en ? "Delete selected" : "លុបដែលបានជ្រើស"}</span>
              </button>
            )}
            <button
              type="button"
              className="guest-button guest-button-secondary"
              disabled={bulkBusy}
              onClick={() => setSelectedIds([])}
            >
              <X size={15} aria-hidden="true" />
              <span>{en ? "Clear selection" : "សម្អាតការជ្រើស"}</span>
            </button>
          </div>
        </div>
      )}
      {loading && !pageInfo ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="pe-desktop-table-wrap">
          <GuestTable
            inlineForm={canManageGuests ? <GuestInlineForm
              key={`${eventId || "local"}:${editingGuest?.id ?? "new"}`}
              guest={editingGuest}
              onCancel={() => setEditingGuest(null)}
              onSave={handleSaveGuest}
              groups={groups}
              categories={categories}
              saving={saving || loading || queryPending}
              error={mutationError}
              focusRequest={guestFormFocus}
              t={t}
            /> : null}
            guests={filteredGuests}
            selectedIds={currentSelected}
            onSelectionChange={serverMode ? setSelectedIds : undefined}
            groups={groups}
            categories={categories}
            saving={saving || loading || queryPending}
            showQuickAdd={false}
            isFiltered={hasFilters}
            onClearFilters={clearFilters}
            onOpenImport={canManageGuests ? () => setImportModalOpen(true) : undefined}
            emptyMessage={
              hasFilters
                ? (t ? t("emptySearchDesc") : "មិនមានភ្ញៀវត្រូវនឹងការស្វែងរកនេះទេ")
                : (t ? t("emptyDesc") : "មិនទាន់មានឈ្មោះភ្ញៀវទេ។ ចាប់ផ្តើមដោយបន្ថែមភ្ញៀវម្នាក់ ឬនាំចូលបញ្ជី។")
            }
            currentDraft={draftMatch}
            publicInvitation={publicInvitation}
            onSaveGuest={canManageGuests ? handleSaveGuest : undefined}
            onEdit={canManageGuests ? handleOpenEditGuest : undefined}
            onDelete={canManageGuests ? (g) => setDeleteGuestTarget(g) : undefined}
            onShowQr={ownerTools ? (g) => setQrGuestTarget(g) : undefined}
            onShowTicket={ownerTools && backendInvitationId ? guest => setTicketGuest(guest) : undefined}
            deliveryPath={ownerTools && backendInvitationId ? `/app/events/${backendInvitationId}/delivery` : undefined}
            onCopyLink={handleCopyLink}
            onMarkAsSent={ownerTools ? handleMarkAsSent : undefined}
            t={t}
          />
        </div>
      )}
      </section>

      <GuestDeleteDialog
        guest={deleteGuestTarget}
        onClose={() => setDeleteGuestTarget(null)}
        onConfirm={handleConfirmDelete}
        saving={saving}
        t={t}
      />

      <GuestQrModal
        guest={qrGuestTarget}
        currentDraft={draftMatch}
        publicInvitation={publicInvitation || backendInvitation}
        backendInvitationId={backendInvitationId}
        onGuestSynced={handleGuestSynced}
        onClose={() => setQrGuestTarget(null)}
        onCopyLink={handleCopyLink}
        onMarkAsSent={ownerTools ? handleMarkAsSent : undefined}
        saving={saving}
        t={t}
      />

      {ticketGuest && <TicketModal eventId={backendInvitationId} guestId={ticketGuest.backendId || ticketGuest.id} onClose={() => setTicketGuest(null)} />}

      {importModalOpen && <Suspense fallback={<p role="status">{en ? 'Loading import…' : 'កំពុងបើកការនាំចូល…'}</p>}><GuestImportModal
        key={backendInvitationId}
        invitationId={backendInvitationId}
        onFileImported={() => { setSelectedIds([]); setServerQuery(current => ({ ...current, page: 0 })); return refreshData(); }}
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        saving={saving}
        onImport={importGuests}
        error={mutationError}
        t={t}
      /></Suspense>}

    </main>
  );
}

