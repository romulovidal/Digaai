import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Tag, Search, Edit2, Filter } from 'lucide-react';

interface HistoryViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (updatedTx: Transaction) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ transactions, onDelete, onEdit }) => {
  const [filter, setFilter] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const sortedTransactions = useMemo(() => {
    return transactions
      .filter(t => 
         t.description.toLowerCase().includes(filter.toLowerCase()) || 
         t.category.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTx) {
          onEdit(editingTx);
          setEditingTx(null);
      }
  };

  return (
    <div id="history-view" className="flex flex-col h-full bg-diga-bg md:bg-transparent relative">
      {/* Centered Header */}
      <header className="p-6 md:px-0 md:pt-4 flex flex-col gap-6 sticky top-0 z-10 bg-diga-bg md:bg-transparent">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-diga-primary tracking-tight">Histórico</h1>
          <p className="text-gray-500 font-medium text-sm">Suas movimentações recentes</p>
        </div>
        <div className="relative group max-w-lg mx-auto w-full">
            <Search className="absolute left-4 top-4 text-gray-400 group-focus-within:text-diga-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou categoria..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all rounded-2xl py-4 pl-12 pr-4 text-gray-700 outline-none border border-transparent focus:border-diga-primary/20"
            />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:px-0 pb-24 md:pb-6 w-full">
         {sortedTransactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl mx-4">
              <div className="p-4 bg-gray-50 rounded-full mb-3">
                 <Filter size={32} className="opacity-50" />
              </div>
              <p className="font-bold text-lg">Nada encontrado.</p>
              <p className="text-sm">Tente buscar outro termo.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {sortedTransactions.map((t) => (
               <div key={t.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:shadow-md hover:border-blue-100 transition-all duration-200">
                 
                 {/* Left: Icon & Info */}
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl shrink-0 transition-colors ${t.type === 'INCOME' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                       {t.type === 'INCOME' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="font-bold text-gray-900 text-lg capitalize leading-snug break-words">{t.description}</p>
                       <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Tag size={10} /> {t.category}
                          </span>
                          <span className="text-xs font-medium">{formatDate(t.date)}</span>
                       </div>
                    </div>
                 </div>

                 {/* Right: Amount & Actions */}
                 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pl-[calc(3.5rem+16px)] sm:pl-0">
                     <span className={`font-bold text-lg whitespace-nowrap ${t.type === 'INCOME' ? 'text-green-600' : 'text-gray-900'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                     </span>
                     <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity sm:translate-x-4 sm:group-hover:translate-x-0 duration-200">
                        <button 
                            onClick={() => setEditingTx(t)}
                            className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => {
                                if(confirm("Tem certeza que deseja apagar esta transação?")) {
                                    onDelete(t.id);
                                }
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                     </div>
                 </div>
               </div>
             ))}
           </div>
         )}
      </main>

      {/* Edit Modal */}
      {editingTx && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-diga-text mb-6">Editar Transação</h2>
            <form onSubmit={handleSaveEdit}>
                <div className="mb-4">
                   <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">Descrição</label>
                   <input 
                     value={editingTx.description} 
                     onChange={e => setEditingTx({...editingTx, description: e.target.value})}
                     className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-diga-primary outline-none font-medium"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                       <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">Valor (R$)</label>
                       <input 
                         type="number"
                         step="0.01"
                         value={editingTx.amount} 
                         onChange={e => setEditingTx({...editingTx, amount: Number(e.target.value)})}
                         className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-diga-primary outline-none font-medium"
                       />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">Tipo</label>
                        <select 
                            value={editingTx.type}
                            onChange={e => setEditingTx({...editingTx, type: e.target.value as 'INCOME' | 'EXPENSE'})}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-diga-primary outline-none font-medium"
                        >
                            <option value="EXPENSE">Despesa (-)</option>
                            <option value="INCOME">Receita (+)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">Categoria</label>
                        <input 
                            value={editingTx.category} 
                            onChange={e => setEditingTx({...editingTx, category: e.target.value})}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-diga-primary outline-none font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1 ml-1">Data</label>
                        <input 
                            type="date"
                            value={editingTx.date} 
                            onChange={e => setEditingTx({...editingTx, date: e.target.value})}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-diga-primary outline-none font-medium"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 h-14 bg-diga-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition-colors">Salvar</button>
                  <button type="button" onClick={() => setEditingTx(null)} className="flex-1 h-14 bg-gray-100 text-diga-text rounded-2xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;