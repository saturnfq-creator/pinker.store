const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const form = document.querySelector(".contact-form");
const formNote = document.querySelector(".form-note");
const submitButton = form.querySelector('button[type="submit"]');
const contactInput = form.elements.contact;

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

contactInput.addEventListener("input", () => {
  contactInput.value = formatPhoneInput(contactInput.value);
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
