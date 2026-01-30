import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { AIResponseSchema, Transaction, UserProfile } from "../types";

// Helper to access environment variables
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

// Security: API Key must be provided via environment variable.
const apiKey = getEnv('API_KEY') || getEnv('VITE_GOOGLE_API_KEY');

if (!apiKey) {
  console.error("Gemini API Key is missing. Please check your environment variables (API_KEY or VITE_GOOGLE_API_KEY).");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    responseText: { type: Type.STRING },
    intent: { type: Type.STRING, enum: ['chat', 'transaction_proposal', 'check_budget', 'update_income', 'create_goal', 'add_to_goal', 'update_goal_plan', 'set_budget_limit'] },
    extractedTransaction: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        date: { type: Type.STRING },
        description: { type: Type.STRING },
        isRecurring: { type: Type.BOOLEAN }
      },
      nullable: true
    },
    budgetAnalysis: { type: Type.STRING, enum: ['safe', 'warning', 'danger'], nullable: true },
    newGoal: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        targetAmount: { type: Type.NUMBER },
        plannedMonths: { type: Type.NUMBER }
      },
      nullable: true
    },
    addToGoal: {
      type: Type.OBJECT,
      properties: {
        goalName: { type: Type.STRING },
        amount: { type: Type.NUMBER }
      },
      nullable: true
    },
    goalPlan: {
      type: Type.OBJECT,
      properties: {
        goalName: { type: Type.STRING },
        months: { type: Type.NUMBER },
        amount: { type: Type.NUMBER }
      },
      nullable: true
    },
    setLimit: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        amount: { type: Type.NUMBER }
      },
      nullable: true
    }
  },
  required: ['responseText', 'intent']
};

// --- HELPER: TEXT NORMALIZER ---
const normalize = (text: string) => {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ""); // Removes accents (é -> e, ã -> a)
};

// --- CATEGORY DICTIONARY (OFFLINE INTELLIGENCE) ---
const CATEGORY_MAP: Record<string, string[]> = {
  'Alimentação': ['mercado', 'comida', 'ifood', 'rappi', 'uber eats', 'restaurante', 'lanche', 'pizza', 'hamburguer', 'bk', 'mc', 'madero', 'subway', 'sushi', 'acai', 'padaria', 'cafe', 'almoco', 'jantar', 'churrasco', 'bebida', 'cerveja', 'agua', 'sorvete'],
  'Transporte': ['uber', '99', 'taxi', 'onibus', 'metro', 'trem', 'passagem', 'gasolina', 'combustivel', 'etanol', 'diesel', 'posto', 'ipiranga', 'shell', 'br', 'estacionamento', 'pedagio', 'multa', 'carro', 'moto', 'oficina', 'mecanico', 'pneu'],
  'Casa': ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'sabesp', 'internet', 'wifi', 'vivo', 'claro', 'tim', 'oi', 'gas', 'botijao', 'iptu', 'faxina', 'limpeza', 'moveis', 'eletro', 'manutencao', 'obra', 'reforma'],
  'Saúde': ['farmacia', 'remedio', 'drogaria', 'medico', 'consulta', 'exame', 'dentista', 'psicologo', 'terapia', 'plano', 'convenio', 'hospital', 'vacina', 'academia', 'suplemento', 'whey'],
  'Lazer': ['cinema', 'filme', 'ingresso', 'show', 'teatro', 'jogo', 'game', 'steam', 'playstation', 'xbox', 'nintendo', 'netflix', 'spotify', 'prime', 'disney', 'hbo', 'assinatura', 'bar', 'balada', 'festa', 'viagem', 'hotel', 'passagem aerea'],
  'Educação': ['curso', 'escola', 'faculdade', 'universidade', 'mensalidade', 'livro', 'material', 'papelaria', 'aula', 'professor', 'idiomas', 'ingles'],
  'Vestuário': ['roupa', 'camisa', 'camiseta', 'calca', 'short', 'tenis', 'sapato', 'chinelo', 'bolsa', 'acessorio', 'shopping', 'loja', 'renner', 'riachuelo', 'zara', 'shein', 'nike', 'adidas'],
  'Serviços': ['cabelo', 'corte', 'barba', 'salao', 'manicure', 'unha', 'estetica', 'depilacao', 'massagem', 'lavanderia', 'costureira'],
  'Pets': ['pet', 'racao', 'veterinario', 'banho', 'tosa', 'gato', 'cachorro', 'areia'],
};

