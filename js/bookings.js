
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

  bookingForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!bookingForm.reportValidity()) return;

    const formData = new FormData(bookingForm);
    const booking = {
      id: `BK-${Date.now()}`,
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      eventType: formData.get("eventType"),
      date: formData.get("date"),
      guests: Number(formData.get("guests")),
      notes: formData.get("notes").trim(),
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    if (booking.date < new Date().toISOString().slice(0, 10)) {
      bookingMessage.textContent = "Please select today or a future date.";
      return;
    }

    const bookings = readSavedItems("momentsia_bookings");
    bookings.push(booking);

    try {
      localStorage.setItem("momentsia_bookings", JSON.stringify(bookings));
      bookingMessage.textContent = `Your demo booking request has been saved. Reference: ${booking.id}`;
      bookingForm.reset();
    } catch {
      bookingMessage.textContent = "Unable to save this request in your browser. Please try again.";
    }
  });

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
      localStorage.setItem("momentsia_messages", JSON.stringify(messages));
      contactMessage.textContent = "Your message has been saved in this browser demo. It has not been emailed.";
      contactForm.reset();
    } catch {
      contactMessage.textContent = "Unable to save the message. Please try again.";
    }
  });
});