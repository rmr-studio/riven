# Feature Design Pipeline
---

> Pipeline for Riven feature designs — from initial concept through completed specification.
> Features progress through stages: **Backlog** → **Planning** → **Planned** → **Active** → **Completed**
> Move feature files between folders as they advance through the pipeline.

## Pipeline at a Glance

```dataviewjs
const base = "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design";
const stages = [
  { folder: "5. Backlog",    label: "Backlog"   },
  { folder: "1. Planning",   label: "Planning"  },
  { folder: "2. Planned",    label: "Planned"   },
  { folder: "3. Active",     label: "Active"    },
  { folder: "4. Completed",  label: "Completed" },
];

const rows = stages.map(s => {
  const count = dv.pages(`"${base}/${s.folder}"`).length;
  const bar = "█".repeat(count) + (count > 0 ? ` **${count}**` : " 0");
  return [s.label, bar];
});

const total = rows.reduce((sum, r) => sum + dv.pages(`"${base}/${stages[rows.indexOf(r)].folder}"`).length, 0);
dv.table(["Stage", `Features (${dv.pages(`"${base}"`).where(p => p.file.name !== "feature-design").length} total)`], rows);
```

---

## By Domain

> Features grouped by domain area. Use the outline pane to jump to a specific domain.

```dataviewjs
const base = "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design";
const pages = dv.pages(`"${base}"`)
  .where(p => p.file.name !== "feature-design");

const domainMap = {};

for (const p of pages) {
  const domains = p.Domains || [];
  const domainList = Array.isArray(domains) ? domains : [domains];

  if (domainList.length === 0 || (domainList.length === 1 && String(domainList[0]).includes("[[Domain]]"))) {
    if (!domainMap["Uncategorised"]) domainMap["Uncategorised"] = [];
    domainMap["Uncategorised"].push(p);
    continue;
  }

  for (const d of domainList) {
    const raw = String(d);
    // Extract display name from wiki-link: [[Path/Name|Alias]] → Alias, or [[Name]] → Name
    const aliasMatch = raw.match(/\[\[[^\]]*\|([^\]]+)\]\]/);
    const linkMatch = raw.match(/\[\[([^\]|]+)/);
    const name = aliasMatch ? aliasMatch[1] : (linkMatch ? linkMatch[1].split("/").pop() : raw);

    if (name === "Domain") {
      if (!domainMap["Uncategorised"]) domainMap["Uncategorised"] = [];
      domainMap["Uncategorised"].push(p);
    } else {
      if (!domainMap[name]) domainMap[name] = [];
      domainMap[name].push(p);
    }
  }
}

const getPriority = (p) => {
  const t = (p.tags || []).map(String);
  if (t.some(tag => tag.includes("priority/high"))) return ["High", 1];
  if (t.some(tag => tag.includes("priority/medium"))) return ["Med", 2];
  if (t.some(tag => tag.includes("priority/low"))) return ["Low", 3];
  return ["—", 4];
};

const getDesign = (p) => {
  const t = (p.tags || []).map(String);
  if (t.some(tag => tag.includes("status/implemented"))) return "Implemented";
  if (t.some(tag => tag.includes("status/designed"))) return "Designed";
  if (t.some(tag => tag.includes("status/draft"))) return "Draft";
  return "—";
};

// Sort domains alphabetically, but put Uncategorised last
const sorted = Object.entries(domainMap).sort((a, b) => {
  if (a[0] === "Uncategorised") return 1;
  if (b[0] === "Uncategorised") return -1;
  return a[0].localeCompare(b[0]);
});

for (const [domain, features] of sorted) {
  dv.header(4, `${domain} (${features.length})`);
  const rows = features
    .sort((a, b) => getPriority(a)[1] - getPriority(b)[1])
    .map(p => [
      p.file.link,
      p.file.folder.replace(/.*\//, ""),
      getPriority(p)[0],
      getDesign(p),
      p["blocked-by"] ? "Yes" : ""
    ]);
  dv.table(["Feature", "Stage", "P", "Design", "Blocked"], rows);
}
```

---

## In Flight

> Features currently being implemented. Limit to 1-3 to maintain focus.

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  choice(contains(tags, "status/implemented"), "Implemented", choice(contains(tags, "status/designed"), "Designed", choice(contains(tags, "status/draft"), "Draft", "—"))) as "Design",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/3. Active"
SORT choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## Critical Path

