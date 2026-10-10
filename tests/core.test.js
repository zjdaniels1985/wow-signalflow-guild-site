const test = require("node:test");
const assert = require("node:assert/strict");
const { routes, resolveRoute, escapeHtml, safeUrl, searchRoster, validDate, eventDates, createCalendar } = require("../core.js");
const data = require("../data.js");

test("exact division routes and safe unknown-route fallback", () => {
  assert.deepEqual(Object.keys(data.versions), ["retail", "classic", "forever", "tbc"]);
  for (const route of routes) assert.equal(resolveRoute(`#${route}`), route);
  assert.equal(resolveRoute("#TBC"), "tbc");
  for (const hash of ["", "#unknown", "#constructor", "#__proto__", "#%retail", "#<script>"]) {
    assert.equal(resolveRoute(hash), "retail");
  }
});

test("HTML escaping covers text and quoted attributes", () => {
  assert.equal(escapeHtml(`<img src="x" onerror='bad()'>&`), "&lt;img src=&quot;x&quot; onerror=&#39;bad()&#39;&gt;&amp;");
  assert.equal(escapeHtml(null), "");
});

test("only absolute HTTP(S) external URLs without credentials are accepted", () => {
  assert.equal(safeUrl("https://example.com/apply?a=1&b=2"), "https://example.com/apply?a=1&b=2");
  assert.equal(safeUrl("http://example.com"), "http://example.com/");
  for (const value of ["javascript:alert(1)", "data:text/html,bad", "//example.com", "/apply", "", undefined]) {
    assert.equal(safeUrl(value), "");
  }
  const withCredentials = new URL("https://example.com");
  withCredentials.username = "test-user";
  assert.equal(safeUrl(withCredentials.href), "");
});

test("roster searches character, class, role, rank, and leadership", () => {
  const roster = [
    { name: "Test Warrior", class: "Warrior", role: "Tank", rank: "Officer", leadership: true },
    { name: "Test Mage", class: "Mage", role: "Damage", rank: "Member", leadership: false }
  ];
  for (const query of [" warrior ", "TANK", "officer", "leadership"]) assert.deepEqual(searchRoster(roster, query), [roster[0]]);
  assert.equal(searchRoster(roster, "").length, 2);
  assert.deepEqual(searchRoster(roster, "not present"), []);
  assert.deepEqual(searchRoster([], "mage"), []);
  assert.equal(searchRoster([{}], "").length, 1);
});

test("shipped content contains no unverified guild identities, dates, or social links", () => {
  for (const v of Object.values(data.versions)) {
    assert.equal(v.events.length + v.roster.length + v.officers.length + v.messages.length, 0);
    assert.ok(Object.values(v.info).every(value => value === ""));
    assert.equal(v.recruitment.applicationUrl, "");
    assert.equal(v.progression.summary, "");
    assert.equal(v.loot.standings.length, 0);
  }
  assert.match(data.community.rulesStatus, /Draft/);
});

test("valid dates reject overflow and malformed values", () => {
  assert.equal(validDate("2024-02-29").toISOString(), "2024-02-29T00:00:00.000Z");
  for (const date of ["0000-01-01", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "26-01-01", "2026-1-1", "2026-10-10junk"]) {
    assert.throws(() => validDate(date));
  }
});

test("date-only events export as all-day with exclusive end, including year boundaries", () => {
  const output = createCalendar([{ id: "test-all-day", date: "2026-12-31", title: "TEST ONLY" }], "classic");
  assert.match(output, /DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101/);
  assert.doesNotMatch(output, /DTSTART:\d+T/);
  const multiDay = createCalendar([{ id: "test", date: "2026-10-10", endDate: "2026-10-13" }], "forever");
  assert.match(multiDay, /DTEND;VALUE=DATE:20261013/);
  assert.throws(() => eventDates({ date: "2026-10-10", endDate: "2026-10-09" }));
  assert.throws(() => eventDates({ date: "9999-12-31" }));
});

test("timed events preserve instants across timezone offsets and DST", () => {
  const output = createCalendar([{
    id: "test-dst", title: "TEST ONLY",
    start: "2026-11-01T01:30:00-04:00", end: "2026-11-01T01:30:00-05:00"
  }], "retail");
  assert.match(output, /DTSTART:20261101T053000Z/);
  assert.match(output, /DTEND:20261101T063000Z/);
  const plus = eventDates({ start: "2026-10-10T00:00:00+05:30", end: "2026-10-10T01:00:00+05:30" });
  assert.equal(plus.start.toISOString(), "2026-10-09T18:30:00.000Z");
});

test("timed event validation rejects missing offsets, impossible dates/times, mixed types, and reversed intervals", () => {
  const end = "2026-10-11T02:00:00Z";
  for (const start of ["2026-10-10T20:00:00", "2026-10-10", "2026-02-30T20:00:00Z", "2026-10-10T24:00:00Z", "2026-10-10T20:60:00Z", "2026-10-10T20:00:60Z", "2026-10-10T20:00:00+25:00", "2026-10-10T20:00:00+01:60"]) {
    assert.throws(() => eventDates({ start, end }));
  }
  assert.throws(() => eventDates({ start: end, end }));
  assert.throws(() => eventDates({ date: "2026-10-10", start: end, end }));
  assert.throws(() => eventDates({ start: "2026-10-10T20:00:00Z", end, endDate: "2026-10-11" }));
  assert.throws(() => eventDates({}));
  assert.throws(() => eventDates({ start: "0001-01-01T00:00:00+01:00", end: "0001-01-01T01:00:00Z" }));
  assert.throws(() => eventDates({ start: "9999-12-31T22:00:00Z", end: "9999-12-31T23:00:00-01:00" }));
});

test("calendar text is escaped, IDs stable and distinct between divisions, and CRLF content cannot inject fields", () => {
  const event = { id: "test", date: "2026-10-10", title: "Test, raid; path\\x\nNew line", description: "text\r\nEND:VEVENT", location: "Hall; test" };
  const output = createCalendar([event], "tbc");
  assert.match(output, /SUMMARY:Test\\, raid\\; path\\\\x\\nNew line\r\n/);
  assert.match(output, /DESCRIPTION:text\\nEND:VEVENT\r\n/);
  assert.match(output, /LOCATION:Hall\\; test/);
  assert.equal(output, createCalendar([event], "tbc"));
  assert.notEqual(output, createCalendar([event], "retail"));
  assert.match(output, /UID:tbc-test@signal-flow.invalid/);
  assert.equal(output.split("\r\n").filter(line => line === "END:VEVENT").length, 1);
  assert.ok(output.endsWith("END:VCALENDAR\r\n"));
  assert.throws(() => createCalendar([event, event], "tbc"));
  assert.throws(() => createCalendar([{ ...event, id: "bad\r\nid" }], "tbc"));
  assert.throws(() => createCalendar([{ ...event, id: undefined }], "tbc"));
  assert.throws(() => createCalendar([event], "community"));
});

test("calendar folds by UTF-8 octets without splitting Unicode characters", () => {
  const title = "Épée ⚔️ ".repeat(40);
  const output = createCalendar([{ id: "unicode", title, date: "2026-10-10" }], "retail");
  for (const line of output.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.ok(output.includes("\r\n "));
  assert.ok(output.replace(/\r\n /g, "").includes(`SUMMARY:${title}`));
  assert.doesNotMatch(output, /\uFFFD/);
});
