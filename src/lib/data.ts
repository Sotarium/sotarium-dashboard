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

export const INITIAL_LOANS: Loan[] = [];
