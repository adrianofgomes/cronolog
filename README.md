# Cronolog

Cronolog é uma aplicação full-stack composta por uma API REST em PHP e um frontend moderno em Next.js.

## 📂 Estrutura do Projeto

```text
├── backend/            # API REST em PHP (Slim 4)
├── frontend/           # Interface Web em Next.js 16
├── DOCUMENTACAO_FUNCIONAL.md # Documentação detalhada de funcionalidades
├── deploy.sh           # Script de deploy unificado (Front + Back)
├── database.sql        # Esquema inicial do banco de dados
├── README.md           # Documentação geral
└── GEMINI.md           # Instruções detalhadas para desenvolvimento
```

---

## 🚀 Backend (API)

O backend segue os princípios de Clean Architecture e utiliza o Slim Framework 4.

### Tecnologias Backend
- **PHP 8.2+**
- **Slim Framework 4**
- **PHP-DI** (Injeção de Dependência)
- **MySQL (PDO)**
- **PHPUnit** (Testes)
- **Google OAuth 2.0**

### Instalação e Configuração (Backend)

1. **Acesse a pasta:** `cd backend`
2. **Instalar Dependências:** `composer install`
3. **Configurar Ambiente:** Copie `backend/.env.example` para `backend/.env` e preencha as credenciais.
4. **Executar Localmente:** `./run_local.sh 8080`
5. **Testes:** `./vendor/bin/phpunit`

---

## 🎨 Frontend

O frontend é uma Single Page Application (SPA) construída com Next.js, focada em performance e UX.

### Tecnologias Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **React 19**
- **Axios** (Integração com API)
- **Lucide React** (Ícones)
- **Google OAuth** (via `@react-oauth/google`)

### Instalação e Configuração (Frontend)

1. **Acesse a pasta:** `cd frontend`
2. **Instalar Dependências:** `npm install`
3. **Configurar Ambiente:** Crie um arquivo `.env.local` com a URL da API.
   - **Local:** `NEXT_PUBLIC_API_URL=http://localhost:8080`
   - **Produção:** `NEXT_PUBLIC_API_URL=https://pogger.com.br/cronolog/api`
4. **Executar Localmente:** `npm run dev`

---

## 🔐 Autenticação e Fluxo de Usuários

A aplicação utiliza autenticação baseada em Google ID Token (Bearer):
1. O cliente envia um `Google ID Token` no cabeçalho `Authorization`.
2. O sistema valida o token com o Google.
3. **Cadastro Automático**: No primeiro login, o usuário é cadastrado com `status = 'pending'`.
4. **Fluxo de Aprovação**: O acesso é bloqueado até que um administrador altere o status para `active`.

---

## 📦 Deploy (HostGator)

O projeto possui um sistema de deploy automatizado via SFTP que protege suas configurações de produção.

### Deploy Unificado
Na raiz do projeto, você pode fazer o deploy de ambos os módulos simultaneamente:

*   **Modo Light** (Rápido, apenas código):
    ```bash
    ./deploy.sh
    ```
*   **Modo Full** (Sobe dependências/vendor completo):
    ```bash
    ./deploy.sh --full
    ```

### Segurança e Configuração
*   **Proteção de `.env`**: Os scripts de deploy são configurados para **não sobrescrever** arquivos `.env` existentes no servidor. Eles serão criados apenas se não existirem.
*   **Requisitos**: É necessário ter o `lftp` instalado e as credenciais de FTP configuradas no arquivo `.env`.

Para instruções passo a passo detalhadas, consulte o arquivo [GEMINI.md](./GEMINI.md).
