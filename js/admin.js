
window.MomentsiaAdmin = {
  getBookings() {
    try {
      return JSON.parse(localStorage.getItem("momentsia_bookings") || "[]");
    } catch {
      return [];
    }
  },

  getMessages() {
    try {
      return JSON.parse(localStorage.getItem("momentsia_messages") || "[]");
    } catch {
      return [];
    }
  },

  exportBookings() {
    const bookings = this.getBookings();
    const blob = new Blob(
      [JSON.stringify(bookings, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "momentsia-demo-bookings.json";
    link.click();
    URL.revokeObjectURL(url);
  }
};