> Features that unblock the most other work. Completing these first has outsized impact.

```dataviewjs
const base = "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design";
const pages = dv.pages(`"${base}"`)
  .where(p => p.file.name !== "feature-design");

const blockerCounts = {};

for (const page of pages) {
  const blockedBy = page["blocked-by"];
  if (!blockedBy) continue;
  const blockers = Array.isArray(blockedBy) ? blockedBy : [blockedBy];

  for (const b of blockers) {
    const str = String(b);
    const match = str.match(/\[\[([^\]|]+)/);
    const name = match ? match[1] : str;

    if (!blockerCounts[name]) blockerCounts[name] = [];
    blockerCounts[name].push(page.file.link);
  }
}

const rows = Object.entries(blockerCounts)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([name, unblocked]) => {
    const pg = pages.find(p => p.file.name === name);
    return [
      pg ? pg.file.link : name,
      pg ? pg.file.folder.replace(/.*\//, "") : "—",
      unblocked.length,
      unblocked.join(", ")
    ];
  });

if (rows.length > 0) {
  dv.table(["Feature", "Stage", "Unblocks", "Waiting On This"], rows);
} else {
  dv.paragraph("*No dependency chains found.*");
}
```

---

## Design Queue — Unblocked

> Unblocked features in Planning, sorted by priority. Pick from the top.

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  choice(contains(tags, "status/implemented"), "Implemented", choice(contains(tags, "status/designed"), "Designed", choice(contains(tags, "status/draft"), "Draft", "—"))) as "Design",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/1. Planning"
WHERE !blocked-by
SORT choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## Blocked

> Waiting on dependencies. Resolve blockers to unlock these features.

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  blocked-by as "Blocked By",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/1. Planning"
WHERE blocked-by
SORT choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## Ready to Build

> Fully designed features queued for implementation.

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/2. Planned"
SORT choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## Needs Triage

> Features with missing or ambiguous priority. Clean up metadata to move into the work queue.

```dataviewjs
const base = "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design";
const pages = dv.pages(`"${base}"`)
  .where(p => p.file.name !== "feature-design");

const untriaged = pages.where(p => {
  const t = (p.tags || []).map(String);
  const priorities = t.filter(tag => tag.startsWith("priority/"));
  return priorities.length === 0 || priorities.length > 1;
});

if (untriaged.length > 0) {
  dv.table(
    ["Feature", "Stage", "Issue"],
    untriaged.map(p => {
      const t = (p.tags || []).map(String);
      const priorities = t.filter(tag => tag.startsWith("priority/"));
      const issue = priorities.length === 0
        ? "No priority set"
        : "Multiple priorities (" + priorities.map(p => p.replace("priority/", "")).join(", ") + ")";
      return [
        p.file.link,
        p.file.folder.replace(/.*\//, ""),
        issue
      ];
    })
  );
} else {
  dv.paragraph("*All features have a single priority assigned.*");
}
```

---

## Backlog

> Ideas and features parked for future consideration.

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/5. Backlog"
SORT choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## All Features

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  regexreplace(file.folder, ".*\/", "") as "Stage",
  choice(contains(tags, "priority/high"), "High", choice(contains(tags, "priority/medium"), "Med", choice(contains(tags, "priority/low"), "Low", "—"))) as "P",
  choice(contains(tags, "status/implemented"), "Implemented", choice(contains(tags, "status/designed"), "Designed", choice(contains(tags, "status/draft"), "Draft", "—"))) as "Design",
  Domains as "Domains",
  blocked-by as "Blocked By"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design"
WHERE file.name != "feature-design"
SORT
  choice(contains(file.folder, "3. Active"), 1, choice(contains(file.folder, "2. Planned"), 2, choice(contains(file.folder, "1. Planning"), 3, choice(contains(file.folder, "5. Backlog"), 4, 5)))) ASC,
  choice(contains(tags, "priority/high"), 1, choice(contains(tags, "priority/medium"), 2, choice(contains(tags, "priority/low"), 3, 4))) ASC
```

---

## Completed

```dataview
TABLE WITHOUT ID
  file.link as "Feature",
  Domains as "Domains"
FROM "2. Areas/2.1 Startup & Business/Riven/2. System Design/feature-design/4. Completed"
SORT file.mtime DESC
```
