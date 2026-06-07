# PHP REST API Template (Slim 4) - Project Instructions

Este arquivo fornece orientações essenciais sobre a arquitetura, convenções e fluxos de trabalho deste projeto para desenvolvedores e assistentes de IA.

## 🏛️ Arquitetura e Padrões

- **Framework:** Slim 4.
- **Injeção de Dependência:** PHP-DI 7.
- **Padrão de Design:** Clean Architecture simplificada.
  - `src/Domain`: Entidades e interfaces de repositório (regras de negócio).
  - `src/Infrastructure`: Implementações concretas (PDO, MySQL).
  - `src/Application/Actions`: Handlers de requisição (Controllers).
  - `src/Application/Middleware`: Lógica de interceptação (Auth, Admin).

## 🚀 Fluxos de Trabalho Principais

### Desenvolvimento Local
1.  **Dependências:** `composer install`.
2.  **Variáveis de Ambiente:** Copiar `.env.example` para `.env`.
3.  **Servidor:** `./run_local.sh <port>`.

### Testes Automatizados
- **Framework:** PHPUnit 10.
- **Execução:** `./vendor/bin/phpunit`.
- **Mocking:** Sempre use mocks para `UserRepository` e outras dependências de infraestrutura em `tests/TestCase.php` para evitar dependência de banco de dados real nos testes.
- **Nota Técnica:** O `app/routes.php` desativa a detecção de `basePath` em modo CLI para evitar erros 404 nos testes.

### Deploy (HostGator)
O projeto utiliza uma estrutura bipartida para segurança:
1.  **Core (`php_template_core`):** Fora da `public_html` (protegido).
2.  **Public (`php_template_public`):** Dentro da `public_html` (ponto de entrada).
- **Scripts:**
  - `generate_deploy_package.sh`: Gera o pacote (use `--full` para incluir `vendor/`).
  - `publish_to_hostgator.sh`: Sincroniza via SFTP (lftp).

## ⚠️ Regras e Convenções

1.  **Rotas:** Novas rotas devem ser registradas em `app/routes.php`.
2.  **Auth:** A maioria das rotas `/users` exige o `AuthMiddleware`.
3.  **Base Path:** A detecção automática de `basePath` no `app/routes.php` é crítica para o funcionamento em subpastas na HostGator. **Não remova a verificação `PHP_SAPI !== 'cli'`**.
4.  **CORS:** Configurado globalmente em `app/routes.php`.

## 📍 Endpoints e Segurança

- **Health Check:** `GET /status` (Público).
- **Auth:** Baseada em Google ID Token (Bearer).
- **Cadastro Automático:** Usuários novos são criados com status `pending`.
- **Admin:** Rotas sob `/users/admin` exigem `AdminMiddleware`.
