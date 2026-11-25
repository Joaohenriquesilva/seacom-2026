import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import {buildActivityWorkbook} from '../src/lib/activityWorkbook.ts';

const confirmedAt = '2026-12-02T15:00:00+00:00';
const rows = [
  {nome:'Ana',email:'ana@example.test',telefone:'012345',atividade:'Oficina',status_presenca:'Não confirmou presença',confirmado_em:null},
  {nome:'Bia',email:'bia@example.test',telefone:null,atividade:'Oficina',status_presenca:'Presença confirmada',confirmado_em:confirmedAt},
];

async function reopen(bytes, sheetName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  return workbook.getWorksheet(sheetName);
}

test('lista de inscritos preserva as colunas, a presença real e as opções de impressão', async () => {
  const ranges = [];
  const {bytes,count} = await buildActivityWorkbook('inscritos','Oficina & Debate',async (offset,end)=>{
    ranges.push([offset,end]);
    return rows.slice(offset,offset+1);
  });
  assert.deepEqual(ranges,[[0,499],[1,500],[2,501]]);
  assert.equal(count,2);
  const sheet = await reopen(bytes,'Inscritos');
  assert.deepEqual(sheet.getRow(1).values.slice(1),['Nome','E-mail','Telefone','Atividade','Status da presença','Confirmado em (UTC)']);
  assert.equal(sheet.getCell('C2').value,'012345');
  assert.equal(sheet.getCell('E2').value,null);
  assert.equal(sheet.getCell('F2').value,null);
  assert.equal(sheet.getCell('E3').value,'Presença confirmada');
  assert.equal(sheet.getCell('F3').value,confirmedAt);
  assert.equal(sheet.pageSetup.paperSize,9);
  assert.equal(sheet.pageSetup.orientation,'landscape');
  assert.equal(sheet.pageSetup.fitToWidth,1);
  assert.equal(sheet.pageSetup.fitToHeight,0);
  assert.equal(sheet.pageSetup.printArea,'A1:F3');
  assert.equal(sheet.pageSetup.printTitlesRow,'1:1');
  assert.match(sheet.headerFooter.oddHeader,/Oficina && Debate/);
});

test('planilha de presenças mantém o status anterior e aceita atividade sem registros', async () => {
  const report = await buildActivityWorkbook('presencas','Oficina',async offset=>rows.slice(offset));
  const sheet = await reopen(report.bytes,'Presenças');
  assert.equal(sheet.getCell('E2').value,'Não confirmou presença');
  const empty = await buildActivityWorkbook('inscritos','Debate',async ()=>[]);
  assert.equal(empty.count,0);
  assert.equal((await reopen(empty.bytes,'Inscritos')).rowCount,1);
});

test('uma falha de consulta impede a entrega de um arquivo parcial', async () => {
  await assert.rejects(buildActivityWorkbook('inscritos','Oficina',async offset=>{
    if (!offset) return rows;
    throw new Error('Sem permissão');
  }),/Sem permissão/);
});
