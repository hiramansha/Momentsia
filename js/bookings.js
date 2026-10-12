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

  // BOOKING FORM
  bookingForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) return;

    const formData = new FormData(bookingForm);

    const booking = {
      id: `BK-${Date.now()}`,
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      eventType: formData.get("eventType"),
      venue: formData.get("venue") === "Other" ? formData.get("customVenue").trim() : formData.get("venue"),
      theme: formData.get("theme") === "Other" ? formData.get("customTheme").trim() : formData.get("theme"),
      menu: formData.get("menu") === "Other" ? formData.get("customMenu").trim() : formData.get("menu"),
      date: formData.get("date"),
      guests: Number(formData.get("guests")),
      package: formData.get("package"),
      estimatedCost: Number(formData.get("guests")) * ({ Basic: 1500, Premium: 3000, Luxury: 5000 }[formData.get("package")] || 0),
      notes: formData.get("notes").trim(),
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    // Prevent past event dates
    if (booking.date < new Date().toISOString().slice(0, 10)) {
      bookingMessage.textContent =
        "Please select today or a future date.";
      return;
    }

    const bookings = readSavedItems("momentsia_bookings");
    bookings.push(booking);

    try {
      localStorage.setItem(
        "momentsia_bookings",
        JSON.stringify(bookings)
      );

    bookingMessage.textContent =
  `Booking request saved successfully! Reference: ${booking.id} | Event: ${booking.eventType} | Venue: ${booking.venue} | Theme: ${booking.theme} | Menu: ${booking.menu} | Date: ${booking.date} | Guests: ${booking.guests}`;

      bookingForm.reset();

      // Reset custom Venue, Theme and Menu fields
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
    } catch {
      bookingMessage.textContent =
        "Unable to save this request in your browser. Please try again.";
    }
  });

  // CONTACT FORM
  contactForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);

    const message = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      subject: formData.get("subject").trim(),
      message: formData.get("message").trim(),
      createdAt: new Date().toISOString()
    };

    const messages = readSavedItems("momentsia_messages");
    messages.push(message);

    try {
      localStorage.setItem(
        "momentsia_messages",
        JSON.stringify(messages)
      );

      contactMessage.textContent =
        "Your message has been saved in this browser demo. It has not been emailed.";

      contactForm.reset();
    } catch {
      contactMessage.textContent =
        "Unable to save the message. Please try again.";
    }
  });
});