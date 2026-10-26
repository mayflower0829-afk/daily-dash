/* 每日 Dash · DailyDash — 大学生的睁眼第一页
   数据：自部署 60s API（vikiboss/60s，MIT）+ Open-Meteo（免费无密钥天气）
   倒计时目标日期存于 localStorage。 */

const API = "https://daily-api-335904-13-1501559031.sh.run.tcloudbase.com";
const CD_KEY = "dailyDash.examDate";
const CITY_KEY = "dailyDash.city";
const DEFAULT_EXAM = "2027-12-25";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

function toast(m) {
  const t = $("toast");
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// ---------- 倒计时 ----------
function examDate() {
  return localStorage.getItem(CD_KEY) || DEFAULT_EXAM;
}
function renderCountdown() {
  const target = new Date(examDate() + "T00:00:00");
  const now = new Date(todayStr() + "T00:00:00");
  const days = Math.round((target - now) / 86400000);
  $("cdNum").textContent = days >= 0 ? days : "已开考";
}
function todayStr() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---------- 60s 新闻 ----------
async function loadNews() {
  try {
    const d = (await getJSON(`${API}/v2/60s`)).data;
    $("dateLine").textContent = `${d.date} ${d.day_of_week || ""} · 农历 ${d.lunar_date || "—"}`;
    const news = (d.news || []).filter((n) => !/公众号|二维码|TheEnd/i.test(n));
    $("newsList").innerHTML = news.map((n) => `<li>${esc(n)}</li>`).join("");
    $("newsTip").textContent = d.tip || "";
    if (d.image) {
      $("newsImageLink").href = d.image;
      $("newsImageLink").style.display = "";
    } else {
      $("newsImageLink").style.display = "none";
    }
  } catch (e) {
    $("newsList").innerHTML = '<li class="loading">加载失败，下拉重试</li>';
  }
}

// ---------- 热榜 ----------
const HOT_SOURCES = {
  weibo: { label: "微博", url: `${API}/v2/weibo` },
  zhihu: { label: "知乎", url: `${API}/v2/zhihu` },
  bili: { label: "B站", url: `${API}/v2/bili` },
  douyin: { label: "抖音", url: `${API}/v2/douyin` },
  toutiao: { label: "头条", url: `${API}/v2/toutiao` },
};
let hotCur = "weibo";
async function loadHot(source) {
  hotCur = source;
  document.querySelectorAll("#hotChips button").forEach((b) => b.classList.toggle("active", b.dataset.src === source));
  const list = $("hotList");
  list.innerHTML = '<li class="loading">加载中…</li>';
  try {
    const data = (await getJSON(HOT_SOURCES[source].url)).data;
    list.innerHTML = data.slice(0, 20).map((item, i) => {
      const title = item.title || item.name || "—";
      const link = item.link || item.url || item.mobileUrl || "#";
      const meta = item.hot_value ? `${Number(item.hot_value).toLocaleString()} 热` : (item.score ? `${item.score}` : "");
      return `<li><a href="${esc(link)}" target="_blank" rel="noopener">
        <span class="hot-rank ${i < 3 ? "top" : ""}">${i + 1}</span>
        <span class="hot-title">${esc(title)}</span>
        ${meta ? `<span class="hot-meta">${esc(meta)}</span>` : ""}
      </a></li>`;
    }).join("");
  } catch (e) {
    list.innerHTML = '<li class="loading">加载失败</li>';
  }
}

// ---------- 天气（Open-Meteo：geocoding + forecast） ----------
async function loadWeather(city) {
  const body = $("weatherBody");
  body.innerHTML = '<p class="loading">加载中…</p>';
  try {
    const geo = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
    const loc = (geo.results || [])[0];
    if (!loc) { body.innerHTML = '<p class="loading">未找到该城市</p>'; return; }
    const w = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=4`);
    const cw = w.current_weather;
    const codeText = weatherText(cw.weathercode);
    const WMO = { 0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️", 45: "🌫", 48: "🌫", 51: "🌦", 53: "🌦", 55: "🌦", 61: "🌧", 63: "🌧", 65: "🌧", 71: "🌨", 73: "🌨", 75: "❄️", 80: "🌦", 81: "🌧", 82: "🌧", 95: "⛈", 96: "⛈", 99: "⛈" };
    const icon = WMO[cw.weathercode] || "🌡";
    const days = w.daily.time.map((t, i) => ({
      t, max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i], code: w.daily.weathercode[i],
    }));
    body.innerHTML = `
      <div class="weather-now">
        <span class="temp">${Math.round(cw.temperature)}°C</span>
        <span class="cond">${icon} ${codeText}<br>${esc(loc.name)} · 风 ${cw.windspeed} km/h</span>
      </div>
      <div class="weather-cards">${days.slice(1, 4).map((d) => `
        <div class="w-card"><span>${d.t.slice(5)}</span><b>${Math.round(d.max)}°/${Math.round(d.min)}°</b><span>${weatherText(d.code)}</span></div>`).join("")}
      </div>`;
    localStorage.setItem(CITY_KEY, city);
  } catch (e) {
    body.innerHTML = '<p class="loading">天气加载失败</p>';
  }
}
function weatherText(code) {
  const m = { 0: "晴", 1: "基本晴", 2: "多云", 3: "阴", 45: "雾", 48: "雾凇", 51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨", 71: "小雪", 73: "中雪", 75: "大雪", 80: "阵雨", 81: "阵雨", 82: "强阵雨", 95: "雷雨", 96: "雷雨冰雹", 99: "雷雨冰雹" };
  return m[code] || "—";
}

// ---------- 初始化 ----------
function init() {
  renderCountdown();
  loadNews();
  // 热榜 chips
  const chips = $("hotChips");
  chips.innerHTML = Object.entries(HOT_SOURCES).map(([k, v]) =>
    `<button data-src="${k}" class="${k === hotCur ? "active" : ""}">${v.label}</button>`).join("");
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-src]");
    if (b) loadHot(b.dataset.src);
  });
  loadHot(hotCur);
  // 天气
  const savedCity = localStorage.getItem(CITY_KEY) || "蚌埠";
  $("cityInput").value = savedCity;
  loadWeather(savedCity);
  $("cityForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = $("cityInput").value.trim();
    if (c) loadWeather(c);
  });
  // 倒计时弹层
  const dlg = $("cdDialog");
  $("cdBox").addEventListener("click", () => {
    $("cdDateInput").value = examDate();
    dlg.showModal();
  });
  $("cdSave").addEventListener("click", () => {
    const v = $("cdDateInput").value;
    if (v) { localStorage.setItem(CD_KEY, v); renderCountdown(); toast("目标日期已保存：" + v); }
  });
}

init();
