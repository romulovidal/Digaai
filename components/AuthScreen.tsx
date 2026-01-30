import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sparkles, ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const translateError = (error: string) => {
    if (error.includes('Email not confirmed')) return 'Email não confirmado. Verifique sua caixa de entrada.';
    if (error.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
    if (error.includes('User already registered')) return 'Este email já está cadastrado.';
    if (error.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    return error;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { error } = await (supabase.auth as any).signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Conta criada! Se a confirmação estiver ativada, verifique seu email. Caso contrário, faça login.');
        setIsSignUp(false);
      } else {
        const { error } = await (supabase.auth as any).signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setErrorMsg(translateError(error.message || 'Ocorreu um erro.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-diga-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-6 transform -rotate-3">
             <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Bem-vindo ao Diga</h1>
          <p className="text-gray-500">Seu assistente financeiro inteligente.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-diga-primary transition-colors" size={20} />
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 rounded-2xl outline-none focus:bg-white focus:ring-4 ring-indigo-50 border border-transparent focus:border-indigo-100 transition-all font-medium text-gray-700"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-diga-primary transition-colors" size={20} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 rounded-2xl outline-none focus:bg-white focus:ring-4 ring-indigo-50 border border-transparent focus:border-indigo-100 transition-all font-medium text-gray-700"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2 animate-in slide-in-from-top-2 border border-red-100">
              <AlertCircle size={18} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl font-medium text-center animate-in slide-in-from-top-2 border border-green-100">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-diga-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-gray-500 font-bold hover:text-diga-primary transition-colors text-sm"
          >
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-400 font-medium">Segurança e privacidade em primeiro lugar.</p>
    </div>
  );
};

export default AuthScreen;