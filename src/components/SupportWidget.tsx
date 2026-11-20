'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, OWNER_DISCORD_ID } from '@/lib/auth';
import { 
  MessageSquare, 
  X, 
  ChevronDown, 
  RefreshCw, 
  Send, 
  ArrowLeft, 
  Plus, 
  UserCheck,
  Users
} from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageSender?: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'owner' | 'admin';
  sender_avatar?: string;
  message: string;
  created_at: string;
}

interface LoanApplicant {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  crypto_currency: string;
  reason?: string;
}

export default function SupportWidget() {
  const { user, isAdmin, isOwner } = useAuth();
  const isStaff = isOwner || isAdmin;

  const [isOpen, setIsOpen] = useState(false);
  const [staffTab, setStaffTab] = useState<'received' | 'conversations'>('received');
  const [view, setView] = useState<'list' | 'chat' | 'create'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loan applicants list for staff to pick borrower
  const [loanApplicants, setLoanApplicants] = useState<LoanApplicant[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');

  // New ticket state
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserName, setTargetUserName] = useState('');
  const [targetUserAvatar, setTargetUserAvatar] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  // Fetch loan applicants (so staff can make tickets with people that asked for loans)
  const fetchLoanApplicants = async () => {
    if (!isStaff) return;
    try {
      const res = await fetch('/api/loan-requests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLoanApplicants(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch loan applicants:', e);
    }
  };

  // Fetch tickets
  const fetchTickets = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const url = user
        ? `/api/support/tickets?userId=${user.id}&isAdmin=${isStaff}`
        : `/api/support/tickets`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch messages for active ticket
  const fetchMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  // On open or user load, fetch tickets & applicants
  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      fetchLoanApplicants();
    }
  }, [isOpen, user]);

  // Listen to global 'open-support-chat' event (e.g. from /requests page)
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        userId: string;
        userName: string;
        userAvatar?: string;
        subject?: string;
      }>;
      const { userId, userName, userAvatar, subject } = customEvent.detail || {};
      if (userId) {
        setIsOpen(true);
        // Check if ticket already exists
        const existing = tickets.find((t) => t.user_id === userId);
        if (existing) {
          handleOpenTicket(existing);
        } else {
          setTargetUserId(userId);
          setTargetUserName(userName || 'Borrower');
          setTargetUserAvatar(userAvatar || '');
          setSelectedBorrowerId(userId);
          setNewSubject(subject || `Loan Discussion with ${userName || 'Borrower'}`);
          setView('create');
        }
      }
    };

    window.addEventListener('open-support-chat', handleOpenChat);
    return () => window.removeEventListener('open-support-chat', handleOpenChat);
  }, [tickets]);

  // Live real-time polling every 3 seconds when widget is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (view === 'chat' && activeTicket) {
        fetchMessages(activeTicket.id);
      } else if (view === 'list') {
        fetchTickets(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, view, activeTicket]);

  // Handle open ticket chat
  const handleOpenTicket = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setView('chat');
    setIsLoading(true);
    fetchMessages(ticket.id).finally(() => setIsLoading(false));
  };

  // Handle borrower selection in create ticket form
  const handleSelectBorrower = (applicantUserId: string) => {
    setSelectedBorrowerId(applicantUserId);
    const applicant = loanApplicants.find((a) => a.user_id === applicantUserId);
    if (applicant) {
      setTargetUserId(applicant.user_id);
      setTargetUserName(applicant.user_name);
      setNewSubject(`Loan Inquiry: ${applicant.user_name} ($${applicant.amount.toFixed(2)} ${applicant.crypto_currency})`);
    } else {
      setTargetUserId(user?.id || 'guest');
      setTargetUserName(user?.username || 'Client');
      setNewSubject('');
    }
  };

  // Handle submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInitialMsg.trim()) return;

    setIsSubmittingTicket(true);
    try {
      // If staff is creating for a client, ticket.user_id is the client's ID
      const finalUserId = isStaff && targetUserId ? targetUserId : (user?.id || 'guest');
      const finalUserName = isStaff && targetUserName ? targetUserName : (user?.username || 'Client');
      const finalUserAvatar = isStaff && targetUserAvatar ? targetUserAvatar : (user?.avatar || '');

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          userName: finalUserName,
          userAvatar: finalUserAvatar,
          subject: newSubject.trim() || 'Loan Support Ticket',
          message: newInitialMsg.trim(),
          creatorId: user?.id,
          creatorName: user?.username || 'Sotarium (Staff)',
          creatorRole: isOwner ? 'owner' : isStaff ? 'admin' : 'user',
          creatorAvatar: user?.avatar || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewSubject('');
        setNewInitialMsg('');
        setSelectedBorrowerId('');
        setTargetUserId('');
        setTargetUserName('');
        await fetchTickets(true);
        handleOpenTicket(data.ticket);
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Handle send message in chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicket) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsSendingMsg(true);

    const senderRole = isOwner ? 'owner' : isStaff ? 'admin' : 'user';

    // Optimistic message update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      ticket_id: activeTicket.id,
      sender_id: user?.id || 'guest',
      sender_name: user?.username || (isStaff ? 'Sotarium' : 'Client'),
      sender_role: senderRole,
      sender_avatar: user?.avatar,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          senderId: user?.id || 'guest',
          senderName: user?.username || (isStaff ? 'Sotarium' : 'Client'),
          senderRole,
          senderAvatar: user?.avatar || '',
          message: text,
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? savedMsg : m)));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Toggle ticket status (close / open)
  const handleToggleStatus = async () => {
    if (!activeTicket) return;
    const nextStatus = activeTicket.status === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeTicket.id, status: nextStatus }),
      });
      if (res.ok) {
        setActiveTicket((prev) => (prev ? { ...prev, status: nextStatus } : null));
        setTickets((prev) =>
          prev.map((t) => (t.id === activeTicket.id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle ticket status:', err);
    }
  };

  // Filter tickets depending on staff tab
  const receivedTickets = tickets.filter((t) => t.user_id !== user?.id);
  const myConversations = tickets.filter((t) => t.user_id === user?.id);
  const displayTickets = isStaff 
    ? (staffTab === 'received' ? receivedTickets : myConversations)
    : tickets;

  return (
    <>
      {/* Support Window Card */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[510px] max-h-[calc(100vh-7rem)] bg-[#0d0d0d] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#121212]/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight font-sans">Support</span>
              {isStaff && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                  Staff
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              title="Minimize Support"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Subheader: Received Tickets vs Your Conversations for Staff */}
          {isStaff ? (
            <div className="flex border-b border-white/[0.06] bg-[#0f0f0f]">
              <button
                onClick={() => { setStaffTab('received'); setView('list'); }}
                className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                  staffTab === 'received'
                    ? 'text-white border-b-2 border-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Received Tickets {receivedTickets.length > 0 && `(${receivedTickets.length})`}
              </button>
              <button
                onClick={() => { setStaffTab('conversations'); setView('list'); }}
                className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                  staffTab === 'conversations'
                    ? 'text-white border-b-2 border-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Your Conversations
              </button>
            </div>
          ) : (
            <div className="border-b border-white/[0.06] bg-[#0f0f0f]">
              <div className="px-4 py-2.5 text-center text-xs font-semibold text-white border-b-2 border-white relative inline-block w-full">
                Your Conversations
              </div>
            </div>
          )}

          {/* Main Body */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">
            {/* VIEW 1: TICKETS LIST */}
            {view === 'list' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tickets Subheader */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04]">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                    {isStaff && staffTab === 'received' ? 'RECEIVED TICKETS' : 'YOUR TICKETS'}{' '}
                    {displayTickets.length > 0 && `(${displayTickets.length})`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchTickets()}
                      disabled={isRefreshing}
                      className="text-neutral-500 hover:text-white transition-colors"
                      title="Refresh tickets"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        fetchLoanApplicants();
                        setView('create');
                      }}
                      className="p-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs transition-colors"
                      title="New Ticket"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tickets Scrollable List */}
                <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2 space-y-1">
                  {displayTickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <span className="text-neutral-500 text-xs">
                        {isStaff && staffTab === 'received' 
                          ? 'No received client tickets yet' 
                          : 'No tickets yet'}
                      </span>
                      <button
                        onClick={() => {
                          fetchLoanApplicants();
                          setView('create');
                        }}
                        className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
                      >
                        {isStaff ? 'Message a loan applicant' : 'Start conversation'}
                      </button>
                    </div>
                  ) : (
                    displayTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenTicket(t)}
                        className="p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={t.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                              alt={t.user_name}
                              className="w-5 h-5 rounded-full object-cover bg-neutral-800"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                            />
                            <div className="truncate max-w-[170px]">
                              <span className="font-semibold text-xs text-white truncate block">
                                {t.subject || 'Loan Support'}
                              </span>
                              {isStaff && (
                                <span className="text-[10px] text-neutral-500 block truncate">
                                  Client: {t.user_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'open'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        {/* Last message preview */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="truncate max-w-[210px] text-neutral-400 group-hover:text-neutral-300">
                            {t.lastMessage ? `${t.lastMessageSender || 'Msg'}: ${t.lastMessage}` : 'Conversation started'}
                          </span>
                          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                            {new Date(t.lastMessageTime || t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Bar in List */}
                <div className="p-3 border-t border-white/[0.06] bg-[#0c0c0c]">
                  <button
                    onClick={() => {
                      fetchLoanApplicants();
                      setView('create');
                    }}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isStaff ? 'New Ticket / Message Applicant' : 'New Ticket'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: CREATE NEW TICKET */}
            {view === 'create' && (
              <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-white">
                    {isStaff ? 'Open Ticket with Client' : 'Create New Support Ticket'}
                  </span>
                </div>

                {/* Staff: Borrower / Loan Applicant Picker */}
                {isStaff && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-neutral-400" />
                      <span>Select Loan Applicant / Client</span>
                    </label>
                    <select
                      value={selectedBorrowerId}
                      onChange={(e) => handleSelectBorrower(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="">Choose a borrower who requested a loan...</option>
                      {loanApplicants.map((a) => (
                        <option key={a.id} value={a.user_id}>
                          {a.user_name} — ${a.amount.toFixed(2)} {a.crypto_currency}
                        </option>
                      ))}
                    </select>

                    {selectedBorrowerId && (
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 px-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Connected to borrower: <strong>{targetUserName}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">Subject / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Question about loan repayment..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[11px] font-semibold text-neutral-300">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder={isStaff ? 'Type your message to this borrower...' : 'Describe how we can assist you...'}
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    className="w-full flex-1 px-3 py-2.5 rounded-xl bg-[#141414] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket || !newInitialMsg.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingTicket ? 'Submitting...' : 'Send Ticket'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: CHAT THREAD */}
            {view === 'chat' && activeTicket && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Top Header */}
                <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-[#111111]">
                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      onClick={() => setView('list')}
                      className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate max-w-[180px]">
                        {activeTicket.subject}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {activeTicket.user_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleToggleStatus}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        activeTicket.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                      title="Click to toggle status"
                    >
                      {activeTicket.status}
                    </button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">
                      No messages yet. Send a message to start!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      const isStaffMsg = m.sender_role === 'owner' || m.sender_role === 'admin';

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400 px-1">
                            <span>{m.sender_name}</span>
                            {isStaffMsg && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                                Staff
                              </span>
                            )}
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${
                              isMe
                                ? 'bg-white text-black font-medium rounded-tr-sm shadow-sm'
                                : 'bg-[#181818] border border-white/[0.08] text-white rounded-tl-sm'
                            }`}
                          >
                            {m.message}
                          </div>

                          <span className="text-[9px] text-neutral-500 px-1 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-2.5 border-t border-white/[0.06] bg-[#0d0d0d] flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={activeTicket.status === 'closed'}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#171717] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMsg || !chatInput.trim() || activeTicket.status === 'closed'}
                    className="p-2 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-40 shadow-sm shrink-0"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Circular Launcher Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#181818] border border-white/[0.12] hover:border-white/30 text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
        title={isOpen ? 'Close Support' : 'Open Support'}
        aria-label="Support Ticket Widget"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageSquare className="w-5 h-5 text-white" />
        )}
      </button>
    </>
  );
}
