(() => {
  const STORAGE_KEY = "momentsia_bookings";
  const MESSAGE_KEY = "momentsia_messages";

  function readStorage(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function renderMessages() {
    const list = document.getElementById("admin-messages-list");
    if (!list) return;

    const messages = readStorage(MESSAGE_KEY);

    if (!messages.length) {
      list.innerHTML = "<p>No customer messages found in this browser yet.</p>";
      return;
    }

    list.innerHTML = [...messages].reverse().map(message => `
      <article class="admin-booking-card">
        <h3>${escapeHTML(message.subject || "Customer Message")}</h3>
        <p><strong>From:</strong> ${escapeHTML(message.name)}</p>
        <p><strong>Email:</strong> ${escapeHTML(message.email)}</p>
        <p><strong>Message:</strong> ${escapeHTML(message.message)}</p>
        <p><strong>Date:</strong> ${escapeHTML(message.createdAt || "Not provided")}</p>
      </article>
    `).join("");
  }

  function renderDashboard() {
    const list = document.getElementById("admin-bookings-list");
    if (!list) return;

    const bookings = readStorage(STORAGE_KEY);
    const query = (
      document.getElementById("admin-booking-search")?.value || ""
    ).trim().toLowerCase();

    const count = status => bookings.filter(booking =>
      String(booking.status || "Pending").toLowerCase() === status.toLowerCase()
    ).length;

    document.getElementById("admin-total-bookings").textContent = bookings.length;
    document.getElementById("admin-pending-bookings").textContent = count("Pending");
    document.getElementById("admin-confirmed-bookings").textContent = count("Confirmed");
    document.getElementById("admin-cancelled-bookings").textContent = count("Cancelled");

    const selectedStatus = (
      document.getElementById("admin-status-filter")?.value || "all"
    ).toLowerCase();

    const filtered = bookings.filter(booking => {
      const status = String(booking.status || "Pending").toLowerCase();
      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      const matchesSearch = [
        booking.id, booking.name, booking.email, booking.eventType,
        booking.venue, booking.date, booking.status
      ].join(" ").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });

    if (!filtered.length) {
      list.innerHTML = `<p>${bookings.length
        ? "No bookings match your search."
        : "No bookings found in this browser yet."}</p>`;
      return;
    }

    list.innerHTML = filtered.map(booking => {
      const status = ["Pending", "Confirmed", "Cancelled"].includes(booking.status)
        ? booking.status
        : "Pending";

      return `
        <article class="admin-booking-card">
          <h3>${escapeHTML(booking.eventType || "Event Booking")}</h3>
          <p><strong>Reference:</strong> ${escapeHTML(booking.id)}</p>
          <p><strong>Customer:</strong> ${escapeHTML(booking.name)}</p>
          <p><strong>Email:</strong> ${escapeHTML(booking.email)}</p>
          <p><strong>Venue:</strong> ${escapeHTML(booking.venue)}</p>
          <p><strong>Theme:</strong> ${escapeHTML(booking.theme)}</p>
          <p><strong>Menu:</strong> ${escapeHTML(booking.menu)}</p>
          <p><strong>Date:</strong> ${escapeHTML(booking.date)}</p>
          <p><strong>Guests:</strong> ${escapeHTML(booking.guests)}</p>
          <p><strong>Notes:</strong> ${escapeHTML(booking.notes || "None")}</p>
          <p><strong>Status:</strong> ${escapeHTML(status)}</p>

          <div class="admin-booking-actions">
            <label>
              Update status
              <select data-status-id="${escapeHTML(booking.id)}">
                <option value="Pending" ${status === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Confirmed" ${status === "Confirmed" ? "selected" : ""}>Confirmed</option>
                <option value="Cancelled" ${status === "Cancelled" ? "selected" : ""}>Cancelled</option>
              </select>
            </label>
            <button type="button" class="btn admin-delete-button"
              data-delete-id="${escapeHTML(booking.id)}">Delete Booking</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function exportBookings() {
    const blob = new Blob(
      [JSON.stringify(readStorage(STORAGE_KEY), null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "momentsia-demo-bookings.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("admin-booking-search")
      ?.addEventListener("input", renderDashboard);

    document.getElementById("admin-status-filter")
      ?.addEventListener("change", renderDashboard);

    document.getElementById("admin-export-bookings")
      ?.addEventListener("click", exportBookings);

    document.getElementById("admin-bookings-list")
      ?.addEventListener("change", event => {
        const select = event.target.closest("select[data-status-id]");
        if (!select) return;

        const bookings = readStorage(STORAGE_KEY);
        const booking = bookings.find(item => item.id === select.dataset.statusId);
        if (!booking) return renderDashboard();

        booking.status = select.value;

        try {
          saveBookings(bookings);
          renderDashboard();
        } catch {
          alert("Unable to save this status in your browser.");
          renderDashboard();
        }
      });

    document.getElementById("admin-bookings-list")
      ?.addEventListener("click", event => {
        const button = event.target.closest("button[data-delete-id]");
        if (!button) return;

        const id = button.dataset.deleteId;
        if (!confirm("Are you sure you want to delete this booking?")) return;

        const bookings = readStorage(STORAGE_KEY);
        try {
          saveBookings(bookings.filter(booking => booking.id !== id));
          renderDashboard();
        } catch {
          alert("Unable to delete this booking in your browser.");
        }
      });

    renderDashboard();
    renderMessages();

    window.addEventListener("storage", event => {
      if (event.key === STORAGE_KEY) renderDashboard();
      if (event.key === MESSAGE_KEY) renderMessages();
    });
  });

  window.MomentsiaAdmin = {
    getBookings: () => readStorage(STORAGE_KEY),
    getMessages: () => readStorage(MESSAGE_KEY),
    exportBookings,
    renderDashboard,
    renderMessages
  };
})();
