import React from 'react';
import { SavingsGoal } from '../types';
import { Target, Plus, Edit2, Trash2, Calendar, Trophy } from 'lucide-react';

interface GoalsViewProps {
  userProfile: { savingsGoals: SavingsGoal[] };
  onCreateGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ 
  userProfile, 
  onCreateGoal, 
  onEditGoal, 
  onDeleteGoal 
}) => {
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-diga-bg md:bg-transparent no-scrollbar">
      {/* Centered Header */}
      <header className="relative p-6 md:px-0 md:pt-4 flex items-center justify-center sticky top-0 md:relative z-10 bg-diga-bg md:bg-transparent">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-diga-primary tracking-tight">Metas</h1>
            <p className="text-gray-500 font-medium text-sm">Realize seus sonhos</p>
        </div>
        <button 
            id="goals-create-btn"
            onClick={onCreateGoal} 
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-diga-primary text-white px-4 py-3 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-95"
        >
            <Plus size={20}/> <span className="hidden sm:inline">Nova Meta</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:px-0 pb-24 md:pb-6 w-full animate-in fade-in duration-500">
         {!userProfile.savingsGoals || userProfile.savingsGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 text-center p-8 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white/50 backdrop-blur-sm mx-4">
               <div className="p-5 bg-blue-50 rounded-full mb-6">
                  <Target size={56} className="text-blue-400" />
               </div>
               <p className="font-bold text-2xl text-gray-700 tracking-tight">Nenhum sonho criado</p>
               <p className="text-lg mt-2 max-w-xs mx-auto text-gray-500">Diga ao Guia: "Quero juntar 5 mil para viajar" ou crie manualmente.</p>
               <button onClick={onCreateGoal} className="mt-8 text-diga-primary font-bold hover:underline bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
                   Criar manualmente
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userProfile.savingsGoals.map(goal => {
                   const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                   const isCompleted = progress >= 100;

                   return (
                   <div key={goal.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white overflow-hidden flex flex-col relative group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                      
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button 
                            onClick={() => onEditGoal(goal)} 
                            className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-blue-600 shadow-lg hover:bg-white transition-colors"
                            title="Editar"
                         >
                            <Edit2 size={18}/>
                         </button>
                         <button 
                            onClick={() => onDeleteGoal(goal.id)} 
                            className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-red-600 shadow-lg hover:bg-white transition-colors"
                            title="Excluir"
                         >
                            <Trash2 size={18}/>
                         </button>
                      </div>

                      {/* Goal Image */}
                      <div className="h-56 w-full bg-gray-100 relative overflow-hidden">
                         {goal.imageUrl ? (
                            <img src={goal.imageUrl} alt={goal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-300">
                               <Target size={80} />
                            </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                            <span className="text-white font-bold text-3xl text-shadow-sm tracking-tight leading-none">{goal.name}</span>
                         </div>
                         {isCompleted && (
                             <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                 <Trophy size={14} /> Conquistado
                             </div>
                         )}
                      </div>
                      
                      {/* Progress Content */}
                      <div className="p-8 flex flex-col gap-6">
                         <div className="flex justify-between items-baseline">
                            <span className="text-4xl font-bold text-gray-900 tracking-tighter">{formatCurrency(goal.currentAmount)}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meta: {formatCurrency(goal.targetAmount)}</span>
                         </div>
                         
                         <div className="relative">
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                <div 
                                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${isCompleted ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} 
                                style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                         </div>
                         
                         <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {isCompleted ? <span className="text-yellow-600 font-bold">Parabéns!</span> : `${progress.toFixed(0)}% Concluído`}
                             </p>
                             {goal.monthlyPlanAmount && (
                               <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border border-blue-100">
                                 <Calendar size={12}/> {formatCurrency(goal.monthlyPlanAmount)}/mês
                               </span>
                             )}
                         </div>
                      </div>
                   </div>
                   );
                })}
            </div>
         )}
      </main>
    </div>
  );
};

export default GoalsView;
