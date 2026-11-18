// =====================================================================
// xlsx.js — penulis file Excel (.xlsx) kecil + grafik (bar / kolom / pie)
// tanpa library Excel, hanya fflate untuk zip. Dipakai Worker untuk export laporan.
// =====================================================================
import { zipSync, strToU8 } from 'fflate';

const x = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
export const kol = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const ref = (sheet, c1, r1, c2, r2) => `'${sheet.replace(/'/g, "''")}'!$${kol(c1)}$${r1 + 1}:$${kol(c2)}$${r2 + 1}`;

// gaya sel (indeks cellXfs di styles.xml)
export const S = { biasa: 0, head: 1, angka: 2, rp: 3, judul: 4, sub: 5, teks: 6, label: 7, rpTebal: 8, angkaTebal: 9, seksi: 10, tgl: 11 };
const WARNA = ['EE4D2D', 'F39C12', '27AE60', '2980B9', '8E44AD', '16A085', 'C0392B', 'D35400', '2C3E50', '7F8C8D', 'E84393', '00B894'];

export class Lembar {
  constructor(nama) { this.nama = nama.slice(0, 31); this.rows = []; this.lebar = []; this.grafik = []; this.merge = []; this.beku = 0; this.filter = null; }
  set(r, c, v, s = 0) { (this.rows[r] ||= [])[c] = { v, s }; }
  baris(r, vals, s = 0) { vals.forEach((v, c) => { if (v !== undefined) this.set(r, c, v, Array.isArray(s) ? s[c] : s); }); }
  // tabel: header + data, kembalikan posisi untuk grafik
  tabel(r0, c0, headers, data, gaya) {
    headers.forEach((h, i) => this.set(r0, c0 + i, h, S.head));
    data.forEach((row, j) => row.forEach((v, i) => this.set(r0 + 1 + j, c0 + i, v, gaya?.[i] ?? (typeof v === 'number' ? S.angka : S.teks))));
    return { r0, c0, r1: r0 + 1, r2: r0 + data.length, n: data.length };
  }
  // grafik: { jenis:'bar'|'kolom'|'pie', judul, kat:{c,r1,r2}, seri:[{nama, c, warna}], dari:{c,r}, ke:{c,r}, format }
  tambahGrafik(g) { if (g.kat.r2 >= g.kat.r1) this.grafik.push(g); }
}

function nilai(sh, r, c) { const v = sh.rows[r]?.[c]?.v; return v; }

function xmlLembar(sh, idx) {
  const rows = [];
  sh.rows.forEach((row, r) => {
    if (!row) return;
    const cells = [];
    row.forEach((cell, c) => {
      if (!cell) return;
      const a = `${kol(c)}${r + 1}`, s = cell.s ? ` s="${cell.s}"` : '';
      if (cell.v === null || cell.v === undefined || cell.v === '') cells.push(`<c r="${a}"${s}/>`);
      else if (typeof cell.v === 'number' && isFinite(cell.v)) cells.push(`<c r="${a}"${s}><v>${cell.v}</v></c>`);
      else cells.push(`<c r="${a}"${s} t="inlineStr"><is><t xml:space="preserve">${x(cell.v)}</t></is></c>`);
    });
    rows.push(`<row r="${r + 1}">${cells.join('')}</row>`);
  });
  const cols = sh.lebar.length ? `<cols>${sh.lebar.map((w, i) => w ? `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>` : '').join('')}</cols>` : '';
  const pane = sh.beku ? `<pane ySplit="${sh.beku}" topLeftCell="A${sh.beku + 1}" activePane="bottomLeft" state="frozen"/>` : '';
  const view = `<sheetViews><sheetView workbookViewId="0"${idx === 0 ? ' tabSelected="1"' : ''} zoomScale="90">${pane}</sheetView></sheetViews>`;
  const af = sh.filter ? `<autoFilter ref="${sh.filter}"/>` : '';
  const mg = sh.merge.length ? `<mergeCells count="${sh.merge.length}">${sh.merge.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
  const dr = sh.grafik.length ? '<drawing r:id="rId1"/>' : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${view}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows.join('')}</sheetData>${af}${mg}<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>${dr}</worksheet>`;
}

function strCache(sh, c, r1, r2) {
  const pts = []; for (let r = r1; r <= r2; r++) pts.push(`<c:pt idx="${r - r1}"><c:v>${x(nilai(sh, r, c))}</c:v></c:pt>`);
  return `<c:strCache><c:ptCount val="${r2 - r1 + 1}"/>${pts.join('')}</c:strCache>`;
}
function numCache(sh, c, r1, r2) {
  const pts = []; for (let r = r1; r <= r2; r++) { const v = nilai(sh, r, c); if (typeof v === 'number') pts.push(`<c:pt idx="${r - r1}"><c:v>${v}</c:v></c:pt>`); }
  return `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${r2 - r1 + 1}"/>${pts.join('')}</c:numCache>`;
}
const teksRich = (t, sz = 1200) => `<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${sz}" b="1"/></a:pPr><a:r><a:rPr lang="id-ID" sz="${sz}" b="1"/><a:t>${x(t)}</a:t></a:r></a:p></c:rich></c:tx>`;
const isi = w => `<c:spPr><a:solidFill><a:srgbClr val="${w}"/></a:solidFill></c:spPr>`;
const fontKecil = `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"/></a:pPr><a:endParaRPr lang="id-ID"/></a:p></c:txPr>`;

