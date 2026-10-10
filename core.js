(function (root) {
  "use strict";
  const routes = ["retail", "classic", "forever", "tbc", "community"];
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
    } catch {
      return "";
    }
  }

  function resolveRoute(hash) {
    const key = String(hash).replace(/^#/, "").toLowerCase();
    return routes.includes(key) ? key : "retail";
  }

  function searchRoster(members, query) {
    const term = String(query).trim().toLowerCase();
    return members.filter(member => [member.name, member.class, member.role, member.rank,
      member.leadership ? "leadership" : ""].some(value => String(value ?? "").toLowerCase().includes(term)));
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) throw new Error("Use a valid YYYY-MM-DD date with a year from 0001 to 9999.");
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Invalid calendar date.");
    return date;
  }

  function timedInstant(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) {
      throw new Error("Timed events need an explicit ISO timezone offset or Z, including seconds.");
    }
    validDate(value.slice(0, 10));
    const [hour, minute, second] = value.slice(11, 19).split(":").map(Number);
    if (hour > 23 || minute > 59 || second > 59) throw new Error("Invalid event time.");
    if (!value.endsWith("Z")) {
      const [offsetHour, offsetMinute] = value.slice(-5).split(":").map(Number);
      if (offsetHour > 23 || offsetMinute > 59) throw new Error("Invalid timezone offset.");
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error("Invalid event instant.");
    if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) throw new Error("Event instant is outside the calendar year range.");
    return date;
  }

  function eventDates(event) {
    if (event.date) {
      if (event.start || event.end) throw new Error("Choose date-only or timed event data, not both.");
      const start = validDate(event.date);
      const end = event.endDate ? validDate(event.endDate) : new Date(start.getTime() + 86400000);
      if (end <= start) throw new Error("Event end must follow start.");
      if (end.getUTCFullYear() > 9999) throw new Error("Event end is outside the calendar year range.");
      return { allDay: true, start, end };
    }
    if (event.endDate) throw new Error("endDate is only for all-day events.");
    const start = timedInstant(event.start);
    const end = timedInstant(event.end);
    if (end <= start) throw new Error("Event end must follow start.");
    return { allDay: false, start, end };
  }

  const escapeCalendar = value => String(value ?? "").replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

  function foldLine(line) {
    const encoder = new TextEncoder();
    let result = "", length = 0;
    for (const character of line) {
      const bytes = encoder.encode(character).length;
      if (length + bytes > 75) {
        result += "\r\n ";
        length = 1;
      }
      result += character;
      length += bytes;
    }
    return result;
  }

  const calendarDate = date => date.toISOString().slice(0, 10).replace(/-/g, "");
  const calendarInstant = date => date.toISOString().replace(/[-:]/g, "").replace(".000", "");

  function createCalendar(events, division) {
    if (!routes.slice(0, 4).includes(division)) throw new Error("Unknown calendar division.");
    const ids = new Set();
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Signal Flow//Guild Calendar//EN", "CALSCALE:GREGORIAN"];
    for (const event of events) {
      if (typeof event.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(event.id) || ids.has(event.id)) {
        throw new Error("Events need unique, stable IDs using letters, numbers, underscores, or hyphens.");
      }
      ids.add(event.id);
      const dates = eventDates(event);
      lines.push("BEGIN:VEVENT", `UID:${division}-${event.id}@signal-flow.invalid`, "DTSTAMP:19700101T000000Z");
      if (dates.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${calendarDate(dates.start)}`, `DTEND;VALUE=DATE:${calendarDate(dates.end)}`);
      } else {
        lines.push(`DTSTART:${calendarInstant(dates.start)}`, `DTEND:${calendarInstant(dates.end)}`);
      }
      lines.push(`SUMMARY:${escapeCalendar(event.title)}`, `DESCRIPTION:${escapeCalendar(event.description)}`,
        `LOCATION:${escapeCalendar(event.location)}`, "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  const api = { routes, escapeHtml, safeUrl, resolveRoute, searchRoster, validDate, eventDates, createCalendar };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SignalFlowCore = api;
})(globalThis);
