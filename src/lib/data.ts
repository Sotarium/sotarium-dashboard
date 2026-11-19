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
    userAvatar: "https://cdn.discordapp.com/avatars/1079074717799030824/64db63e7b0bcbe6b841ba40535473949.png?size=128",
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
      eth: "0xF1b93f0Cc886be3d1D6983116b286A07117F4f0D",
      ltc: "MAVKtFcudkZ7LDavCLTS6PAacHhTmqVWo6"
    },
    notes: "Active Loan Ticket"
  }
];
