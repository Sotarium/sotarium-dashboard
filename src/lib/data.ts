export interface Loan {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  repaidAmount: number;
  status: 'active' | 'completed' | 'overdue';
  loanDate: string;
  dueDate: string;
  ticketChannelId?: string;
  addresses: {
    sol?: string;
    eth?: string;
    ltc?: string;
  };
  notes?: string;
  completedAt?: string;
}

// Real active loans with live SOL, ETH & LTC NOWPayments deposit addresses
export const INITIAL_LOANS: Loan[] = [
  {
    id: "LOAN-1079074717799030824",
    userId: "1079074717799030824",
    userName: "sotarium",
    userAvatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    principal: 1000,
    interestRate: 0.15,
    interestAmount: 150,
    totalDue: 1150,
    repaidAmount: 0,
    status: 'active',
    loanDate: "2026-11-19",
    dueDate: "Nov 20, 2026",
    ticketChannelId: "1573024208118743202",
    addresses: {
      sol: "DMKA3rLfwVJagiV7jLiP4X4BCuoYDZ23h2JD3LDMU2MG",
      eth: "0xD022Bf33Ac2193Ad3F4144022ea3Be63153a7b72",
      ltc: "MBJbSvbyCLMh8VYiJGKxtpJaSK9TFWuUup"
    },
    notes: "Active Loan Ticket"
  }
];
