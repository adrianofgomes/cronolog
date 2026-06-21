# Cronolog - Project Instructions (Source of Truth for AI Agents)

Este arquivo é a **fonte única de verdade** para todos os agentes de IA (Gemini CLI, Claude Code, Cursor, Copilot) que trabalham neste projeto. Qualquer alteração estrutural ou de fluxo deve ser registrada aqui.

## 📁 Estrutura do Projeto

- `backend/`: API PHP (Slim 4)
- `database.sql`: Schema do banco de dados
- `README.md`: Documentação geral

## 🔄 Banco de Dados e Migrações

Este projeto utiliza o [Phinx](https://phinx.org/) para gerenciamento de migrações do banco de dados. **NUNCA altere o schema manualmente ou apenas pelo arquivo `database.sql`.**

### Fluxo de Trabalho (Para Agentes)

1.  **Criar Nova Migração:**
    ```bash
    cd backend
    ./vendor/bin/phinx create NomeDaMigracao
    ```
2.  **Editar Migração:** Edite o arquivo gerado em `backend/db/migrations/`.
3.  **Aplicar Migrações:**
    ```bash
    cd backend
    ./vendor/bin/phinx migrate
    ```

### Deploy
O script de deploy (`deploy.sh` ou scripts individuais) automatiza a instalação das dependências de produção (`composer install --no-dev`) e executa `./vendor/bin/phinx migrate` no ambiente de destino antes da aplicação iniciar.
O arquivo `database.sql` na raiz é mantido apenas para fins históricos e documentação de referência.

## 📊 Modelagem de Dados (v2)

O sistema utiliza uma abordagem flexível baseada em JSON para permitir múltiplos tipos de eventos sem complexidade excessiva de tabelas.

- **Profiles:** Permite segmentar eventos por membros da família.
- **Categorias Dinâmicas:** Cada categoria possui um `metadata_schema` (JSON) que define os atributos técnicos daquela categoria.
- **Events (Log Principal):** 
  - `metadata` (JSON): Armazena os dados específicos conforme a categoria.
  - `source` & `raw_input`: Preparado para processamento de linguagem natural (IA).

### Fluxo de IA (Magic Box)
O Cronolog utiliza o **Google Gemini 2.5 Flash** para processar pedidos em linguagem natural.
- **Funcionamento:** O backend busca as categorias, schemas e o histórico recente do usuário (valores conhecidos) e os envia como contexto para a IA.
- **Status Inteligente:** A IA define automaticamente o status como `pending` para datas futuras ou solicitações de agendamento.
- **Consistência:** A IA prioriza o uso de nomes já existentes no histórico do usuário para garantir padronização dos dados.

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

### Testes Automatizados (Frontend / E2E)
- **Framework:** Cypress.
- **Execução:** Na raiz do projeto, execute `./run_e2e_tests.sh`.
- **Funcionamento:** O script verifica se o backend (:8080) e o frontend (:3000) estão rodando. Caso contrário, tenta iniciá-los automaticamente antes de disparar os testes.
- **Autenticação em Testes:** Para que os testes E2E funcionem, o backend deve permitir tokens de teste.
  - No arquivo `backend/.env`, certifique-se de definir: `ENABLE_TEST_TOKENS=true`.
  - Isso permite que o Cypress use o comando `cy.login()` com tokens simulados (`test-token`).

### Deploy (HostGator)
O projeto utiliza uma estrutura automatizada para deploy via SFTP (lftp) ou SSH (zip):
- **Script Unificado (na raiz):**
  - `./deploy.sh`: Executa o deploy do frontend e backend sequencialmente. 
  - **Parâmetros:**
    - `--full`: Faz o build completo.
    - `--ftp`: Usa o método legado FTP/lftp (default é SSH).
    - `--skipTests`: Pula a execução dos testes automatizados.
- **Scripts de Módulo:**
  - `backend/generate_deploy_package.sh` & `backend/publish_to_hostgator.sh`.
  - `frontend/generate_deploy_package.sh` & `frontend/publish_to_hostgator.sh`.

## 🤖 Mandatos da IA (AI Mandates)

Este projeto é desenvolvido majoritariamente por agentes de IA. As seguintes regras são fundamentais e devem ser seguidas em todas as interações:

1.  **Documentação Contínua:** Sempre que uma nova funcionalidade, rota ou alteração arquitetural for feita, a documentação pertinente (`README.md`, `GEMINI.md`, comentários de código) **deve** ser atualizada imediatamente.
2.  **Testes Primeiro ou Junto:** Nenhuma funcionalidade nova deve ser considerada completa sem a criação dos respectivos testes automatizados (PHPUnit no backend, Jest/Cypress no frontend conforme aplicável).
3.  **Segurança e Isolamento de Dados (Multi-tenancy):** É terminantemente proibido que um usuário tenha acesso a dados de outro usuário. Toda e qualquer query ao banco de dados ou chamada a repositórios **deve** incluir o `user_id` do usuário autenticado no filtro. Testes automatizados devem ser criados para validar que esse isolamento não seja quebrado.
4.  **Validação de Regressão:** Após qualquer alteração, os testes existentes devem ser executados para garantir que não houve quebra de funcionalidades legadas.
5.  **Idiomatismo:** Siga rigorosamente os padrões de código e arquitetura já estabelecidos no projeto.
6.  **Tratamento de Data e Fuso Horário (Timezone):** O sistema utiliza **UTC** como padrão para armazenamento e comunicação (API).
    - **Backend:** Sempre use `UTC` internamente. As datas retornadas pela API devem estar no formato ISO 8601 UTC (`Y-m-d\TH:i:s\Z`).
    - **Frontend:** Receba datas em UTC e converta para o fuso horário local do usuário apenas para exibição e entrada nos formulários (utilize `toDateTimeLocal` e `toUTCISOString` em `frontend/src/lib/dateUtils.ts`).
    - **NUNCA** envie ou armazene strings de data "naivas" (sem fuso horário) entre frontend e backend.
7.  **Idioma dos Commits:** Todas as mensagens de commit geradas por IA devem ser escritas em **Português**, seguindo o padrão de 'conventional commits' (ex: feat:, fix:, refactor:).
8.  **Formulários e Opcionalidade:**
    - Todos os campos de preenchimento em formulários de eventos devem ser **opcionais**, a menos que haja uma necessidade de negócio estrita e justificada.
    - **Datas:** Se o campo de data/hora não for preenchido pelo usuário, o sistema **deve** utilizar a data e hora atual (`new Date()` no frontend).
    - **Metadados:** Nenhum campo dentro do `metadata` (ex: carro, KM, posto, serviço) deve ser obrigatório.
9. **Padrões de UI/UX e Componentes Customizados:**
    - É estritamente proibido o uso de `alert()`, `confirm()` ou `prompt()` nativos do navegador.
    - Sempre utilize os componentes de interface customizados da aplicação para garantir a consistência visual (ex: `ConfirmationModal` para diálogos de confirmação).
    - Qualquer novo componente de UI deve seguir a estrutura de `CSS Modules` e a identidade visual existente.
    - Priorize a reutilização de componentes (como `VehicleHeaderForm` ou `ConfirmationModal`) antes de criar novos.


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

### Endpoints de Administração
- `GET /users/admin/pending`: Lista usuários aguardando aprovação (Admin apenas).
- `POST /users/admin/{googleId}/approve`: Aprova ou altera o status de um usuário (Admin apenas).

## 🖥️ Frontend

- **Tecnologias:** Next.js 15+, TypeScript, CSS Modules.
- **Autenticação:** Google OAuth + JWT (Bearer).
- **Gerenciamento de Estado:** AuthContext para dados de usuário e status de aprovação.
- **Painel Administrativo:** Localizado em `/admin`, acessível apenas por administradores para gestão de novos usuários.

## 🎨 Padrões de UI/UX (Frontend)

Para manter a consistência e usabilidade do sistema, todos os novos formulários de eventos devem seguir rigorosamente este padrão:

1.  **Estrutura de Modal:** Use o layout baseado em `styles.overlay`, `styles.modal`, e `styles.modalHeader` (como visto em `EventForm.module.css`).
2.  **Campos Reutilizáveis:** Sempre que um campo puder ter valores repetidos (ex: nome do paciente, médico, posto, carro), implemente a funcionalidade de sugestão usando `<input list="id-da-lista">` e `<datalist id="id-da-lista">`.
3.  **Sugestões (Autocomplete):** Carregue os valores únicos dos eventos anteriores da mesma categoria na montagem do componente (`useEffect`) e popule as listas de sugestões.
4.  **Componentes:** Utilize os componentes reutilizáveis, como o `AttachmentComponent`, sempre que necessário.
5.  **Instrução para IAs:** Ao implementar um novo tipo de evento, a IA deve criar o formulário seguindo o estilo visual (`.module.css`), a estrutura de campos de entrada, a lógica de sugestões de campos reutilizáveis e o tratamento de erros padrão dos formulários existentes (`EventForm`, `MedicalExamForm`).
