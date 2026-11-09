// Loaded by the buy page (pages/[locale]/unlock.astro). Starts a payment (api/checkout.js), and checks a code from
// the return link or the mail (api/redeem.js); a good code is kept in this browser as `access` ({ code, until }),
// which the head script (head-study.js) reads on every page.
(() => {
  const root = document.querySelector("[data-unlock]");
  if (!root) return;
  const { locale, on, texts } = JSON.parse(root.dataset.vars);
  const $ = (s) => root.querySelector(s);
  const status = $("[data-status]");
  const say = (text, kind = "") => {
    status.hidden = !text;
    status.textContent = text || "";
    status.dataset.kind = kind;
  };
  const date = (ms) => new Date(ms).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem("access") || "null");
    } catch {
      return null;
    }
  };
  const showDone = (text) => {
    say("");
    $("[data-done]").hidden = false;
    $("[data-done-text]").textContent = text;
    $("[data-offer]").hidden = true;
    $("[data-code-form]").hidden = true;
  };

  // A code from a link (…/unlock/?code=…), pasted whole or alone.
  const codeOf = (s) => {
    s = String(s || "").trim();
    try {
      const u = new URL(s);
      return u.searchParams.get("code") || "";
    } catch {
      return s;
    }
  };

  let tries = 0;
  async function redeem(code) {
    say(texts.checking);
    try {
      const r = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, { headers: { Accept: "application/json" } });
      const b = await r.json().catch(() => ({}));
      if (b.ok && Number.isFinite(b.until)) {
        try {
          localStorage.setItem("access", JSON.stringify({ code, until: b.until }));
        } catch {}
        document.documentElement.dataset.access = "";
        history.replaceState(null, "", location.pathname);
        return showDone(texts.done.replace("{date}", date(b.until)));
      }
      if (b.status === "pending") {
        if (++tries <= 10) {
          say(texts.pending);
          return setTimeout(() => redeem(code), 3000);
        }
        return say(texts.pendingLong, "warn");
      }
      say(texts[b.status] || texts.error, "warn");
    } catch (e) {
      window.__report?.(e, "unlock");
      say(texts.error, "warn");
    }
  }

  const fromLink = new URLSearchParams(location.search).get("code");
  const have = read();
  if (fromLink) redeem(fromLink);
  else if (have && Number.isFinite(have.until) && have.until > Date.now()) showDone(texts.already.replace("{date}", date(have.until)));

  $("[data-code-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = codeOf(e.target.code.value);
    if (code) {
      tries = 0;
      redeem(code);
    } else say(texts.invalid, "warn");
  });

  const buy = $("[data-buy-form]");
  if (!on || !buy) return;
  buy.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = buy.email.value.trim();
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) || !buy.consent.checked) return say(texts.missing, "warn");
    const button = buy.querySelector("button");
    button.disabled = true;
    say(texts.redirecting);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, consent: true }),
      });
      const b = await r.json().catch(() => ({}));
      if (b.ok && b.url) return void (location.href = b.url);
      say(texts.error, "warn");
    } catch (err) {
      window.__report?.(err, "checkout");
      say(texts.error, "warn");
    }
    button.disabled = false;
  });
})();
