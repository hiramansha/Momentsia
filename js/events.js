document.addEventListener("DOMContentLoaded", () => {
  const cards = [...document.querySelectorAll(".event-card")];
  const categoryButtons = [...document.querySelectorAll("#event-categories button")];
  const searchForm = document.getElementById("event-search");
  const searchInput = document.getElementById("search-query");
  const grid = document.getElementById("event-grid");
  const categoryBar = document.getElementById("event-categories");
  const detailView = document.getElementById("event-detail-view");
  const emptyMessage = document.getElementById("event-empty");

  let activeCategory = "All";
  let currentEvent = null;

  const eventData = {
    "Elegant Wedding Showcase": {
      category: "WEDDING",
      date: "November 15, 2026",
      location: "Lahore",
      price: "PKR 2,500 per person",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
      description: "Experience an elegant wedding celebration with beautiful décor, carefully planned arrangements and thoughtful details."
    },
    "Dream Birthday Experience": {
      category: "BIRTHDAY",
      date: "November 22, 2026",
      location: "Islamabad",
      price: "PKR 1,200 per person",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=85",
      description: "Celebrate a special day with a joyful atmosphere, charming decorations and a memorable birthday experience."
    },
    "Under the Stars Concert": {
      category: "MUSIC",
      date: "December 5, 2026",
      location: "Lahore",
      price: "PKR 3,000 per person",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85",
      description: "Enjoy an exciting live music experience with entertainment and a vibrant atmosphere under the stars."
    }
  };

  function filterEvents() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.dataset.category || "";
      const matchesCategory = activeCategory === "All" || category === activeCategory;
      const matchesSearch = card.textContent.toLowerCase().includes(query);
      const visible = matchesCategory && matchesSearch;

      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (emptyMessage) emptyMessage.hidden = visibleCount > 0;

    if (detailView) detailView.hidden = true;
    if (grid) grid.hidden = false;
    if (categoryBar) categoryBar.hidden = false;
  }

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "All";
      categoryButtons.forEach(item => item.classList.toggle("active", item === button));
      filterEvents();
    });
  });

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    activeCategory = "All";
    categoryButtons.forEach(button => {
      button.classList.toggle("active", button.dataset.category === "All");
    });
    filterEvents();
  });

  function openEvent(title) {
    const data = eventData[title];
    if (!data) return;

    currentEvent = title;

    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-category").textContent = data.category;
    document.getElementById("detail-description").textContent = data.description;
    document.getElementById("detail-date").textContent = data.date;
    document.getElementById("detail-location").textContent = data.location;
    document.getElementById("detail-price").textContent = data.price;

    const image = document.getElementById("detail-image");
    image.src = data.image;
    image.alt = title;

    grid.hidden = true;
    categoryBar.hidden = true;
    emptyMessage.hidden = true;
    detailView.hidden = false;
    detailView.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll(".book-event").forEach(button => {
    button.addEventListener("click", () => openEvent(button.dataset.event));
  });

  document.getElementById("detail-back")?.addEventListener("click", () => {
    detailView.hidden = true;
    grid.hidden = false;
    categoryBar.hidden = false;
    filterEvents();
  });

  document.getElementById("detail-book")?.addEventListener("click", () => {
    const data = eventData[currentEvent];
    if (!data) return;

    const typeSelect = document.getElementById("booking-type");
    const dateInput = document.getElementById("booking-date");
    const eventType = data.category.charAt(0) + data.category.slice(1).toLowerCase();

    if (typeSelect) {
      const matchingOption = [...typeSelect.options].find(option =>
        option.value.toLowerCase() === eventType.toLowerCase()
      );
      if (matchingOption) typeSelect.value = matchingOption.value;
    }

    if (dateInput) {
      const dateMap = {
        "Elegant Wedding Showcase": "2026-11-15",
        "Dream Birthday Experience": "2026-11-22",
        "Under the Stars Concert": "2026-12-05"
      };
      dateInput.value = dateMap[currentEvent] || "";
    }

    document.querySelector('.nav-links a[href="#booking"]')?.click();
  });

  filterEvents();
});