
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function respond(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function value(input) {
  return String(input ?? "").trim();
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function isAuthorized(request, env) {
  const configuredToken = value(env.ADMIN_TOKEN);
  const suppliedToken = getBearerToken(request);

  return Boolean(
    configuredToken &&
    suppliedToken &&
    suppliedToken === configuredToken
  );
}

async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function mapBooking(row) {
  return {
    ...row,
    eventType: row.eventType ?? row.event ?? "",
    date: row.date ?? row.event_date ?? "",
    estimatedCost: row.estimatedCost ?? row.estimated_cost ?? null,
    createdAt: row.createdAt ?? row.created_at ?? ""
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (path === "/" && method === "GET") {
      return respond({
        success: true,
        message: "Momentsia Backend is running!"
      });
    }

    if (path === "/api/health" && method === "GET") {
      return respond({
        success: true,
        api: "healthy",
        database: env.DB ? "configured" : "not_configured",
        adminToken: env.ADMIN_TOKEN ? "configured" : "missing"
      });
    }

    if (!env.DB) {
      return respond({
        success: false,
        message: "Database is not configured. Check the D1 binding named DB."
      }, 503);
    }

    // ADMIN LOGIN
    if (path === "/api/admin/login" && method === "POST") {
      if (!env.ADMIN_TOKEN) {
        return respond({
          success: false,
          message: "Admin token is not configured in Worker secrets."
        }, 503);
      }

      const body = await readJSON(request);

      if (!body) {
        return respond({
          success: false,
          message: "Invalid JSON."
        }, 400);
      }

      const password = value(
        body.password ?? body.token ?? body.adminPassword
      );

      if (!password || password !== value(env.ADMIN_TOKEN)) {
        return respond({
          success: false,
          message: "Invalid admin password."
        }, 401);
      }

      return respond({
        success: true,
        message: "Admin login successful.",
        token: env.ADMIN_TOKEN
      });
    }

    // Protect all remaining admin endpoints.
    if (path.startsWith("/api/admin/")) {
      if (!isAuthorized(request, env)) {
        return respond({
          success: false,
          message: "Unauthorized. Please sign in again."
        }, 401);
      }
    }

    // LIST BOOKINGS
    if (path === "/api/admin/bookings" && method === "GET") {
      try {
        const result = await env.DB.prepare(
          "SELECT * FROM bookings ORDER BY id DESC"
        ).all();

        return respond({
          success: true,
          bookings: (result.results || []).map(mapBooking)
        });
      } catch {
        return respond({
          success: false,
          message: "Could not load bookings. Check the bookings table schema."
        }, 500);
      }
    }

    // LIST CONTACT MESSAGES
    if (path === "/api/admin/contacts" && method === "GET") {
      try {
        const result = await env.DB.prepare(
          "SELECT * FROM contacts ORDER BY id DESC"
        ).all();

        return respond({
          success: true,
          messages: (result.results || []).map((row) => ({
            ...row,
            createdAt: row.createdAt ?? row.created_at ?? ""
          }))
        });
      } catch {
        return respond({
          success: false,
          message: "Could not load messages. Check the contacts table schema."
        }, 500);
      }
    }

    // UPDATE BOOKING STATUS
    const statusMatch = path.match(
      /^\/api\/admin\/bookings\/([^/]+)\/status$/
    );

    if (statusMatch && method === "PATCH") {
      const id = decodeURIComponent(statusMatch[1]);
      const body = await readJSON(request);
      const status = value(body?.status);

      if (!body) {
        return respond({
          success: false,
          message: "Invalid JSON."
        }, 400);
      }

      if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
        return respond({
          success: false,
          message: "Invalid booking status."
        }, 400);
      }

      try {
        const result = await env.DB.prepare(
          "UPDATE bookings SET status = ? WHERE id = ?"
        ).bind(status, id).run();

        if (!result.meta?.changes) {
          return respond({
            success: false,
            message: "Booking not found."
          }, 404);
        }

        return respond({
          success: true,
          message: "Booking status updated."
        });
      } catch {
        return respond({
          success: false,
          message: "Could not update status. Check the bookings table schema."
        }, 500);
      }
    }

    // DELETE BOOKING
    const bookingMatch = path.match(
      /^\/api\/admin\/bookings\/([^/]+)$/
    );

    if (bookingMatch && method === "DELETE") {
      const id = decodeURIComponent(bookingMatch[1]);

      try {
        const result = await env.DB.prepare(
          "DELETE FROM bookings WHERE id = ?"
        ).bind(id).run();

        if (!result.meta?.changes) {
          return respond({
            success: false,
            message: "Booking not found."
          }, 404);
        }

        return respond({
          success: true,
          message: "Booking deleted successfully."
        });
      } catch {
        return respond({
          success: false,
          message: "Could not delete booking. Check the bookings table schema."
        }, 500);
      }
    }

    // CREATE BOOKING
    if (path === "/api/bookings" && method === "POST") {
      const booking = await readJSON(request);

      if (!booking) {
        return respond({
          success: false,
          message: "Invalid JSON."
        }, 400);
      }

      const name = value(booking.name);
      const email = value(booking.email);
      const event = value(
        booking.event || booking.eventName || booking.eventType
      );
      const date = value(booking.date || booking.event_date);
      const venue = value(booking.venue);
      const theme = value(booking.theme);
      const menu = value(booking.menu);
      const guestsValue = booking.guests;
      const guests =
        guestsValue === "" || guestsValue == null
          ? null
          : Number(guestsValue);
      const packageName = value(booking.package || booking.packageName);
      const notes = value(booking.notes);

      if (!name || !email || !event || !date) {
        return respond({
          success: false,
          message: "Name, email, event and date are required."
        }, 400);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return respond({
          success: false,
          message: "Please enter a valid email address."
        }, 400);
      }

      if (guests !== null &&
          (!Number.isInteger(guests) || guests < 1)) {
        return respond({
          success: false,
          message: "Please enter a valid guest count."
        }, 400);
      }

      try {
        const result = await env.DB.prepare(`
          INSERT INTO bookings
            (name, email, event, event_date, venue, theme, menu,
             guests, package, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          name,
          email,
          event,
          date,
          venue || null,
          theme || null,
          menu || null,
          guests,
          packageName || null,
          notes || null
        ).run();

        return respond({
          success: true,
          message: "Booking submitted successfully.",
          bookingId: result.meta?.last_row_id
        }, 201);
      } catch {
        return respond({
          success: false,
          message: "Could not save booking. Check the bookings table columns."
        }, 500);
      }
    }

    // SAVE CONTACT MESSAGE
    if (path === "/api/contact" && method === "POST") {
      const contact = await readJSON(request);

      if (!contact) {
        return respond({
          success: false,
          message: "Invalid JSON."
        }, 400);
      }

      const name = value(contact.name);
      const email = value(contact.email);
      const subject = value(contact.subject);
      const message = value(contact.message);

      if (!name || !email || !message) {
        return respond({
          success: false,
          message: "Name, email and message are required."
        }, 400);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return respond({
          success: false,
          message: "Please enter a valid email address."
        }, 400);
      }

      try {
        await env.DB.prepare(`
          INSERT INTO contacts (name, email, subject, message, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          name,
          email,
          subject || null,
          message
        ).run();

        return respond({
          success: true,
          message: "Your message has been received."
        }, 201);
      } catch {
        return respond({
          success: false,
          message: "Could not save your message. Check the contacts table."
        }, 500);
      }
    }

    return respond({
      success: false,
      message: "API route not found."
    }, 404);
  }
};
