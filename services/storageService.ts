import { supabase } from './supabaseClient';
import { Transaction, UserProfile, ChatMessage, SavingsGoal, BudgetLimit } from "../types";

// --- HELPERS ---
const getUserId = async () => {
  const { data: { user } } = await (supabase.auth as any).getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
};

// --- TRANSACTIONS ---
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return (data || []).map((t: any) => ({
    ...t,
    amount: Number(t.amount),
    isRecurring: t.is_recurring
  }));
};

export const saveTransaction = async (transaction: Transaction) => {
  const user_id = await getUserId();
  
  const payload = {
    user_id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    description: transaction.description,
    is_recurring: transaction.isRecurring
  };

  const { error } = await supabase.from('transactions').insert([payload]);
  if (error) console.error('Error saving transaction:', error);
};

export const updateTransaction = async (updatedTx: Transaction) => {
  const { error } = await supabase
    .from('transactions')
    .update({
      type: updatedTx.type,
      amount: updatedTx.amount,
      category: updatedTx.category,
      date: updatedTx.date,
      description: updatedTx.description,
      is_recurring: updatedTx.isRecurring
    })
    .eq('id', updatedTx.id);

  if (error) console.error('Error updating transaction:', error);
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Error deleting transaction:', error);
};

// --- USER PROFILE ---
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const userId = await getUserId();
    
    // 1. Get Profile Core
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
       console.error('Error fetching profile:', profileError);
    }

    // 2. Get Goals
    const { data: goalsData } = await supabase.from('savings_goals').select('*');
    
    // 3. Get Limits
    const { data: limitsData } = await supabase.from('budget_limits').select('*');

    const mappedGoals: SavingsGoal[] = (goalsData || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      imageUrl: g.image_url,
      deadline: g.deadline,
      monthlyPlanAmount: Number(g.monthly_plan_amount)
    }));

    const mappedLimits: BudgetLimit[] = (limitsData || []).map((l: any) => ({
      id: l.id,
      category: l.category,
      amount: Number(l.amount)
    }));

    return {
      monthlyIncome: Number(profileData?.monthly_income || 0),
      hasOnboarded: profileData?.has_onboarded || false,
      dailyQuote: profileData?.daily_quote_text ? {
        text: profileData.daily_quote_text,
        date: profileData.daily_quote_date
      } : undefined,
      preferences: profileData?.preferences || {},
      savingsGoals: mappedGoals,
      budgetLimits: mappedLimits
    };

  } catch (e) {
    console.error(e);
    return { monthlyIncome: 0, hasOnboarded: false, savingsGoals: [], budgetLimits: [] };
  }
};

// --- PROFILE UPDATES ---

export const updateMonthlyIncome = async (income: number) => {
  const userId = await getUserId();
  await supabase.from('profiles').update({ monthly_income: income, has_onboarded: true }).eq('id', userId);
};

export const updateDailyQuote = async (text: string, date: string) => {
  const userId = await getUserId();
  await supabase.from('profiles').update({ daily_quote_text: text, daily_quote_date: date }).eq('id', userId);
};

export const updatePreferences = async (prefs: any) => {
  const userId = await getUserId();
  await supabase.from('profiles').update({ preferences: prefs }).eq('id', userId);
};

export const saveGoal = async (goal: SavingsGoal) => {
  const userId = await getUserId();
  const payload = {
    user_id: userId,
    name: goal.name,
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    image_url: goal.imageUrl,
    deadline: goal.deadline,
    monthly_plan_amount: goal.monthlyPlanAmount
  };

  if (goal.id && goal.id.length > 20) {
     await supabase.from('savings_goals').update(payload).eq('id', goal.id);
  } else {
     await supabase.from('savings_goals').insert([payload]);
  }
};

export const deleteGoal = async (id: string) => {
  await supabase.from('savings_goals').delete().eq('id', id);
};

export const saveLimit = async (limit: BudgetLimit) => {
  const userId = await getUserId();
  const payload = {
    user_id: userId,
    category: limit.category,
    amount: limit.amount
  };
  
  if (limit.id && limit.id.length > 20) {
    await supabase.from('budget_limits').update(payload).eq('id', limit.id);
  } else {
    await supabase.from('budget_limits').insert([payload]);
  }
};

export const deleteLimit = async (id: string) => {
  await supabase.from('budget_limits').delete().eq('id', id);
};


// --- CHAT HISTORY ---
export const getChatHistory = async (): Promise<ChatMessage[]> => {
  const { data } = await supabase
    .from('chat_history')
    .select('*')
    .order('timestamp', { ascending: true });
    
  return (data || []).map((msg: any) => ({
    id: msg.id,
    sender: msg.sender,
    text: msg.text,
    timestamp: Number(msg.timestamp),
    isDraft: msg.is_draft,
  }));
};

export const saveChatHistory = async (messages: ChatMessage[]) => {
  // Optimized: We accept an array but mostly we care about saving the latest one 
  // to avoid redundant inserts.
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg) return;

  const userId = await getUserId();
  
  // Use upsert to prevent duplicates if network retries happen
  await supabase.from('chat_history').upsert([{
     id: lastMsg.id,
     user_id: userId,
     sender: lastMsg.sender,
     text: lastMsg.text,
     timestamp: lastMsg.timestamp,
     is_draft: lastMsg.isDraft || false
  }], { onConflict: 'id' });
};

export const clearAllData = async () => {
  const userId = await getUserId();
  await supabase.from('transactions').delete().eq('user_id', userId);
  await supabase.from('savings_goals').delete().eq('user_id', userId);
  await supabase.from('budget_limits').delete().eq('user_id', userId);
  await supabase.from('chat_history').delete().eq('user_id', userId);
  await supabase.from('profiles').update({ 
      monthly_income: 0, 
      has_onboarded: false, 
      preferences: {} 
  }).eq('id', userId);
};