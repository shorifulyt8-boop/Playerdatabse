import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Player, Team } from '../types';

export const generateSquadPDF = (team: Team, players: Player[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Savar Ashuliya Premier League', 105, 20, { align: 'center' });
  
  // Sub-header (Team Name)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Team: ${team.name}`, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Owner: ${team.owner}`, 14, 40);
  doc.text(`Remaining Budget: $${team.remaining_budget.toLocaleString()}`, 14, 45);
  
  // Table
  const tableData = players.map((p, index) => [
    index + 1,
    p.name,
    p.contact_number || 'N/A',
    p.role_details || p.category
  ]);
  
  autoTable(doc, {
    startY: 50,
    head: [['SL', 'Player Name', 'Contact Number', 'Role']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0] }, // emerald-500
    styles: { fontSize: 9 },
    margin: { bottom: 20 }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Software Developed By Shoriful Islam', 105, pageHeight - 10, { align: 'center' });
  }
  
  doc.save(`${team.name}_Squad.pdf`);
};

export const generateAllPlayersPDF = (players: Player[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Savar Ashuliya Premier League', 105, 20, { align: 'center' });
  
  // Sub-header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('All Registered Players', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Total Players: ${players.length}`, 14, 40);
  
  // Table
  const tableData = players.map((p, index) => [
    index + 1,
    p.name,
    p.category,
    p.contact_number || 'N/A',
    p.role_details || 'N/A',
    p.status.toUpperCase()
  ]);
  
  autoTable(doc, {
    startY: 45,
    head: [['SL', 'Player Name', 'Category', 'Contact', 'Role', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] }, // blue-500
    styles: { fontSize: 8 },
    margin: { bottom: 20 }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Software Developed By Shoriful Islam', 105, pageHeight - 10, { align: 'center' });
  }
  
  doc.save('All_Players_List.pdf');
};

export const generateAllSquadsPDF = (teams: Team[], allPlayers: Player[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Savar Ashuliya Premier League', 105, 20, { align: 'center' });
  
  // Sub-header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('All Teams Squad Summary', 105, 30, { align: 'center' });
  
  let currentY = 40;

  teams.forEach((team, teamIndex) => {
    const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
    
    if (teamIndex > 0) {
      // Check if we need a new page or just some space
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 10;
      }
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${team.name} (${team.owner})`, 14, currentY);
    currentY += 5;

    const tableData = teamPlayers.map((p, index) => [
      index + 1,
      p.name,
      p.contact_number || 'N/A',
      p.role_details || p.category,
      `$${p.sold_price?.toLocaleString() || '0'}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['SL', 'Player Name', 'Contact', 'Role', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { bottom: 20 },
      didDrawPage: (data) => {
        currentY = data.cursor?.y || currentY;
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Software Developed By Shoriful Islam', 105, pageHeight - 10, { align: 'center' });
  }
  
  doc.save('All_Teams_Squads.pdf');
};
