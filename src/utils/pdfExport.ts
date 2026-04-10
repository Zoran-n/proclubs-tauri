import type { Session, Match, Player } from "../types";

export function getSessionPdfFilename(session: Session): string {
  return `session-${session.clubName.replace(/\s+/g, "_")}-${new Date(session.date).toISOString().slice(0, 10)}.pdf`;
}

export function getPlayerPdfFilename(playerName: string): string {
  return `${playerName.replace(/\s+/g, "_")}_fiche.pdf`;
}

interface PlayerMvp { name: string; goals: number; assists: number; motm: number; games: number }

function aggregateSession(matches: Match[], clubId: string) {
  let goals = 0, assists = 0, passes = 0, tackles = 0, motm = 0;
  const players: Record<string, PlayerMvp> = {};

  for (const m of matches) {
    for (const clubPlayers of Object.values(m.players)) {
      for (const p of Object.values(clubPlayers as Record<string, Record<string, unknown>>)) {
        goals   += Number(p["goals"] ?? 0);
        assists += Number(p["assists"] ?? 0);
        passes  += Number(p["passesMade"] ?? p["passesmade"] ?? 0);
        tackles += Number(p["tacklesMade"] ?? p["tacklesmade"] ?? 0);
        if (p["mom"] === "1" || p["manofthematch"] === "1") motm++;
      }
    }
    const clubPlayers = m.players[clubId] as Record<string, Record<string, unknown>> | undefined;
    if (!clubPlayers) continue;
    for (const [pid, p] of Object.entries(clubPlayers)) {
      const name = String(p["name"] ?? p["playername"] ?? p["playerName"] ?? pid);
      if (!players[name]) players[name] = { name, goals: 0, assists: 0, motm: 0, games: 0 };
      players[name].goals   += Number(p["goals"] ?? 0);
      players[name].assists += Number(p["assists"] ?? 0);
      players[name].games   += 1;
      if (p["mom"] === "1" || p["manofthematch"] === "1") players[name].motm++;
    }
  }
  return { goals, assists, passes, tackles, motm, players: Object.values(players) };
}

// ─── jsPDF helpers ────────────────────────────────────────────────────────────

type DocLike = {
  setDrawColor: (r: number, g: number, b: number) => void;
  setFillColor: (r: number, g: number, b: number) => void;
  setLineWidth: (w: number) => void;
  setFontSize: (s: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  circle: (x: number, y: number, r: number, style: string) => void;
  text: (text: string, x: number, y: number, opts?: Record<string, unknown>) => void;
  internal: { pageSize: { getHeight: () => number } };
};

/**
 * Draw a radar chart using jsPDF primitives.
 * axes: array of { label, value, max }
 */
function drawRadar(
  doc: DocLike,
  cx: number, cy: number, radius: number,
  axes: { label: string; value: number; max: number }[],
  accentR: number, accentG: number, accentB: number,
) {
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(angle(i)),
    cy + r * Math.sin(angle(i)),
  ];

  // Background grid rings (5 levels)
  for (let lvl = 1; lvl <= 5; lvl++) {
    const r = (radius * lvl) / 5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.15);
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pt(i, r);
      const [x2, y2] = pt((i + 1) % n, r);
      doc.line(x1, y1, x2, y2);
    }
  }

  // Axis spokes
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, radius);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.line(cx, cy, x, y);
    // Label
    const [lx, ly] = pt(i, radius + 8);
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text(axes[i].label, lx, ly, { align: "center" });
    const val = axes[i].value;
    doc.setFontSize(6);
    doc.setTextColor(40, 40, 40);
    doc.text(String(val), lx, ly + 3.5, { align: "center" });
  }

  // Data polygon
  const dataPts: [number, number][] = axes.map((ax, i) => {
    const ratio = ax.max > 0 ? Math.min(ax.value / ax.max, 1) : 0;
    return pt(i, radius * ratio);
  });
  doc.setDrawColor(accentR, accentG, accentB);
  doc.setLineWidth(1);
  for (let i = 0; i < n; i++) {
    const [x1, y1] = dataPts[i];
    const [x2, y2] = dataPts[(i + 1) % n];
    doc.line(x1, y1, x2, y2);
  }
  // Dots at vertices
  doc.setFillColor(accentR, accentG, accentB);
  for (const [x, y] of dataPts) {
    doc.circle(x, y, 1.5, "F");
  }
}

