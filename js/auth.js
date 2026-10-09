
/*
  Momentsia Authentication

  Login and registration UI and a secure backend are not connected yet.
  Do not store passwords or authentication tokens in localStorage.

  When authentication is added, connect this module to a real backend
  or a properly configured authentication provider.
*/

window.MomentsiaAuth = {
  isConfigured: false,

  getStatus() {
    return this.isConfigured
      ? "Authentication is configured."
      : "Authentication has not been connected yet.";
  }
};