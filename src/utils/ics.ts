// Minimální parser iCal (.ics) – vytáhne události (datum, čas, název).
// Stačí na běžný Google Kalendář (jednorázové události). Opakované události
// (RRULE) zatím nerozbaluje.

export interface CalEvent {
  date: string; // YYYY-MM-DD (lokální, Europe/Prague)
  time: string; // HH:MM nebo "" pro celodenní
  title: string;
  allDay: boolean;
}

function unescape(v: string): string {
  return v
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseDT(rawKey: string, val: string): { date: string; time: string; allDay: boolean } {
  const isDate = /VALUE=DATE/i.test(rawKey) || /^\d{8}$/.test(val);
  if (isDate) {
    return {
      date: `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`,
      time: "",
      allDay: true,
    };
  }
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!m) return { date: "", time: "", allDay: false };
  const [, y, mo, d, h, mi, s, z] = m;
  if (z) {
    // UTC → převést na Europe/Prague
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Prague",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(dt);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, allDay: false };
  }
  // lokální/floating čas (např. TZID=Europe/Prague) – zobrazíme tak, jak je
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}`, allDay: false };
}

export function parseICS(text: string): CalEvent[] {
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  // rozbalit zalomené řádky (pokračování začíná mezerou/tabem)
  const lines: string[] = [];
  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && lines.length) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
  }

  const events: CalEvent[] = [];
  let cur: { summary?: string; start?: ReturnType<typeof parseDT> } | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur?.start?.date) {
        events.push({
          date: cur.start.date,
          time: cur.start.time,
          allDay: cur.start.allDay,
          title: cur.summary || "(bez názvu)",
        });
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx);
      const val = line.slice(idx + 1);
      const name = key.split(";")[0].toUpperCase();
      if (name === "SUMMARY") cur.summary = unescape(val);
      else if (name === "DTSTART") cur.start = parseDT(key, val);
    }
  }
  return events;
}