/**
 * Draw a mini line chart using jsPDF primitives.
 * values: array of numbers, domain: [min, max]
 */
function drawLineChart(
  doc: DocLike,
  x: number, y: number, w: number, h: number,
  values: number[],
  domain: [number, number],
  accentR: number, accentG: number, accentB: number,
) {
  if (values.length < 2) return;
  const [minV, maxV] = domain;
  const range = maxV - minV || 1;

  const toX = (i: number) => x + (i / (values.length - 1)) * w;
  const toY = (v: number) => y + h - ((v - minV) / range) * h;

  // Axes
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(x, y, x, y + h);
  doc.line(x, y + h, x + w, y + h);

  // Horizontal grid + Y labels (4 levels)
  for (let lvl = 0; lvl <= 4; lvl++) {
    const gy = y + h - (lvl / 4) * h;
    const gv = minV + (lvl / 4) * range;
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.line(x, gy, x + w, gy);
    doc.setFontSize(5);
    doc.setTextColor(130, 130, 130);
    doc.text(gv.toFixed(1), x - 1, gy + 1, { align: "right" });
  }

  // Data line
  doc.setDrawColor(accentR, accentG, accentB);
  doc.setLineWidth(0.9);
  for (let i = 0; i < values.length - 1; i++) {
    doc.line(toX(i), toY(values[i]), toX(i + 1), toY(values[i + 1]));
  }

  // Data dots
  doc.setFillColor(accentR, accentG, accentB);
  for (let i = 0; i < values.length; i++) {
    doc.circle(toX(i), toY(values[i]), 0.9, "F");
  }

  // X-axis labels (every N to avoid clutter)
  const step = Math.max(1, Math.floor(values.length / 12));
  doc.setFontSize(5);
  doc.setTextColor(130, 130, 130);
  for (let i = 0; i < values.length; i += step) {
    doc.text(`M${i + 1}`, toX(i), y + h + 4, { align: "center" });
  }

  // Last value callout
  const lastX = toX(values.length - 1);
  const lastY = toY(values[values.length - 1]);
  doc.setFontSize(6);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text(values[values.length - 1].toFixed(1), lastX + 2, lastY);
}

// ─── Session PDF ──────────────────────────────────────────────────────────────

