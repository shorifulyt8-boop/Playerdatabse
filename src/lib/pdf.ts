import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Player, Team } from '../types';

export const generateSquadPDF = (team: Team, players: Player[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(`${team.name} - Final Squad`, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Owner: ${team.owner}`, 14, 30);
  doc.text(`Remaining Budget: $${team.remaining_budget.toLocaleString()}`, 14, 37);
  
  // Table
  const tableData = players.map((p, index) => [
    index + 1,
    p.name,
    p.category,
    `$${p.sold_price?.toLocaleString() || '0'}`
  ]);
  
  (doc as any).autoTable({
    startY: 45,
    head: [['#', 'Player Name', 'Category', 'Sold Price']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [31, 41, 55] },
  });
  
  doc.save(`${team.name}_Squad.pdf`);
};
