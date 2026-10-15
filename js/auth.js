
window.MomentsiaAuth = {
  isConfigured: true,

  async login(password) {

const response = await fetch("https://momentsia.23-st-028.workers.dev/api/admin/login", {

      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Login failed.");
    }

    // Keep the token only for this browser tab session.
    sessionStorage.setItem("momentsiaAdminToken", result.token);

    return result;
  },

  logout() {
    sessionStorage.removeItem("momentsiaAdminToken");
  },

  getToken() {
    return sessionStorage.getItem("momentsiaAdminToken");
  },

  getStatus() {
    return this.getToken()
      ? "Admin is logged in."
      : "Admin is not logged in.";
  }
};
