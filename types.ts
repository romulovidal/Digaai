
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  description: string;
  isRecurring?: boolean; // For fixed expenses/income
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl?: string; // Base64 or URL
  deadline?: string; // ISO Date target
  monthlyPlanAmount?: number; // Calculated amount to save per month
}

export interface BudgetLimit {
  id: string;
  category: string;
  amount: number;
}

export interface DailyQuote {
  text: string;
  date: string; // YYYY-MM-DD
}

export interface UserPreferences {
  defaultPrivacyMode?: boolean;
  hasSeenWalkthrough?: boolean;
}

export interface UserProfile {
  monthlyIncome: number;
  hasOnboarded: boolean;
  savingsGoals: SavingsGoal[];
  budgetLimits: BudgetLimit[]; // New: Limits per category
  dailyQuote?: DailyQuote;
  preferences?: UserPreferences;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isDraft?: boolean; // If true, this is a pending transaction confirmation
  draftData?: Partial<Transaction>;
  goalData?: { // Context for adding to a specific goal
    goalName: string;
    amount: number;
  };
}

export interface AIResponseSchema {
  responseText: string;
  extractedTransaction?: {
    type: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    description: string;
    isRecurring?: boolean;
  };
  intent: 'chat' | 'transaction_proposal' | 'check_budget' | 'update_income' | 'create_goal' | 'add_to_goal' | 'update_goal_plan' | 'set_budget_limit';
  budgetAnalysis?: 'safe' | 'warning' | 'danger'; // For "Posso comprar?"
  newGoal?: {
    name: string;
    targetAmount: number;
    plannedMonths?: number; // Allow defining time immediately
  };
  addToGoal?: {
    goalName: string;
    amount: number;
  };
  goalPlan?: { // New intent data
    goalName?: string; // Optional, infers most recent if empty
    months: number; // Duration in months
    amount?: number; // Added to allow updating both
  };
  setLimit?: { // New intent payload
    category: string;
    amount: number;
  };
}
