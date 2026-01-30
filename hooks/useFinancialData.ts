import { useState, useEffect } from 'react';
import { Transaction, UserProfile, ChatMessage, SavingsGoal, BudgetLimit } from '../types';
import { sendMessageToGemini, generateGoalImage, getDailyQuote } from '../services/geminiService';
import { 
  getTransactions, 
  saveTransaction, 
  updateTransaction,
  deleteTransaction,
  getUserProfile, 
  updateMonthlyIncome,
  updateDailyQuote,
  updatePreferences,
  saveGoal,
  deleteGoal,
  saveLimit,
  deleteLimit,
  getChatHistory,
  saveChatHistory,
  clearAllData
} from '../services/storageService';

export const useFinancialData = (session: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    monthlyIncome: 0, 
    hasOnboarded: false, 
    savingsGoals: [], 
    budgetLimits: [] 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // --- DATA LOADING ---
  const loadData = async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const [txs, profile, history] = await Promise.all([
        getTransactions(),
        getUserProfile(),
        getChatHistory()
      ]);

      setTransactions(txs);
      setUserProfile(profile);
      setMessages(history);

      // Welcome message check
      if (!profile.hasOnboarded && history.length === 0) {
        const welcomeMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'assistant',
          text: "Olá! Sou o Diga. \n\nPara começarmos, qual é a sua renda mensal aproximada? (Ex: Fale ou digite 'Ganho 2000 por mês')",
          timestamp: Date.now()
        };
        setMessages([welcomeMsg]);
        saveChatHistory([welcomeMsg]);
      }

      // Daily Quote
      const today = new Date().toISOString().split('T')[0];
      if (!profile.dailyQuote || profile.dailyQuote.date !== today) {
        getDailyQuote().then(async quote => {
          await updateDailyQuote(quote, today);
          setUserProfile(prev => ({ ...prev, dailyQuote: { text: quote, date: today } }));
        });
      }

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
    } else {
        // Clear state on logout
        setTransactions([]);
        setUserProfile({ monthlyIncome: 0, hasOnboarded: false, savingsGoals: [], budgetLimits: [] });
        setMessages([]);
    }
  }, [session]);

  // --- ACTIONS ---

  const resetApp = async () => {
    await clearAllData();
    setTransactions([]);
    setUserProfile({ monthlyIncome: 0, hasOnboarded: false, savingsGoals: [], budgetLimits: [] });
    setMessages([]);
    loadData();
  };

  const updateUserProfileLocal = (newProfile: UserProfile) => {
      setUserProfile(newProfile);
      if (newProfile.preferences) updatePreferences(newProfile.preferences);
      if (newProfile.monthlyIncome !== userProfile.monthlyIncome) updateMonthlyIncome(newProfile.monthlyIncome);
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setIsLoading(true);

    try {
      const historyStrings = updatedMessages.map(m => `${m.sender}: ${m.text}`);
      const aiResponse = await sendMessageToGemini(text, historyStrings, userProfile, transactions);

      let assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: aiResponse.responseText,
        timestamp: Date.now()
      };

      if (aiResponse.intent === 'transaction_proposal' && aiResponse.extractedTransaction) {
        assistantMsg.isDraft = true;
        assistantMsg.draftData = { ...aiResponse.extractedTransaction, id: Date.now().toString() } as Transaction;
      } 
      
      else if (aiResponse.intent === 'create_goal' && aiResponse.newGoal) {
          const targetVal = Number(aiResponse.newGoal.targetAmount) || 0;
          const goalName = aiResponse.newGoal.name;
          const existingGoal = userProfile.savingsGoals.find(g => g.name.toLowerCase() === goalName.toLowerCase());

          if (existingGoal) {
             if (targetVal > 0) {
                 const updatedGoal = { ...existingGoal, targetAmount: targetVal };
                 const pMonths = Number(aiResponse.newGoal.plannedMonths);
                 if (pMonths && pMonths > 0) {
                     const monthly = targetVal / pMonths;
                     const date = new Date();
                     date.setMonth(date.getMonth() + pMonths);
                     updatedGoal.deadline = date.toISOString();
                     updatedGoal.monthlyPlanAmount = monthly;
                     assistantMsg.text += `\n\n(Atualizei os detalhes da sua meta!)`;
                 }
                 await saveGoal(updatedGoal);
                 setUserProfile(prev => ({ 
                     ...prev, 
                     savingsGoals: prev.savingsGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g) 
                 }));
             }
          } else {
             if (targetVal > 0) {
                 let newGoal: SavingsGoal = {
                     id: Date.now().toString(),
                     name: goalName,
                     targetAmount: targetVal,
                     currentAmount: 0
                 };
                 const pMonths = Number(aiResponse.newGoal.plannedMonths);
                 if (pMonths && pMonths > 0) {
                    const monthly = targetVal / pMonths;
                    const date = new Date();
                    date.setMonth(date.getMonth() + pMonths);
                    newGoal.deadline = date.toISOString();
                    newGoal.monthlyPlanAmount = monthly;
                    assistantMsg.text += `\n\nJá preparei o plano: guarde ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthly)} por mês durante ${pMonths} meses.`;
                 }
                 await saveGoal(newGoal);
                 setUserProfile(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, newGoal] }));
                 
                 generateGoalImage(newGoal.name).then(async imgUrl => {
                    if (imgUrl) {
                       const goalWithImg = { ...newGoal, imageUrl: imgUrl };
                       await saveGoal(goalWithImg);
                       setUserProfile(current => ({
                           ...current,
                           savingsGoals: current.savingsGoals.map(g => g.id === newGoal.id ? goalWithImg : g)
                       }));
                    }
                 });
             }
          }
      } 
      
      else if (aiResponse.intent === 'set_budget_limit' && aiResponse.setLimit) {
         const { category, amount } = aiResponse.setLimit;
         const existingLimit = userProfile.budgetLimits.find(l => l.category.toLowerCase() === category.toLowerCase());
         
         const newLimit: BudgetLimit = existingLimit 
            ? { ...existingLimit, amount } 
            : { id: Date.now().toString(), category, amount };

         await saveLimit(newLimit);
         setUserProfile(prev => {
             const others = prev.budgetLimits.filter(l => l.category.toLowerCase() !== category.toLowerCase());
             return { ...prev, budgetLimits: [...others, newLimit] };
         });
         
         assistantMsg.text = `Defini um limite de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} para a categoria "${category}".`;
      }

      else if (aiResponse.intent === 'add_to_goal' && aiResponse.addToGoal) {
          assistantMsg.isDraft = true;
          assistantMsg.draftData = {
             id: Date.now().toString(),
             type: 'EXPENSE',
             amount: aiResponse.addToGoal.amount,
             category: 'Economia',
             description: `Economia para: ${aiResponse.addToGoal.goalName}`,
             date: new Date().toISOString().split('T')[0]
          };
          assistantMsg.goalData = {
             goalName: aiResponse.addToGoal.goalName,
             amount: aiResponse.addToGoal.amount
          };
          assistantMsg.text = `Entendi! Você guardou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aiResponse.addToGoal.amount)} para "${aiResponse.addToGoal.goalName}". Confirma?`;
      }

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (error) {
      const errorMsg: ChatMessage = { id: Date.now().toString(), sender: 'assistant', text: "Desculpe, tive um pequeno problema. Pode repetir?", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTransaction = async (messageId: string, confirmed: boolean) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg) return;

    if (confirmed && targetMsg.draftData) {
         const newTx: Transaction = {
            id: Date.now().toString(),
            type: targetMsg.draftData.type as 'INCOME' | 'EXPENSE',
            amount: Number(targetMsg.draftData.amount),
            category: targetMsg.draftData.category || 'Geral',
            date: targetMsg.draftData.date || new Date().toISOString().split('T')[0],
            description: targetMsg.draftData.description || 'Sem descrição',
            isRecurring: targetMsg.draftData.isRecurring || false
         };
         
         await saveTransaction(newTx);
         setTransactions(prev => [...prev, newTx]);
         
         if (targetMsg.goalData) {
             const goal = userProfile.savingsGoals.find(g => g.name.toLowerCase() === targetMsg.goalData?.goalName.toLowerCase());
             if (goal) {
                 const updatedGoal = { ...goal, currentAmount: goal.currentAmount + targetMsg.goalData.amount };
                 await saveGoal(updatedGoal);
                 setUserProfile(prev => ({
                     ...prev,
                     savingsGoals: prev.savingsGoals.map(g => g.id === goal.id ? updatedGoal : g)
                 }));
             }
         }

         setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isDraft: false, text: msg.text + "\n\n✅ CONFIRMADO!" } : msg));
    } else if (!confirmed) {
         setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isDraft: false, text: msg.text + "\n\n❌ Cancelado." } : msg));
    }
    
    setTimeout(() => { 
        saveChatHistory(messages); 
    }, 500);
  };

  // CRUD Actions
  const updateIncome = async (val: number) => {
      await updateMonthlyIncome(val);
      setUserProfile(prev => ({ ...prev, monthlyIncome: val, hasOnboarded: true }));
  };

  const removeTransaction = async (id: string) => { await deleteTransaction(id); setTransactions(prev => prev.filter(t => t.id !== id)); };
  const modifyTransaction = async (updatedTx: Transaction) => { await updateTransaction(updatedTx); setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t)); };
  const removeGoal = async (id: string) => { await deleteGoal(id); setUserProfile(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== id) })); };
  const modifyGoal = async (goal: SavingsGoal) => { await saveGoal(goal); setUserProfile(prev => ({ ...prev, savingsGoals: prev.savingsGoals.map(g => g.id === goal.id ? goal : g) })); };
  const removeLimit = async (id: string) => { await deleteLimit(id); setUserProfile(prev => ({ ...prev, budgetLimits: prev.budgetLimits.filter(l => l.id !== id) })); };
  const modifyLimit = async (limit: BudgetLimit) => { 
      // Handle ID generation if needed, though view usually passes it
      const newLimit = { ...limit, id: limit.id || Date.now().toString() };
      await saveLimit(newLimit); 
      setUserProfile(prev => {
          const others = prev.budgetLimits.filter(l => l.id !== newLimit.id);
          return { ...prev, budgetLimits: [...others, newLimit] };
      });
  };

  return {
    messages,
    transactions,
    userProfile,
    isLoading,
    dataLoading,
    sendMessage,
    confirmTransaction,
    updateUserProfileLocal,
    resetApp,
    updateIncome,
    removeTransaction,
    modifyTransaction,
    removeGoal,
    modifyGoal,
    removeLimit,
    modifyLimit
  };
};