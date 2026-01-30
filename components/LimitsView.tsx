import React, { useMemo } from 'react';
import { Transaction, UserProfile, BudgetLimit } from '../types';
import { Edit2, Trash2, Plus, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface LimitsViewProps {
  transactions: Transaction[];
  userProfile: UserProfile;
  onEditLimit: (limit: BudgetLimit) => void;
  onDeleteLimit: (id: string) => void;
  onCreateLimit: () => void;
}

const LimitsView: React.FC<LimitsViewProps> = ({ 
  transactions, 
  userProfile, 
  onEditLimit, 
  onDeleteLimit, 
  onCreateLimit 
}) => {
  
  const limitsStatus = useMemo(() => {
     if (!userProfile.budgetLimits) return [];
     
     return userProfile.budgetLimits.map(limit => {
        const spent = transactions
           .filter(t => t.type === 'EXPENSE' && t.category.toLowerCase() === limit.category.toLowerCase())
           .reduce((acc, curr) => acc + curr.amount, 0);
        
        return {
           ...limit,
           spent,
           percent: Math.min((spent / limit.amount) * 100, 100)
        };
     });
  }, [userProfile.budgetLimits, transactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-diga-bg md:bg-transparent">
      {/* Centered Header */}
      <header className="relative p-6 md:px-0 md:pt-4 flex items-center justify-center sticky top-0 md:relative z-10 bg-diga-bg md:bg-transparent">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-diga-primary tracking-tight">Limites</h1>
            <p className="text-gray-500 font-medium text-sm">Controle seu orçamento</p>
        </div>
        <button 
            id="limits-create-btn"
            onClick={onCreateLimit} 
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-blue-50 text-diga-primary px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors"
        >
            <Plus size={20}/> <span className="hidden sm:inline">Novo Limite</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:px-0 pb-24 md:pb-6 w-full">
         {limitsStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center p-6 border-2 border-dashed border-gray-200 rounded-[2rem] mx-4">
               <div className="p-4 bg-orange-50 rounded-full mb-4">
                  <AlertCircle size={48} className="text-orange-400" />
               </div>
               <p className="font-bold text-xl text-gray-600">Sem limites definidos</p>
               <p className="text-base mt-2 max-w-xs mx-auto">Diga: "Definir limite de 600 reais para Mercado" ou crie manualmente.</p>
               <button onClick={onCreateLimit} className="mt-6 text-diga-primary font-bold hover:underline">
                   Criar manualmente
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {limitsStatus.map(limit => (
                   <div key={limit.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-xl capitalize tracking-tight">{limit.category}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Orçamento Mensal</span>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => onEditLimit(limit)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={16}/></button>
                             <button onClick={() => onDeleteLimit(limit.id)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      
                      <div className="mb-2 flex justify-between items-end">
                          <span className="text-2xl font-bold text-gray-700">{formatCurrency(limit.spent)}</span>
                          <span className="text-sm font-bold text-gray-400 mb-1">de {formatCurrency(limit.amount)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative border border-gray-50">
                         <div 
                            className={`h-full transition-all duration-1000 ease-out shadow-sm rounded-full
                                ${limit.percent > 100 ? 'bg-red-500' : limit.percent > 85 ? 'bg-orange-400' : 'bg-green-500'}
                            `}
                            style={{ width: `${Math.min(limit.percent, 100)}%` }}
                         ></div>
                      </div>
                      
                      {/* Status Text */}
                      <div className="flex justify-between items-center mt-4">
                          <span className="text-xs font-bold text-gray-400">{limit.percent.toFixed(0)}% utilizado</span>
                          {limit.percent > 100 ? (
                             <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">Estourou</span>
                          ) : limit.percent > 85 ? (
                             <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-wider">Atenção</span>
                          ) : (
                             <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg uppercase tracking-wider">Normal</span>
                          )}
                      </div>
                   </div>
                ))}
            </div>
         )}
      </main>
    </div>
  );
};

export default LimitsView;
