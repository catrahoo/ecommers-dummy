// =====================================================================
// laporan.js — query & tata letak file Excel "Laporan Penjualan"
// =====================================================================
import { Lembar, S, buatXlsx, kol } from './xlsx.js';

const JKT = `(o.created_at::timestamptz AT TIME ZONE 'Asia/Jakarta')`;
const AWAL = { hari: `date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta')`, minggu: `date_trunc('week', now() AT TIME ZONE 'Asia/Jakarta')`, bulan: `date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta')` };
const memberTop = p => `SELECT pr.nama, pr.kota, pr.no_hp, count(*) n, sum(o.total) belanja FROM orders o JOIN profiles pr ON pr.id = o.member_id
  WHERE o.status <> 'batal' AND ${JKT} >= ${AWAL[p]} GROUP BY pr.id, pr.nama, pr.kota, pr.no_hp ORDER BY n DESC, belanja DESC LIMIT 10`;

export const QUERY = {
  kpi: `SELECT (SELECT count(*) FROM profiles WHERE role = 'member') member,
      (SELECT count(*) FROM orders) pesanan,
      (SELECT count(*) FROM orders WHERE status = 'selesai') selesai,
      (SELECT count(*) FROM orders WHERE status = 'batal') batal,
      (SELECT count(*) FROM orders WHERE status IN ('menunggu','dikonfirmasi','dikirim')) proses,
      (SELECT coalesce(sum(total),0) FROM orders WHERE status IN ('dikonfirmasi','dikirim','selesai')) omzet,
      (SELECT count(*) FROM orders WHERE kurir = 'GoSend' AND status <> 'batal') gosend,
      (SELECT count(*) FROM orders WHERE kurir <> 'GoSend' AND status <> 'batal') jnt,
      (SELECT coalesce(sum(poin),0) FROM profiles) poin,
      (SELECT count(*) FROM redemptions WHERE status = 'disetujui') tukar_ok,
      (SELECT count(*) FROM redemptions WHERE status = 'menunggu') tukar_tunggu,
      (SELECT count(DISTINCT member_id) FROM keranjang) member_keranjang,
      (SELECT coalesce(sum(qty * harga),0) FROM keranjang) nilai_keranjang`,
  bulanan: `SELECT to_char(${JKT}, 'YYYY-MM') bln, count(*) n, sum(o.total) omzet FROM orders o
      WHERE o.status IN ('dikonfirmasi','dikirim','selesai') GROUP BY 1 ORDER BY 1 DESC LIMIT 12`,
  terlaris: `SELECT max(i->>'nama') nama, sum((i->>'qty')::int * coalesce((i->>'isi')::int,1)) qty, count(DISTINCT o.id) n,
      sum((i->>'qty')::int * (i->>'harga')::int) omzet
      FROM orders o, jsonb_array_elements(o.items::jsonb) i WHERE o.status <> 'batal'
      GROUP BY (i->>'id') ORDER BY qty DESC LIMIT 15`,
  diinginkan: `SELECT p.nama, count(DISTINCT k.member_id) member, sum(k.qty * k.isi) qty, sum(k.qty * k.harga) nilai, max(k.updated_at) terakhir
      FROM keranjang k JOIN products p ON p.id = k.product_id GROUP BY p.id, p.nama ORDER BY member DESC, qty DESC LIMIT 15`,
  termurah: `SELECT nama, harga, harga_slof, harga_ball FROM products WHERE aktif = 1 AND harga > 0 ORDER BY harga ASC, nama LIMIT 10`,
  termahal: `SELECT nama, harga, harga_slof, harga_ball FROM products WHERE aktif = 1 ORDER BY harga DESC, nama LIMIT 10`,
  kota: `SELECT coalesce(nullif(o.penerima_kota,''),'(GoSend / titik peta)') kota, count(*) n, count(DISTINCT o.member_id) m, sum(o.total) omzet
      FROM orders o WHERE o.status <> 'batal' GROUP BY 1 ORDER BY n DESC`,
  top_hari: memberTop('hari'), top_minggu: memberTop('minggu'), top_bulan: memberTop('bulan'),
  pesanan: `SELECT o.kode, o.created_at, pr.nama member, o.penerima_kota kota, o.kurir, o.layanan, o.subtotal, o.ongkir, o.potongan_poin, o.total,
      o.status, o.status_bayar, o.metode_bayar, o.resi FROM orders o LEFT JOIN profiles pr ON pr.id = o.member_id ORDER BY o.created_at DESC`,
  member: `SELECT pr.nama, pr.email, pr.no_hp, pr.kota, pr.kecamatan, pr.poin,
      (SELECT count(*) FROM orders o WHERE o.member_id = pr.id AND o.status <> 'batal') n,
      (SELECT coalesce(sum(total),0) FROM orders o WHERE o.member_id = pr.id AND o.status <> 'batal') belanja, pr.created_at
      FROM profiles pr WHERE pr.role = 'member' ORDER BY belanja DESC`,
};