export async function generateSessionPdf(session: Session) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const accent: [number, number, number] = [0, 180, 220];
  const dark: [number, number, number] = [30, 35, 45];

  const stats = aggregateSession(session.matches, session.clubId);
  const dateStr = new Date(session.date).toLocaleString();
  const wins = session.matches.filter((m) => {
    const cd = m.clubs[session.clubId] as Record<string, unknown> | undefined;
    return cd?.["matchResult"] === "win";
  }).length;
  const losses = session.matches.filter((m) => {
    const cd = m.clubs[session.clubId] as Record<string, unknown> | undefined;
    return cd?.["matchResult"] === "loss";
  }).length;
  const draws = session.matches.length - wins - losses;

  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(session.clubName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(`Session du ${dateStr}`, 14, 28);

  let y = 44;
  doc.setFillColor(240, 242, 245);
  doc.rect(10, y - 4, 190, 18, "F");
  const kpis = [
    { label: "Matchs", value: String(session.matches.length) },
    { label: "V/N/D",  value: `${wins}/${draws}/${losses}` },
    { label: "Buts",   value: String(stats.goals) },
    { label: "PD",     value: String(stats.assists) },
    { label: "Passes", value: String(stats.passes) },
    { label: "MOTM",   value: String(stats.motm) },
  ];
  const kpiW = 190 / kpis.length;
  kpis.forEach(({ label, value }, i) => {
    const x = 10 + i * kpiW + kpiW / 2;
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text(value, x, y + 4, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, x, y + 10, { align: "center" });
  });

  y = 70;
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("Meilleurs Joueurs", 14, y);
  y += 4;

  const sorted = [...stats.players].sort((a, b) => b.goals - a.goals);
  if (sorted.length > 0) {
    (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Joueur", "MJ", "Buts", "PD", "MOTM"]],
      body: sorted.slice(0, 11).map((p) => [p.name, p.games, p.goals, p.assists, p.motm]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  const afterTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10;
  let matchY = afterTable + 10;
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("Matchs Joués", 14, matchY);
  matchY += 4;

  const matchRows = session.matches.map((m) => {
    const cd = m.clubs[session.clubId] as Record<string, unknown> | undefined;
    const result = String(cd?.["matchResult"] ?? "");
    const goals  = String(cd?.["goals"] ?? "?");
    const r = result === "win" ? "V" : result === "loss" ? "D" : "N";
    const ts = Number(m.timestamp);
    const date = ts > 0 ? new Date(ts * 1000).toLocaleTimeString() : "";
    return [r, goals + " but(s)", m.matchType, date];
  });

  (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: matchY,
    margin: { left: 14, right: 14 },
    head: [["Rés.", "Score", "Type", "Heure"]],
    body: matchRows,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("ProClubs Stats — Généré automatiquement", 105, pageH - 8, { align: "center" });

  doc.save(`session-${session.clubName.replace(/\s+/g, "_")}-${new Date(session.date).toISOString().slice(0, 10)}.pdf`);
}

// ─── Player PDF (enrichi) ─────────────────────────────────────────────────────

interface MonthlyData {
  month: string;
  goals: number;
  assists: number;
  rating: number;
  games: number;
}

export async function generatePlayerPdf(
  player: Player,
  posLabel: string,
  ratingHistory: number[],
  monthlyData?: MonthlyData[],
) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const [aR, aG, aB]: [number, number, number] = [0, 180, 220];
  const dark: [number, number, number] = [30, 35, 45];

  // ── Page 1: header + stats + radar ──────────────────────────────────────

  // Header band
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(player.name, 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(aR, aG, aB);
  doc.text(posLabel, 14, 32);
  if (player.rating > 0) {
    doc.setFontSize(11);
    doc.setTextColor(255, 200, 50);
    doc.text(`Note moy. ${player.rating.toFixed(1)} ★`, 196, 32, { align: "right" });
  }

  // Stats table (left column)
  const rows: [string, string][] = [
    ["Matchs joués",    String(player.gamesPlayed)],
    ["Buts",            String(player.goals)],
    ["Passes décisives",String(player.assists)],
    ["Passes réussies", String(player.passesMade)],
    ["Tacles",          String(player.tacklesMade)],
    ["MOTM",            String(player.motm)],
    ["Note moyenne",    player.rating > 0 ? player.rating.toFixed(1) : "—"],
  ];
  if (player.shotsOnTarget)  rows.push(["Tirs cadrés",   String(player.shotsOnTarget)]);
  if (player.interceptions)  rows.push(["Interceptions",  String(player.interceptions)]);
  if (player.foulsCommitted) rows.push(["Fautes",         String(player.foulsCommitted)]);
  if (player.yellowCards)    rows.push(["Cartons jaunes", String(player.yellowCards)]);
  if (player.redCards)       rows.push(["Cartons rouges", String(player.redCards)]);
  if (player.cleanSheets)    rows.push(["Clean sheets",   String(player.cleanSheets)]);
  if (player.saveAttempts)   rows.push(["Arrêts GK",      String(player.saveAttempts)]);

  (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: 48,
    margin: { left: 14, right: 110 },
    head: [["Statistique", "Valeur"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [aR, aG, aB], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 1: { halign: "center" as const, fontStyle: "bold" as const } },
  });

  // Radar chart (right column, next to stats table)
  const radarCx = 165, radarCy = 85, radarR = 38;

  // Normalize radar axes relative to 90th-percentile typical values
  const radarAxes = [
    { label: "Buts",   value: player.goals,        max: Math.max(player.goals * 2, 30) },
    { label: "PD",     value: player.assists,       max: Math.max(player.assists * 2, 20) },
    { label: "Passes", value: player.passesMade,    max: Math.max(player.passesMade * 2, 200) },
    { label: "Tacles", value: player.tacklesMade,   max: Math.max(player.tacklesMade * 2, 100) },
    { label: "MOTM",   value: player.motm,          max: Math.max(player.motm * 2, 10) },
    { label: "Note",   value: player.rating > 0 ? player.rating * 10 : 0, max: 100 },
  ];

  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text("RADAR PERFORMANCES", radarCx, 52, { align: "center" });

  drawRadar(doc as unknown as DocLike, radarCx, radarCy, radarR, radarAxes, aR, aG, aB);

  // ── Rating evolution line chart ───────────────────────────────────────────

  const afterStatsY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 130;
  const chartY = Math.max(afterStatsY + 10, 135);

  if (ratingHistory.length > 1) {
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text("ÉVOLUTION DE LA NOTE PAR MATCH", 14, chartY);

    const minR = Math.max(0, Math.min(...ratingHistory) - 0.5);
    const maxR = Math.min(10, Math.max(...ratingHistory) + 0.5);

    drawLineChart(
      doc as unknown as DocLike,
      18, chartY + 6, 174, 38,
      ratingHistory, [minR, maxR],
      aR, aG, aB,
    );

    // Trend annotation
    if (ratingHistory.length >= 3) {
      const n = ratingHistory.length;
      const xMean = (n - 1) / 2;
      const yMean = ratingHistory.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      ratingHistory.forEach((y2, x) => { num += (x - xMean) * (y2 - yMean); den += (x - xMean) ** 2; });
      const slope = den !== 0 ? num / den : 0;
      const avg5 = ratingHistory.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, ratingHistory.length);
      const direction = slope > 0.05 ? "↑ En progression" : slope < -0.05 ? "↓ En baisse" : "→ Stable";
      doc.setFontSize(7);
      doc.setTextColor(aR, aG, aB);
      doc.text(`Tendance : ${direction}  |  Moy. 5 derniers : ${avg5.toFixed(1)}  |  Pente : ${slope > 0 ? "+" : ""}${slope.toFixed(3)}/match`, 18, chartY + 50);
    }
  }

  // ── Monthly breakdown table (page 2 if data available) ────────────────────

  const hasMonthly = monthlyData && monthlyData.length > 0;
  const hasEvoTable = ratingHistory.length > 1;

  if (hasEvoTable || hasMonthly) {
    const currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    const sectionY = ratingHistory.length > 1 ? (chartY + 60) : (currentY ? currentY + 10 : 160);

    if (hasMonthly) {
      const monthY = sectionY + 6;
      if (monthY > 240) {
        (doc as unknown as { addPage: () => void }).addPage();
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        doc.text("ÉVOLUTION MENSUELLE", 14, 20);
        (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
          startY: 26,
          margin: { left: 14, right: 14 },
          head: [["Mois", "MJ", "Buts", "PD", "Note moy."]],
          body: monthlyData!.map((m) => [m.month, m.games, m.goals, m.assists, m.rating > 0 ? m.rating.toFixed(1) : "—"]),
          styles: { fontSize: 9, cellPadding: 2.5 },
          headStyles: { fillColor: [aR, aG, aB], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: { 0: { fontStyle: "bold" as const } },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        doc.text("ÉVOLUTION MENSUELLE", 14, monthY);
        (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
          startY: monthY + 4,
          margin: { left: 14, right: 14 },
          head: [["Mois", "MJ", "Buts", "PD", "Note moy."]],
          body: monthlyData!.map((m) => [m.month, m.games, m.goals, m.assists, m.rating > 0 ? m.rating.toFixed(1) : "—"]),
          styles: { fontSize: 9, cellPadding: 2.5 },
          headStyles: { fillColor: [aR, aG, aB], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: { 0: { fontStyle: "bold" as const } },
        });
      }
    }
  }

  // ── Footer on all pages ───────────────────────────────────────────────────

  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    (doc as unknown as { setPage: (n: number) => void }).setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`ProClubs Stats — Fiche joueur · Page ${i}/${totalPages}`, 105, pageH - 7, { align: "center" });
  }

  doc.save(`${player.name.replace(/\s+/g, "_")}_fiche.pdf`);
}
