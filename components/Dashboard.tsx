import React, { useMemo } from 'react';
import { Transaction, UserProfile } from '../types';
import { Eye, EyeOff, TrendingUp, TrendingDown, Lightbulb, Target, ShieldCheck, PieChart as PieIcon, Calendar, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, ReferenceLine } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  userProfile: UserProfile;
  onSetIncome: () => void;
  onViewHistory: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  userProfile, 
  onSetIncome, 
  onViewHistory
}) => {
  const [privacyMode, setPrivacyMode] = React.useState(userProfile.preferences?.defaultPrivacyMode || false);

  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalIncomeAvailable = userProfile.monthlyIncome + income;
    const balance = totalIncomeAvailable - expenses;
    
    // Calculate "Safe to Spend" (Balance - Sum of Monthly Goal Commitments)
    const monthlyGoalCommitments = userProfile.savingsGoals.reduce((acc, goal) => acc + (goal.monthlyPlanAmount || 0), 0);
    const safeToSpend = Math.max(0, balance - monthlyGoalCommitments);

    return { income, expenses, totalIncomeAvailable, balance, safeToSpend, monthlyGoalCommitments };
  }, [transactions, userProfile]);

  // --- DAILY PACE CALCULATION ---
  const dailyStats = useMemo(() => {
    // FIX: Use totalIncomeAvailable instead of just monthlyIncome.
    // This ensures that if the user logged "Income" transactions but didn't set a profile Salary, it still works.
    const baseForLimit = totals.totalIncomeAvailable > 0 ? totals.totalIncomeAvailable : userProfile.monthlyIncome;
    
    // Sustainable Daily Limit = (Total Income - Fixed Goal Commitments) / 30
    const dailyLimit = Math.max(0, (baseForLimit - totals.monthlyGoalCommitments) / 30);
    
    const today = new Date();
    const data = [];
    
    // Get last 5 days
    for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        // Day label (e.g., "Seg", "Ter")
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).replace('.', '');
        
        const spent = transactions
            .filter(t => t.type === 'EXPENSE' && t.date.startsWith(dateStr))
            .reduce((acc, t) => acc + t.amount, 0);
        
        data.push({ 
            date: dateStr, 
            label: dayLabel, 
            spent, 
            limit: dailyLimit,
            isToday: i === 0 
        });
    }

    const todaySpent = data[data.length - 1].spent;
    const isOverLimit = dailyLimit > 0 && todaySpent > dailyLimit;

    return { data, dailyLimit, todaySpent, isOverLimit };
  }, [transactions, userProfile, totals]);

  // --- CATEGORY CHART DATA ---
  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const grouped: Record<string, number> = {};
    
    expenses.forEach(t => {
      // Normalize category to Title Case
      const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1).toLowerCase() || 'Outros';
      grouped[cat] = (grouped[cat] || 0) + t.amount;
    });

    const data = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Take top 4 and group others
    if (data.length > 5) {
      const top4 = data.slice(0, 4);
      const others = data.slice(4).reduce((sum, item) => sum + item.value, 0);
      return [...top4, { name: 'Outros', value: others }];
    }
    
    return data;
  }, [transactions]);

  const COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#64748B'];

  const recentTx = useMemo(() => {
      return [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [transactions]);

  const topGoals = useMemo(() => {
     return userProfile.savingsGoals.slice(0, 2); 
  }, [userProfile.savingsGoals]);

  const formatCurrency = (val: number) => {
    if (privacyMode) return '••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Custom Tooltip for Pie Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-xs">
          <p className="font-bold text-gray-800">{payload[0].name}</p>
          <p className="text-diga-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Bar Chart
  const BarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100 text-xs">
            <p className="font-bold text-gray-600 mb-1">Gasto do dia</p>
            <p className="text-diga-primary font-bold text-sm">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-700 pb-8 md:pb-0 pt-4 md:pt-0">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center px-4 md:px-0">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{getGreeting()}</h1>
           <p className="text-gray-500 text-sm">Vamos organizar sua vida financeira hoje?</p>
        </div>
        <button 
           onClick={() => setPrivacyMode(!privacyMode)} 
           className="p-2.5 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-diga-primary transition-colors"
        >
           {privacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
        </button>
      </div>

      {/* 2. DAILY INSIGHT CARD */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-4 md:p-5 rounded-[2rem] border border-indigo-100 shadow-sm flex gap-4 items-start relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Lightbulb size={80} className="md:w-[100px] md:h-[100px] text-indigo-400 rotate-12" />
         </div>
         <div className="bg-white p-3 rounded-2xl shadow-sm text-diga-primary shrink-0 z-10 hidden md:block">
            <Lightbulb size={24} />
         </div>
         {/* Mobile icon smaller version */}
         <div className="bg-white p-2 rounded-xl shadow-sm text-diga-primary shrink-0 z-10 md:hidden">
            <Lightbulb size={18} />
         </div>
         <div className="z-10 relative">
            <h3 className="font-bold text-indigo-900 text-xs md:text-sm uppercase tracking-wide mb-1">Dica do Diga</h3>
            <p className="text-gray-700 font-medium leading-relaxed text-sm md:text-base pr-4">
               "{userProfile.dailyQuote?.text || "Pequenos gastos diários somam grandes montantes no final do mês."}"
            </p>
         </div>
      </div>

      {/* 3. DAILY PACE CHART (Ritmo de Gastos) */}
      <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-50">
         <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                 <Activity size={18} className="text-diga-primary"/> Ritmo Diário
             </h3>
             {dailyStats.dailyLimit > 0 ? (
                <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    Meta: {formatCurrency(dailyStats.dailyLimit)}/dia
                </span>
             ) : (
                <button onClick={onSetIncome} className="text-[10px] md:text-xs font-bold text-diga-primary bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors animate-pulse">
                    Definir Renda
                </button>
             )}
         </div>

         {/* Bar Chart */}
         <div className="h-28 md:h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats.data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                        dy={5}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{fill: '#F3F4F6'}} />
                    <ReferenceLine y={dailyStats.dailyLimit} stroke="#E5E7EB" strokeDasharray="3 3" />
                    <Bar dataKey="spent" radius={[4, 4, 4, 4]}>
                        {dailyStats.data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isToday 
                                    ? (entry.spent > entry.limit && entry.limit > 0 ? '#EF4444' : '#4F46E5') 
                                    : '#E0E7FF' 
                                } 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Summary Text */}
         <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
             <div className={`w-2 h-10 rounded-full shrink-0 ${dailyStats.isOverLimit ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
             <div>
                 <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5">Resumo de Hoje</p>
                 <p className="text-gray-700 text-xs md:text-sm leading-snug">
                     {dailyStats.todaySpent === 0 ? (
                         "Você ainda não registrou gastos hoje."
                     ) : dailyStats.dailyLimit === 0 ? (
                         <>Você gastou <span className="font-bold text-gray-800">{formatCurrency(dailyStats.todaySpent)}</span>. Defina sua renda para ver a meta.</>
                     ) : dailyStats.isOverLimit ? (
                         <>
                             Você gastou <span className="font-bold text-red-600">{formatCurrency(dailyStats.todaySpent)}</span>, 
                             o que está acima da média.
                         </>
                     ) : (
                         <>
                             Você gastou <span className="font-bold text-emerald-600">{formatCurrency(dailyStats.todaySpent)}</span>. 
                             Ótimo trabalho!
                         </>
                     )}
                 </p>
             </div>
         </div>
      </div>

      {/* 4. FINANCIAL WELLNESS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
         {/* Main Metric: Safe to Spend */}
         <div id="dashboard-safe-spend" className="bg-white p-5 md:p-6 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col justify-between min-h-[160px] md:h-40 relative overflow-hidden transition-all">
             <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-green-50 rounded-full blur-2xl"></div>
             <div>
                <span className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                   <ShieldCheck size={14} className="text-emerald-500"/> Livre no Mês
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{formatCurrency(totals.safeToSpend)}</h2>
             </div>
             <div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mb-2 overflow-hidden">
                   <div className="bg-emerald-500 h-full rounded-full" style={{width: '75%'}}></div>
                </div>
                <p className="text-[10px] md:text-xs text-gray-400">Descontando metas e gastos fixos.</p>
             </div>
         </div>

         {/* Secondary Metrics */}
         <div className="flex flex-col gap-3 md:gap-4">
            <div 
               onClick={onSetIncome} 
               className="flex-1 bg-white px-5 py-4 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between group cursor-pointer hover:border-gray-200 transition-colors"
            >
               <div>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Entradas</p>
                  <p className="text-base md:text-lg font-bold text-gray-800">{formatCurrency(totals.totalIncomeAvailable)}</p>
               </div>
               <div className="bg-gray-50 p-2 rounded-xl text-green-600 group-hover:bg-green-50 transition-colors">
                  <TrendingUp size={18} />
               </div>
            </div>
            <div className="flex-1 bg-white px-5 py-4 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between group cursor-pointer hover:border-gray-200 transition-colors">
               <div>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Saídas</p>
                  <p className="text-base md:text-lg font-bold text-gray-800">{formatCurrency(totals.expenses)}</p>
               </div>
               <div className="bg-gray-50 p-2 rounded-xl text-red-500 group-hover:bg-red-50 transition-colors">
                  <TrendingDown size={18} />
               </div>
            </div>
         </div>
      </div>

      {/* 5. EXPENSES CHART (Pie) */}
      {totals.expenses > 0 && chartData.length > 0 && (
         <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                  <PieIcon size={18} className="text-diga-primary"/> Gastos por Categoria
               </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
               {/* Chart Circle */}
               <div className="w-48 h-48 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={chartData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                     </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                     <span className="text-lg font-bold text-gray-800">{formatCurrency(totals.expenses)}</span>
                  </div>
               </div>

               {/* Legend */}
               <div className="flex-1 w-full grid grid-cols-1 gap-3">
                  {chartData.map((entry, index) => {
                     const percent = ((entry.value / totals.expenses) * 100).toFixed(0);
                     return (
                        <div key={index} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <div 
                                 className="w-3 h-3 rounded-full shrink-0" 
                                 style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm font-bold text-gray-700">{entry.name}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{percent}%</span>
                              <span className="text-sm font-bold text-gray-800 tabular-nums">{formatCurrency(entry.value)}</span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      )}

      {/* 6. GOALS TEASER */}
      {topGoals.length > 0 && (
         <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                  <Target size={18} className="text-diga-primary"/> Foco Principal
               </h3>
               <span className="text-[10px] md:text-xs font-bold text-diga-primary bg-indigo-50 px-2 py-1 rounded-lg">Seus Sonhos</span>
            </div>
            <div className="space-y-4">
               {topGoals.map(goal => {
                  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                  return (
                     <div key={goal.id}>
                        <div className="flex justify-between text-sm mb-1.5">
                           <span className="font-bold text-gray-700">{goal.name}</span>
                           <span className="text-gray-500 text-xs font-medium">{percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-diga-primary rounded-full transition-all duration-1000" 
                              style={{ width: `${percent}%` }}
                           ></div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      )}

      {/* 7. RECENT ACTIVITY */}
      <div className="pt-2 px-2 md:px-0">
         <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm md:text-base">Últimos Movimentos</h3>
            <button onClick={onViewHistory} className="text-diga-primary text-xs md:text-sm font-bold hover:underline">Ver extrato</button>
         </div>
         
         <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 divide-y divide-gray-50 overflow-hidden">
            {recentTx.length === 0 ? (
               <div className="p-8 text-center">
                  <Calendar className="mx-auto text-gray-300 mb-2" size={24}/>
                  <p className="text-gray-400 text-sm">Nenhuma atividade recente.</p>
               </div>
            ) : (
               recentTx.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0
                           ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                           {tx.type === 'INCOME' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                        <div className="min-w-0">
                           <p className="font-bold text-gray-800 text-sm truncate pr-2">{tx.description}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">{tx.category}</p>
                        </div>
                     </div>
                     <span className={`font-bold text-sm whitespace-nowrap ${tx.type === 'INCOME' ? 'text-green-600' : 'text-gray-800'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                     </span>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;