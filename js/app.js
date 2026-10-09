document.addEventListener("DOMContentLoaded", () => {
  const welcome = document.getElementById("welcome-screen");
  const exploreButton = document.getElementById("welcome-explore");
  const menuButton = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  const sections = [...document.querySelectorAll("main > section.page-section")];
  const navigationLinks = [...document.querySelectorAll("#nav-links a")];

  function showSection(sectionId, updateHash = true) {
    const target = document.getElementById(sectionId);
    if (!target || !target.classList.contains("page-section")) return;

    sections.forEach(section => {
      section.classList.toggle("section-hidden", section !== target);
    });

    navigationLinks.forEach(link => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (updateHash) {
      history.replaceState(null, "", `#${sectionId}`);
    }

    navLinks?.classList.remove("active");
    menuButton?.setAttribute("aria-expanded", "false");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enterWebsite() {
    welcome?.classList.add("is-hidden");
    showSection("home");
  }

  exploreButton?.addEventListener("click", enterWebsite);

  navigationLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showSection(link.getAttribute("href").slice(1));
    });
  });

  document.querySelectorAll('a[href="#booking"], a[href="#events"], a[href="#home"]').forEach(link => {
    if (link.closest("#nav-links")) return;

    link.addEventListener("click", event => {
      event.preventDefault();

      if (welcome && !welcome.classList.contains("is-hidden")) {
        welcome.classList.add("is-hidden");
      }

      showSection(link.getAttribute("href").slice(1));
    });
  });

  menuButton?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  // Start with the welcome screen. The Home section appears after Explore.
  sections.forEach(section => {
    section.classList.toggle("section-hidden", section.id !== "home");
  });

  // If the welcome screen is closed and the browser is refreshed,
  // show the section identified in the URL hash.
  if (location.hash && document.getElementById(location.hash.slice(1))?.classList.contains("page-section")) {
    showSection(location.hash.slice(1), false);
  }
});