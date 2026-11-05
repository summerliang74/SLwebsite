const calendar = document.querySelector(".calendar-scroll");
const tooltip = document.querySelector(".day-tip");
const days = [...calendar.querySelectorAll("[data-day]")];
let selected = days.length - 1;
const format = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
function show(day) {
  selected = days.indexOf(day);
  const count = Number(day.dataset.count);
  tooltip.textContent =
    count +
    (count === 1 ? " contribution on " : " contributions on ") +
    format.format(new Date(day.dataset.day));
  tooltip.hidden = false;
  const box = day.getBoundingClientRect();
  tooltip.style.left =
    Math.max(
      4,
      Math.min(
        innerWidth - tooltip.offsetWidth - 4,
        box.left + box.width / 2 - tooltip.offsetWidth / 2,
      ),
    ) + "px";
  tooltip.style.top = Math.max(4, box.top - tooltip.offsetHeight - 8) + "px";
}
function hide() {
  tooltip.hidden = true;
}
calendar.addEventListener("pointerover", (e) => (e.target.dataset.day ? show(e.target) : hide()));
calendar.addEventListener("click", (e) => {
  if (e.target.dataset.day) show(e.target);
});
calendar.addEventListener("pointerleave", hide);
calendar.addEventListener("blur", hide);
window.addEventListener("scroll", hide, true);
calendar.addEventListener("keydown", (e) => {
  if (e.key === "Escape") return hide();
  if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const day =
    days[Math.max(0, Math.min(days.length - 1, selected + (e.key === "ArrowRight" ? 1 : -1)))];
  day.scrollIntoView({ block: "nearest", inline: "nearest" });
  show(day);
});

async function refreshContributions(source = "assets/contributions.json", live = false) {
  const caption = document.querySelector(".activity-plate figcaption > span");
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  caption.append(status);
  try {
    const response = await fetch(source, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Contribution request failed");
    const { contributions } = await response.json();
    if (!Array.isArray(contributions) || !contributions.length) throw new Error("Empty calendar");
    const entries = contributions.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (entries.some(d => !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isFinite(Date.parse(d.date)) || !Number.isInteger(d.count) || d.count < 0 || !Number.isInteger(d.level) || d.level < 0 || d.level > 4)) throw new Error("Invalid calendar");
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    const start = new Date(entries[0].date);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const colors = ["#f8f8f8", "#e3e3e5", "#c6c6cb", "#aaaab2", "#8e8e99"];
    let previousMonth = "";
    let total = 0;
    let lastColumn = 0;
    for (const entry of entries) {
      const date = new Date(entry.date);
      const column = Math.floor((date - start) / 86400000 / 7);
      lastColumn = Math.max(lastColumn, column);
      const month = entry.date.slice(0, 7);
      if (month !== previousMonth && (date.getUTCDate() <= 7 || !previousMonth)) {
        const label = document.createElementNS(ns, "text");
        label.setAttribute("x", column * 21 + 8);
        label.setAttribute("y", 23);
        label.textContent = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
        svg.append(label);
        previousMonth = month;
      }
      const rect = document.createElementNS(ns, "rect");
      for (const [key, value] of Object.entries({ x: column * 21, y: 39 + date.getUTCDay() * 21, width: 18, height: 18, fill: colors[entry.level], "data-day": entry.date, "data-count": entry.count })) rect.setAttribute(key, value);
      svg.append(rect);
      total += entry.count;
    }
    svg.setAttribute("viewBox", `0 0 ${Math.max(1113, (lastColumn + 1) * 21 + 40)} 186`);
    svg.setAttribute("font-family", "Arial,sans-serif");
    svg.setAttribute("font-size", "21");
    svg.setAttribute("fill", "#73737f");
    hide();
    calendar.replaceChildren(svg);
    days.splice(0, days.length, ...svg.querySelectorAll("[data-day]"));
    selected = days.length - 1;
    const number = document.createElement("span");
    number.className = "figure-number";
    number.textContent = "Fig. 1.";
    const link = document.createElement("a");
    link.href = "https://github.com/summerliang74";
    link.textContent = "GitHub";
    caption.replaceChildren(number, ` ${total} contributions, ${format.format(new Date(entries[0].date))} – ${format.format(new Date(entries.at(-1).date))}. Source: `, link, ". Updated automatically.");
  } catch (error) {
    status.textContent = live ? " Live update unavailable; showing saved data." : " Loading latest contributions…";
  }
  if (!live) await refreshContributions("https://github-contributions-api.jogruber.de/v4/summerliang74?y=last", true);
}
refreshContributions();
