'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, OWNER_DISCORD_ID } from '@/lib/auth';
import { 
  MessageSquare, 
  X, 
  ChevronDown, 
  Send, 
  ArrowLeft, 
  Plus, 
  Trash2
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
  lastMessageSenderId?: string | null;
  lastMessageId?: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'owner' | 'admin' | 'staff';
  sender_avatar?: string;
  message: string;
  created_at: string;
}

interface LoanApplicant {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  amount: number;
  crypto_currency: string;
  reason?: string;
}

export default function SupportWidget() {
  const { user, isAdmin, isOwner } = useAuth();
  const isStaff = isOwner || isAdmin;

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [staffTab, setStaffTab] = useState<'received' | 'conversations'>('received');
  const [view, setView] = useState<'list' | 'chat' | 'create'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User-scoped storage key so owner & alt never collide in the same browser
  const getStorageKey = () => `sotarium_support_read_msgs_${user?.id || 'guest'}`;

  // Check unread messages for notification dot using user-scoped storage & message ID
  const checkUnread = (fetchedTickets: Ticket[]) => {
    try {
      const storageKey = getStorageKey();
      const readMapStr = localStorage.getItem(storageKey);
      const readMap: Record<string, string> = readMapStr ? JSON.parse(readMapStr) : {};

      let unread = 0;
      for (const t of fetchedTickets) {
        if (!t.lastMessageId && !t.lastMessageTime) continue;

        // Check if latest message is from someone else
        const isFromOther = t.lastMessageSenderId
          ? t.lastMessageSenderId !== user?.id
          : t.lastMessageSender?.toLowerCase() !== user?.username?.toLowerCase();

        if (!isFromOther) continue;

        // Unread if message ID differs or not yet tracked
        const lastReadMsg = readMap[t.id];
        const isUnread = t.lastMessageId
          ? lastReadMsg !== t.lastMessageId
          : (!lastReadMsg || new Date(t.lastMessageTime || '').getTime() > new Date(lastReadMsg).getTime());

        if (isUnread) {
          unread++;
        }
      }

      setUnreadCount(unread);
      setHasUnread(unread > 0);
    } catch (e) {
      console.error('Failed to check unread messages:', e);
    }
  };

  const markTicketAsRead = (ticketId: string, specificMsgId?: string | null) => {
    try {
      const storageKey = getStorageKey();
      const readMapStr = localStorage.getItem(storageKey);
      const readMap: Record<string, string> = readMapStr ? JSON.parse(readMapStr) : {};

      const currentTicket = tickets.find((t) => t.id === ticketId);
      readMap[ticketId] = specificMsgId || currentTicket?.lastMessageId || new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(readMap));
      checkUnread(tickets);
    } catch (e) {
      console.error('Failed to mark ticket as read:', e);
    }
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        checkUnread(tickets);
      }
      return next;
    });
  };

  // Loan applicants list for staff to pick borrower
  const [loanApplicants, setLoanApplicants] = useState<LoanApplicant[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');
  const [isBorrowerDropdownOpen, setIsBorrowerDropdownOpen] = useState(false);

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

  // When viewing chat, mark active ticket as read
  useEffect(() => {
    if (isOpen && view === 'chat' && activeTicket) {
      const latest = messages[messages.length - 1];
      markTicketAsRead(activeTicket.id, latest?.id || activeTicket.lastMessageId);
    }
  }, [isOpen, view, activeTicket, messages]);

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
        const data: Ticket[] = await res.json();
        setTickets(data);
        checkUnread(data);
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

  // Background polling every 7s when widget is closed to show unread red dot in real time
  useEffect(() => {
    if (isOpen || !user?.id) return;

    fetchTickets(true);
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [isOpen, user]);

  // On open or user load, fetch tickets & applicants
  useEffect(() => {
    if (isOpen && user?.id) {
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
        setHasUnread(false);
        setUnreadCount(0);
        try {
          localStorage.setItem('sotarium_support_last_seen', Date.now().toString());
        } catch {}
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
    markTicketAsRead(ticket.id);
    fetchMessages(ticket.id).finally(() => setIsLoading(false));
  };

  // Handle borrower selection in create ticket form
  const handleSelectBorrower = (applicantUserId: string) => {
    setSelectedBorrowerId(applicantUserId);
    const applicant = loanApplicants.find((a) => a.user_id === applicantUserId);
    if (applicant) {
      setTargetUserId(applicant.user_id);
      setTargetUserName(applicant.user_name);
      setTargetUserAvatar(applicant.user_avatar || '');
      setNewSubject(`Loan Inquiry: ${applicant.user_name} ($${applicant.amount.toFixed(2)} ${applicant.crypto_currency})`);
    } else {
      setTargetUserId(user?.id || 'guest');
      setTargetUserName(user?.username || 'Client');
      setTargetUserAvatar(user?.avatar || '');
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
          creatorName: user?.username || (isOwner ? 'Sotarium' : isStaff ? 'Staff' : 'Client'),
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
      sender_name: user?.username || (isOwner ? 'Sotarium' : isStaff ? 'Staff' : 'Client'),
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
          senderName: user?.username || (isOwner ? 'Sotarium' : isStaff ? 'Staff' : 'Client'),
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

  const handleDeleteTicket = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/support/tickets?id=${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        if (activeTicket?.id === ticketId) {
          setActiveTicket(null);
          setView('list');
        }
      }
    } catch (err) {
      console.error('Failed to delete ticket:', err);
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
        <div className="fixed bottom-22 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-7rem)] bg-[#121212] border border-white/[0.06] rounded-[22px] shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 font-sans">

          {/* VIEW 1: TICKETS LIST */}
          {view === 'list' && (
            <>
              {/* Single Clean Header */}
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <span className="font-bold text-white text-[15px] tracking-tight">Support</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      fetchLoanApplicants();
                      setView('create');
                    }}
                    className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="New ticket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="Close"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Segmented Tab Switcher (Staff only) */}
              {isStaff && (
                <div className="px-4 pb-3">
                  <div className="flex p-1 rounded-full bg-[#181818]">
                    <button
                      onClick={() => setStaffTab('received')}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        staffTab === 'received'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>Received</span>
                      {receivedTickets.length > 0 && (
                        <span className={staffTab === 'received' ? 'text-black/60' : 'text-neutral-500'}>
                          {receivedTickets.length}
                        </span>
                      )}
                      {hasUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => setStaffTab('conversations')}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        staffTab === 'conversations'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Yours
                    </button>
                  </div>
                </div>
              )}

              {/* Tickets Scrollable List */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
                {displayTickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <span className="text-neutral-500 text-xs">
                      {isStaff && staffTab === 'received' ? 'No received tickets yet' : 'No tickets yet'}
                    </span>
                    <button
                      onClick={() => {
                        fetchLoanApplicants();
                        setView('create');
                      }}
                      className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {isStaff ? 'New Message' : 'Start Conversation'}
                    </button>
                  </div>
                ) : (
                  displayTickets.map((t) => {
                    const storageKey = getStorageKey();
                    let isTicketUnread = false;
                    try {
                      const readMap = JSON.parse(localStorage.getItem(storageKey) || '{}');
                      const isFromOther = t.lastMessageSenderId
                        ? t.lastMessageSenderId !== user?.id
                        : t.lastMessageSender?.toLowerCase() !== user?.username?.toLowerCase();
                      if (isFromOther && t.lastMessageId) {
                        isTicketUnread = readMap[t.id] !== t.lastMessageId;
                      }
                    } catch {}

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleOpenTicket(t)}
                        className="p-3 rounded-2xl bg-[#181818]/70 hover:bg-[#1e1e20] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={t.user_name}
                            className="w-9 h-9 rounded-full object-cover bg-neutral-800 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[13px] text-white truncate">
                                {t.subject || 'Loan Support'}
                              </span>
                              {isTicketUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 truncate mt-0.5">
                              {t.lastMessage ? `${t.lastMessageSender || 'Msg'}: ${t.lastMessage}` : t.user_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-neutral-500">
                            {new Date(t.lastMessageTime || t.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={(e) => handleDeleteTicket(e, t.id)}
                            className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* VIEW 2: CREATE NEW TICKET */}
          {view === 'create' && (
            <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="p-1.5 rounded-full hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {isStaff ? 'New Message' : 'New Ticket'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col p-4 space-y-3.5 overflow-y-auto">
                {/* Staff: Borrower Selector */}
                {isStaff && (
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-medium text-neutral-400">Borrower</label>
                    <div
                      onClick={() => setIsBorrowerDropdownOpen((prev) => !prev)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/[0.06] hover:border-white/15 text-xs text-white flex items-center justify-between cursor-pointer transition-all select-none"
                    >
                      {selectedBorrowerId ? (
                        <div className="flex items-center gap-2 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={targetUserAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={targetUserName}
                            className="w-5 h-5 rounded-full object-cover shrink-0 bg-neutral-800"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                          />
                          <span className="font-semibold text-xs text-white truncate">
                            {targetUserName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-xs">Choose a borrower...</span>
                      )}

                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${
                          isBorrowerDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>

                    {isBorrowerDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsBorrowerDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#181818] border border-white/[0.08] rounded-xl p-1.5 shadow-2xl z-50 space-y-1 max-h-52 overflow-y-auto">
                          {loanApplicants.length === 0 ? (
                            <div className="p-3 text-center text-xs text-neutral-500">
                              No borrowers found
                            </div>
                          ) : (
                            loanApplicants.map((applicant) => (
                              <div
                                key={applicant.id}
                                onClick={() => {
                                  handleSelectBorrower(applicant.user_id);
                                  setIsBorrowerDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedBorrowerId === applicant.user_id
                                    ? 'bg-white/10 text-white'
                                    : 'hover:bg-white/[0.05] text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={applicant.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                    alt={applicant.user_name}
                                    className="w-6 h-6 rounded-full object-cover bg-neutral-800 shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                                  />
                                  <div className="text-left min-w-0">
                                    <div className="text-xs font-semibold text-white truncate">
                                      {applicant.user_name}
                                    </div>
                                    <div className="text-[11px] text-neutral-500">
                                      ${applicant.amount.toFixed(2)} {applicant.crypto_currency}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Subject</label>
                  <input
                    type="text"
                    placeholder="What is this about?"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
                  />
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-xs font-medium text-neutral-400">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your message..."
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/25 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="flex-1 py-2.5 rounded-full bg-[#181818] hover:bg-[#222224] text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket || !newInitialMsg.trim()}
                    className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingTicket ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW 3: CHAT THREAD */}
          {view === 'chat' && activeTicket && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Top Header */}
              <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between bg-[#121212]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="p-1.5 -ml-1 rounded-full hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTicket.user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={activeTicket.user_name}
                    className="w-7 h-7 rounded-full object-cover bg-neutral-800 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white truncate">
                      {activeTicket.user_name}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {activeTicket.subject}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDeleteTicket(e, activeTicket.id)}
                    className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="Close"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0e0e10]">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-500 text-xs">
                    No messages yet
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}
                      >
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-[13px] max-w-[82%] break-words leading-snug ${
                            isMe
                              ? 'bg-white text-black font-medium'
                              : 'bg-[#1c1c1f] text-neutral-100'
                          }`}
                        >
                          {m.message}
                        </div>

                        <span className="text-[10px] text-neutral-500 px-1">
                          {isMe ? '' : `${m.sender_name} · `}
                          {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
                className="p-3 bg-[#121212] border-t border-white/[0.05]"
              >
                <div className="flex items-center gap-2 bg-[#181818] border border-white/[0.06] focus-within:border-white/20 rounded-full pl-4 pr-1.5 py-1.5 transition-colors">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={activeTicket.status === 'closed'}
                    className="flex-1 bg-transparent text-[13px] text-white placeholder-neutral-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMsg || !chatInput.trim() || activeTicket.status === 'closed'}
                    className="w-7 h-7 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-30 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Circular Launcher Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggleOpen}
          className="relative w-12 h-12 rounded-full bg-[#181818] border border-white/[0.12] hover:border-white/30 text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={isOpen ? 'Close Support' : 'Open Support'}
          aria-label="Support Ticket Widget"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <MessageSquare className="w-5 h-5 text-white" />
          )}

          {/* Unread Reply Notification Dot */}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-[#121212] shadow-lg shadow-red-500/50" />
            </span>
          )}
        </button>
      </div>
    </>
  );
}
