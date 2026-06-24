const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const nav = document.querySelector(".nav");
const form = document.querySelector(".contact-form");
const formNote = document.querySelector(".form-note");
const submitButton = form.querySelector('button[type="submit"]');
const contactInput = form.elements.contact;
const messageInput = form.elements.message;
const autoplayVideos = document.querySelectorAll("video[autoplay]");
let scrollAnimationFrame = null;
const videoObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const isVisible = entry.isIntersecting;

        video.dataset.isVisible = String(isVisible);

        if (isVisible) {
          playVideo(video);
          return;
        }

        video.pause();
      });
    }, { rootMargin: "240px 0px", threshold: 0.12 })
  : null;

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  siteHeader.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    const link = event.target;
    const target = document.querySelector(link.getAttribute("href"));

    if (target) {
      event.preventDefault();
      scrollToSection(target);
    }

    nav.classList.remove("is-open");
    siteHeader.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  if (link.closest(".nav")) {
    return;
  }

  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    scrollToSection(target);
  });
});

["wheel", "touchstart", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, cancelScrollAnimation, { passive: true });
});

autoplayVideos.forEach((video) => {
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.dataset.lastTime = "0";
  video.dataset.isVisible = videoObserver ? "false" : "true";

  video.addEventListener("pause", () => {
    if (!document.hidden && video.dataset.isVisible === "true") {
      requestAnimationFrame(() => playVideo(video));
    }
  });

  video.addEventListener("ended", () => {
    video.currentTime = 0;
    playVideo(video);
  });

  if (videoObserver) {
    videoObserver.observe(video);
  } else {
    playVideo(video);
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    autoplayVideos.forEach((video) => {
      if (video.dataset.isVisible === "true") {
        playVideo(video);
      }
    });
  }
});

window.addEventListener("pageshow", () => {
  autoplayVideos.forEach((video) => {
    if (video.dataset.isVisible === "true") {
      playVideo(video);
    }
  });
});

window.setInterval(() => {
  if (document.hidden) {
    return;
  }

  autoplayVideos.forEach((video) => {
    if (video.dataset.isVisible !== "true") {
      return;
    }

    const lastTime = Number(video.dataset.lastTime || 0);
    const isStuck = !video.paused && Math.abs(video.currentTime - lastTime) < 0.02;

    if (video.paused || isStuck) {
      playVideo(video);
    }

    video.dataset.lastTime = String(video.currentTime);
  });
}, 3500);

contactInput.addEventListener("input", () => {
  contactInput.value = formatPhoneInput(contactInput.value);
});

messageInput.addEventListener("input", () => {
  autoResizeTextarea(messageInput);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    contact: String(formData.get("contact") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    website: String(formData.get("website") || "").trim(),
  };

  if (!payload.name || !payload.contact || !payload.message) {
    formNote.textContent = "Заполните все поля";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Отправка...";
  formNote.textContent = "";

  fetch("/.netlify/functions/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().catch(() => ({})).then((errorBody) => {
          throw new Error(errorBody.error || "Request failed");
        });
      }

      form.reset();
      autoResizeTextarea(messageInput);
      formNote.textContent = "Заявка отправлена";
    })
    .catch((error) => {
      console.error("Contact form error:", error);
      formNote.textContent = "Ошибка отправки. Попробуйте позже";
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Отправить";
    });
});

function formatPhoneInput(value) {
  if (/[a-zа-я@]/i.test(value)) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let phone = digits;

  if (phone.startsWith("8")) {
    phone = `7${phone.slice(1)}`;
  }

  if (phone.startsWith("9")) {
    phone = `7${phone}`;
  }

  if (!phone.startsWith("7")) {
    return value;
  }

  phone = phone.slice(0, 11);

  const code = phone.slice(1, 4);
  const first = phone.slice(4, 7);
  const second = phone.slice(7, 9);
  const third = phone.slice(9, 11);

  let result = "+7";

  if (code) {
    result += ` (${code}`;
  }

  if (code.length === 3) {
    result += ")";
  }

  if (first) {
    result += ` ${first}`;
  }

  if (second) {
    result += `-${second}`;
  }

  if (third) {
    result += `-${third}`;
  }

  return result;
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

autoResizeTextarea(messageInput);

function scrollToSection(target) {
  const headerOffset = siteHeader.offsetHeight + 18;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  const maxTop = document.documentElement.scrollHeight - window.innerHeight;

  animateScrollTo(Math.max(0, Math.min(top, maxTop)), 680);
}

function animateScrollTo(targetTop, duration) {
  cancelScrollAnimation();

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    window.scrollTo(0, startTop + distance * eased);

    if (progress < 1) {
      scrollAnimationFrame = requestAnimationFrame(step);
      return;
    }

    scrollAnimationFrame = null;
  }

  scrollAnimationFrame = requestAnimationFrame(step);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function cancelScrollAnimation() {
  if (!scrollAnimationFrame) {
    return;
  }

  cancelAnimationFrame(scrollAnimationFrame);
  scrollAnimationFrame = null;
}

function playVideo(video) {
  const playPromise = video.play();

  if (playPromise) {
    playPromise.catch(() => {});
  }
}
