(() => {
  "use strict";

  const API_BASE_URL = window.location.hostname.endsWith(".app.github.dev")
    ? `${window.location.protocol}//${window.location.hostname.replace(/-\d+\.app\.github\.dev$/, "-5000.app.github.dev")}`
    : "http://localhost:5000";

  let bookings = [];
  let messages = [];
  let loading = false;

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  }

  function showError(containerId, message) {
    const container = $(containerId);
    if (container) {
      container.innerHTML = `<p role="alert">${escapeHTML(message)}</p>`;
    }
  }

  function renderMessages() {
    const list = $("admin-messages-list");
    if (!list) return;

    if (!messages.length) {
      list.innerHTML = "<p>No customer messages found.</p>";
      return;
    }

    list.innerHTML = [...messages].reverse().map((message) => `
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
    const list = $("admin-bookings-list");
    if (!list) return;

    const count = (status) => bookings.filter(
      (booking) => String(booking.status || "Pending").toLowerCase() === status.toLowerCase()
    ).length;

    if ($("admin-total-bookings")) $("admin-total-bookings").textContent = bookings.length;
    if ($("admin-pending-bookings")) $("admin-pending-bookings").textContent = count("Pending");
    if ($("admin-confirmed-bookings")) $("admin-confirmed-bookings").textContent = count("Confirmed");
    if ($("admin-cancelled-bookings")) $("admin-cancelled-bookings").textContent = count("Cancelled");

    const query = ($("admin-booking-search")?.value || "").trim().toLowerCase();
    const selectedStatus = ($("admin-status-filter")?.value || "all").toLowerCase();

    const filtered = bookings.filter((booking) => {
      const status = String(booking.status || "Pending").toLowerCase();
      const searchable = [
        booking.id, booking.name, booking.email, booking.eventType,
        booking.venue, booking.date, booking.status
      ].join(" ").toLowerCase();

      return (selectedStatus === "all" || status === selectedStatus)
        && searchable.includes(query);
    });

    if (!filtered.length) {
      list.innerHTML = `<p>${bookings.length
        ? "No bookings match your search."
        : "No bookings found in the database yet."}</p>`;
      return;
    }

    list.innerHTML = filtered.map((booking) => {
      const status = ["Pending", "Confirmed", "Cancelled"].includes(booking.status)
        ? booking.status : "Pending";

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
          <p><strong>Package:</strong> ${escapeHTML(booking.package || "Not selected")}</p>
          <p><strong>Estimated Cost:</strong> ${
            booking.estimatedCost
              ? "PKR " + Number(booking.estimatedCost).toLocaleString("en-PK")
              : "Not available"
          }</p>
          <p><strong>Notes:</strong> ${escapeHTML(booking.notes || "None")}</p>
          <p><strong>Status:</strong> ${escapeHTML(status)}</p>
          <div class="admin-booking-actions">
            <label>Update status
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

  async function loadData() {
    if (loading) return;
    loading = true;

    const bookingList = $("admin-bookings-list");
    const messageList = $("admin-messages-list");
    if (bookingList) bookingList.innerHTML = "<p>Loading bookings...</p>";
    if (messageList) messageList.innerHTML = "<p>Loading messages...</p>";

    try {
      const [bookingData, messageData] = await Promise.all([
        apiRequest("/api/bookings"),
        apiRequest("/api/contact")
      ]);

      bookings = Array.isArray(bookingData.bookings) ? bookingData.bookings : [];
      messages = Array.isArray(messageData.messages) ? messageData.messages : [];

      renderDashboard();
      renderMessages();
    } catch (error) {
      showError("admin-bookings-list", `Could not load bookings: ${error.message}`);
      showError("admin-messages-list", `Could not load messages: ${error.message}`);
    } finally {
      loading = false;
    }
  }

  async function updateStatus(select) {
    const id = select.dataset.statusId;
    const newStatus = select.value;
    select.disabled = true;

    try {
      await apiRequest(`/api/bookings/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });

      await loadData();
    } catch (error) {
      alert(`Status could not be updated: ${error.message}`);
      await loadData();
    } finally {
      select.disabled = false;
    }
  }

  async function deleteBooking(button) {
    const id = button.dataset.deleteId;
    if (!confirm("Are you sure you want to delete this booking?")) return;

    button.disabled = true;

    try {
      await apiRequest(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      await loadData();
    } catch (error) {
      alert(`Booking could not be deleted: ${error.message}`);
      button.disabled = false;
    }
  }

  function exportBookings() {
    const blob = new Blob([JSON.stringify(bookings, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "momentsia-bookings.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("admin-booking-search")?.addEventListener("input", renderDashboard);
    $("admin-status-filter")?.addEventListener("change", renderDashboard);
    $("admin-export-bookings")?.addEventListener("click", exportBookings);

    $("admin-bookings-list")?.addEventListener("change", (event) => {
      const select = event.target.closest("select[data-status-id]");
      if (select) updateStatus(select);
    });

    $("admin-bookings-list")?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-delete-id]");
      if (button) deleteBooking(button);
    });

    loadData();
  });

  window.MomentsiaAdmin = {
    getBookings: () => [...bookings],
    getMessages: () => [...messages],
    exportBookings,
    renderDashboard,
    renderMessages,
    loadData
  };
})();
