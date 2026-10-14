document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const bookingMessage = document.getElementById("booking-message");
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("form-message");

  // API URL: live website uses the same origin.
  // Local development and Codespaces remain supported.
  const hostname = window.location.hostname;

  const API_BASE_URL =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : hostname.endsWith(".app.github.dev")
        ? `${window.location.protocol}//${hostname.replace(
            /-\d+\.app\.github\.dev$/,
            "-5000.app.github.dev"
          )}`
        : "";

  function readSavedItems(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  // CUSTOM OPTIONS: VENUE, THEME AND MENU
  const customFields = [
    ["booking-venue", "booking-venue-other", "customVenue"],
    ["booking-theme", "booking-theme-other", "customTheme"],
    ["booking-menu", "booking-menu-other", "customMenu"]
  ];

  customFields.forEach(([selectId, inputId]) => {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    const wrapper = document.getElementById(`${inputId}-wrapper`);

    if (!select || !input || !wrapper) return;

    function updateCustomField() {
      const show = select.value === "Other";
      wrapper.hidden = !show;
      input.required = show;

      if (!show) input.value = "";
    }

    select.addEventListener("change", updateCustomField);
    updateCustomField();
  });

  // LIVE PACKAGE COST CALCULATOR
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

  // Safely handle JSON and unexpected server responses.
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
        "Cannot connect to the backend. The API may not be deployed yet."
      );
    }

    const contentType = response.headers.get("content-type") || "";
    let result;

    if (contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned invalid JSON.");
      }
    } else {
      throw new Error(
        `Server error (${response.status}). The API route may not be configured.`
      );
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || `Request failed (${response.status}).`
      );
    }

    return result;
  }

  // BOOKING FORM
  bookingForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) return;

    if (!bookingMessage) return;

    const formData = new FormData(bookingForm);

    const booking = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      eventType: formData.get("eventType"),
      venue:
        formData.get("venue") === "Other"
          ? formData.get("customVenue")?.trim()
          : formData.get("venue"),
      theme:
        formData.get("theme") === "Other"
          ? formData.get("customTheme")?.trim()
          : formData.get("theme"),
      menu:
        formData.get("menu") === "Other"
          ? formData.get("customMenu")?.trim()
          : formData.get("menu"),
      date: formData.get("date"),
      guests: Number(formData.get("guests")),
      package: formData.get("package"),
      notes: formData.get("notes")?.trim() || ""
    };

    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (booking.date < localToday) {
      bookingMessage.textContent =
        "Please select today or a future date.";
      return;
    }

    const submitButton = bookingForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    bookingMessage.textContent = "Submitting your booking...";

    try {
      const result = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(booking)
      });

      const reference =
        result.booking?.id || result.booking?._id || "Received";

      bookingMessage.textContent =
        `Booking request saved successfully! Reference: ${reference}`;

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
      if (submitButton) submitButton.disabled = false;
    }
  });

  // CONTACT FORM
  contactForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;
    if (!contactMessage) return;

    const formData = new FormData(contactForm);

    const message = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      subject: formData.get("subject")?.trim(),
      message: formData.get("message")?.trim()
    };

    const submitButton = contactForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

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
      if (submitButton) submitButton.disabled = false;
    }
  });
});
