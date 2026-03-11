export async function exportPng(element: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#090c10";
  const canvas = await html2canvas(element, {
    backgroundColor: bg,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function exportCsv(headers: string[], rows: (string | number)[][], filename: string): void {
  const allRows = [headers, ...rows];
  const csv = allRows
    .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filename}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
