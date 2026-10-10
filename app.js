(function () {
  "use strict";
  const { guild, versions, community } = SignalFlowData;
  const { escapeHtml: esc, safeUrl, resolveRoute, searchRoster, validDate, eventDates, createCalendar } = SignalFlowCore;
  const main = document.getElementById("main");
  const nav = document.getElementById("version-nav");
  const toggle = document.querySelector(".menu-toggle");
  const fallback = "assets/fallback-emblem.svg";
  document.querySelectorAll("[data-guild-name]").forEach(element => { element.textContent = guild.name; });
  document.querySelector(".brand").setAttribute("aria-label", `${guild.name} home`);
  let tabard = fallback;
  let originalLoaded = false;
  let currentRoute;
  const image = new Image();
  image.onload = () => {
    originalLoaded = true;
    tabard = image.src;
    document.querySelectorAll("[data-tabard]").forEach(element => { element.src = tabard; });
    document.querySelectorAll(".emblem-note").forEach(element => { element.textContent = "Guild tabard"; });
  };
  // Only a local asset path is accepted for the guild image.
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(guild.tabard) && !guild.tabard.includes("..")) image.src = guild.tabard;

  const empty = text => `<p class="empty">${esc(text)}</p>`;
  const field = value => esc(value || "Not configured");
  const link = (url, label, prominent = false) => {
    const safe = safeUrl(url);
    return safe ? `<a class="${prominent ? "button" : "external"}" href="${esc(safe)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`
      : `<span class="unconfigured">${esc(label)} — not configured</span>`;
  };
  const card = (title, content, id = "") => `<section class="card"${id ? ` id="${id}"` : ""}><h2>${esc(title)}</h2>${content}</section>`;
  const infoList = entries => `<dl class="info-list">${entries.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${field(value)}</dd></div>`).join("")}</dl>`;
  const list = (items, renderItem, message) => items.length ? `<ul class="item-list">${items.map(item => `<li>${renderItem(item)}</li>`).join("")}</ul>` : empty(message);

  function displayDate(value) {
    try { validDate(value); return value; } catch { return "Date not configured"; }
  }

  function hero(key, title, tagline) {
    return `<section class="hero">
      <div class="hero-copy"><p class="eyebrow">ONE COMMUNITY · FOUR DIVISIONS</p>
        <p class="division-label">${esc(key === "community" ? "The guild hall" : `${versions[key].label} division`)}</p>
        <h1>${esc(title)}</h1><p class="tagline">${esc(tagline)}</p>
        <div class="hero-actions">${key === "community" ? '<a class="button" href="#retail">Explore the divisions <span aria-hidden="true">→</span></a>' : '<a class="button" href="#recruitment" data-section="recruitment">Join the adventure <span aria-hidden="true">→</span></a>'}
        ${link(guild.discordUrl, "Community Discord")}</div>
        <p class="setup-note">Guild details await leadership verification. No recruitment, realm, or progression claims are implied.</p>
      </div>
      <figure class="hero-emblem"><div class="emblem-frame"><img data-tabard src="${esc(tabard)}" alt="${esc(guild.name)} emblem"></div><figcaption class="emblem-note">${originalLoaded ? "Guild tabard" : "Placeholder emblem · original tabard not supplied"}</figcaption></figure>
    </section>`;
  }

  function rosterRows(members) {
    return members.map(member => `<tr><th scope="row">${esc(member.name)}</th><td>${field(member.class)}</td><td>${field(member.role)}</td><td>${field(member.rank)}${member.leadership ? '<span class="small-badge">Leadership</span>' : ""}</td></tr>`).join("");
  }

  function rosterSection(v) {
    return `<label class="search-label" for="roster-search">Find a character, class, role, or rank</label>
      <input id="roster-search" type="search" placeholder="Search the active roster…" aria-describedby="roster-feedback" autocomplete="off">
      <p id="roster-feedback" role="status" aria-live="polite"></p>
      <div class="table-wrap"><table><caption>${esc(v.label)} active character directory · manually maintained</caption>
        <thead><tr><th scope="col">Character</th><th scope="col">Class</th><th scope="col">Role</th><th scope="col">Rank</th></tr></thead>
        <tbody id="roster-rows">${rosterRows(v.roster)}</tbody></table></div>`;
  }

  function eventMarkup(event) {
    try {
      const dates = eventDates(event);
      const when = dates.allDay ? `${event.date} · All day${event.endDate ? ` · until ${event.endDate} (exclusive)` : ""}`
        : `${event.start} → ${event.end} (explicit timezone offsets)`;
      return `<h3>${esc(event.title)}</h3><p class="meta">${esc(when)}</p><p>${esc(event.description)}</p>${event.location ? `<p class="meta">${esc(event.location)}</p>` : ""}`;
    } catch {
      return `<h3>${esc(event.title)}</h3>${empty("Invalid event dates — ask leadership to correct the calendar data.")}`;
    }
  }

  function messages(items, message) {
    return list(items, item => `${item.pinned ? '<span class="small-badge pinned">Pinned</span>' : ""}
      <h3>${esc(item.title || "Guild update")}</h3><p class="meta">${esc(item.author || "Author not configured")} · ${esc(displayDate(item.date))}</p><p>${esc(item.text)}</p>`, message);
  }

  function versionPage(key) {
    const v = versions[key];
    const recruitment = list(v.recruitment.needs, need => `<strong>${esc(need.class)} · ${esc(need.role)}</strong><span class="small-badge">${esc(need.priority)}</span>`, "No class or role needs have been published.");
    const officers = list(v.officers, officer => `<h3>${esc(officer.name)}</h3><p>${esc(officer.role)}</p><p class="meta">Discord: ${field(officer.discord)}<br>Battle.net: ${field(officer.battleNet)}</p>`, "Verified officer names and contact details have not been published.");
    const lootConfigured = safeUrl(v.loot.trackerUrl) || v.loot.standings.length;
    const loot = lootConfigured ? card("Loot tracker", `<p class="meta">Read-only, manually maintained. Last verified: ${esc(displayDate(v.loot.verifiedDate))}</p>${link(v.loot.trackerUrl, "Authoritative loot tracker")}
      ${list(v.loot.standings, entry => `<strong>${esc(entry.name)}</strong> · ${esc(entry.points)} points`, "No local standings published.")}<p>Official balances and awards are managed externally, not by this website.</p>`) : "";
    return hero(key, `${guild.name} — ${v.label}`, v.tagline) + `<div class="content">
      <div class="section-heading"><p class="eyebrow">YOUR DIVISION AT A GLANCE</p><h2>Gather. Prepare. Adventure.</h2><p>Information and tools for the ${esc(v.label)} guild division.</p></div>
      <div class="grid">
      ${card("Guild information", infoList([["Realm", v.info.realm], ["Faction", v.info.faction], ["Focus", v.info.focus], ["Leadership", v.info.leadership], ["Recruitment", v.info.recruitment]]))}
      ${card("Recruitment", recruitment + `<p>${esc(v.recruitment.instructions || "Application instructions are awaiting leadership setup. No application can be submitted on this site.")}</p><div class="actions">${link(v.recruitment.applicationUrl, "Apply externally", true)}${link(v.recruitment.discordUrl, "Recruitment Discord")}</div>`, "recruitment")}
      ${card("Raid schedule & calendar", infoList([["Raid days", v.schedule.days], ["Server time (exact)", v.schedule.serverTime], ["Timezone", v.schedule.timezone]]) +
        (key === "retail" && v.schedule.mythicPlus ? `<p>M+ nights: ${esc(v.schedule.mythicPlus)}</p>` : "") +
        `<h3>Scheduled events</h3>${list(v.events, eventMarkup, "No confirmed events. Check back after the schedule is published.")}
        <button id="download-calendar" class="button secondary" type="button"${v.events.length ? "" : " disabled"}>Download .ics calendar <span aria-hidden="true">↓</span></button>
        <p class="meta">Times are shown as configured, not converted to your timezone. Calendar apps can localize timed imports. This download contains listed events only, not recurring raid days.</p><p id="calendar-feedback" role="status"></p>`)}
      ${card("Progression", `<p class="meta">Manually maintained · not live API data</p>${infoList([["Raid tier", v.progression.tier], ["Boss-kill summary", v.progression.summary], ["Last verified", v.progression.verifiedDate ? displayDate(v.progression.verifiedDate) : ""]])}<div class="actions">${link(v.progression.logsUrl, "Warcraft Logs")}${key === "retail" ? link(v.progression.raiderIoUrl, "Raider.IO") : ""}</div>`)}
      ${card("Rules & expectations", infoList([["Loot distribution", v.rules.loot], ["Attendance", v.rules.attendance]]) + '<p>Division rules await leadership confirmation. Shared conduct suggestions are a draft, not approved guild policy.</p><a class="external" href="#community">Read shared conduct & reporting →</a>')}
      ${card("Officer contacts", officers)}
      </div>
      ${card("Guild announcements", messages(v.messages, "No announcements published. Pinned messages will appear here."))}
      ${card("Roster & member directory", rosterSection(v))}
      ${loot}
      <aside class="notice">These are user-selected guild division labels, not a statement about current realm or game-version availability.</aside>
    </div>`;
  }

  function communityPage() {
    return hero("community", `${guild.name} — Community`, "Beyond the raid. Between the adventures. Together.") +
      `<div class="content"><div class="section-heading"><p class="eyebrow">A SHARED GUILD HALL</p><h2>Good company matters.</h2><p>News, conversations, and a respectful place for all four divisions.</p></div><div class="grid">
      ${card("General conduct", `<span class="small-badge pinned">${esc(community.rulesStatus)}</span>${list(community.rules, rule => esc(rule), "Conduct rules have not been configured.")}`)}
      ${card("Reporting & support", `<p>${esc(community.reporting)}</p><div class="actions">${link(guild.contactUrl, "General contact")}${link(guild.discordUrl, "Community Discord")}</div>`)}
      ${card("Discussions", `<p>Find strategies, class guides, and off-topic conversations through the configured services.</p><div class="actions">${link(community.discussions.publicUrl, "Public discussions")}${link(community.discussions.memberUrl, "Member discussions")}${link(community.discussions.discordUrl, "Discussion Discord")}</div><p class="notice">External services must enforce member-only access. This public static page is not an authorization boundary and must never contain private member information.</p>`)}
      ${card("Community news", messages(community.news, "No news published yet. Verified boss kills, roster changes, and social events can be shared here."))}
      </div></div>`;
  }

  function closeMenu(returnFocus = false) {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (returnFocus) toggle.focus();
  }

  function updateRoster(v) {
    const query = document.getElementById("roster-search").value;
    const members = searchRoster(v.roster, query);
    document.getElementById("roster-rows").innerHTML = rosterRows(members);
    document.getElementById("roster-feedback").textContent = !v.roster.length
      ? "No active members published yet." : !members.length ? "No matching members."
        : `${members.length} of ${v.roster.length} members shown.`;
  }

  function render(moveFocus = false) {
    const key = resolveRoute(location.hash);
    if (location.hash !== `#${key}`) history.replaceState(null, "", `#${key}`);
    currentRoute = key;
    document.body.dataset.route = key;
    document.title = `${guild.name} — ${key === "community" ? "Community" : versions[key].label}`;
    nav.querySelectorAll("a").forEach(anchor => {
      if (anchor.hash === `#${key}`) anchor.setAttribute("aria-current", "page");
      else anchor.removeAttribute("aria-current");
    });
    closeMenu();
    main.innerHTML = key === "community" ? communityPage() : versionPage(key);
    if (key !== "community") {
      const v = versions[key];
      document.getElementById("roster-search").addEventListener("input", () => updateRoster(v));
      updateRoster(v);
      document.getElementById("download-calendar").addEventListener("click", () => {
        const feedback = document.getElementById("calendar-feedback");
        let url;
        let anchor;
        try {
          const calendar = createCalendar(v.events, key);
          url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
          anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `signal-flow-${key}.ics`;
          document.body.append(anchor);
          anchor.click();
          feedback.textContent = "Calendar download requested.";
        } catch {
          feedback.textContent = "Calendar unavailable: check unique event IDs and valid dates with explicit timezone offsets.";
        } finally {
          if (anchor) anchor.remove();
          if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      });
    }
    if (moveFocus) {
      main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu(true);
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      closeMenu();
      if (event.target.closest("a").hash === `#${currentRoute}`) main.focus();
    }
  });
  main.addEventListener("click", event => {
    const anchor = event.target.closest("[data-section]");
    if (!anchor) return;
    event.preventDefault();
    const section = document.getElementById(anchor.dataset.section);
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    main.focus();
  });
  window.addEventListener("hashchange", () => render(true));
  render();
})();