function xmlGrafik(sh, g) {
  const { kat } = g, fmt = g.format || '#,##0';
  const katRef = `<c:cat><c:strRef><c:f>${x(ref(sh.nama, kat.c, kat.r1, kat.c, kat.r2))}</c:f>${strCache(sh, kat.c, kat.r1, kat.r2)}</c:strRef></c:cat>`;
  const seri = (s, i, pie) => {
    const n = kat.r2 - kat.r1 + 1;
    const dpt = pie ? Array.from({ length: n }, (_, k) => `<c:dPt><c:idx val="${k}"/><c:bubble3D val="0"/>${isi(WARNA[k % WARNA.length])}</c:dPt>`).join('') : '';
    const lbl = pie
      ? `<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${fontKecil}<c:dLblPos val="bestFit"/><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/><c:showLeaderLines val="1"/></c:dLbls>`
      : `<c:dLbls><c:numFmt formatCode="${x(fmt)}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${fontKecil}<c:dLblPos val="outEnd"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>`;
    return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:v>${x(s.nama)}</c:v></c:tx>${pie ? '' : isi(s.warna || WARNA[i])}${pie ? '' : '<c:invertIfNegative val="0"/>'}${dpt}${lbl}${katRef}<c:val><c:numRef><c:f>${x(ref(sh.nama, s.c, kat.r1, s.c, kat.r2))}</c:f>${numCache(sh, s.c, kat.r1, kat.r2)}</c:numRef></c:val></c:ser>`;
  };
  let plot, legend = '';
  if (g.jenis === 'pie') {
    plot = `<c:pieChart><c:varyColors val="1"/>${seri(g.seri[0], 0, true)}<c:firstSliceAng val="0"/></c:pieChart>`;
    legend = `<c:legend><c:legendPos val="r"/><c:overlay val="0"/>${fontKecil}</c:legend>`;
  } else {
    const bar = g.jenis === 'bar';
    plot = `<c:barChart><c:barDir val="${bar ? 'bar' : 'col'}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${g.seri.map((s, i) => seri(s, i, false)).join('')}<c:gapWidth val="60"/><c:axId val="5001"/><c:axId val="5002"/></c:barChart>
<c:catAx><c:axId val="5001"/><c:scaling><c:orientation val="${bar ? 'maxMin' : 'minMax'}"/></c:scaling><c:delete val="0"/><c:axPos val="${bar ? 'l' : 'b'}"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${fontKecil}<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>
<c:valAx><c:axId val="5002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${bar ? 'b' : 'l'}"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E5E5E5"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${x(fmt)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${fontKecil}<c:crossAx val="5001"/><c:crosses val="${bar ? 'max' : 'autoZero'}"/><c:crossBetween val="between"/></c:valAx>`;
    if (g.seri.length > 1) legend = `<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${fontKecil}</c:legend>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:roundedCorners val="0"/><c:chart><c:title>${teksRich(g.judul)}<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${plot}</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`;
}

function xmlDrawing(sh, idAwal) {
  const a = sh.grafik.map((g, i) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${g.dari.c}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${g.dari.r}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${g.ke.c}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${g.ke.r}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Grafik ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${a}</xdr:wsDr>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;Rp&quot;#,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
<fonts count="6"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="16"/><color rgb="FFEE4D2D"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="9"/><color rgb="FF7F7F7F"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FFC0392B"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEE4D2D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDECEA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="3" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function buatXlsx(lembar) {
  const f = {}, ct = [], wbSheets = [], wbRels = [], dn = [];
  let nGrafik = 0, nDraw = 0;
  lembar.forEach((sh, i) => {
    const n = i + 1;
    f[`xl/worksheets/sheet${n}.xml`] = xmlLembar(sh, i);
    ct.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    wbSheets.push(`<sheet name="${x(sh.nama)}" sheetId="${n}" r:id="rId${n}"/>`);
    wbRels.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`);
    if (sh.filter) dn.push(`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(sh.nama)}'!${sh.filter.split(':').map(a => a.replace(/([A-Z]+)(\d+)/, '$$$1$$$2')).join(':')}</definedName>`);
    if (sh.grafik.length) {
      const d = ++nDraw;
      f[`xl/worksheets/_rels/sheet${n}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${d}.xml"/></Relationships>`;
      f[`xl/drawings/drawing${d}.xml`] = xmlDrawing(sh);
      ct.push(`<Override PartName="/xl/drawings/drawing${d}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
      const rels = sh.grafik.map((g, k) => {
        const cn = ++nGrafik;
        f[`xl/charts/chart${cn}.xml`] = xmlGrafik(sh, g);
        ct.push(`<Override PartName="/xl/charts/chart${cn}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
        return `<Relationship Id="rId${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${cn}.xml"/>`;
      });
      f[`xl/drawings/_rels/drawing${d}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
    }
  });
  const nS = lembar.length;
  wbRels.push(`<Relationship Id="rId${nS + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
  f['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${wbSheets.join('')}</sheets>${dn.length ? `<definedNames>${dn.join('')}</definedNames>` : ''}</workbook>`;
  f['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRels.join('')}</Relationships>`;
  f['xl/styles.xml'] = STYLES;
  f['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  f['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ct.join('')}</Types>`;
  const z = {}; for (const [k, v] of Object.entries(f)) z[k] = strToU8(v);
  return zipSync(z, { level: 6 });
}
