const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const missingEnv = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "MAIL_FROM",
    "MAIL_TO",
  ].filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
    return jsonResponse(500, { error: "Server configuration error" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const website = normalize(body.website, 120);

  if (website) {
    return jsonResponse(200, { ok: true });
  }

  const name = normalize(body.name, 80);
  const contact = normalize(body.contact, 120);
  const message = normalize(body.message, 2000);

  if (!name || !contact || !message) {
    return jsonResponse(400, { error: "All fields are required" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: `Новая заявка PINKER от ${name}`,
    text: [
      "Новая заявка с сайта PINKER",
      "",
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      "",
      "Сообщение:",
      message,
    ].join("\n"),
    html: `
      <h2>Новая заявка с сайта PINKER</h2>
      <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
      <p><strong>Контакт:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Сообщение:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `,
  };

  if (contact.includes("@")) {
    mailOptions.replyTo = contact;
  }

  try {
    await transporter.sendMail(mailOptions);
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error("Contact form email error:", error);
    return jsonResponse(500, { error: "Email send failed" });
  }
};

function normalize(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: statusCode === 204 ? "" : JSON.stringify(body),
  };
}
