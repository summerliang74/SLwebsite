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
