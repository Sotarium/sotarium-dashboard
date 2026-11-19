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
  addresses: {
    sol?: string;
    eth?: string;
    ltc?: string;
  };
  notes?: string;
  completedAt?: string;
}

export const INITIAL_LOANS: Loan[] = [
  {
    id: "LOAN-1079074717799030824",
    userId: "1079074717799030824",
    userName: "PlayerOne",
    userAvatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    principal: 1000,
    interestRate: 0.15,
    interestAmount: 150,
    totalDue: 1150,
    repaidAmount: 250,
    status: 'active',
    loanDate: "2026-11-19",
    dueDate: "2026-11-26",
    addresses: {
      sol: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      eth: "0x71C...b29",
      ltc: "ltc1q...99k"
    },
    notes: "High roller tier"
  },
  {
    id: "LOAN-98430067123984",
    userId: "98430067123984",
    userName: "KevVibes",
    userAvatar: "https://cdn.discordapp.com/embed/avatars/1.png",
    principal: 500,
    interestRate: 0.15,
    interestAmount: 75,
    totalDue: 575,
    repaidAmount: 575,
    status: 'completed',
    loanDate: "2026-11-15",
    dueDate: "2026-11-22",
    completedAt: "2026-11-18",
    addresses: {
      sol: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    },
    notes: "Paid in full"
  }
];
