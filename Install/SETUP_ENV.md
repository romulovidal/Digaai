# ⚠️ Configuração de Variáveis de Ambiente (Obrigatório)

Para segurança do projeto em produção, **não existem mais chaves padrão no código**. Você DEVE criar este arquivo para que o aplicativo funcione.

## Passo a Passo

1.  Na raiz do projeto (mesma pasta do `package.json`), crie um arquivo chamado `.env`.
2.  Cole o conteúdo abaixo e substitua pelos seus valores reais:

```env
# URL do seu projeto Supabase
# Encontre em: Supabase Dashboard > Project Settings > API
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave Anônima (Public) do Supabase
# Encontre em: Supabase Dashboard > Project Settings > API
VITE_SUPABASE_ANON_KEY=sua-chave-publica-longa-aqui

# Chave da API do Google Gemini
# Encontre em: https://aistudio.google.com/app/apikey
# Certifique-se de que a chave tenha permissão para "Generative Language API"
VITE_GOOGLE_API_KEY=sua-chave-ia-comeca-com-AIza
```

## Solução de Problemas

*   **Erro "CRITICAL: Missing Supabase Credentials":**
    Significa que o Vite não conseguiu ler o `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY`. Verifique se o arquivo se chama exatamente `.env` (sem extensão .txt no final) e se você reiniciou o servidor (`npm run dev`) após criar o arquivo.

*   **Erro "Gemini API Key is missing":**
    O chat não funcionará. Verifique a `VITE_GOOGLE_API_KEY`.

## Deploy (Vercel/Netlify)

Se você estiver subindo este projeto para a nuvem, não envie o arquivo `.env`. Em vez disso, vá nas configurações do seu painel de hospedagem (Environment Variables) e adicione as mesmas chaves lá com os mesmos nomes (`VITE_SUPABASE_URL`, etc).
