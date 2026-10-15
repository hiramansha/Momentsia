const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
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
        database: env.DB ? "configured" : "not_configured"
      });
    }

    // CREATE BOOKING
    if (path === "/api/bookings" && method === "POST") {
      let booking;

      try {
        booking = await request.json();
      } catch {
        return respond({ success: false, message: "Invalid JSON." }, 400);
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

      if (guests !== null && (!Number.isInteger(guests) || guests < 1)) {
        return respond({
          success: false,
          message: "Please enter a valid guest count."
        }, 400);
      }

      if (!env.DB) {
        return respond({
          success: false,
          message: "Database is not configured. Check the D1 binding named DB."
        }, 503);
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
      } catch (error) {
        return respond({
          success: false,
          message: "Could not save booking. Check the bookings table columns."
        }, 500);
      }
    }

    // SAVE CONTACT MESSAGE
    if (path === "/api/contact" && method === "POST") {
      let contact;

      try {
        contact = await request.json();
      } catch {
        return respond({ success: false, message: "Invalid JSON." }, 400);
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

      if (!env.DB) {
        return respond({
          success: false,
          message: "Database is not configured."
        }, 503);
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
