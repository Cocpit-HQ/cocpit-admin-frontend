import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../utils/api';
import { useEnvironment } from '../EnvironmentContext';
import { useToast } from '../components/ToastProvider';

export default function ContactSupport() {
  const { environment } = useEnvironment();
  const { showToast } = useToast();
  
  // Data State
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState(null);
  const [replies, setReplies] = useState([]);
  
  // Inputs & Actions State
  const [adminNote, setAdminNote] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenAttachment, setFullscreenAttachment] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Input refs for auto-focus
  const replyInputRef = useRef(null);
  const noteInputRef = useRef(null);

  // Fetch all tickets on mount or when environment changes
  useEffect(() => {
    fetchTickets();
  }, [environment]);

  // Fetch details whenever activeTicketId changes
  useEffect(() => {
    if (activeTicketId) {
      fetchTicketDetails(activeTicketId);
    }
  }, [activeTicketId]);

  const fetchTickets = async (isManualRefresh = false) => {
    try {
      setIsLoading(true);
      const data = await api.get('/api/admin/support/tickets');
      if (data && data.success) {
        const fetchedTickets = data.tickets || [];
        setTickets(fetchedTickets);
        
        // Auto-select first ticket if current selection is invalid
        if (fetchedTickets.length > 0) {
          if (!activeTicketId || !fetchedTickets.some(t => t.id === activeTicketId)) {
            setActiveTicketId(fetchedTickets[0].id);
          } else {
            // Also refresh details of the currently selected ticket
            fetchTicketDetails(activeTicketId);
          }
        } else {
          setActiveTicketId(null);
          setActiveTicketDetails(null);
          setReplies([]);
        }

        if (isManualRefresh) {
          showToast('Ticket queue refreshed', 'info', 2500);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      showToast(error.message || 'Failed to fetch tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    try {
      setIsDetailsLoading(true);
      const data = await api.get(`/api/admin/support/tickets/${id}`);
      if (data && data.success) {
        setActiveTicketDetails(data.ticket);
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error("Failed to fetch ticket details:", error);
      showToast(error.message || 'Failed to load ticket details', 'error');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicketId || isStatusUpdating) return;
    try {
      setIsStatusUpdating(true);
      const data = await api.put(`/api/admin/support/tickets/${activeTicketId}/status`, { status: newStatus });
      if (data && data.success) {
        setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: newStatus } : t));
        if (activeTicketDetails) {
          setActiveTicketDetails(prev => ({ ...prev, status: newStatus }));
        }
        showToast(`Ticket status updated to ${newStatus}`, 'success');
      } else {
        showToast(data?.message || 'Failed to update ticket status', 'error');
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      showToast('Please type a reply message before sending', 'warning');
      replyInputRef.current?.focus();
      return;
    }
    if (!activeTicketId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const data = await api.post(`/api/admin/support/tickets/${activeTicketId}/reply`, {
        message: replyMessage.trim(),
        is_internal_note: false
      });
      if (data && data.success) {
        setReplies(prev => [...prev, data.reply]);
        setReplyMessage('');
        showToast('Reply dispatched to user via email!', 'success');

        // Automatically update ticket to IN_PROGRESS if currently OPEN
        if (activeTicketDetails?.status === 'OPEN') {
          setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: 'IN_PROGRESS' } : t));
          setActiveTicketDetails(prev => ({ ...prev, status: 'IN_PROGRESS' }));
        }
      } else {
        showToast(data?.message || 'Failed to send reply', 'error');
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      showToast(error.message || 'Failed to send reply', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      showToast('Please enter an internal admin note before saving', 'warning');
      noteInputRef.current?.focus();
      return;
    }
    if (!activeTicketId || isNoteSubmitting) return;

    try {
      setIsNoteSubmitting(true);
      const data = await api.post(`/api/admin/support/tickets/${activeTicketId}/reply`, {
        message: adminNote.trim(),
        is_internal_note: true
      });
      if (data && data.success) {
        setReplies(prev => [...prev, data.reply]);
        setAdminNote('');
        showToast('Internal note saved to staff log!', 'success');
      } else {
        showToast(data?.message || 'Failed to save note', 'error');
      }
    } catch (error) {
      console.error("Failed to add note:", error);
      showToast(error.message || 'Failed to add note', 'error');
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  // Quick reply macros
  const applyMacro = (templateText, label) => {
    setReplyMessage(templateText);
    showToast(`Applied macro: "${label}"`, 'info', 2000);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 50);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  // Direct email client launcher
  const handleEmailDirect = () => {
    if (!activeTicketDetails?.email) return;
    const shortId = activeTicketDetails.id ? `TK-${activeTicketDetails.id.slice(0, 6).toUpperCase()}` : 'SUPPORT';
    const subject = encodeURIComponent(`[Cocpit Support] Ticket ${shortId}: ${activeTicketDetails.issue || 'Support Request'}`);
    const body = encodeURIComponent(replyMessage ? replyMessage : `Hello,\n\nRegarding your support ticket ${shortId}:\n\n`);
    window.open(`mailto:${activeTicketDetails.email}?subject=${subject}&body=${body}`, '_blank');
    navigator.clipboard?.writeText(activeTicketDetails.email);
    showToast(`Opening email client & copied ${activeTicketDetails.email} to clipboard!`, 'success');
  };

  // Metrics counts
  const openCount = useMemo(() => tickets.filter(t => t.status === 'OPEN').length, [tickets]);
  const inProgressCount = useMemo(() => tickets.filter(t => t.status === 'IN_PROGRESS').length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Status filter
      if (filterStatus === 'OPEN' && ticket.status !== 'OPEN') return false;
      if (filterStatus === 'IN_PROGRESS' && ticket.status !== 'IN_PROGRESS') return false;
      if (filterStatus === 'RESOLVED' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const emailMatch = ticket.email?.toLowerCase().includes(query);
        const issueMatch = ticket.issue?.toLowerCase().includes(query);
        const idMatch = ticket.id?.toLowerCase().includes(query);
        return emailMatch || issueMatch || idMatch;
      }
      return true;
    });
  }, [tickets, filterStatus, searchQuery]);

  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === activeTicketId) || null;
  }, [tickets, activeTicketId]);

  const internalNotes = useMemo(() => {
    return replies.filter(r => r.is_internal_note);
  }, [replies]);

  const publicReplies = useMemo(() => {
    return replies.filter(r => !r.is_internal_note);
  }, [replies]);

  const shortId = activeTicketDetails?.id ? `TK-${activeTicketDetails.id.slice(0, 6).toUpperCase()}` : '';

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* Sub-header & Live SLA Metrics */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div className="flex flex-col gap-1">
          {/* Clickable Interactive Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant flex-wrap">
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setSearchQuery('');
                fetchTickets(true);
              }}
              className="hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              Support Operations
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button
              onClick={() => {
                setSearchQuery('');
                fetchTickets(true);
              }}
              className="hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              Ticket Dispatch
            </button>
            {activeTicket && (
              <>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <button
                  onClick={() => copyToClipboard(activeTicket.id, "Ticket UUID")}
                  className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Click to copy Ticket ID"
                  type="button"
                >
                  <span>TK-{activeTicket.id.slice(0, 6).toUpperCase()}</span>
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Contact Support &amp; Help Desk</h1>
            <button
              onClick={() => showToast(`Live Gateway is connected to ${environment.toUpperCase()} endpoint.`, 'info')}
              className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 hover:bg-primary/20 transition-colors cursor-pointer"
              type="button"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Live Gateway
            </button>
            <button
              onClick={() => showToast(`Active Environment: ${environment.toUpperCase()}`, 'info')}
              className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-colors cursor-pointer"
              type="button"
            >
              {environment.toUpperCase()} ENV
            </button>
          </div>
        </div>

        {/* Live Performance Stat Chips - FULLY CLICKABLE FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`p-3 rounded-xl border text-left shadow-sm flex flex-col min-w-[124px] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
              filterStatus === 'ALL'
                ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant/40 hover:border-primary/40'
            }`}
            type="button"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Active Queue</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-on-surface">{tickets.length}</span>
              <span className="text-xs text-primary font-medium">tickets</span>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('OPEN')}
            className={`p-3 rounded-xl border text-left shadow-sm flex flex-col min-w-[124px] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
              filterStatus === 'OPEN'
                ? 'bg-surface-container-low border-error ring-1 ring-error'
                : 'bg-surface-container-lowest border-outline-variant/40 hover:border-error/40'
            }`}
            type="button"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Needs Action</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-error">{openCount}</span>
              <span className="text-xs text-on-surface-variant font-medium">open</span>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`p-3 rounded-xl border text-left shadow-sm flex flex-col min-w-[124px] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-surface-container-low border-secondary ring-1 ring-secondary'
                : 'bg-surface-container-lowest border-outline-variant/40 hover:border-secondary/40'
            }`}
            type="button"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">In Progress</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-secondary">{inProgressCount}</span>
              <span className="text-xs text-on-surface-variant font-medium">assigned</span>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`p-3 rounded-xl border text-left shadow-sm flex flex-col min-w-[124px] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
              filterStatus === 'RESOLVED'
                ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant/40 hover:border-primary/40'
            }`}
            type="button"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Resolved</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-on-surface">{resolvedCount}</span>
              <span className="text-xs text-primary font-medium">closed</span>
            </div>
          </button>
        </div>
      </div>

      {/* Operational Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-surface-container-high p-0.5">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'OPEN'
                  ? 'bg-surface-container-lowest text-error shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'IN_PROGRESS'
                  ? 'bg-surface-container-lowest text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'RESOLVED'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/40 shadow-sm"
              placeholder="Filter tickets by email or ID..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer flex items-center justify-center"
                title="Clear filter"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets(true)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-high border border-outline-variant/40 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            type="button"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>sync</span>
            <span>{isLoading ? 'Refreshing...' : 'Refresh Queue'}</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Work Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Master Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">Support Inbox</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                {filteredTickets.length} Tickets
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Sort: Newest First
            </span>
          </div>

          {/* Ticket Cards Stack */}
          <div className="flex flex-col gap-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {isLoading && tickets.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
                <span>Loading support tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/60">inbox</span>
                <span>No tickets match the selected filter.</span>
                {(filterStatus !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterStatus('ALL');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    type="button"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicketId === ticket.id;
                const ticketShortId = ticket.id ? `TK-${ticket.id.slice(0, 6).toUpperCase()}` : 'TK-8492';
                const formattedDate = ticket.date
                  ? new Date(ticket.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <article
                    key={ticket.id}
                    onClick={() => setActiveTicketId(ticket.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary'
                        : 'bg-surface-container-lowest border-outline-variant/40 hover:border-primary/40 hover:shadow-sm'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: '0 4px 16px -2px rgba(79, 70, 229, 0.15)' }
                        : undefined
                    }
                  >
                    {/* Active Accent Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                    )}

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {ticket.email}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                          ID: {ticketShortId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ticket.status === 'OPEN'
                              ? 'bg-error-container text-error'
                              : ticket.status === 'IN_PROGRESS'
                              ? 'bg-secondary-container/30 text-secondary'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-1 pl-1">
                      {ticket.issue || 'No issue description provided'}
                    </p>

                    <div className="flex items-center justify-between pt-1 pl-1 text-on-surface-variant text-[11px] border-t border-outline-variant/20">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {formattedDate}
                      </span>
                      {ticket.attachment && (
                        <span className="flex items-center gap-1 text-primary font-semibold text-[11px]">
                          <span className="material-symbols-outlined text-[14px]">attach_file</span>
                          1 file
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail, Context & Resolution Console (8 cols) */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
          {isDetailsLoading || !activeTicketDetails ? (
            <div className="p-12 text-center text-on-surface-variant text-sm bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex flex-col items-center justify-center min-h-[400px] gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
              <span>Loading ticket details...</span>
            </div>
          ) : (
            <>
              {/* Ticket Identity & Header Strip Card */}
              <section className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">account_circle</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-on-surface truncate">
                          {activeTicketDetails.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(activeTicketDetails.email, "Customer email")}
                          className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                          title="Copy email"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                        <button
                          onClick={() => showToast(`User ${activeTicketDetails.email} is a verified platform account.`, 'info')}
                          className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
                          type="button"
                        >
                          Verified User
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono truncate">
                        <span>UUID: {activeTicketDetails.id}</span>
                        <button
                          onClick={() => copyToClipboard(activeTicketDetails.id, "Ticket UUID")}
                          className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                          title="Copy UUID"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="relative">
                      <select
                        value={activeTicketDetails.status}
                        disabled={isStatusUpdating}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <option value="OPEN">● Status: Open</option>
                        <option value="IN_PROGRESS">◐ Status: In Progress</option>
                        <option value="RESOLVED">✓ Status: Resolved</option>
                        <option value="CLOSED">✕ Status: Closed</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[16px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Telemetry & Diagnostic Quick Stats Ribbon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Current Status</span>
                    <span className="text-xs font-semibold text-on-surface">{activeTicketDetails.status}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Submitted On</span>
                    <span className="text-xs font-semibold text-on-surface">
                      {activeTicketDetails.date ? new Date(activeTicketDetails.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total Replies</span>
                    <span className="text-xs font-semibold text-on-surface">{publicReplies.length} sent</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Environment</span>
                    <span className="text-xs font-semibold text-primary">{environment.toUpperCase()}</span>
                  </div>
                </div>
              </section>

              {/* Ticket Information Details Card */}
              <section className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
                    <h2 className="text-sm font-bold text-on-surface">Ticket Diagnostic Information</h2>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    {activeTicketDetails.date ? new Date(activeTicketDetails.date).toLocaleString() : ''}
                  </span>
                </div>

                {/* Meta Grid */}
                <div className="flex flex-col gap-3">
                  {/* Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center">
                    <div className="md:col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Customer
                    </div>
                    <div className="md:col-span-10 p-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium border border-outline-variant/20 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{activeTicketDetails.email}</span>
                        <button
                          onClick={() => copyToClipboard(activeTicketDetails.email, "Customer email")}
                          className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                          title="Copy email"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                        <span>ID: {activeTicketDetails.id}</span>
                        <button
                          onClick={() => copyToClipboard(activeTicketDetails.id, "Ticket ID")}
                          className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                          title="Copy Ticket ID"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reported Issue Body */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-start">
                    <div className="md:col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pt-2">
                      Reported Issue
                    </div>
                    <div className="md:col-span-10 p-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/20 flex flex-col gap-2">
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">
                        {activeTicketDetails.issue}
                      </p>
                    </div>
                  </div>

                  {/* Attachments Viewport */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-start">
                    <div className="md:col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pt-2">
                      Attachment
                    </div>
                    <div className="md:col-span-10 flex flex-col gap-2">
                      {activeTicketDetails.attachment ? (
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
                          {/* Preview Canvas Frame */}
                          <div className="relative w-full rounded-lg bg-surface-container-lowest p-4 flex flex-col items-center justify-center min-h-[220px] shadow-inner overflow-hidden group border border-outline-variant/20">
                            <img
                              src={activeTicketDetails.attachment}
                              alt="Customer attachment"
                              className="max-h-[320px] max-w-full object-contain rounded cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => setFullscreenAttachment(activeTicketDetails.attachment)}
                            />
                            {/* Overlay Controls */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <button
                                onClick={() => setFullscreenAttachment(activeTicketDetails.attachment)}
                                className="px-2.5 py-1 rounded bg-surface-container-highest/95 hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[14px]">zoom_in</span> Fullscreen
                              </button>
                              <a
                                href={activeTicketDetails.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded bg-surface-container-highest/95 hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span> Open Link
                              </a>
                            </div>
                          </div>
                          {/* Attachment Details Strip */}
                          <div className="flex items-center justify-between text-on-surface-variant text-[11px] px-1 flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 font-medium text-on-surface">
                              <span className="material-symbols-outlined text-primary text-[15px]">image</span>
                              Attached Evidence
                            </span>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={activeTicketDetails.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[260px] text-primary hover:underline font-mono text-[10px]"
                              >
                                {activeTicketDetails.attachment}
                              </a>
                              <button
                                onClick={() => copyToClipboard(activeTicketDetails.attachment, "Attachment link")}
                                className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                                title="Copy link"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-surface-container-low text-on-surface-variant text-xs border border-outline-variant/20 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">info</span>
                          <span>No attachment provided with this support request.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Execution Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center pt-2">
                    <div className="md:col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Actions
                    </div>
                    <div className="md:col-span-10 flex flex-wrap items-center gap-2">
                      {/* Contextual Action Buttons depending on status */}
                      {activeTicketDetails.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleStatusChange('RESOLVED')}
                            disabled={isStatusUpdating}
                            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Mark as Resolved</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange('IN_PROGRESS')}
                            disabled={isStatusUpdating}
                            className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>Move to In Progress</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange('CLOSED')}
                            disabled={isStatusUpdating}
                            className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-error hover:bg-error-container/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            <span>Close Ticket</span>
                          </button>
                        </>
                      )}

                      {activeTicketDetails.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handleStatusChange('RESOLVED')}
                            disabled={isStatusUpdating}
                            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Mark as Resolved</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange('OPEN')}
                            disabled={isStatusUpdating}
                            className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">undo</span>
                            <span>Move back to Open</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange('CLOSED')}
                            disabled={isStatusUpdating}
                            className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-error hover:bg-error-container/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            <span>Close Ticket</span>
                          </button>
                        </>
                      )}

                      {(activeTicketDetails.status === 'RESOLVED' || activeTicketDetails.status === 'CLOSED') && (
                        <>
                          <button
                            onClick={() => handleStatusChange('OPEN')}
                            disabled={isStatusUpdating}
                            className="px-4 py-2 rounded-lg bg-warning-container text-on-warning-container text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            <span>Reopen Ticket</span>
                          </button>
                          {activeTicketDetails.status === 'RESOLVED' && (
                            <button
                              onClick={() => handleStatusChange('CLOSED')}
                              disabled={isStatusUpdating}
                              className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-error hover:bg-error-container/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>Close Ticket</span>
                            </button>
                          )}
                          {activeTicketDetails.status === 'CLOSED' && (
                            <button
                              onClick={() => handleStatusChange('RESOLVED')}
                              disabled={isStatusUpdating}
                              className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Mark as Resolved</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Confidential Internal Notes (Staff-Only) */}
              <section className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">Confidential Internal Notes</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">(Not visible to customer)</span>
                  </div>
                  {/* Clickable Staff Audit Log Button */}
                  <button
                    onClick={() => setShowAuditModal(true)}
                    className="px-2.5 py-1 rounded-md bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-sm active:scale-95"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[13px]">history</span>
                    <span>Staff Audit Log</span>
                  </button>
                </div>

                {/* Logged Internal Notes */}
                {internalNotes.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {internalNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-lowest text-on-surface-variant text-xs flex flex-col gap-1 border border-outline-variant/30 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-primary">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">shield_person</span> ADMIN NOTE
                          </span>
                          <span className="text-on-surface-variant font-normal">
                            {new Date(note.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface whitespace-pre-wrap font-mono">{note.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant/70 italic px-1">
                    No internal notes posted yet. Use the field below to log confidential staff comments.
                  </p>
                )}

                {/* Add Note Input Area */}
                <div className="flex flex-col gap-2">
                  <textarea
                    ref={noteInputRef}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleAddNote();
                      }
                    }}
                    className="w-full p-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 shadow-sm resize-none"
                    placeholder="Add an internal admin note (not seen by user)... [Ctrl+Enter to save]"
                    rows={2}
                  ></textarea>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant">Press Ctrl+Enter to quickly save</span>
                    <button
                      onClick={handleAddNote}
                      disabled={isNoteSubmitting}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isNoteSubmitting ? 'sync' : 'bookmark'}
                      </span>
                      <span>{isNoteSubmitting ? 'Saving...' : 'Save Note'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Customer Response Composer & Conversation */}
              <section className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">reply</span>
                    <h3 className="text-sm font-bold text-on-surface">Respond to Customer</h3>
                  </div>
                  {/* Clickable Email Direct Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleEmailDirect}
                      className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary/90 text-on-primary text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                      title="Launch external email client with prefilled ticket details"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[13px]">mail</span>
                      <span>Email Direct</span>
                    </button>
                  </div>
                </div>

                {/* Conversation History */}
                {publicReplies.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto p-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Conversation History
                    </span>
                    {publicReplies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface border border-outline-variant/30 text-xs flex flex-col gap-1 shadow-sm"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-primary uppercase">Support Team Reply</span>
                          <span className="text-on-surface-variant">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick AI/Macro Suggestions Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase mr-1">Quick Macros:</span>
                  <button
                    onClick={() =>
                      applyMacro(
                        `Hello,\n\nWe have investigated the issue and resolved the underlying problem. Please test again and let us know if everything is working smoothly on your end.\n\nBest regards,\nCocpit Support Team`,
                        'Issue Resolved'
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm border border-outline-variant/30 cursor-pointer active:scale-95"
                    type="button"
                  >
                    <span>✨ Issue Resolved</span>
                  </button>
                  <button
                    onClick={() =>
                      applyMacro(
                        `Hello,\n\nCould you please provide additional details or screenshots regarding what happened right before this occurred? This will help our engineering team inspect the logs faster.\n\nBest regards,\nCocpit Support Team`,
                        'Requesting Details'
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm border border-outline-variant/30 cursor-pointer active:scale-95"
                    type="button"
                  >
                    <span>🔍 Requesting Details</span>
                  </button>
                  <button
                    onClick={() =>
                      applyMacro(
                        `Hello,\n\nCould you please perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) and clear your browser cache, then attempt the action once more?\n\nBest regards,\nCocpit Support Team`,
                        'Refresh & Clear Cache'
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm border border-outline-variant/30 cursor-pointer active:scale-95"
                    type="button"
                  >
                    <span>🔄 Refresh &amp; Clear Cache</span>
                  </button>
                  <button
                    onClick={() =>
                      applyMacro(
                        `Hello,\n\nThank you for reaching out. We have escalated your inquiry to our engineering team for immediate technical investigation. We will follow up as soon as we have an update.\n\nBest regards,\nCocpit Support Team`,
                        'Under Investigation'
                      )
                    }
                    className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm border border-outline-variant/30 cursor-pointer active:scale-95"
                    type="button"
                  >
                    <span>⏳ Under Investigation</span>
                  </button>
                </div>

                {/* Reply Message Editor */}
                <div className="flex flex-col gap-2">
                  <textarea
                    ref={replyInputRef}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleSendReply();
                      }
                    }}
                    className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface text-xs placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/40 shadow-sm resize-y"
                    placeholder="Write a reply message to the user... [Ctrl+Enter to send]"
                    rows={4}
                  ></textarea>

                  {/* Composer Toolbar & Dispatch Button */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      <span>Recipient:</span>
                      <span className="font-semibold text-on-surface">{activeTicketDetails.email}</span>
                      <button
                        onClick={() => copyToClipboard(activeTicketDetails.email, "Recipient email")}
                        className="text-on-surface-variant hover:text-primary p-0.5 rounded cursor-pointer"
                        title="Copy recipient email"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendReply}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        type="button"
                      >
                        <span>{isSubmitting ? 'Sending...' : 'Send Reply'}</span>
                        <span className={`material-symbols-outlined text-[16px] ${isSubmitting ? 'animate-spin' : ''}`}>
                          {isSubmitting ? 'sync' : 'send'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Attachment Lightbox Modal */}
      {fullscreenAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenAttachment(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">visibility</span>
                Attachment Evidence Preview
              </span>
              <button
                onClick={() => setFullscreenAttachment(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Close Lightbox"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-auto max-h-[72vh] flex items-center justify-center p-2 bg-surface-container-low rounded-lg">
              <img
                src={fullscreenAttachment}
                alt="Enlarged attachment"
                className="max-w-full max-h-[68vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30 flex-wrap">
              <button
                onClick={() => copyToClipboard(fullscreenAttachment, "Attachment link")}
                className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>Copy Link</span>
              </button>
              <a
                href={fullscreenAttachment}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                <span>Open in New Tab</span>
              </a>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fullscreenAttachment;
                  link.download = `ticket-attachment-${activeTicketDetails?.id || 'evidence'}`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Initiating attachment download...', 'info');
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Audit Log Modal */}
      {showAuditModal && activeTicketDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAuditModal(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] bg-surface-container-lowest rounded-xl p-5 flex flex-col gap-4 shadow-2xl border border-outline-variant/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">manage_history</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Staff Audit Trail &amp; Ticket Timeline</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">Ticket: {shortId} ({activeTicketDetails.id})</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[55vh] flex flex-col gap-3 pr-1 text-xs">
              {/* Event 1: Creation */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex justify-between items-center font-bold text-primary text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    TICKET CREATED
                  </span>
                  <span className="text-on-surface-variant font-normal">
                    {activeTicketDetails.date ? new Date(activeTicketDetails.date).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <p className="text-on-surface text-xs">Customer: <span className="font-semibold">{activeTicketDetails.email}</span></p>
                <p className="text-on-surface-variant text-[11px] italic">"{activeTicketDetails.issue}"</p>
              </div>

              {/* Event 2: Status */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex justify-between items-center font-bold text-secondary text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    CURRENT STATUS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px]">
                    {activeTicketDetails.status}
                  </span>
                </div>
              </div>

              {/* Event 3: All replies & internal notes chronological */}
              {replies.length > 0 ? (
                replies.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col gap-1 ${
                      r.is_internal_note
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={`flex items-center gap-1 ${r.is_internal_note ? 'text-amber-600' : 'text-primary'}`}>
                        <span className="material-symbols-outlined text-[13px]">
                          {r.is_internal_note ? 'lock' : 'outgoing_mail'}
                        </span>
                        {r.is_internal_note ? 'INTERNAL STAFF NOTE' : 'DISPATCHED EMAIL REPLY'}
                      </span>
                      <span className="text-on-surface-variant font-normal">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-on-surface whitespace-pre-wrap font-sans text-xs">{r.message}</p>
                    {r.admin_id && (
                      <span className="text-[10px] text-on-surface-variant font-mono">Staff ID: {r.admin_id}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-surface-container-low text-center text-on-surface-variant text-xs">
                  No subsequent staff replies or notes recorded yet.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30 flex-wrap gap-2">
              <span className="text-[11px] text-on-surface-variant">Total events logged: {replies.length + 2}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const auditSummary = `[AUDIT LOG SUMMARY]\nTicket: ${shortId} (${activeTicketDetails.id})\nCustomer: ${activeTicketDetails.email}\nStatus: ${activeTicketDetails.status}\nSubmitted: ${activeTicketDetails.date}\nIssue: ${activeTicketDetails.issue}\n\nReplies & Notes:\n` +
                      replies.map((r, i) => `[${i+1}] ${r.is_internal_note ? 'NOTE' : 'REPLY'} at ${r.created_at}: ${r.message}`).join('\n');
                    copyToClipboard(auditSummary, "Audit Log Summary");
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>Copy Audit Summary</span>
                </button>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
