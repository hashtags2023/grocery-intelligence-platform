/**
 * comments-widget.js
 */
(function () {
  const API_BASE = "https://smart-grocery-savings.vercel.app/api/comments";

  const STYLE = `
    .cw-wrap {
      max-width: 760px;
      margin: 48px auto 0;
      font-family: "Source Sans 3", sans-serif;
      color: #222;
    }
    .cw-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: "Playfair Display", serif;
      font-weight: 900;
      font-size: 1.5rem;
      color: #1b5e20;
      margin: 0 0 20px;
      border-bottom: 2px solid #e8f5e9;
      padding-bottom: 12px;
    }
    .cw-heading .cw-count {
      font-family: "Source Sans 3", sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      background: #2e7d32;
      color: #fff;
      padding: 2px 10px;
      border-radius: 999px;
    }
    .cw-form {
      background: #fafafa;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .cw-form-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .cw-form input,
    .cw-form textarea {
      width: 100%;
      font-family: inherit;
      font-size: 0.95rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px 12px;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .cw-form input:focus,
    .cw-form textarea:focus {
      outline: none;
      border-color: #2e7d32;
      box-shadow: 0 0 0 3px rgba(46,125,50,0.12);
    }
    .cw-form textarea { min-height: 90px; resize: vertical; }
    .cw-form-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .cw-char-count { font-size: 0.78rem; color: #999; }
    .cw-submit {
      background: #2e7d32;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    .cw-submit:hover:not(:disabled) { background: #1b5e20; }
    .cw-submit:active:not(:disabled) { transform: scale(0.98); }
    .cw-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .cw-error, .cw-notice {
      font-size: 0.85rem;
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .cw-error { background: #fce4ec; color: #c62828; }
    .cw-notice { background: #e8f5e9; color: #1b5e20; }
    .cw-list { display: flex; flex-direction: column; gap: 16px; }
    .cw-item {
      display: flex;
      gap: 14px;
      animation: cw-fade-in 0.25s ease;
    }
    @keyframes cw-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cw-avatar {
      flex: 0 0 auto;
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2e7d32, #66bb6a);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .cw-body {
      background: #fff;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 12px 16px;
      flex: 1;
    }
    .cw-item-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .cw-author { font-weight: 700; color: #1b5e20; font-size: 0.92rem; }
    .cw-time { font-size: 0.78rem; color: #999; }
    .cw-text { font-size: 0.94rem; line-height: 1.55; color: #333; white-space: pre-wrap; }
    .cw-empty, .cw-loading {
      color: #888;
      font-size: 0.92rem;
      text-align: center;
      padding: 24px 0;
    }
    .cw-honeypot { position: absolute; left: -9999px; opacity: 0; height: 0; }
    @media (max-width: 600px) {
      .cw-form-row { flex-direction: column; }
    }
  `;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function initials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("");
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  function renderComment(c) {
    return `
      <div class="cw-item">
        <div class="cw-avatar">${escapeHtml(initials(c.author_name))}</div>
        <div class="cw-body">
          <div class="cw-item-header">
            <span class="cw-author">${escapeHtml(c.author_name)}</span>
            <span class="cw-time">${timeAgo(c.created_at)}</span>
          </div>
          <div class="cw-text">${escapeHtml(c.body)}</div>
        </div>
      </div>
    `;
  }

  async function loadComments(slug, listEl, countEl) {
    listEl.innerHTML = '<div class="cw-loading">Loading comments…</div>';
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      countEl.textContent = data.count;
      if (data.comments.length === 0) {
        listEl.innerHTML =
          '<div class="cw-empty">No comments yet — be the first to share your thoughts!</div>';
      } else {
        listEl.innerHTML = data.comments.map(renderComment).join("");
      }
    } catch (err) {
      listEl.innerHTML =
        '<div class="cw-empty">Couldn\'t load comments right now. Please refresh the page.</div>';
    }
  }

  function mount(container) {
    const slug = container.dataset.postSlug;
    if (!slug) {
      console.error("comments-widget: missing data-post-slug attribute");
      return;
    }

    if (!document.getElementById("cw-styles")) {
      const styleTag = document.createElement("style");
      styleTag.id = "cw-styles";
      styleTag.textContent = STYLE;
      document.head.appendChild(styleTag);
    }

    container.innerHTML = `
      <div class="cw-wrap">
        <h3 class="cw-heading">💬 Comments <span class="cw-count" id="cw-count-${slug}">0</span></h3>
        <form class="cw-form" id="cw-form-${slug}">
          <div class="cw-form-row">
            <input type="text" name="author_name" placeholder="Your name" maxlength="80" required />
          </div>
          <textarea name="body" placeholder="Share your thoughts…" maxlength="2000" required></textarea>
          <!-- Honeypot: real users leave this blank -->
          <input type="text" name="website" class="cw-honeypot" tabindex="-1" autocomplete="off" />
          <div class="cw-form-footer">
            <span class="cw-char-count" id="cw-charcount-${slug}">0 / 2000</span>
            <button type="submit" class="cw-submit">Post Comment</button>
          </div>
          <div id="cw-msg-${slug}"></div>
        </form>
        <div class="cw-list" id="cw-list-${slug}"></div>
      </div>
    `;

    const listEl = document.getElementById(`cw-list-${slug}`);
    const countEl = document.getElementById(`cw-count-${slug}`);
    const formEl = document.getElementById(`cw-form-${slug}`);
    const msgEl = document.getElementById(`cw-msg-${slug}`);
    const textarea = formEl.querySelector("textarea");
    const charCount = document.getElementById(`cw-charcount-${slug}`);
    const submitBtn = formEl.querySelector(".cw-submit");

    textarea.addEventListener("input", () => {
      charCount.textContent = `${textarea.value.length} / 2000`;
    });

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      msgEl.innerHTML = "";
      const formData = new FormData(formEl);
      const payload = {
        author_name: formData.get("author_name"),
        body: formData.get("body"),
        website: formData.get("website"),
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Posting…";

      try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post comment");

        formEl.reset();
        charCount.textContent = "0 / 2000";
        msgEl.innerHTML =
          '<div class="cw-notice">Thanks! Your comment has been posted.</div>';
        loadComments(slug, listEl, countEl);
      } catch (err) {
        msgEl.innerHTML = `<div class="cw-error">${escapeHtml(err.message)}</div>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Post Comment";
      }
    });

    loadComments(slug, listEl, countEl);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[id="comments-root"]').forEach(mount);
  });
})();
