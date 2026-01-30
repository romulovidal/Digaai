# Diga - Documentação Técnica (v2.0 Produção)

## Visão Geral
O **Diga** é um assistente financeiro PWA (Progressive Web App) desenvolvido com foco em performance, acessibilidade e segurança. A versão atual utiliza um processo de build moderno para otimização de assets e proteção de código.

## Stack Tecnológica

### Core
*   **Runtime:** React 19.
*   **Linguagem:** TypeScript (Strict Mode).
*   **Build Tool:** Vite 5 (Bundling & Minification).
*   **Estilização:** Tailwind CSS 3 (Processado via PostCSS).

### Backend & Serviços
*   **BaaS:** Supabase (Auth & PostgreSQL).
*   **AI:** Google Gemini API (`gemini-3-flash-preview` via SDK `@google/genai`).

## Arquitetura e Segurança

### 1. Processo de Build
Diferente de versões anteriores baseadas em ESM via CDN, esta versão compila o código para produção:
*   **Minificação:** O código JS é ofuscado e minificado (Terser).
*   **Tree Shaking:** Apenas as funções utilizadas das bibliotecas (ex: `lucide-react`) são incluídas no bundle final.
*   **Variáveis de Ambiente:** As chaves `VITE_*` são injetadas durante o processo de build.

### 2. Fluxo de Dados e IA
1.  **Entrada:** Usuário envia comando de voz/texto.
2.  **Sanitização:** O texto é normalizado localmente.
3.  **Processamento Híbrido:**
    *   *Online:* Envia contexto (saldo, últimas txs) para o Gemini.
    *   *Offline (Fallback):* Se a API falhar ou der timeout, o `geminiService.ts` utiliza Regex e dicionários locais para inferir a transação.
4.  **Persistência:** `storageService.ts` comunica-se com o Supabase via RLS (Row Level Security).

### 3. Medidas de Segurança Implementadas (DAST/SAST)
*   **Remoção de Hardcoded Secrets:** As chaves de API de fallback foram removidas. O app falhará de forma segura (console error) se as variáveis de ambiente não existirem, prevenindo vazamento de credenciais em repositórios públicos.
*   **CSV Injection Prevention:** Ao exportar dados em `SettingsView.tsx`, campos de texto iniciados com caracteres de fórmula (`=`, `+`, `-`, `@`) são escapados para prevenir execução de código malicioso no Excel/Google Sheets.
*   **Dependências Fixas:** O uso de `package.json` garante que as versões das bibliotecas sejam consistentes, evitando quebras por atualizações automáticas de CDN.

## Estrutura de Arquivos (Pós-Instalação)

```
/
├── dist/               # Arquivos finais para deploy (gerado por npm run build)
├── src/
│   ├── components/     # UI Components
│   ├── services/       # Lógica de IA e Banco de Dados
│   ├── hooks/          # React Hooks (useFinancialData)
│   ├── types.ts        # Interfaces TypeScript
│   └── constants.ts    # Prompts de Sistema e Configs
├── Install/            # Documentação e Scripts SQL
├── package.json        # Dependências do projeto
└── vite.config.ts      # Configuração do Bundler
```
