import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GuestsPage from './GuestsPage';
import { guestService } from './api/guestApi';
import { invitationService } from '../invitations/api/invitationApi';
import { EventContext } from '../events/workspace/EventContext';
import FeedbackHost from '@/shared/feedback/FeedbackHost';
import { useLanguageStore } from '@/stores/useLanguageStore';
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 7 } }) }));
vi.mock('./api/guestApi', () => ({
  guestService: {
    page: vi.fn(),
    overview: vi.fn(),
    exportSelection: vi.fn(),
    listByInvitation: vi.fn(),
    updateForInvitation: vi.fn(),
    removeFromInvitation: vi.fn(),
  },
}));
vi.mock('../invitations/api/invitationApi', () => ({ invitationService: { listMine: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); useLanguageStore.setState({ lang: 'en' });
  invitationService.listMine.mockResolvedValue([{ id: 10, title: 'Bounded event', status: 'DRAFT' }]);
  guestService.page.mockImplementation((id, query) => Promise.resolve({ items: [{ guest: { id: query.page + 1, guestName: `Page ${query.page} guest`, seatCount: 2 } }], page: query.page, size: query.size, totalElements: 40, totalPages: 2 }));
  guestService.overview.mockResolvedValue({ guestRecords: 40, reservedSeats: 80, markedSentRecords: 30, respondedRecords: 25, toInviteRecords: 10, checkedInRecords: 6, confirmedAttendees: 35, attendingRecords: 20, declinedRecords: 3, maybeRecords: 2, unansweredRecords: 15 });
  guestService.exportSelection.mockResolvedValue(undefined);
  guestService.updateForInvitation.mockResolvedValue({ id: 1, guestName: 'Page 0 guest', seatCount: 2, sendStatus: 'SENT' });
  guestService.removeFromInvitation.mockResolvedValue(undefined);
});
afterEach(cleanup);
it('shows server-wide totals, selects only the current page, and clears selection on page changes', async () => {
  render(<MemoryRouter initialEntries={['/app/events/10/guests']}><Routes><Route path="/app/events/:eventId/guests" element={<GuestsPage />} /></Routes></MemoryRouter>);
  await screen.findByText('Page 0 guest');
  expect(screen.getByText('80')).toBeInTheDocument();
  expect(document.querySelector('.guest-count-definitions')).toBeNull();
  expect(screen.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select guest: Page 0 guest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Export selected (1)' }));
  await waitFor(() => expect(guestService.exportSelection).toHaveBeenCalledWith(10, [1]));
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('Page 1 guest');
  expect(screen.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled();
  expect(guestService.listByInvitation).not.toHaveBeenCalled();
  expect(guestService.page).toHaveBeenCalledWith(10, expect.objectContaining({ page: 1, size: 25 }));
});

it('hides redundant pagination and guidance for one small page', async () => {
  guestService.page.mockResolvedValue({ items: [{ guest: { id: 1, guestName: 'Small list', seatCount: 1 } }], page: 0, size: 25, totalElements: 1, totalPages: 1 });
  render(<MemoryRouter initialEntries={['/app/events/10/guests']}><Routes><Route path="/app/events/:eventId/guests" element={<GuestsPage />} /></Routes></MemoryRouter>);
  await screen.findByText('Small list');
  expect(screen.queryByRole('navigation', { name: 'Guest pages' })).toBeNull();
  expect(screen.queryByText(/Selection resets|Exports omit/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Import', exact: true })).toBeEnabled();
});

it('shows the bulk action bar, confirms bulk mark-sent and delete, and supports clear selection', async () => {
  guestService.page.mockResolvedValue({
    items: [{ guest: { id: 1, guestName: 'Sokha', seatCount: 2, sendStatus: 'PENDING' } }],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
  });
  render(
    <MemoryRouter initialEntries={['/app/events/10/guests']}>
      <FeedbackHost />
      <Routes><Route path="/app/events/:eventId/guests" element={<GuestsPage />} /></Routes>
    </MemoryRouter>
  );
  await screen.findByText('Sokha');

  fireEvent.click(screen.getByRole('checkbox', { name: 'Select guest: Sokha' }));
  const bulkBar = screen.getByRole('region', { name: 'Selected guest bulk actions' });
  expect(within(bulkBar).getByText('1 selected')).toBeInTheDocument();

  // Cancel bulk mark sent first
  fireEvent.click(within(bulkBar).getByRole('button', { name: 'Mark sent' }));
  const markDialog = await screen.findByRole('dialog');
  fireEvent.click(within(markDialog).getByRole('button', { name: 'Cancel' }));
  expect(guestService.updateForInvitation).not.toHaveBeenCalled();

  // Confirm bulk delete
  fireEvent.click(within(bulkBar).getByRole('button', { name: 'Delete selected' }));
  const deleteDialog = await screen.findByRole('dialog');
  fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete selected' }));
  await waitFor(() => expect(guestService.removeFromInvitation).toHaveBeenCalledWith(10, 1));
});

it('gates create, import, mark-sent, and delete controls when staff lack MANAGE_GUESTS permission', async () => {
  guestService.page.mockResolvedValue({
    items: [{ guest: { id: 1, guestName: 'Staff Read Only Guest', seatCount: 1 } }],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
  });
  render(
    <EventContext.Provider value={{ eventId: '10', isOwner: false, access: { owner: false, permissions: ['VIEW_GUESTS'] } }}>
      <MemoryRouter initialEntries={['/app/events/10/guests']}>
        <Routes><Route path="/app/events/:eventId/guests" element={<GuestsPage />} /></Routes>
      </MemoryRouter>
    </EventContext.Provider>
  );
  await screen.findByText('Staff Read Only Guest');
  expect(screen.queryByRole('button', { name: 'Add guest' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Import', exact: true })).toBeNull();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Select guest: Staff Read Only Guest' }));
  const bulkBar = screen.getByRole('region', { name: 'Selected guest bulk actions' });
  expect(within(bulkBar).getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  expect(within(bulkBar).queryByRole('button', { name: 'Mark sent' })).toBeNull();
  expect(within(bulkBar).queryByRole('button', { name: 'Delete selected' })).toBeNull();
});
