export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    if (path === "/") {
      return json({
        success: true,
        message: "Momentsia Backend is running!"
      });
    }

    if (path === "/api/health") {
      return json({
        success: true,
        api: "healthy",
        database: env.MONGODB_DATA_API_URL ? "configured" : "not_configured"
      });
    }

    if (path === "/api/admin/login" && method === "POST") {
      return json({
        success: false,
        message: "Admin login is not configured yet. Complete the secure authentication setup first."
      }, 503);
    }

    if (
      path.startsWith("/api/bookings") ||
      path === "/api/contact"
    ) {
      return json({
        success: false,
        message: "Database API is not configured yet."
      }, 503);
    }

    return json({
      success: false,
      message: "API route not found."
    }, 404);
  }
};