const N = v => (v === null || v === undefined || v === '') ? 0 : Number(v);
const tglExcel = iso => { const t = Date.parse(iso); return isFinite(t) ? (t + 7 * 3600e3) / 86400000 + 25569 : ''; }; // serial Excel, WIB
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const namaBln = s => { const [y, m] = String(s || '').split('-'); return m ? `${BLN[+m - 1]} ${y}` : String(s || ''); };

export function susunLaporan(d, toko) {
  const now = new Date(Date.now() + 7 * 3600e3);
  const stempel = now.toISOString().slice(0, 16).replace('T', ' ') + ' WIB';
  const k = d.kpi[0] || {};
  const kepala = (sh, judul) => { sh.set(0, 0, judul, S.judul); sh.set(1, 0, `${toko} · dibuat ${stempel}`, S.sub); };

  // 1) RINGKASAN
  const r = new Lembar('Ringkasan'); kepala(r, 'Laporan Penjualan'); r.lebar = [40, 20, 3, 12, 12, 18];
  const kpi = [
    ['Total member', N(k.member), S.angkaTebal], ['Total pesanan', N(k.pesanan), S.angkaTebal], ['Pesanan selesai', N(k.selesai), S.angkaTebal],
    ['Pesanan diproses', N(k.proses), S.angkaTebal], ['Pesanan batal', N(k.batal), S.angkaTebal], ['Omzet (lunas)', N(k.omzet), S.rpTebal],
    ['Rata-rata per pesanan', N(k.selesai) ? Math.round(N(k.omzet) / Math.max(1, N(k.pesanan) - N(k.batal))) : 0, S.rpTebal],
    ['Pengiriman GoSend', N(k.gosend), S.angkaTebal], ['Pengiriman J&T', N(k.jnt), S.angkaTebal], ['Total poin beredar', N(k.poin), S.angkaTebal],
    ['Penukaran hadiah disetujui', N(k.tukar_ok), S.angkaTebal], ['Penukaran menunggu', N(k.tukar_tunggu), S.angkaTebal],
    ['Member dengan keranjang belum checkout', N(k.member_keranjang), S.angkaTebal], ['Nilai keranjang belum checkout', N(k.nilai_keranjang), S.rpTebal],
  ];
  r.set(3, 0, 'Indikator', S.head); r.set(3, 1, 'Nilai', S.head);
  kpi.forEach(([a, b, s], i) => { r.set(4 + i, 0, a, S.label); r.set(4 + i, 1, b, s); });
  const bl = [...d.bulanan].reverse();
  r.set(3, 3, 'Omzet per bulan', S.seksi);
  const tb = r.tabel(4, 3, ['Bulan', 'Pesanan', 'Omzet'], bl.map(b => [namaBln(b.bln), N(b.n), N(b.omzet)]), [S.teks, S.angka, S.rp]);
  r.tambahGrafik({ jenis: 'kolom', judul: 'Omzet per Bulan', kat: { c: 3, r1: tb.r1, r2: tb.r2 }, seri: [{ nama: 'Omzet', c: 5 }], format: '"Rp"#,##0,,"jt"', dari: { c: 7, r: 3 }, ke: { c: 15, r: 19 } });
  const kr = { c: 3, r1: tb.r2 + 3 };
  r.set(kr.r1 - 1, 3, 'Kurir', S.seksi);
  const tk = r.tabel(kr.r1, 3, ['Kurir', 'Pesanan'], [['GoSend', N(k.gosend)], ['J&T', N(k.jnt)]], [S.teks, S.angka]);
  r.tambahGrafik({ jenis: 'pie', judul: 'Porsi Kurir', kat: { c: 3, r1: tk.r1, r2: tk.r2 }, seri: [{ nama: 'Pesanan', c: 4 }], dari: { c: 7, r: 20 }, ke: { c: 13, r: 36 } });

  // 2) PRODUK TERLARIS
  const t = new Lembar('Produk Terlaris'); kepala(t, 'Produk Paling Laku'); t.lebar = [6, 32, 14, 14, 18];
  t.set(2, 0, 'Dihitung dari semua pesanan yang tidak batal (qty dalam pack)', S.sub);
  const tt = t.tabel(3, 0, ['No', 'Produk', 'Terjual (pack)', 'Jumlah pesanan', 'Omzet'], d.terlaris.map((p, i) => [i + 1, p.nama, N(p.qty), N(p.n), N(p.omzet)]), [S.angka, S.teks, S.angka, S.angka, S.rp]);
  t.tambahGrafik({ jenis: 'bar', judul: 'Top 15 Produk Terlaris (pack)', kat: { c: 1, r1: tt.r1, r2: tt.r2 }, seri: [{ nama: 'Terjual (pack)', c: 2 }], dari: { c: 6, r: 2 }, ke: { c: 16, r: 26 } });
  t.tambahGrafik({ jenis: 'bar', judul: 'Omzet per Produk', kat: { c: 1, r1: tt.r1, r2: tt.r2 }, seri: [{ nama: 'Omzet', c: 4, warna: 'F39C12' }], format: '"Rp"#,##0,,"jt"', dari: { c: 6, r: 27 }, ke: { c: 16, r: 51 } });

  // 3) PALING DIINGINKAN
  const w = new Lembar('Paling Diinginkan'); kepala(w, 'Produk Paling Diinginkan'); w.lebar = [6, 32, 16, 16, 18, 18];
  w.set(2, 0, 'Produk yang sudah masuk keranjang member tapi belum di-checkout', S.sub);
  const tw = w.tabel(3, 0, ['No', 'Produk', 'Jumlah member', 'Qty di keranjang (pack)', 'Nilai potensi', 'Terakhir ditambah'],
    d.diinginkan.map((p, i) => [i + 1, p.nama, N(p.member), N(p.qty), N(p.nilai), tglExcel(p.terakhir)]), [S.angka, S.teks, S.angka, S.angka, S.rp, S.tgl]);
  w.tambahGrafik({ jenis: 'bar', judul: 'Paling Diinginkan (jumlah member)', kat: { c: 1, r1: tw.r1, r2: tw.r2 }, seri: [{ nama: 'Member', c: 2, warna: '8E44AD' }], dari: { c: 7, r: 2 }, ke: { c: 16, r: 26 } });
  w.tambahGrafik({ jenis: 'bar', judul: 'Nilai Potensi Penjualan', kat: { c: 1, r1: tw.r1, r2: tw.r2 }, seri: [{ nama: 'Nilai potensi', c: 4, warna: '16A085' }], format: '"Rp"#,##0', dari: { c: 7, r: 27 }, ke: { c: 16, r: 51 } });

  // 4) HARGA
  const h = new Lembar('Harga Termurah & Termahal'); kepala(h, 'Produk Termurah & Termahal'); h.lebar = [6, 30, 14, 14, 16];
  h.set(3, 0, '10 produk termurah (harga per pack)', S.seksi);
  const hm = h.tabel(4, 0, ['No', 'Produk', 'Harga pack', 'Harga slof', 'Harga ball'], d.termurah.map((p, i) => [i + 1, p.nama, N(p.harga), N(p.harga_slof), N(p.harga_ball)]), [S.angka, S.teks, S.rp, S.rp, S.rp]);
  const r2 = hm.r2 + 3;
  h.set(r2 - 1, 0, '10 produk termahal (harga per pack)', S.seksi);
  const hx = h.tabel(r2, 0, ['No', 'Produk', 'Harga pack', 'Harga slof', 'Harga ball'], d.termahal.map((p, i) => [i + 1, p.nama, N(p.harga), N(p.harga_slof), N(p.harga_ball)]), [S.angka, S.teks, S.rp, S.rp, S.rp]);
  h.tambahGrafik({ jenis: 'bar', judul: '10 Termurah (Rp/pack)', kat: { c: 1, r1: hm.r1, r2: hm.r2 }, seri: [{ nama: 'Harga pack', c: 2, warna: '27AE60' }], format: '"Rp"#,##0', dari: { c: 6, r: 2 }, ke: { c: 15, r: 20 } });
  h.tambahGrafik({ jenis: 'bar', judul: '10 Termahal (Rp/pack)', kat: { c: 1, r1: hx.r1, r2: hx.r2 }, seri: [{ nama: 'Harga pack', c: 2, warna: 'C0392B' }], format: '"Rp"#,##0', dari: { c: 6, r: 21 }, ke: { c: 15, r: 39 } });

  // 5) KOTA
  const c = new Lembar('Kota Terbanyak'); kepala(c, 'Kota dengan Order Terbanyak'); c.lebar = [6, 28, 14, 14, 18];
  const tc = c.tabel(3, 0, ['No', 'Kota', 'Jumlah order', 'Jumlah member', 'Omzet'], d.kota.map((p, i) => [i + 1, p.kota, N(p.n), N(p.m), N(p.omzet)]), [S.angka, S.teks, S.angka, S.angka, S.rp]);
  c.tambahGrafik({ jenis: 'bar', judul: 'Jumlah Order per Kota', kat: { c: 1, r1: tc.r1, r2: tc.r2 }, seri: [{ nama: 'Order', c: 2, warna: '2980B9' }], dari: { c: 6, r: 2 }, ke: { c: 15, r: 20 } });
  c.tambahGrafik({ jenis: 'pie', judul: 'Porsi Order per Kota', kat: { c: 1, r1: tc.r1, r2: tc.r2 }, seri: [{ nama: 'Order', c: 2 }], dari: { c: 6, r: 21 }, ke: { c: 15, r: 40 } });

  // 6) MEMBER TERATAS (hari / minggu / bulan)
  const m = new Lembar('Member Teratas'); kepala(m, 'Member Paling Banyak Order'); m.lebar = [5, 26, 14, 15, 10, 16, 2, 5, 26, 14, 10, 16, 2, 5, 26, 14, 10, 16];
  const blok = [['Hari ini', d.top_hari], ['Minggu ini (mulai Senin)', d.top_minggu], ['Bulan ini', d.top_bulan]];
  const pos = [0, 7, 13];
  let tinggi = 0;
  blok.forEach(([judul, rows], b) => {
    const c0 = pos[b];
    m.set(3, c0, judul, S.seksi);
    const head = b === 0 ? ['No', 'Member', 'Kota', 'No. HP', 'Order', 'Belanja'] : ['No', 'Member', 'Kota', 'Order', 'Belanja'];
    const data = rows.length ? rows.map((p, i) => b === 0 ? [i + 1, p.nama, p.kota, p.no_hp, N(p.n), N(p.belanja)] : [i + 1, p.nama, p.kota, N(p.n), N(p.belanja)]) : [['-', 'Belum ada pesanan', '', ...(b === 0 ? [''] : []), 0, 0]];
    const tm = m.tabel(4, c0, head, data, b === 0 ? [S.angka, S.teks, S.teks, S.teks, S.angka, S.rp] : [S.angka, S.teks, S.teks, S.angka, S.rp]);
    tinggi = Math.max(tinggi, tm.r2);
    if (rows.length) m.tambahGrafik({ jenis: 'bar', judul: `Order Terbanyak — ${judul}`, kat: { c: c0 + 1, r1: tm.r1, r2: tm.r2 }, seri: [{ nama: 'Order', c: c0 + (b === 0 ? 4 : 3), warna: ['EE4D2D', 'F39C12', '2980B9'][b] }], dari: { c: c0, r: 16 }, ke: { c: c0 + (b === 0 ? 6 : 5), r: 34 } });
  });

  // 7) DATA PESANAN
  const p = new Lembar('Data Pesanan'); p.lebar = [18, 17, 24, 14, 10, 12, 13, 11, 11, 13, 13, 11, 10, 16]; p.beku = 1;
  const tp = p.tabel(0, 0, ['Kode', 'Tanggal', 'Member', 'Kota', 'Kurir', 'Layanan', 'Subtotal', 'Ongkir', 'Potongan poin', 'Total', 'Status', 'Bayar', 'Metode', 'Resi'],
    d.pesanan.map(o => [o.kode, tglExcel(o.created_at), o.member, o.kota, o.kurir, o.layanan, N(o.subtotal), N(o.ongkir), N(o.potongan_poin), N(o.total), o.status, o.status_bayar, o.metode_bayar, o.resi]),
    [S.teks, S.tgl, S.teks, S.teks, S.teks, S.teks, S.rp, S.rp, S.rp, S.rp, S.teks, S.teks, S.teks, S.teks]);
  p.filter = `A1:${kol(13)}${tp.r2 + 1}`;

  // 8) DATA MEMBER
  const dm = new Lembar('Data Member'); dm.lebar = [24, 32, 15, 12, 16, 10, 10, 15, 17]; dm.beku = 1;
  const tdm = dm.tabel(0, 0, ['Nama', 'Email', 'No. HP', 'Kota', 'Kecamatan', 'Poin', 'Order', 'Total belanja', 'Terdaftar'],
    d.member.map(a => [a.nama, a.email, a.no_hp, a.kota, a.kecamatan, N(a.poin), N(a.n), N(a.belanja), tglExcel(a.created_at)]),
    [S.teks, S.teks, S.teks, S.teks, S.teks, S.angka, S.angka, S.rp, S.tgl]);
  dm.filter = `A1:${kol(8)}${tdm.r2 + 1}`;

  return buatXlsx([r, t, w, h, c, m, p, dm]);
}
