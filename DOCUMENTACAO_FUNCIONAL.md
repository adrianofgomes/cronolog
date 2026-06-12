# Cronolog - Documentação Funcional

O Cronolog é uma plataforma pessoal e familiar para o registro e organização de eventos cronológicos importantes da vida cotidiana. O sistema foca em simplicidade, flexibilidade e organização por categorias técnicas (como Veículos e Saúde) e anotações gerais.

## 1. Fluxo de Acesso e Segurança

### 1.1. Autenticação via Google
O acesso ao sistema é feito exclusivamente através da conta Google. Isso elimina a necessidade de gerenciar senhas e garante uma camada extra de segurança.

### 1.2. Cadastro e Aprovação (Status do Usuário)
Ao entrar pela primeira vez, o usuário é cadastrado automaticamente com o status **Pendente**.
- **Pendente:** O usuário pode ver a tela inicial mas não pode realizar lançamentos ou visualizar dados sensíveis.
- **Ativo:** O administrador aprovou o acesso. Todas as funcionalidades são liberadas.
- **Bloqueado:** O acesso foi revogado pelo administrador.

---

## 2. Gestão de Lançamentos (Eventos)

A principal funcionalidade do sistema é o registro de eventos, divididos em categorias específicas que permitem capturar dados técnicos relevantes.

### 2.1. Novo Lançamento (Seletor Categorizado)
Ao clicar no botão **"+ Novo lançamento"**, um modal é aberto com as opções agrupadas por semelhança e um campo de busca para filtragem rápida.

### 2.2. Tipos de Eventos Suportados

#### **A. Veículo (Carro/Moto)**
- **Abastecimento:** Registro de posto, quilometragem atual, tipo de combustível, litros e valor total pago.
- **Manutenção:** Registro de revisões, trocas de óleo, serviços mecânicos e custo de peças/mão de obra.

#### **B. Saúde**
- **Exame Médico:** Registro de resultados, médico solicitante e anexo do laudo (PDF/Imagem).
- **Vacina:** Controle de imunizações, doses recebidas (ex: 1ª dose, reforço), local de aplicação e lote.
- **Remédios:** Registro de medicamentos em uso, dosagem, frequência (ex: 8/8h), quem prescreveu e duração do tratamento.
- **Consulta:** Agendamento ou registro de visitas médicas, especialidade, médico, local e orientações recebidas.

#### **C. Geral (Outros)**
- **Geral:** Uma opção flexível para qualquer anotação ou registro que não se encaixe nas categorias acima. Permite título, descrição livre e anexos.

---

## 3. Recursos Inteligentes de UI/UX

### 3.1. Autocomplete (Sugestões Automáticas)
Para agilizar o preenchimento, o sistema aprende com os seus registros anteriores.
- **Compartilhamento de Dados:** Campos como "Paciente" e "Médico" sugerem nomes já utilizados em qualquer uma das categorias de saúde.
- **Dados do Veículo:** Sugere nomes de carros e postos de combustíveis já cadastrados.

### 3.2. Gestão de Anexos
Todos os formulários permitem a inclusão de arquivos (PDFs) ou fotos (direto da câmera do celular ou galeria).
- **Inclusão Dinâmica:** Você pode adicionar anexos no momento da criação do evento ou posteriormente na edição.
- **Download e Visualização:** Arquivos salvos podem ser baixados ou visualizados a qualquer momento.

---

## 4. Visualização de Dados

### 4.1. Timeline (Linha do Tempo)
A tela principal exibe uma linha do tempo com as atividades recentes.
- **Ícones e Cores:** Cada tipo de evento possui um ícone e cor característica (ex: Rosa para Vacina, Azul para Abastecimento) para fácil identificação visual.
- **Modos de Visualização:**
    - **Resumido:** Exibe apenas o título, categoria e data.
    - **Detalhado:** Expande os cartões para mostrar todos os campos técnicos (metadata) e a descrição.

### 4.2. Painel Administrativo (Apenas Admin)
Usuários com privilégios de administrador possuem acesso a uma área restrita para:
- Listar novos usuários pendentes.
- Aprovar ou rejeitar o acesso de novos membros.

---

## 5. Padrões Técnicos Funcionais
- **Fuso Horário:** O sistema armazena todos os dados em UTC, mas exibe automaticamente no horário local do seu dispositivo.
- **Mobilidade:** A interface é totalmente responsiva (Progressive Web App - PWA), otimizada para uso em smartphones, permitindo tirar fotos de comprovantes e receitas diretamente pelo navegador.
