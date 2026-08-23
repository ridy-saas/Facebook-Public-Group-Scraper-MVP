const form = document.querySelector("#group-form");
const groupUrlInput = document.querySelector("#group-url");
const keywordInput = document.querySelector("#keyword");
const daysInput = document.querySelector("#days");
const maxPostsInput = document.querySelector("#max-posts");
const cookiesFileInput = document.querySelector("#cookies-file");
const noProxyInput = document.querySelector("#no-proxy");
const analyzerInput = document.querySelector("#analyzer");
const normalizedTarget = document.querySelector("#normalized-target");
const commandPreview = document.querySelector("#command-preview");
const statusBadge = document.querySelector("#status-badge");
const formError = document.querySelector("#form-error");
const copyButton = document.querySelector("#copy-command");
const copyStatus = document.querySelector("#copy-status");

function normalizeGroupUrl(value) {
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase();
    const match = parsed.pathname.match(/^\/groups\/([^/]+)(?:\/|$)/i);
    if (!/^facebook\.com$|^www\.facebook\.com$|^m\.facebook\.com$/.test(host) || !match) {
      return null;
    }

    return `https://www.facebook.com/groups/${match[1]}/`;
  } catch {
    return null;
  }
}

function shellQuote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function setError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function updateSummary({ target, keyword, days, maxPosts }) {
  normalizedTarget.textContent = target;
  document.querySelector("#summary-keyword").textContent = keyword || "未設定";
  document.querySelector("#summary-days").textContent = `近 ${days} 天`;
  document.querySelector("#summary-posts").textContent = `${maxPosts} 筆`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  setError("");
  copyStatus.textContent = "";

  const target = normalizeGroupUrl(groupUrlInput.value);
  const days = Number(daysInput.value);
  const maxPosts = Number(maxPostsInput.value);
  const keyword = keywordInput.value.trim();
  const cookiesFile = cookiesFileInput.value.trim();

  if (!target) {
    setError("請輸入有效的 Facebook 公開社團網址。格式例如 https://www.facebook.com/groups/440543412776310/");
    groupUrlInput.focus();
    return;
  }
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    setError("近幾天必須是 1 到 365 之間的整數。");
    daysInput.focus();
    return;
  }
  if (!Number.isInteger(maxPosts) || maxPosts < 1 || maxPosts > 5000) {
    setError("最多貼文數必須是 1 到 5000 之間的整數。");
    maxPostsInput.focus();
    return;
  }

  const commandParts = ["npm run start:no-proxy --", "--url", shellQuote(target), "--max-posts", String(maxPosts)];
  if (!noProxyInput.checked) {
    commandParts[0] = "npm run start:proxy --";
  }
  if (cookiesFile) commandParts.push("--cookies-file", shellQuote(cookiesFile));
  if (analyzerInput.checked) {
    commandParts.push("&&", "npm run analyze:xlsx --", "--group-url", shellQuote(target));
  }

  updateSummary({ target, keyword, days, maxPosts });
  commandPreview.value = commandParts.join(" ");
  statusBadge.textContent = "設定完成";
  statusBadge.classList.add("ready");
  copyButton.disabled = false;
});

copyButton.addEventListener("click", async () => {
  if (!commandPreview.value) return;

  try {
    await navigator.clipboard.writeText(commandPreview.value);
    copyStatus.textContent = "命令已複製。";
  } catch {
    commandPreview.select();
    copyStatus.textContent = "瀏覽器未允許自動複製，已選取命令文字。";
  }
});
