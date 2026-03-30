import type { Session, Match, Player } from "../types";

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
    // Per-player stats scoped to club
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

  // Header
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(session.clubName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(`Session du ${dateStr}`, 14, 28);

  // KPIs bar
  let y = 44;
  doc.setFillColor(240, 242, 245);
  doc.rect(10, y - 4, 190, 18, "F");
  const kpis = [
    { label: "Matchs", value: String(session.matches.length) },
    { label: "V/N/D", value: `${wins}/${draws}/${losses}` },
    { label: "Buts", value: String(stats.goals) },
    { label: "PD", value: String(stats.assists) },
    { label: "Passes", value: String(stats.passes) },
    { label: "MOTM", value: String(stats.motm) },
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

  // Top players
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

  // Match list
  const afterTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10;
  let matchY = afterTable + 10;
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("Matchs Joués", 14, matchY);
  matchY += 4;

  const matchRows = session.matches.map((m) => {
    const cd = m.clubs[session.clubId] as Record<string, unknown> | undefined;
    const result = String(cd?.["matchResult"] ?? "");
    const goals = String(cd?.["goals"] ?? "?");
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

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("ProClubs Stats — Généré automatiquement", 105, pageH - 8, { align: "center" });

  doc.save(`session-${session.clubName.replace(/\s+/g, "_")}-${new Date(session.date).toISOString().slice(0, 10)}.pdf`);
}

export async function generatePlayerPdf(player: Player, posLabel: string, ratingHistory: number[]) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const accent: [number, number, number] = [0, 180, 220];
  const dark: [number, number, number] = [30, 35, 45];

  // Header
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(player.name, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(posLabel, 14, 28);

  // Stats table
  const rows: [string, string][] = [
    ["Matchs joués", String(player.gamesPlayed)],
    ["Buts", String(player.goals)],
    ["Passes décisives", String(player.assists)],
    ["Passes réussies", String(player.passesMade)],
    ["Tacles", String(player.tacklesMade)],
    ["MOTM", String(player.motm)],
    ["Note moyenne", player.rating > 0 ? player.rating.toFixed(1) : "—"],
  ];
  if (player.shotsOnTarget)  rows.push(["Tirs cadrés",   String(player.shotsOnTarget)]);
  if (player.interceptions)  rows.push(["Interceptions",  String(player.interceptions)]);
  if (player.foulsCommitted) rows.push(["Fautes",         String(player.foulsCommitted)]);
  if (player.yellowCards)    rows.push(["Cartons jaunes", String(player.yellowCards)]);
  if (player.redCards)       rows.push(["Cartons rouges", String(player.redCards)]);
  if (player.cleanSheets)    rows.push(["Clean sheets",   String(player.cleanSheets)]);
  if (player.saveAttempts)   rows.push(["Arrêts GK",      String(player.saveAttempts)]);

  (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
    startY: 44,
    margin: { left: 14, right: 14 },
    head: [["Statistique", "Valeur"]],
    body: rows,
    styles: { fontSize: 11, cellPadding: 3 },
    headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 1: { halign: "center" as const, fontStyle: "bold" as const } },
  });

  // Rating evolution
  if (ratingHistory.length > 1) {
    const afterY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
    const evoY = afterY + 10;
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text("Évolution de la note par match", 14, evoY);

    (doc as unknown as { autoTable: (opts: unknown) => void }).autoTable({
      startY: evoY + 4,
      margin: { left: 14, right: 100 },
      head: [["Match", "Note"]],
      body: ratingHistory.map((r, i) => [`M${i + 1}`, r.toFixed(1)]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("ProClubs Stats — Généré automatiquement", 105, pageH - 8, { align: "center" });

  doc.save(`${player.name.replace(/\s+/g, "_")}_fiche.pdf`);
}
