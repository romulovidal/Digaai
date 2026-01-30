import React, { useState } from 'react';
import { UserProfile, Transaction } from '../types';
import { Settings, DollarSign, Download, Trash2, ChevronRight, FileText, EyeOff, HelpCircle, X, MessageSquare, Target, SlidersHorizontal, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SettingsViewProps {
  userProfile: UserProfile;
  transactions: Transaction[];
  onSetIncome: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetApp: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userProfile, 
  transactions,
  onSetIncome,
  onUpdateProfile,
  onResetApp
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Não há transações para exportar.");
      return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Tipo,Categoria,Descricao,Valor\n";

    // CSV Rows
    transactions.forEach(t => {
      // SECURITY: Sanitize description to prevent CSV Formula Injection
      let safeDescription = t.description;
      const dangerousChars = ['=', '+', '-', '@'];
      if (safeDescription && dangerousChars.includes(safeDescription.charAt(0))) {
        safeDescription = "'" + safeDescription;
      }
      // Escape quotes
      safeDescription = `"${safeDescription.replace(/"/g, '""')}"`;

      const row = [
        t.date,
        t.type,
        t.category,
        safeDescription,
        t.amount.toFixed(2)
      ].join(",");
      csvContent += row + "\n";
    });

    // Create Download Link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `diga_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePrivacyMode = () => {
    const current = userProfile.preferences?.defaultPrivacyMode || false;
    onUpdateProfile({
      ...userProfile,
      preferences: {
        ...userProfile.preferences,
        defaultPrivacyMode: !current
      }
    });
  };

  const handleLogout = async () => {
      await (supabase.auth as any).signOut();
      // App.tsx auth listener will handle redirect to login
  };

  return (
    <div className="flex flex-col h-full bg-diga-bg relative">
      {/* Centered Header */}
      <header className="p-6 bg-white shadow-sm sticky top-0 z-10 text-center">
        <h1 className="text-2xl font-bold text-diga-primary flex items-center justify-center gap-2">
            <Settings size={28} /> Configurações
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
         
         {/* Section: Profile */}
         <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Perfil</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
               <button 
                  onClick={onSetIncome}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <DollarSign size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-gray-900">Renda Mensal</p>
                        <p className="text-sm text-gray-500">
                           Atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(userProfile.monthlyIncome)}
                        </p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
               </button>

               <div className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <EyeOff size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-gray-900">Modo Discreto</p>
                        <p className="text-sm text-gray-500">Iniciar com valores ocultos</p>
                     </div>
                  </div>
                  <button 
                    onClick={togglePrivacyMode}
                    className={`w-12 h-7 rounded-full transition-colors relative ${userProfile.preferences?.defaultPrivacyMode ? 'bg-diga-primary' : 'bg-gray-200'}`}
                  >
                     <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${userProfile.preferences?.defaultPrivacyMode ? 'left-6' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>
         </section>

         {/* Section: Help */}
         <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Ajuda</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <button 
                  onClick={() => setShowHelp(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <HelpCircle size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-gray-900">Comandos de Voz</p>
                        <p className="text-sm text-gray-500">O que dizer para o Guia?</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
               </button>
            </div>
         </section>

         {/* Section: Data */}
         <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Dados</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <button 
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <Download size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-gray-900">Exportar CSV</p>
                        <p className="text-sm text-gray-500">Baixar histórico para Excel</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
               </button>
            </div>
         </section>

         {/* Section: Account */}
         <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Conta</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
               <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                        <LogOut size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-gray-900">Sair da Conta</p>
                        <p className="text-sm text-gray-500">Fazer logout do aplicativo</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
               </button>

               <button 
                  onClick={() => setShowResetModal(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-200 transition-colors">
                        <Trash2 size={20} />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-red-600">Apagar Dados</p>
                        <p className="text-sm text-red-400">Excluir tudo desta conta</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-red-300" />
               </button>
            </div>
         </section>

         {/* Footer Info */}
         <div className="text-center pt-8 pb-4 opacity-30">
            <div className="flex justify-center mb-2">
                <FileText size={32} />
            </div>
            <p className="font-bold text-sm">Diga Financeiro</p>
            <p className="text-xs">Versão 3.5.0 (Cloud)</p>
         </div>

      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full h-[80%] max-h-[600px] rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl">
                  <HelpCircle size={24} />
                </div>
                <h2 className="text-2xl font-bold text-diga-text">O que falar?</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                 
                 <div>
                    <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                       <MessageSquare size={18} className="text-diga-primary"/> Transações
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                       <li className="bg-gray-50 p-3 rounded-xl">"Gastei 50 reais na padaria"</li>
                       <li className="bg-gray-50 p-3 rounded-xl">"Recebi 200 de freela"</li>
                       <li className="bg-gray-50 p-3 rounded-xl">"Paguei 100 de luz"</li>
                    </ul>
                 </div>

                 <div>
                    <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                       <Target size={18} className="text-diga-accent"/> Metas
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                       <li className="bg-gray-50 p-3 rounded-xl">"Quero juntar 5 mil para viajar"</li>
                       <li className="bg-gray-50 p-3 rounded-xl">"Guardei 200 para a viagem"</li>
                       <li className="bg-gray-50 p-3 rounded-xl">"Quanto falta para meu carro?"</li>
                    </ul>
                 </div>

                 <div>
                    <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                       <SlidersHorizontal size={18} className="text-green-600"/> Orçamento
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                       <li className="bg-gray-50 p-3 rounded-xl">"Definir limite de 600 para mercado"</li>
                       <li className="bg-gray-50 p-3 rounded-xl">"Quanto já gastei em lazer?"</li>
                    </ul>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-red-100">
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 mb-2">Tem certeza?</h2>
                 <p className="text-gray-500 mb-8 leading-relaxed">
                    Isso apagará <strong>todos</strong> os seus dados, metas e histórico permanentemente da nuvem.
                 </p>
                 
                 <div className="flex flex-col gap-3 w-full">
                    <button 
                       onClick={() => {
                          onResetApp();
                          setShowResetModal(false);
                       }}
                       className="w-full h-12 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
                    >
                       Sim, apagar tudo
                    </button>
                    <button 
                       onClick={() => setShowResetModal(false)}
                       className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all"
                    >
                       Cancelar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;