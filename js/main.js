(function () {
  var letterOverlay = document.getElementById("letterOverlay");
  var sealButton = document.getElementById("sealButton");

  var bgMusic = document.getElementById("bgMusic");
  var musicToggle = document.getElementById("musicToggle");
  var musicStarted = false;

  function startMusic() {
    if (!bgMusic || musicStarted) return;
    var playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(function () {
          musicStarted = true;
          if (musicToggle) musicToggle.classList.add("is-playing");
        })
        .catch(function () {
          musicStarted = false;
        });
    } else {
      musicStarted = true;
      if (musicToggle) musicToggle.classList.add("is-playing");
    }
  }

  if (musicToggle && bgMusic) {
    musicToggle.addEventListener("click", function () {
      if (bgMusic.paused) {
        bgMusic.play();
        musicToggle.classList.add("is-playing");
        musicToggle.setAttribute("aria-label", "Pausar música");
      } else {
        bgMusic.pause();
        musicToggle.classList.remove("is-playing");
        musicToggle.setAttribute("aria-label", "Reproducir música");
      }
    });
  }

  if (letterOverlay && sealButton) {
    letterOverlay.classList.add("is-closed");

    sealButton.addEventListener("click", function (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      startMusic();

      letterOverlay.classList.add("is-opening");

      setTimeout(function () {
        letterOverlay.classList.add("is-open");
        letterOverlay.classList.remove("is-closed", "is-opening");
      }, 800);
    });
  }

  var daysEl = document.getElementById("daysValue");
  var hoursEl = document.getElementById("hoursValue");
  var minutesEl = document.getElementById("minutesValue");

  if (daysEl && hoursEl && minutesEl) {
    var eventDate = new Date("2026-07-18T18:00:00");
    var dayMs = 24 * 60 * 60 * 1000;
    var hourMs = 60 * 60 * 1000;
    var minuteMs = 60 * 1000;

    function pad(value) {
      if (value < 10) return "00" + value;
      if (value < 100) return "0" + value;
      return String(value);
    }

    function updateCountdown() {
      var now = new Date();
      var diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        daysEl.textContent = "000";
        hoursEl.textContent = "000";
        minutesEl.textContent = "000";
        return;
      }

      var days = Math.floor(diff / dayMs);
      var hours = Math.floor((diff % dayMs) / hourMs);
      var minutes = Math.floor((diff % hourMs) / minuteMs);

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);
    }

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  var carouselTrack = document.getElementById("carouselTrack");
  var carouselDots = document.getElementById("carouselDots");

  if (carouselTrack) {
    var slides = carouselTrack.querySelectorAll(".carousel-slide");
    var carousel = carouselTrack.closest(".carousel");
    var prevBtn = carousel ? carousel.querySelector(".carousel-prev") : null;
    var nextBtn = carousel ? carousel.querySelector(".carousel-next") : null;
    var currentIndex = 0;
    var autoTimer = null;

    function scrollToIndex(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;
      var slide = slides[currentIndex];
      if (slide) {
        carouselTrack.scrollTo({
          left: slide.offsetLeft - (carouselTrack.clientWidth - slide.clientWidth) / 2,
          behavior: "smooth"
        });
      }
      updateDots();
    }

    function updateDots() {
      if (!carouselDots) return;
      var dots = carouselDots.querySelectorAll(".carousel-dot");
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === currentIndex);
      });
    }

    if (carouselDots) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", "Ir a la foto " + (i + 1));
        dot.addEventListener("click", function () {
          scrollToIndex(i);
          restartAuto();
        });
        carouselDots.appendChild(dot);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        scrollToIndex(currentIndex - 1);
        restartAuto();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        scrollToIndex(currentIndex + 1);
        restartAuto();
      });
    }

    var scrollDebounce = null;
    carouselTrack.addEventListener("scroll", function () {
      window.clearTimeout(scrollDebounce);
      scrollDebounce = window.setTimeout(function () {
        var center = carouselTrack.scrollLeft + carouselTrack.clientWidth / 2;
        var closest = 0;
        var closestDist = Infinity;
        slides.forEach(function (slide, i) {
          var slideCenter = slide.offsetLeft + slide.clientWidth / 2;
          var dist = Math.abs(slideCenter - center);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        currentIndex = closest;
        updateDots();
      }, 120);
    });

    function startAuto() {
      if (slides.length <= 1) return;
      autoTimer = window.setInterval(function () {
        scrollToIndex(currentIndex + 1);
      }, 4500);
    }

    function restartAuto() {
      window.clearInterval(autoTimer);
      startAuto();
    }

    carouselTrack.addEventListener("pointerdown", function () {
      window.clearInterval(autoTimer);
    });

    startAuto();
  }

  var mapModal = document.getElementById("mapModal");
  var mapIframe = document.getElementById("mapModalIframe");
  var mapTitle = document.getElementById("mapModalTitle");
  var mapLink = document.getElementById("mapModalLink");
  var mapButtons = document.querySelectorAll(".map-btn");

  if (mapModal && mapIframe && mapButtons.length) {
    function openMap(query, title) {
      var q = encodeURIComponent(query);
      mapIframe.src = "https://www.google.com/maps?q=" + q + "&output=embed";
      if (mapLink) mapLink.href = "https://www.google.com/maps?q=" + q;
      if (mapTitle && title) mapTitle.textContent = title;
      mapModal.classList.add("is-open");
      mapModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeMap() {
      mapModal.classList.remove("is-open");
      mapModal.setAttribute("aria-hidden", "true");
      mapIframe.src = "";
      document.body.style.overflow = "";
    }

    mapButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openMap(btn.getAttribute("data-map-query"), btn.getAttribute("data-map-title"));
      });
    });

    mapModal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeMap);
    });

    document.addEventListener("keydown", function (evt) {
      if (evt.key === "Escape" && mapModal.classList.contains("is-open")) {
        closeMap();
      }
    });
  }
})();