// --- SUPER OFFLINE PARSER ---
const parseMessageLocally = (text: string, currentBalance: number): AIResponseSchema => {
  const cleanText = normalize(text);
  
  // 1. EXTRACT AMOUNT (Enhanced)
  let amount = 0;
  const kMatch = cleanText.match(/(\d+([.,]\d+)?)k/);
  if (kMatch) {
    amount = parseFloat(kMatch[1].replace(',', '.')) * 1000;
  } else {
    // Matches R$ 50, 50 reais, 50,00, 50.00
    const amountMatch = text.match(/(?:r\$|R\$)?\s*(\d+([.,]\d{1,2})?)/);
    if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', '.'));
    }
  }

  // Helper: Find category based on keywords
  const detectCategory = (txt: string): string => {
    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
      if (keywords.some(k => txt.includes(k))) return category;
    }
    return 'Outros';
  };

  // Helper: Clean description extraction
  const extractDescription = (raw: string, intentKeywords: string[]): string => {
    let desc = raw;
    // Remove amount
    desc = desc.replace(/(?:r\$|R\$)?\s*\d+([.,]\d{1,2})?k?/, '');
    // Remove intent keywords
    intentKeywords.forEach(k => { desc = desc.replace(new RegExp(`\\b${k}\\b`, 'gi'), ''); });
    // Remove stop words and common verbs
    desc = desc.replace(/\b(no|na|em|com|pro|pra|para|de|do|da|o|a|um|uma|gastei|comprei|paguei|fiz|recebi|ganhei|foi|custou|valor|reais|real|criar|novo|nova)\b/gi, ' ');
    // Remove recurring keywords from description
    desc = desc.replace(/\b(mensal|assinatura|todo mes|fixo|recorrente)\b/gi, '');
    
    desc = desc.trim().replace(/\s+/g, ' ');
    
    if (desc.length < 2) return ''; // Too short
    return desc.charAt(0).toUpperCase() + desc.slice(1);
  };

  // 2. CHECK INTENTS

  // A. BALANCE / STATUS
  if (cleanText.match(/\b(saldo|quanto tenho|sobredo|meu caixa|extrato|resumo|situacao|posso gastar)\b/)) {
    const status = currentBalance > 0 ? 'safe' : 'danger';
    return {
      responseText: `(Modo Offline) 📡 Pelo que calculei aqui, seu saldo atual é de **R$ ${currentBalance.toFixed(2).replace('.', ',')}**. ${status === 'safe' ? 'Está positivo!' : 'Atenção aos gastos!'}`,
      intent: 'check_budget',
      budgetAnalysis: status
    };
  }

  // B. LIMITS
  if (cleanText.match(/\b(limite|teto|maximo|orcamento)\b/) && amount > 0) {
    const category = detectCategory(cleanText);
    const catName = category === 'Outros' ? extractDescription(text, ['limite', 'teto', 'para']) || 'Geral' : category;
    return {
      responseText: `(Modo Offline) 📡 Definindo limite de R$ ${amount} para **${catName}**. Te avisarei se passar disso!`,
      intent: 'set_budget_limit',
      setLimit: { category: catName, amount }
    };
  }

  // C. GOALS & SAVINGS
  const goalKeywords = /\b(meta|sonho|objetivo|juntar|comprar carro|comprar casa)\b/;
  const savingsKeywords = /\b(guardei|investi|apliquei|poupanca|reservado|cofre|fundo)\b/;

  // C1. Create Goal (With Amount)
  if (goalKeywords.test(cleanText) && amount > 0 && !savingsKeywords.test(cleanText)) {
    const name = extractDescription(text, ['meta', 'sonho', 'objetivo', 'juntar', 'para', 'quero', 'comprar', 'criar', 'novo', 'nova']) || 'Novo Objetivo';
    return {
      responseText: `(Modo Offline) 📡 Legal! Criei a meta **"${name}"** com valor de R$ ${amount}.`,
      intent: 'create_goal',
      newGoal: { name, targetAmount: amount, plannedMonths: 12 }
    };
  }

  // C2. Create Goal (Missing Amount - Instruction)
  if (goalKeywords.test(cleanText) && amount === 0 && !savingsKeywords.test(cleanText)) {
      return {
        responseText: "(Modo Offline) 📡 Para criar um novo sonho sem internet, preciso que você diga o **nome** e o **valor** juntos.\n\nPor exemplo, digite ou fale:\n👉 'Meta Viagem 5000'\n👉 'Sonho Carro 30k'",
        intent: 'chat'
      };
  }

  // C3. Add to Savings
  if (savingsKeywords.test(cleanText) && amount > 0) {
    const goalName = extractDescription(text, ['guardei', 'investi', 'apliquei', 'para', 'na']) || 'Economias';
    return {
      responseText: `(Modo Offline) 📡 Ótimo hábito! Registrei R$ ${amount} guardados em **"${goalName}"**.`,
      intent: 'add_to_goal',
      addToGoal: { goalName, amount }
    };
  }

  // D. INCOME (Earnings)
  const incomeKeywords = ['ganhei', 'recebi', 'caiu', 'entrou', 'pingou', 'salario', 'pagamento', 'deposito', 'lucro', 'bico', 'freela', 'venda', 'reembolso', 'pix recebido'];
  const isIncome = incomeKeywords.some(k => cleanText.includes(k)) || (cleanText.includes('pix') && (cleanText.includes('de') || cleanText.includes('do')));

  if (amount > 0 && (isIncome || text.includes('+'))) {
    const desc = extractDescription(text, incomeKeywords.concat(['pix', 'recebido']));
    return {
      responseText: `(Modo Offline) 📡 Oba! Entrada de **R$ ${amount}** detectada. Descrição: ${desc || 'Renda Extra'}.`,
      intent: 'transaction_proposal',
      extractedTransaction: {
        type: 'INCOME',
        amount: amount,
        category: 'Renda',
        description: desc || 'Renda Extra',
        date: new Date().toISOString().split('T')[0],
        isRecurring: cleanText.includes('mensal') || cleanText.includes('todo mes')
      }
    };
  }

  // E. EXPENSES (Spending) - Fallback for any amount
  if (amount > 0) {
    const category = detectCategory(cleanText);
    const desc = extractDescription(text, ['gastei', 'comprei', 'paguei', 'pix', 'transferi', 'foi', 'para', 'no', 'na']);
    
    const isRecurring = /\b(mensal|assinatura|todo mes|fixo|recorrente)\b/.test(cleanText);
    const finalDesc = desc || (category !== 'Outros' ? category : 'Despesa Avulsa');

    return {
      responseText: `(Modo Offline) 📡 Entendi. Gasto de **R$ ${amount}** em ${finalDesc}. \nClassifiquei como: **${category}**.`,
      intent: 'transaction_proposal',
      extractedTransaction: {
        type: 'EXPENSE',
        amount: amount,
        category: category,
        description: finalDesc,
        date: new Date().toISOString().split('T')[0],
        isRecurring
      }
    };
  }

  return {
    responseText: "No modo offline 📡, tente ser direto, por exemplo:\n\n• 'Gastei 50 no Madero'\n• 'Mercado 300'\n• 'Recebi 1000'\n• 'Assinatura Netflix 40'\n• 'Meta Carro 50k'",
    intent: 'chat'
  };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (
  message: string,
  history: string[],
  userProfile: UserProfile,
  recentTransactions: Transaction[]
): Promise<AIResponseSchema> => {
  
  const totalIncome = recentTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = recentTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = (userProfile.monthlyIncome + totalIncome) - totalExpenses;

  const optimizedHistory = history.slice(-6);

  let attempt = 0;
  const maxRetries = 1;

  while (true) {
    try {
      if (!apiKey) throw new Error("Missing API Key");

      const model = "gemini-3-flash-preview";

      const sanitizedGoals = userProfile.savingsGoals.map(g => ({
        name: g.name,
        t: g.targetAmount,
        c: g.currentAmount
      }));

      const limits = userProfile.budgetLimits || [];

      const context = `
        DADOS:
        Saldo: ${currentBalance.toFixed(0)}
        Renda: ${userProfile.monthlyIncome}
        Metas: ${JSON.stringify(sanitizedGoals)}
        Limites: ${JSON.stringify(limits)}
        
        ULTIMAS MSG:
        ${optimizedHistory.join('\n')}
      `;

      const timeoutMs = 8000;
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      );

      const apiCall = ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.3,
        },
      });

      const response = await Promise.race([apiCall, timeoutPromise]) as any;

      const textResponse = response.text;
      if (!textResponse) throw new Error("No response from AI");
      
      return JSON.parse(textResponse) as AIResponseSchema;

    } catch (error: any) {
      const isRateLimit = error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota');
      
      if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000; 
          console.warn(`Gemini Rate Limit hit. Retrying...`);
          await delay(waitTime);
          continue;
      }
      
      console.warn("Switching to Offline Mode due to error:", error.message || "Unknown error");
      return parseMessageLocally(message, currentBalance);
    }
  }
};

export const generateGoalImage = async (goalName: string): Promise<string | undefined> => {
  if (!apiKey) return undefined;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: `Illustration of financial goal: "${goalName}". Vector art style.` }],
      },
    });
    
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64String}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.warn("Image Gen Error (Ignored):", error);
    return undefined;
  }
};

export const getDailyQuote = async (): Promise<string> => {
  if (!apiKey) return "Pequenos passos levam a grandes destinos.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Frase curta motivacional financeira. PT-BR. Sem aspas.",
    });
    return response.text || "Foco no futuro.";
  } catch (e) {
    return "Pequenos passos levam a grandes destinos.";
  }
};