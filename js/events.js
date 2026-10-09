
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
      category: "Wedding",
      date: "November 15, 2026",
      dateValue: "2026-11-15",
      location: "Lahore",
      price: "PKR 2,500 per person",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85",
      description: "Experience an elegant wedding celebration with beautiful décor, carefully planned arrangements and thoughtful details."
    },
    "Dream Birthday Experience": {
      category: "Birthday",
      date: "November 22, 2026",
      dateValue: "2026-11-22",
      location: "Islamabad",
      price: "PKR 1,200 per person",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=85",
      description: "Celebrate a special day with charming decorations, a joyful atmosphere and a memorable birthday experience."
    },
    "Under the Stars Concert": {
      category: "Music",
      date: "December 5, 2026",
      dateValue: "2026-12-05",
      location: "Lahore",
      price: "PKR 3,000 per person",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85",
      description: "Enjoy live music, exciting entertainment and a vibrant concert atmosphere under the stars."
    },
    "Corporate Excellence Summit": {
      category: "Corporate",
      date: "December 12, 2026",
      dateValue: "2026-12-12",
      location: "Lahore",
      price: "PKR 2,000 per person",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85",
      description: "Discover a professional corporate event experience with thoughtful planning, networking opportunities and elegant arrangements."
    },
    "Future Leaders Conference": {
      category: "Conference",
      date: "December 20, 2026",
      dateValue: "2026-12-20",
      location: "Islamabad",
      price: "PKR 1,800 per person",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=85",
      description: "Take part in an engaging conference featuring professional discussions, knowledge sharing and opportunities to connect."
    }
  };

  function getCardTitle(card) {
    return (
      card.querySelector("h3")?.textContent.trim() ||
      card.dataset.event ||
      ""
    );
  }

  function getCardCategory(card) {
    return (card.dataset.category || "").toLowerCase();
  }

  function filterEvents() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const category = getCardCategory(card);
      const searchableText = card.textContent.toLowerCase();
      const matchesCategory =
        activeCategory === "All" ||
        category === activeCategory.toLowerCase() ||
        category === activeCategory.toLowerCase().replace(/s$/, "");

      const matchesSearch = searchableText.includes(query);
      const visible = matchesCategory && matchesSearch;

      card.hidden = !visible;

      if (visible) visibleCount++;
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleCount > 0;
    }

    if (detailView) detailView.hidden = true;
    if (grid) grid.hidden = false;
    if (categoryBar) categoryBar.hidden = false;
  }

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "All";

      categoryButtons.forEach(item => {
        item.classList.toggle("active", item === button);
      });

      filterEvents();
    });
  });

  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    activeCategory = "All";

    categoryButtons.forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.category === "All"
      );
    });

    filterEvents();
  });

  function openEvent(title) {
    const data = eventData[title];
    if (!data || !grid || !categoryBar || !detailView) return;

    currentEvent = title;

    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-category").textContent = data.category;
    document.getElementById("detail-description").textContent = data.description;
    document.getElementById("detail-date").textContent = data.date;
    document.getElementById("detail-location").textContent = data.location;
    document.getElementById("detail-price").textContent = data.price;

    const image = document.getElementById("detail-image");
    if (image) {
      image.src = data.image;
      image.alt = title;
    }

    cards.forEach(card => {
      card.hidden = true;
    });

    if (emptyMessage) emptyMessage.hidden = true;

    grid.hidden = true;
    categoryBar.hidden = true;
    detailView.hidden = false;

    detailView.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  cards.forEach(card => {
    const title = getCardTitle(card);

    card.addEventListener("click", event => {
      if (event.target.closest(".book-event")) return;
      openEvent(title);
    });
  });

  document.querySelectorAll(".book-event").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      openEvent(button.dataset.event || button.closest(".event-card")?.querySelector("h3")?.textContent.trim());
    });
  });

  document.getElementById("detail-back")?.addEventListener("click", () => {
    if (detailView) detailView.hidden = true;
    if (grid) grid.hidden = false;
    if (categoryBar) categoryBar.hidden = false;

    filterEvents();
  });

  document.getElementById("detail-book")?.addEventListener("click", () => {
    const data = eventData[currentEvent];
    if (!data) return;

    const typeSelect = document.getElementById("booking-type");
    const dateInput = document.getElementById("booking-date");

    if (typeSelect) {
      const matchingOption = [...typeSelect.options].find(option =>
        option.value.toLowerCase().includes(data.category.toLowerCase()) ||
        data.category.toLowerCase().includes(option.value.toLowerCase())
      );

      if (matchingOption) {
        typeSelect.value = matchingOption.value;
      }
    }

    if (dateInput) {
      dateInput.value = data.dateValue;
    }

    document.querySelector('.nav-links a[href="#booking"]')?.click();
  });

  filterEvents();
});