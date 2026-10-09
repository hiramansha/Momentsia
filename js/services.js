document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".service-link").forEach(link => {
    link.addEventListener("click", () => {
      const selectedService = link.dataset.service;
      const bookingType = document.getElementById("booking-type");

      if (!bookingType || !selectedService) return;

      const options = [...bookingType.options];
      const matchingOption = options.find(option =>
        option.value.toLowerCase() === selectedService.toLowerCase()
      );

      if (matchingOption) {
        bookingType.value = matchingOption.value;
      } else if (selectedService === "Music") {
        bookingType.value = "Music";
      } else {
        bookingType.value = "Other";
      }
    });
  });
});