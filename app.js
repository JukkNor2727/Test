const STORAGE_KEY = "driveDataWebsite.scriptUrl";

const state = {
  scriptUrl: localStorage.getItem(STORAGE_KEY) || "",
  records: [],
  filteredRecords: []
};

const elements = {
  configForm: document.querySelector("#configForm"),
  scriptUrl: document.querySelector("#scriptUrl"),
  recordForm: document.querySelector("#recordForm"),
  recordsList: document.querySelector("#recordsList"),
  searchInput: document.querySelector("#searchInput"),
  refreshBtn: document.querySelector("#refreshBtn"),
  connectionStatus: document.querySelector("#connectionStatus"),
  connectionHint: document.querySelector("#connectionHint"),
  totalRecords: document.querySelector("#totalRecords"),
  totalCategories: document.querySelector("#totalCategories"),
  lastUpdated: document.querySelector("#lastUpdated"),
  formMessage: document.querySelector("#formMessage")
};

function init() {
  elements.scriptUrl.value = state.scriptUrl;
  updateConnectionStatus();
  bindEvents();
  loadRecords();
}

function bindEvents() {
  elements.configForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = elements.scriptUrl.value.trim();
    if (!url) return;
    state.scriptUrl = url;
    localStorage.setItem(STORAGE_KEY, url);
    updateConnectionStatus();
    loadRecords();
  });

  elements.recordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await addRecord(new FormData(elements.recordForm));
  });

  elements.refreshBtn.addEventListener("click", loadRecords);

  elements.searchInput.addEventListener("input", () => {
    const keyword = elements.searchInput.value.trim().toLowerCase();
    state.filteredRecords = state.records.filter((record) => {
      return [record.title, record.category, record.owner, record.status, record.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
    renderRecords();
  });
}

function updateConnectionStatus() {
  if (state.scriptUrl) {
    elements.connectionStatus.textContent = "เชื่อมต่อพร้อมใช้งาน";
    elements.connectionHint.textContent = "ระบบจะอ่าน–เขียนข้อมูลผ่าน Apps Script URL ที่ตั้งไว้";
  } else {
    elements.connectionStatus.textContent = "ยังไม่ได้ตั้งค่า";
    elements.connectionHint.textContent = "เพิ่ม Apps Script Web App URL เพื่อเชื่อม Google Drive";
  }
}

async function addRecord(formData) {
  if (!state.scriptUrl) {
    showMessage("กรุณาตั้งค่า Apps Script Web App URL ก่อน", true);
    return;
  }

  const payload = new URLSearchParams();
  payload.set("action", "create");
  payload.set("title", formData.get("title") || "");
  payload.set("category", formData.get("category") || "");
  payload.set("owner", formData.get("owner") || "");
  payload.set("status", formData.get("status") || "ใหม่");
  payload.set("description", formData.get("description") || "");

  showMessage("กำลังบันทึกข้อมูล...");

  try {
    // Apps Script Web App มักติด CORS เมื่อต้องการอ่าน response จาก browser
    // จึงใช้ no-cors สำหรับการเขียนข้อมูล และโหลดรายการใหม่หลังบันทึก
    await fetch(state.scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: payload.toString()
    });

    elements.recordForm.reset();
    showMessage("ส่งข้อมูลไปยัง Google Drive แล้ว กำลังโหลดข้อมูลใหม่...");
    setTimeout(loadRecords, 1500);
  } catch (error) {
    showMessage(`บันทึกไม่สำเร็จ: ${error.message}`, true);
  }
}

function loadRecords() {
  if (!state.scriptUrl) {
    state.records = getDemoRecords();
    state.filteredRecords = state.records;
    renderRecords();
    updateStats();
    return;
  }

  showLoading();
  jsonp(`${state.scriptUrl}?action=list`)
    .then((data) => {
      state.records = Array.isArray(data.records) ? data.records : [];
      state.filteredRecords = state.records;
      renderRecords();
      updateStats();
    })
    .catch((error) => {
      elements.recordsList.innerHTML = `
        <div class="empty-state">
          โหลดข้อมูลไม่สำเร็จ<br />
          <small>${escapeHtml(error.message)}</small>
        </div>
      `;
    });
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `driveDataCallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("หมดเวลารอข้อมูลจาก Apps Script"));
    }, 12000);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("เชื่อมต่อ Apps Script ไม่สำเร็จ"));
    };

    script.src = `${url}${separator}callback=${callbackName}`;
    document.body.appendChild(script);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
  });
}

function renderRecords() {
  if (!state.filteredRecords.length) {
    elements.recordsList.innerHTML = `
      <div class="empty-state">
        ยังไม่มีข้อมูลที่แสดง<br />
        <small>ลองเพิ่มข้อมูลใหม่ หรือแก้คำค้นหา</small>
      </div>
    `;
    return;
  }

  elements.recordsList.innerHTML = state.filteredRecords.map((record) => {
    const createdDate = formatDate(record.createdAt);
    return `
      <article class="record-card">
        <h3>${escapeHtml(record.title || "ไม่มีชื่อ")}</h3>
        <p>${escapeHtml(record.description || "-")}</p>
        <div class="meta-row">
          <span class="badge">${escapeHtml(record.category || "ไม่ระบุหมวด")}</span>
          <span class="badge">${escapeHtml(record.status || "-")}</span>
          <span class="badge">ผู้รับผิดชอบ: ${escapeHtml(record.owner || "-")}</span>
          <span class="badge">${createdDate}</span>
        </div>
      </article>
    `;
  }).join("");
}

function updateStats() {
  const categories = new Set(state.records.map((record) => record.category).filter(Boolean));
  const latest = state.records
    .map((record) => record.updatedAt || record.createdAt)
    .filter(Boolean)
    .sort()
    .pop();

  elements.totalRecords.textContent = state.records.length.toLocaleString("th-TH");
  elements.totalCategories.textContent = categories.size.toLocaleString("th-TH");
  elements.lastUpdated.textContent = latest ? formatDate(latest) : "-";
}

function showLoading() {
  elements.recordsList.innerHTML = `<div class="empty-state">กำลังโหลดข้อมูล...</div>`;
}

function showMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.style.color = isError ? "#b42318" : "#1d4ed8";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDemoRecords() {
  return [
    {
      id: "demo-1",
      title: "ตัวอย่างข้อมูลจากหน้าเว็บ",
      category: "Demo",
      owner: "Admin",
      status: "ใหม่",
      description: "รายการนี้เป็นข้อมูลตัวอย่าง เมื่อใส่ Apps Script URL แล้วระบบจะโหลดข้อมูลจริงจาก Google Drive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

init();
