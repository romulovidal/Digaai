# Diga - Assistente Financeiro IA

Um aplicativo financeiro inteligente (PWA) que utiliza Inteligência Artificial (Gemini) para registrar transações através de linguagem natural.

> **Versão de Produção:** Esta versão utiliza Vite como bundler, TypeScript estrito e removeu dependências de CDN para maior segurança e performance.

## Pré-requisitos

*   [Node.js](https://nodejs.org/) (Versão 18 ou superior)
*   Uma conta no [Supabase](https://supabase.com/) (Para banco de dados e autenticação)
*   Uma chave de API do [Google AI Studio](https://aistudio.google.com/) (Gemini API)

## 🚀 Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/diga-app.git
    cd diga-app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```
    *Isso instalará o React, Vite, Supabase Client e Google GenAI SDK listados no `package.json`.*

3.  **Configure as Variáveis de Ambiente (CRÍTICO):**
    *   Crie um arquivo `.env` na raiz do projeto.
    *   **O app NÃO funcionará sem estas chaves**, pois os fallbacks de segurança foram removidos para produção.
    *   Veja o arquivo `Install/SETUP_ENV.md` para detalhes.

4.  **Configure o Banco de Dados:**
    *   Copie o script SQL em `Install/SCHEMA_DATABASE.sql`.
    *   Execute no "SQL Editor" do seu painel Supabase.

5.  **Rodar em Desenvolvimento:**
    ```bash
    npm run dev
    ```
    Acesse: `http://localhost:5173`

## 📦 Build para Produção

Para gerar a versão otimizada para deploy (Vercel, Netlify, Cloudflare Pages):

1.  Execute o comando de build:
    ```bash
    npm run build
    ```

2.  Uma pasta `dist` será criada na raiz.
    *   Esta pasta contém o HTML, CSS e JS minificados e otimizados.
    *   Aponte seu serviço de hospedagem para esta pasta `dist`.

## 🛡️ Segurança

*   **Sanitização de CSV:** A exportação de dados foi protegida contra injeção de fórmulas.
*   **Segurança de API:** Chaves de API não estão mais hardcoded. Elas devem ser injetadas via variáveis de ambiente no momento do build ou runtime.
