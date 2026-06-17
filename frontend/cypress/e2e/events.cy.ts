describe('Dynamic Event Forms', () => {
  beforeEach(() => {
    cy.login();
    
    // Register interceptors BEFORE visiting the page.
    // Use '/api' to match the proxy configuration in api.ts
    cy.intercept('GET', '/api/categories').as('getCategories');
    cy.intercept('GET', '/api/events*').as('getEvents');
    
    cy.visit('/');
  });

  it('should create a Refueling (Abastecimento) event using dynamic form', () => {
    // Instead of waiting immediately, wait for the modal to be openable
    cy.contains('Novo Lançamento').click();
    
    // Then wait for categories to load
    cy.wait('@getCategories');
    
    // Seleciona Abastecimento
    cy.contains('Abastecimento').click();

    // Preenche o formulário
    cy.get('input[name="carro"]').type('Cypress Car');
    cy.get('input[name="km_atual"]').type('10000');
    cy.get('input[name="litros"]').type('40');
    cy.get('input[name="total"]').type('250.50');
    cy.get('input[name="posto"]').type('Cypress Station');

    // Salva
    cy.intercept('POST', '**/events').as('createEvent');
    cy.contains('Salvar Registro').click();

    // Verifica sucesso
    cy.wait('@createEvent').its('response.statusCode').should('eq', 201);
    cy.contains('Atividades Recentes').should('be.visible');
    cy.contains('Cypress Car').should('be.visible');
  });

  it('should create a Bill to Pay (Conta a Pagar) event with recurrence', () => {
    cy.wait(['@getCategories', '@getEvents']);

    // Abre o seletor de categorias
    cy.contains('Novo Lançamento').click();
    
    // Seleciona Conta a Pagar
    cy.contains('Conta a Pagar').click();

    // Preenche campos dinâmicos
    cy.get('input[placeholder="Ex: Conta a Pagar"]').type('Aluguel Teste');
    cy.get('input[name="valor"]').type('1500');
    cy.get('input[name="beneficiario"]').type('Imobiliária Cypress');

    // Testa Recorrência (Feature ativada para esta categoria)
    cy.contains('Esta lançamento se repete').click();
    cy.get('select').select('months');
    cy.get('input[type="number"]').last().clear().type('1');

    // Salva
    cy.intercept('POST', '**/events').as('createEvent');
    cy.contains('Salvar Registro').click();

    // Verifica sucesso
    cy.wait('@createEvent').its('response.statusCode').should('eq', 201);
    
    // Verifica na lista de agendados (contas a pagar pendentes)
    cy.contains('Agendados').click();
    cy.contains('Aluguel Teste').should('be.visible');
    cy.contains('1500').should('be.visible');
  });
});
