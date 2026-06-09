# Cronolog - Project Instructions (Source of Truth for AI Agents)

Este arquivo é a **fonte única de verdade** para todos os agentes de IA (Gemini CLI, Claude Code, Cursor, Copilot) que trabalham neste projeto. Qualquer alteração estrutural ou de fluxo deve ser registrada aqui.

## 📁 Estrutura do Projeto

- `backend/`: API PHP (Slim 4)
- `database.sql`: Schema do banco de dados
- `README.md`: Documentação geral

## 🏛️ Arquitetura e Padrões (Backend)

- **Framework:** Slim 4.
- **Injeção de Dependência:** PHP-DI 7.
- **Padrão de Design:** Clean Architecture simplificada.
  - `backend/src/Domain`: Entidades e interfaces de repositório (regras de negócio).
  - `backend/src/Infrastructure`: Implementações concretas (PDO, MySQL).
  - `backend/src/Application/Actions`: Handlers de requisição (Controllers).
  - `backend/src/Application/Middleware`: Lógica de interceptação (Auth, Admin).

## 🚀 Fluxos de Trabalho Principais

### Desenvolvimento Local (Backend)
1.  **Acesse a pasta:** `cd backend`.
2.  **Dependências:** `composer install`.
3.  **Variáveis de Ambiente:** Copiar `.env.example` para `.env`.
4.  **Servidor:** `./run_local.sh <port>`.

### Testes Automatizados (Backend)
- **Framework:** PHPUnit 10.
- **Execução:** `cd backend && ./vendor/bin/phpunit`.
- **Mocking:** Sempre use mocks para `UserRepository` e outras dependências de infraestrutura em `backend/tests/TestCase.php`.
- **Nota Técnica:** O `backend/app/routes.php` desativa a detecção de `basePath` em modo CLI para evitar erros 404 nos testes.

### Deploy (HostGator)
O projeto utiliza uma estrutura automatizada para deploy via SFTP (lftp):
- **Script Unificado (na raiz):**
  - `./deploy.sh`: Executa o deploy do frontend e backend sequencialmente. Aceita `--full`.
- **Scripts de Módulo:**
  - `backend/generate_deploy_package.sh` & `backend/publish_to_hostgator.sh`.
  - `frontend/generate_deploy_package.sh` & `frontend/publish_to_hostgator.sh`.

## 🤖 Mandatos da IA (AI Mandates)

Este projeto é desenvolvido majoritariamente por agentes de IA. As seguintes regras são fundamentais e devem ser seguidas em todas as interações:

1.  **Documentação Contínua:** Sempre que uma nova funcionalidade, rota ou alteração arquitetural for feita, a documentação pertinente (`README.md`, `GEMINI.md`, comentários de código) **deve** ser atualizada imediatamente.
2.  **Testes Primeiro ou Junto:** Nenhuma funcionalidade nova deve ser considerada completa sem a criação dos respectivos testes automatizados (PHPUnit no backend, Jest/Cypress no frontend conforme aplicável).
3.  **Validação de Regressão:** Após qualquer alteração, os testes existentes devem ser executados para garantir que não houve quebra de funcionalidades legadas.
4.  **Idiomatismo:** Siga rigorosamente os padrões de código e arquitetura já estabelecidos no projeto.

## ⚠️ Regras e Convenções

1.  **Rotas:** Novas rotas devem ser registradas em `backend/app/routes.php`.
2.  **Auth:** A maioria das rotas `/users` exige o `AuthMiddleware`.
3.  **Base Path:** A detecção automática de `basePath` no `backend/app/routes.php` é crítica para o funcionamento em subpastas na HostGator.
4.  **CORS:** Configurado globalmente em `backend/app/routes.php`.
5.  **Deploy e .env:** NUNCA altere os scripts de deploy para sobrescrever arquivos `.env` no servidor. Eles devem apenas criar se não existirem (`--ignore-existing`).

## 📍 Endpoints e Segurança

- **Base URL (Produção):** `https://pogger.com.br/cronolog/api`
- **Health Check:** `GET /status` (Público, ex: `/cronolog/api/status`).
- **Auth:** Baseada em Google ID Token (Bearer).
- **Cadastro Automático:** Usuários novos são criados com status `pending`.
- **Admin:** Rotas sob `/users/admin` exigem `AdminMiddleware`.
