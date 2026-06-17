declare namespace Cypress {
  interface Chainable {
    login(): Chainable<any>;
  }
}

Cypress.Commands.add('login', () => {
  const apiUrl = 'http://localhost:8080';
  
  cy.request('POST', `${apiUrl}/auth/login`, {
    id_token: 'test-token'
  }).then((response) => {
    const { token, user } = response.body.data;
    
    window.localStorage.setItem('auth_token', token);
    window.localStorage.setItem('auth_user', JSON.stringify({
      name: user.name,
      email: user.email,
      picture: user.picture,
      status: 'active', // Force active status for testing
      isAdmin: user.isAdmin
    }));
  });
});
