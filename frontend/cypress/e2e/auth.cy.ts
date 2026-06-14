describe('Authentication', () => {
  it('should load login page', () => {
    cy.visit('/login/');
    cy.contains('Cronolog').should('be.visible');
    cy.contains('Entre com sua conta Google').should('be.visible');
  });

  it('should bypass login and access home page using custom command', () => {
    cy.login();
    cy.visit('/');
    
    // Deberia estar na home e não ser redirecionado para login
    cy.url().should('not.include', '/login');
    
    // Verifica elementos do Header que aparecem para qualquer usuário logado
    cy.get('header').contains('Cronolog').should('be.visible');
    cy.contains('Admin User').should('be.visible');

    // Verifica se a Timeline ou o Banner de Pendente está presente
    cy.get('body').then(($body) => {
      if ($body.text().includes('Atividades Recentes')) {
        cy.contains('Atividades Recentes').should('be.visible');
      } else {
        cy.contains('Cadastro em Análise').should('be.visible');
      }
    });
  });
});
