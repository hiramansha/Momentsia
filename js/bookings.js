document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");
  const bookingMessage = document.getElementById("booking-message");
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("form-message");

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

  customFields.forEach(([selectId, inputId, fieldName]) => {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);
    const wrapper = document.getElementById(`${inputId}-wrapper`);

    if (!select || !input || !wrapper) return;

    const updateCustomField = () => {
      const show = select.value === "Other";
      wrapper.hidden = !show;
      input.required = show;
      if (!show) input.value = "";
    };

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


  // Backend URL for GitHub Codespaces or local development
  const API_BASE_URL = window.location.hostname.endsWith(".app.github.dev")
    ? window.location.protocol + "//" +
      window.location.hostname.replace(/-\d+\.app\.github\.dev$/, "-5000.app.github.dev")
    : "http://localhost:5000";

  // BOOKING FORM: SAVE TO MONGODB
  bookingForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) return;

    const formData = new FormData(bookingForm);
    const booking = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      eventType: formData.get("eventType"),
      venue: formData.get("venue") === "Other"
        ? formData.get("customVenue")?.trim()
        : formData.get("venue"),
      theme: formData.get("theme") === "Other"
        ? formData.get("customTheme")?.trim()
        : formData.get("theme"),
      menu: formData.get("menu") === "Other"
        ? formData.get("customMenu")?.trim()
        : formData.get("menu"),
      date: formData.get("date"),
      guests: Number(formData.get("guests")),
      package: formData.get("package"),
      notes: formData.get("notes")?.trim() || ""
    };

    if (booking.date < new Date().toISOString().slice(0, 10)) {
      bookingMessage.textContent = "Please select today or a future date.";
      return;
    }

    bookingMessage.textContent = "Submitting your booking...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit booking.");
      }

      bookingMessage.textContent =
        `Booking request saved successfully! Reference: ${result.booking.id}`;

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
      bookingMessage.textContent =
        error.message || "Unable to connect to the server. Please try again.";
    }
  });

  // CONTACT FORM: SAVE TO MONGODB
  contactForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const message = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      subject: formData.get("subject")?.trim(),
      message: formData.get("message")?.trim()
    };

    contactMessage.textContent = "Sending your message...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send message.");
      }

      contactMessage.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      contactMessage.textContent =
        error.message || "Unable to connect to the server. Please try again.";
    }
  });
});
