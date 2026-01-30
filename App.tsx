import React, { useState, useEffect } from 'react';
import { MessageSquare, History, SlidersHorizontal, Target, Settings, LayoutDashboard, Sparkles, Loader2, LogOut } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import LimitsView from './components/LimitsView';
import GoalsView from './components/GoalsView';
import SettingsView from './components/SettingsView';
import Walkthrough, { Step } from './components/Walkthrough';
import { SavingsGoal, BudgetLimit } from './types';
import { useFinancialData } from './hooks/useFinancialData';
import { updatePreferences } from './services/storageService';

const App: React.FC = () => {
  // --- Auth State ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'goals' | 'limits' | 'history' | 'settings'>('dashboard');
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editingLimit, setEditingLimit] = useState<Partial<BudgetLimit> | null>(null);

  // --- Custom Hook (Business Logic) ---
  const { 
    messages, transactions, userProfile, isLoading, dataLoading,
    sendMessage, confirmTransaction, updateUserProfileLocal, resetApp,
    updateIncome, removeTransaction, modifyTransaction, 
    removeGoal, modifyGoal, removeLimit, modifyLimit
  } = useFinancialData(session);

  // --- 1. AUTH INITIALIZATION ---
  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => setSession(session)).finally(() => setAuthLoading(false));
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (!session) setActiveTab('dashboard');
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check Walkthrough Preference
  useEffect(() => {
      if (userProfile.preferences && userProfile.preferences.hasSeenWalkthrough !== true && session && !dataLoading) {
         setShowWalkthrough(true);
      }
  }, [userProfile, session, dataLoading]);

  // --- Walkthrough Handlers ---
  const tutorialSteps: Step[] = [
    { title: "Tela Inicial", description: "Este é o seu painel principal. Aqui você sempre verá seu saldo 'Livre para Gastar' e dicas financeiras.", targetTab: 'dashboard', targetId: 'dashboard-safe-spend' },
    { title: "Menu de Chat", description: "Para falar com o Diga, toque neste ícone de balão. Use o chat para registrar gastos, ganhos ou pedir conselhos.", targetTab: 'chat', desktopTargetId: 'nav-desktop-chat', mobileTargetId: 'nav-mobile-chat' },
    { title: "Menu de Sonhos", description: "Para ver ou criar metas, toque neste ícone de alvo. É aqui que você acompanha seu progresso visualmente.", targetTab: 'goals', desktopTargetId: 'nav-desktop-goals', mobileTargetId: 'nav-mobile-goals' },
    { title: "Menu de Limites", description: "Toque no ícone de ajustes para definir limites de gastos por categoria (como Mercado ou Lazer) e não estourar o orçamento.", targetTab: 'limits', desktopTargetId: 'nav-desktop-limits', mobileTargetId: 'nav-mobile-limits' },
    { title: "Menu de Extrato", description: "Precisa ver tudo que gastou? O ícone de relógio leva ao seu histórico completo para consultas ou correções.", targetTab: 'history', desktopTargetId: 'nav-desktop-history', mobileTargetId: 'nav-mobile-history' }
  ];

  const handleWalkthroughNext = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setActiveTab(tutorialSteps[nextIndex].targetTab);
    } else {
      handleWalkthroughSkip(true);
    }
  };

  const handleWalkthroughSkip = (dontShowAgain: boolean) => {
    setShowWalkthrough(false);
    setActiveTab('dashboard');
    if (dontShowAgain) {
       updateUserProfileLocal({ ...userProfile, preferences: { ...userProfile.preferences, hasSeenWalkthrough: true } });
    }
  };

  // --- UI Handlers ---
  const handleLogout = async () => await (supabase.auth as any).signOut();
  
  const handleSaveIncome = async () => {
    const val = parseFloat(tempIncome.replace(',', '.'));
    if (!isNaN(val)) {
      await updateIncome(val);
      setShowIncomeModal(false);
    }
  };

  const handleSaveGoalEdit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!editingGoal) return; 
      await modifyGoal(editingGoal); 
      setEditingGoal(null); 
  };

  const handleSaveLimitEdit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!editingLimit || !editingLimit.category || !editingLimit.amount) return; 
      // Ensure ID is passed or created
      await modifyLimit({ id: editingLimit.id || '', category: editingLimit.category, amount: editingLimit.amount });
      setEditingLimit(null); 
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'goals', label: 'Sonhos', icon: Target },
    { id: 'history', label: 'Extrato', icon: History },
    { id: 'limits', label: 'Limites', icon: SlidersHorizontal },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-diga-primary" size={32}/></div>;
  if (!session) return <AuthScreen />;
  if (dataLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] flex-col gap-4"><Loader2 className="animate-spin text-diga-primary" size={40}/><p className="text-gray-400 font-bold">Carregando suas finanças...</p></div>;

  return (
    <div className="flex h-[100dvh] w-full font-sans text-diga-text bg-[#F8FAFC]">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 h-full sticky top-0 py-8 pl-8 z-50 transition-all duration-300">
         <div className="flex-1 bg-white/50 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white/40 flex flex-col py-8 px-4 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10 px-2 text-diga-primary">
               <div className="w-10 h-10 bg-diga-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                  <Sparkles size={20} fill="currentColor" />
               </div>
               <span className="text-2xl font-bold tracking-tight">Diga.</span>
            </div>
            <nav className="flex-1 space-y-2 w-full flex flex-col">
              {navItems.map(item => (
                <button 
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative
                     ${activeTab === item.id ? 'bg-white shadow-lg shadow-black/5 text-diga-primary font-bold' : 'text-gray-500 hover:bg-white/50 hover:text-diga-primary'}`}
                >
                  <div className={`relative z-10 ${activeTab === item.id ? 'scale-110' : ''} transition-transform`}>
                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                  </div>
                  <span className="text-sm relative z-10 block">{item.label}</span>
                </button>
              ))}
              
              <div className="flex-1"></div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group text-gray-500 hover:bg-red-50 hover:text-red-500 mb-2"
              >
                  <div className="relative z-10">
                    <LogOut size={24} />
                  </div>
                  <span className="text-sm relative z-10 block font-medium">Sair</span>
              </button>
            </nav>
            <div className="mt-auto p-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
               <p className="text-[10px] font-bold text-diga-primary uppercase tracking-widest mb-1">Motivação</p>
               <p className="text-xs text-gray-500 italic">"{userProfile.dailyQuote?.text}"</p>
            </div>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full relative overflow-hidden">
        <div className={`h-full w-full ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar scroll-smooth'}`}>
           <div className={`max-w-[1200px] mx-auto p-0 md:p-8 ${activeTab === 'chat' ? 'h-full' : 'min-h-full'}`}>
              
              {activeTab === 'chat' && <ChatInterface messages={messages} onSendMessage={sendMessage} onConfirmTransaction={confirmTransaction} isLoading={isLoading} />}
              {activeTab === 'dashboard' && <Dashboard transactions={transactions} userProfile={userProfile} onSetIncome={() => { setShowIncomeModal(true); setTempIncome(userProfile.monthlyIncome.toString()); }} onViewHistory={() => setActiveTab('history')} />}
              {activeTab === 'goals' && <GoalsView userProfile={userProfile} onCreateGoal={() => { setActiveTab('chat'); sendMessage("Criar novo sonho"); }} onEditGoal={setEditingGoal} onDeleteGoal={removeGoal} />}
              {activeTab === 'limits' && <LimitsView transactions={transactions} userProfile={userProfile} onEditLimit={setEditingLimit} onDeleteLimit={removeLimit} onCreateLimit={() => setEditingLimit({ category: '', amount: 0 })} />}
              {activeTab === 'history' && <HistoryView transactions={transactions} onDelete={removeTransaction} onEdit={modifyTransaction} />}
              {activeTab === 'settings' && <SettingsView userProfile={userProfile} transactions={transactions} onSetIncome={() => { setShowIncomeModal(true); setTempIncome(userProfile.monthlyIncome.toString()); }} onUpdateProfile={updateUserProfileLocal} onResetApp={resetApp} />}
              
              {activeTab !== 'chat' && <div className="h-28 md:h-0"></div>}
           </div>
        </div>
      </main>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] h-[72px] bg-white/90 backdrop-blur-2xl rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/60 flex justify-between items-center px-4 z-50 ring-1 ring-white/50">
         {navItems.map(item => {
           const isActive = activeTab === item.id;
           return (
            <button key={item.id} id={`nav-mobile-${item.id}`} onClick={() => setActiveTab(item.id as any)} className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 group`}>
              <div className={`absolute inset-0 bg-diga-primary/10 rounded-full scale-0 transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-75'}`}></div>
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-diga-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>}
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-diga-primary' : 'text-gray-400 group-hover:text-diga-primary/70'}`} />
            </button>
           );
         })}
      </nav>

      {/* WALKTHROUGH */}
      {showWalkthrough && <Walkthrough steps={tutorialSteps} currentStepIndex={currentStepIndex} onNext={handleWalkthroughNext} onSkip={handleWalkthroughSkip} />}

      {/* MODALS */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800">Sua Renda</h2>
            <div className="relative mb-8">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">R$</span>
               <input type="number" value={tempIncome} onChange={e => setTempIncome(e.target.value)} className="w-full text-4xl font-bold text-center p-6 bg-gray-50 rounded-3xl outline-none focus:ring-4 ring-indigo-50 transition-all text-diga-primary" placeholder="0.00" autoFocus />
            </div>
            <div className="space-y-3">
              <button onClick={handleSaveIncome} className="w-full h-14 bg-diga-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">Salvar</button>
              <button onClick={() => setShowIncomeModal(false)} className="w-full h-12 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      
      {editingGoal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-center mb-6">Editar Sonho</h2>
            <input value={editingGoal.name} onChange={e => setEditingGoal({...editingGoal, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-bold outline-none focus:ring-2 ring-indigo-100" placeholder="Nome" />
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="text-xs font-bold text-gray-400 ml-2">Meta</label><input type="number" value={editingGoal.targetAmount} onChange={e => setEditingGoal({...editingGoal, targetAmount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-100" /></div>
                <div><label className="text-xs font-bold text-gray-400 ml-2">Atual</label><input type="number" value={editingGoal.currentAmount} onChange={e => setEditingGoal({...editingGoal, currentAmount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-100" /></div>
            </div>
            <button onClick={(e) => handleSaveGoalEdit(e)} className="w-full h-14 bg-diga-primary text-white rounded-2xl font-bold mb-2 shadow-lg shadow-indigo-500/20">Salvar</button>
            <button onClick={() => setEditingGoal(null)} className="w-full h-12 text-gray-400 font-bold">Cancelar</button>
          </div>
        </div>
      )}

      {editingLimit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-center mb-6">{editingLimit.id ? 'Editar Limite' : 'Novo Limite'}</h2>
            <input value={editingLimit.category} onChange={e => setEditingLimit({...editingLimit, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-bold outline-none focus:ring-2 ring-indigo-100" placeholder="Categoria (ex: Mercado)" />
            <input type="number" value={editingLimit.amount || ''} onChange={e => setEditingLimit({...editingLimit, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl mb-6 font-bold outline-none focus:ring-2 ring-indigo-100" placeholder="Valor Limite" />
            <button onClick={(e) => handleSaveLimitEdit(e)} className="w-full h-14 bg-diga-primary text-white rounded-2xl font-bold mb-2 shadow-lg shadow-indigo-500/20">Salvar</button>
            <button onClick={() => setEditingLimit(null)} className="w-full h-12 text-gray-400 font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;