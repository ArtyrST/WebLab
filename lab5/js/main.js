// main.js — Лабораторна робота №5, Варіант 16
// jQuery: плавна навігація, гамбургер, анімації секцій 1-2, слайдер секції 3

$(document).ready(function () {

  // ============================================================
  // 1. ПЛАВНА ПРОКРУТКА по кліку на пункти меню і кнопки
  // ============================================================
  $("a.nav-link, a.btn").on("click", function (e) {
    const href = $(this).attr("href");

    // Перевіряємо чи посилання веде на якір (#section...)
    if (href && href.startsWith("#")) {
      e.preventDefault();

      const target = $(href);
      if (target.length) {
        $("html, body").animate(
          { scrollTop: target.offset().top - 70 }, // -70 щоб не перекривав navbar
          700,
          "swing"
        );
      }

      // Закриваємо мобільне меню після кліку
      $("#nav-menu").removeClass("open");
      $("#hamburger").removeClass("open");
    }
  });

  // ============================================================
  // 2. МЕНЮ "ГАМБУРГЕР"
  // ============================================================
  $("#hamburger").on("click", function () {
    $(this).toggleClass("open");
    $("#nav-menu").toggleClass("open");
  });

  // Закрити меню при кліку поза ним
  $(document).on("click", function (e) {
    if (!$(e.target).closest("#navbar").length) {
      $("#nav-menu").removeClass("open");
      $("#hamburger").removeClass("open");
    }
  });

  // ============================================================
  // 3. ПІДСВІЧУВАННЯ АКТИВНОГО ПУНКТУ МЕНЮ при скролі
  // ============================================================
  $(window).on("scroll", function () {
    highlightActiveMenu();
    triggerAnimations();
  });

  function highlightActiveMenu() {
    const scrollPos = $(window).scrollTop() + 80;

    $("section").each(function () {
      const sectionTop = $(this).offset().top;
      const sectionBottom = sectionTop + $(this).outerHeight();
      const sectionId = $(this).attr("id");

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        $(".nav-link").removeClass("active");
        $(`.nav-link[href="#${sectionId}"]`).addClass("active");
      }
    });
  }

  // ============================================================
  // 4. АНІМАЦІЇ для секцій 1 і 2
  // ============================================================

  // Запускаємо анімацію для елементів що видно на екрані
  function triggerAnimations() {
    const windowBottom = $(window).scrollTop() + $(window).height();

    // Анімуємо .animate-item (елементи в секції 1)
    $(".animate-item").each(function () {
      if ($(this).offset().top < windowBottom - 60) {
        $(this).addClass("visible");
      }
    });

    // Анімуємо .animate-section (секція 2 — картки, заголовки)
    $(".animate-section").each(function () {
      if ($(this).offset().top < windowBottom - 60) {
        $(this).addClass("visible");
      }
    });
  }

  // Запускаємо одразу при завантаженні (для елементів що вже видно)
  triggerAnimations();
  highlightActiveMenu();

  // ============================================================
  // 5. СЛАЙДЕР для секції 3
  // ============================================================
  const $slides    = $(".slide");
  const totalSlides = $slides.length;
  let currentSlide = 0;
  let autoplayTimer;

  // Створюємо точки навігації
  for (let i = 0; i < totalSlides; i++) {
    $("#sliderDots").append(
      $("<button>").addClass("dot" + (i === 0 ? " active" : ""))
        .attr("data-index", i)
    );
  }

  // Функція переходу до слайду
  function goToSlide(index) {
    $slides.eq(currentSlide).removeClass("active");
    $(".dot").removeClass("active");

    currentSlide = (index + totalSlides) % totalSlides;

    $slides.eq(currentSlide).addClass("active");
    $(".dot").eq(currentSlide).addClass("active");
  }

  // Кнопка "Наступний"
  $("#nextBtn").on("click", function () {
    goToSlide(currentSlide + 1);
    resetAutoplay();
  });

  // Кнопка "Попередній"
  $("#prevBtn").on("click", function () {
    goToSlide(currentSlide - 1);
    resetAutoplay();
  });

  // Клік по точці
  $(document).on("click", ".dot", function () {
    goToSlide(parseInt($(this).attr("data-index")));
    resetAutoplay();
  });

  // Автоматична прокрутка кожні 4 секунди
  function startAutoplay() {
    autoplayTimer = setInterval(function () {
      goToSlide(currentSlide + 1);
    }, 4000);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  startAutoplay();

  // Пауза при наведенні на слайдер
  $(".slider-wrapper").on("mouseenter", function () {
    clearInterval(autoplayTimer);
  }).on("mouseleave", function () {
    startAutoplay();
  });

});
