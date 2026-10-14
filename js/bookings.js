
document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const bookingMessage = document.getElementById("booking-message");
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("form-message");

  const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : window.location.hostname.endsWith(".app.github.dev")
        ? `${window.location.protocol}//${window.location.hostname.replace(
            /-\d+\.app\.github\.dev$/,
            "-5000.app.github.dev"
          )}`
        : "https://momentsia.23-st-028.workers.dev";

  const customFields = [
    ["booking-venue", "booking-venue-other"],
    ["booking-theme", "booking-theme-other"],
    ["booking-menu", "booking-menu-other"]
  ];

  customFields.forEach(([selectId, inputId]) => {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    const wrapper = document.getElementById(`${inputId}-wrapper`);

    if (!select || !input || !wrapper) return;

    const update = () => {
      const show = select.value === "Other";
      wrapper.hidden = !show;
      input.required = show;
      if (!show) input.value = "";
    };

    select.addEventListener("change", update);
    update();
  });

  const packageSelect = document.getElementById("booking-package");
  const guestCountInput = document.getElementById("guest-count");
  const estimatedCost = document.getElementById("estimated-cost");

  const packagePrices = {
    Basic: 1500,
    Premium: 3000,
    Luxury: 5000
  };

  function updateEstimatedCost() {
    if (!packageSelect || !guestCountInput || !estimatedCost) return;

    const price = packagePrices[packageSelect.value];
    const guests = Number(guestCountInput.value);

    if (!price || !Number.isFinite(guests) || guests < 1) {
      estimatedCost.textContent = "Select a package and guest count";
      return;
    }

    estimatedCost.textContent =
      `PKR ${(price * guests).toLocaleString("en-PK")}`;
  }

  packageSelect?.addEventListener("change", updateEstimatedCost);
  guestCountInput?.addEventListener("input", updateEstimatedCost);
  updateEstimatedCost();

  async function apiRequest(path, options = {}) {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        }
      });
    } catch {
      throw new Error(
        "Cannot connect to the backend. Check the Worker deployment."
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(`Server returned an unexpected response (${response.status}).`);
    }

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned invalid JSON.");
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Request failed (${response.status}).`);
    }

    return result;
  }

  // BOOKING FORM
  bookingForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!bookingForm.reportValidity() || !bookingMessage) return;

    const formData = new FormData(bookingForm);
    const getValue = key => String(formData.get(key) || "").trim();

    const venue = getValue("venue") === "Other"
      ? getValue("customVenue")
      : getValue("venue");

    const theme = getValue("theme") === "Other"
      ? getValue("customTheme")
      : getValue("theme");

    const menu = getValue("menu") === "Other"
      ? getValue("customMenu")
      : getValue("menu");

    const booking = {
      name: getValue("name"),
      email: getValue("email"),
      event: getValue("eventType"),
      eventType: getValue("eventType"),
      venue,
      theme,
      menu,
      date: getValue("date"),
      guests: Number(getValue("guests")),
      package: getValue("package"),
      notes: getValue("notes")
    };

    if (!booking.name || !booking.email || !booking.event || !booking.date) {
      bookingMessage.textContent = "Please complete all required fields.";
      return;
    }

    if (!Number.isFinite(booking.guests) || booking.guests < 1) {
      bookingMessage.textContent = "Please enter a valid guest count.";
      return;
    }

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");

    if (booking.date < today) {
      bookingMessage.textContent = "Please select today or a future date.";
      return;
    }

    const button = bookingForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (button) button.disabled = true;
    bookingMessage.textContent = "Submitting your booking...";

    try {
      const result = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(booking)
      });

      const reference =
        result.booking?.id ||
        result.booking?._id ||
        result.bookingId ||
        "Received";

      bookingMessage.textContent =
        `Booking submitted successfully! Reference: ${reference}`;

      bookingForm.reset();

      customFields.forEach(([selectId, inputId]) => {
        const select = document.getElementById(selectId);
        const input = document.getElementById(inputId);
        const wrapper = document.getElementById(`${inputId}-wrapper`);

        if (select && input && wrapper) {
          wrapper.hidden = true;
          input.required = false;
          input.value = "";
        }
      });

      updateEstimatedCost();
    } catch (error) {
      bookingMessage.textContent = error.message;
    } finally {
      if (button) button.disabled = false;
    }
  });

  // CONTACT FORM
  contactForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!contactForm.reportValidity() || !contactMessage) return;

    const formData = new FormData(contactForm);
    const getValue = key => String(formData.get(key) || "").trim();

    const message = {
      name: getValue("name"),
      email: getValue("email"),
      subject: getValue("subject"),
      message: getValue("message")
    };

    if (!message.name || !message.email || !message.message) {
      contactMessage.textContent = "Please complete all required fields.";
      return;
    }

    const button = contactForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (button) button.disabled = true;
    contactMessage.textContent = "Sending your message...";

    try {
      const result = await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(message)
      });

      contactMessage.textContent =
        result.message || "Your message was sent successfully.";

      contactForm.reset();
    } catch (error) {
      contactMessage.textContent = error.message;
    } finally {
      if (button) button.disabled = false;
    }
  });
});

