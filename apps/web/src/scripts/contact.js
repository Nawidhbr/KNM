// The contact form: sends to /api/contact; if the site cannot send (no mail service set up, or offline),
// the reader's own mail program opens with the same message filled in.
(() => {
  const form = document.querySelector("[data-contact]");
  if (!form) return;
  const opened = Date.now();
  const el = (k) => form.elements.namedItem(k);
  const texts = JSON.parse(form.dataset.texts);
  const status = form.querySelector(".contact-status");
  const send = form.querySelector("[data-send]");
  const label = send.textContent;
  const q = new URLSearchParams(location.search);
  if (q.get("topic") && el("topic").querySelector(`option[value="${CSS.escape(q.get("topic"))}"]`)) el("topic").value = q.get("topic");
  if (q.get("page")) el("page").value = q.get("page").slice(0, 300);

  const say = (msg) => { status.textContent = msg; status.hidden = !msg; };
  const mailto = (f) => {
    const topic = el("topic").selectedOptions[0]?.textContent ?? f.topic;
    const body = [f.message, "", `— ${f.name}`, f.page && `(${f.page})`].filter((x) => x !== undefined && x !== "").join("\n");
    location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(`[${form.dataset.site}] ${topic}`)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(["name", "email", "topic", "page", "message", "website"].map((k) => [k, el(k).value.trim()]));
    if (!f.name || !el("email").checkValidity() || !f.email || f.message.length < 5) {
      say(texts.invalid);
      (!f.name ? el("name") : !f.email || !el("email").checkValidity() ? el("email") : el("message")).focus();
      return;
    }
    say("");
    send.disabled = true;
    send.textContent = send.dataset.sending;
    try {
      const r = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, t: opened, locale: form.dataset.locale }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        form.querySelectorAll(".field, .contact-actions, h2").forEach((x) => (x.hidden = true));
        form.querySelector("[data-sent]").hidden = false;
        return;
      }
      if (r.status === 400) { say(texts.invalid); return; }
      throw new Error(String(r.status));
    } catch {
      say(texts.failed);
      mailto(f);
    } finally {
      send.disabled = false;
      send.textContent = label;
    }
  });
})();
