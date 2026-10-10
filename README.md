# Signal Flow guild website

A dependency-free, responsive World of Warcraft guild hall with bookmarkable
`#retail`, `#classic`, `#forever`, `#tbc`, and `#community` pages. Division names
are user-selected labels, not claims about current game or realm availability.
Guild name is inferred from the repository name and can be changed.

## Run locally

Open `index.html` in a modern browser. No install, build, API credentials, or
external fonts are required. Alternatively, from the repository root:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Run the automated checks with Node.js 18 or later:

```sh
npm test
```

Tests use Node's built-in test runner; there are no package dependencies.

## Original tabard

The supplied conversation did **not** include an accessible image file in this
repository. The navy/gold/silver SVG is an original **placeholder emblem**, not
a reproduction of the user's tabard. To use the real image, place it at
`assets/Signal_Flow_Tabbard.png` (case-sensitive), then reload. The branding and
each hero automatically switch to that image once it loads. The placeholder
remains visible if the image cannot load; its label explicitly says so.

## LifeCraft and Folkard typography

LifeCraft is used for the guild wordmark, hero titles, and footer branding.
Folkard is used for section and event headings. Body text, navigation, forms,
and tables retain system fonts for readability.

The requested font binaries are not supplied in this repository. The site
first tries installed copies, then optional `assets/fonts/LifeCraft.woff2`
and `assets/fonts/Folkard.woff2` (case-sensitive). Create that directory and
add webfont copies only if your licenses permit web embedding and public
redistribution. If your licensed files use a different format, update the
`@font-face` sources in `styles.css` to match. No font service or downloads
are required: Georgia/Times fallbacks render immediately when the fonts
are unavailable. The actual custom-font appearance requires supplied fonts
and cannot be verified with the absent originals.

## Configure verified content

Edit **`data.js`**. Blank values and empty arrays deliberately produce honest
empty states. No made-up realms, officers, recruitment needs, dates, or
progression are published. Replace blanks only with verified, publishable
information. Keep these four division keys; route handling intentionally
accepts exactly those four and Community.

- `guild`: name, local tabard path, community Discord and general contact URL.
- `versions.<key>.info`: realm, faction, focus, leadership, recruitment status.
- `recruitment`: application instructions, external application/Discord URLs;
  `needs` entries use `{ class, role, priority }`.
- `schedule`: raid days, exact server time range, and explicit timezone
  (prefer a named zone such as `America/New_York`, not an ambiguous abbreviation).
  `mythicPlus` is optional and displayed only for Retail. These fields are
  informational and do not generate recurring calendar events.
- `events`: confirmed dates with stable unique IDs; formats below.
- `rules`: approved division loot distribution and attendance expectations.
- `progression`: raid tier, boss-kill summary, `verifiedDate` (`YYYY-MM-DD`),
  Warcraft Logs URL, optional Retail Raider.IO URL. Manually maintained, not
  live synchronization.
- `roster`: active characters using `{ name, class, role, rank, leadership }`;
  `leadership` is a boolean. Search includes all those fields. The directory
  is public; publish only information members have agreed to share.
- `officers`: `{ name, role, discord, battleNet }`. Handles/tags are plain
  contact text, not fabricated links.
- `messages`: `{ title, text, author, date, pinned }`, with a `YYYY-MM-DD` date
  and boolean `pinned`. Pinned entries have a visible badge; array order
  controls display order (place pinned messages first).
- `loot`: optional authoritative tracker URL, verified date, and read-only
  `standings` entries `{ name, points }`. Hidden unless a valid tracker URL
  or standings are configured. There is no client-side points editing.
- `community`: suggested conduct rules, draft status, reporting guidance,
  `news` (same fields as messages), and `discussions` URLs (`publicUrl`,
  `memberUrl`, `discordUrl`). Draft conduct suggestions require leadership
  approval. Update reporting instructions with verified contacts.

External links must be absolute `https://` or `http://` URLs without embedded
credentials. Invalid or blank links are displayed as unconfigured, never as
dead application buttons. HTTP is supported, but HTTPS is recommended.
New tabs use `noopener noreferrer`; rendered data text is HTML-escaped.

### Calendar data

The following are **format examples only**, not actual guild events:

```js
// Date-only events are all-day, never silently converted into timed raids.
{
  id: "example-social", title: "FORMAT EXAMPLE — social event",
  date: "2026-10-14", description: "Replace with verified information",
  location: ""
}
// Timed events require seconds and an explicit numeric offset or Z on BOTH ends.
{
  id: "example-raid", title: "FORMAT EXAMPLE — raid",
  start: "2026-10-14T20:00:00-04:00",
  end: "2026-10-14T23:00:00-04:00",
  description: "Replace with verified information", location: ""
}
```

For multi-day all-day events, optional `endDate` is **exclusive**; otherwise
the end is the following day. Do not mix date-only and timed fields.
Dates are validated, including leap years and overflow. Ends must follow
starts. IDs must use letters, digits, `_` or `-`, and remain unique and stable
within a division; changing an ID may duplicate an imported event.

Exports preserve timed instants as UTC, escape calendar text, fold UTF-8 lines
at 75 octets, and release download object URLs. UID includes the division and
event ID. The deterministic `DTSTAMP` is a fixed baseline, not a claim about
when leadership verified an event. Downloads are snapshots of listed events,
not subscriptions or update synchronization. Re-import behavior depends on
the calendar app.

The website shows times **as configured**, without automatic viewer-time
conversion. Importing apps can localize UTC events. Ensure each timed event's
offset is correct for its date and any daylight-saving transition. Invalid
events show a warning and invalid IDs/dates prevent export rather than producing
an inaccurate calendar.

## Optional static deployment

Publish the repository root using GitHub Pages (Settings → Pages → deploy
from the chosen branch/root) or another static host. No build output is needed.
Hash navigation also works under a project subpath. No deployment workflow or
external account has been created by this implementation.

## Boundaries and checks

- Applications, Discord, trackers, and discussions are external. This site
  neither submits applications nor creates external service accounts.
- Member-only access must be enforced by the linked service. A public static
  page is **not** authentication or an authorization boundary. Never put
  secrets, private discussions, or private member details in this repository.
- Progression, roster, announcements, calendars, and DKP are manually maintained.
  There is no backend, live game API, private forum, or authoritative loot editor.
- Automated tests cover routes, invalid route fallback, search, HTML escaping,
  URL filtering, shipped empty data, calendar validation, timezone preservation,
  all-day events, stable UIDs, calendar escaping, and Unicode line folding.
- Browser verification is needed for navigation/back-forward, focus, mobile
  menu and layout, image switching, and downloads. Real external applications,
  calendar-client imports, and the original tabard cannot be verified until
  configured/provided.
