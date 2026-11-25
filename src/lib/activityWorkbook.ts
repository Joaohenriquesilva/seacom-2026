type ExportRow = {
  nome: string;
  email: string;
  telefone: string | null;
  atividade: string;
  status_presenca: string;
  confirmado_em: string | null;
};

export async function buildActivityWorkbook(
  kind: 'inscritos' | 'presencas',
  activityTitle: string,
  fetchPage: (offset: number, end: number) => Promise<ExportRow[]>,
) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(kind === 'inscritos' ? 'Inscritos' : 'Presenças', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '1:1',
    },
  });
  sheet.columns = [
    { header: 'Nome', key: 'nome', width: 36 },
    { header: 'E-mail', key: 'email', width: 38 },
    { header: 'Telefone', key: 'telefone', width: 22, style: { numFmt: '@' } },
    { header: 'Atividade', key: 'atividade', width: 42 },
    { header: 'Status da presença', key: 'status_presenca', width: 29 },
    { header: 'Confirmado em (UTC)', key: 'confirmado_em', width: 33 },
  ];
  const title = activityTitle.replace(/\s+/g, ' ').slice(0, 100).replace(/&/g, '&&');
  sheet.headerFooter.oddHeader = '&L' + sheet.name + '&C' + title;
  sheet.headerFooter.oddFooter = '&RPágina &P de &N';
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
  sheet.autoFilter = { from: 'A1', to: 'F1' };

  const pageSize = 500;
  let count = 0;
  while (true) {
    const rows = await fetchPage(count, count + pageSize - 1);
    if (!rows.length) break;
    for (const row of rows) {
      sheet.addRow({
        ...row,
        status_presenca: kind === 'inscritos' && !row.confirmado_em ? null : row.status_presenca,
      });
    }
    count += rows.length;
  }
  sheet.pageSetup.printArea = 'A1:F' + (count + 1);
  return { bytes: await workbook.xlsx.writeBuffer(), count };
}
