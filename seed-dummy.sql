-- =====================================================================
-- E-COMMERS DUMMY — data demo presentasi
-- 200 member + transaksi random + poin random + penukaran hadiah random
-- Semua member memakai password yang sama (diberikan terpisah). Contoh login: ID MEMBER1
-- Jalankan SETELAH schema.sql dan seed.sql. Aman diulang: data dummy lama dihapus dulu.
-- =====================================================================
DO $$
DECLARE
  admin_id text := '751f3bc6-ac03-4248-96fc-7de1b9da82b1';
  pw text := 'pbkdf2$100000$4ZDTlG2xCaU8WO1rK+7sdg==$IayjmjJM9mKZLnBn+5ooGCS6x7aA9lMsuUdbaGi/qog=';
  depan text[] := ARRAY['Budi','Siti','Agus','Dewi','Rudi','Rina','Andi','Wati','Joko','Sri','Eko','Yuni','Hendra','Lina','Bambang','Ani','Fajar','Nur','Dimas','Putri','Rizki','Ayu','Arif','Indah','Teguh','Maya','Bayu','Fitri','Yoga','Desi','Hadi','Rani','Irfan','Lestari','Wahyu','Novi','Slamet','Endah','Gilang','Ratna'];
  belakang text[] := ARRAY['Santoso','Wijaya','Saputra','Rahayu','Pratama','Hidayat','Kusuma','Setiawan','Lestari','Nugroho','Susanto','Purnomo','Wibowo','Handoko','Maulana','Firmansyah','Ramadhan','Permata','Anggraini','Prasetyo'];
  jalan text[] := ARRAY['Jl. Raya Menganti','Jl. Kedurus','Jl. Wiyung','Jl. Lakarsantri','Jl. Karang Pilang','Jl. Jemursari','Jl. Ketintang','Jl. Rungkut Madya','Jl. Ahmad Yani','Jl. Darmo Permai','Jl. Mayjen Sungkono','Jl. Kenjeran','Jl. Gresik Kota Baru','Jl. Raya Driyorejo','Jl. Raya Waru'];
  -- kota, kecamatan, kodepos, lat, lng, tarif J&T/kg
  wil_kota text[] := ARRAY['Gresik','Gresik','Gresik','Surabaya','Surabaya','Surabaya','Surabaya','Surabaya','Surabaya','Sidoarjo','Sidoarjo','Malang','Jakarta'];
  wil_kec  text[] := ARRAY['Menganti','Driyorejo','Kebomas','Wiyung','Lakarsantri','Karang Pilang','Wonokromo','Rungkut','Sukolilo','Waru','Taman','Lowokwaru','Kebayoran Baru'];
  wil_kp   text[] := ARRAY['61174','61177','61124','60228','60213','60221','60243','60293','60111','61256','61257','65141','12110'];
  wil_lat  float8[] := ARRAY[-7.2618,-7.3640,-7.1690,-7.3120,-7.3070,-7.3410,-7.3010,-7.3260,-7.2880,-7.3560,-7.3530,-7.9420,-6.2440];
  wil_lng  float8[] := ARRAY[112.5673,112.6230,112.6280,112.6870,112.6310,112.7120,112.7380,112.7810,112.7920,112.7290,112.6880,112.6240,106.8000];
  wil_tarif int[] := ARRAY[8000,8000,8000,8000,8000,8000,8000,8000,8000,9000,9000,12000,18000];
  toko_lat float8 := -7.261802; toko_lng float8 := 112.567277;
  prod_ids int[]; rw record; m record;
  i int; j int; k int; w int; n_order int; seq int := 0;
  mid text; nm text; em text; hp text; t_member timestamptz; t timestamptz; t_last timestamptz;
  items jsonb; sub int; berat int; pid int; pr record; sat text; isi int; harga int; qty int;
  kurir text; layanan text; ongkir int; etd text; tujuan text; la float8; lo float8; km float8;
  st text; stb text; resi text; kode text; saldo int; dapat int; pakai int; tot int; mb text;
  r_id int; r_nama text; r_poin int; r_st text;
BEGIN
  PERFORM setseed(0.4141);
  -- bersihkan data dummy lama (admin & produk tetap)
  DELETE FROM keranjang; DELETE FROM redemptions; DELETE FROM point_logs; DELETE FROM orders; DELETE FROM proses_sekali;
  DELETE FROM auth_users WHERE id <> admin_id; DELETE FROM rewards;
  UPDATE counters SET value = 0 WHERE name = 'order_kode';
  UPDATE products SET stok = 5000;

  -- program hadiah / tukar poin
  INSERT INTO rewards (nama, deskripsi, poin, stok, aktif) VALUES
    ('Korek Gas Eksklusif', 'Korek gas logo toko', 150, 300, 1),
    ('Asbak Keramik', 'Asbak keramik motif', 300, 200, 1),
    ('Gantungan Kunci', 'Gantungan kunci akrilik', 100, 400, 1),
    ('Topi Snapback', 'Topi branded toko', 750, 120, 1),
    ('Kaos Premium', 'Kaos katun combed 30s', 1200, 100, 1),
    ('Payung Lipat', 'Payung lipat 3 susun', 900, 80, 1),
    ('Voucher Belanja Rp25.000', 'Potong belanja berikutnya', 500, 500, 1),
    ('Jaket Parasut', 'Jaket parasut waterproof', 2500, 40, 1);

  SELECT array_agg(id ORDER BY id) INTO prod_ids FROM products WHERE aktif = 1;

  FOR i IN 1..200 LOOP
    mid := gen_random_uuid()::text;
    nm := depan[1 + floor(random()*array_length(depan,1))::int] || ' ' || belakang[1 + floor(random()*array_length(belakang,1))::int];
    em := CASE WHEN i <= 3 THEN 'member' || i || '@ecommersdummy.com'
               ELSE lower(replace(nm,' ','.')) || i || '@gmail.com' END;
    hp := '08' || (ARRAY['12','13','21','52','57','77','78','95','96','98'])[1 + floor(random()*10)::int] || lpad(floor(random()*100000000)::text, 8, '0');
    w := 1 + floor(random()*array_length(wil_kota,1))::int;
    t_member := now() - (interval '1 day' * (20 + random()*160)) ;
    INSERT INTO auth_users (id, email, pass_hash, created_at) VALUES (mid, em, pw, to_char(t_member AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
    INSERT INTO profiles (id, nama, no_hp, email, alamat, kota, kecamatan, kodepos, role, poin, created_at)
      VALUES (mid, nm, hp, em, jalan[1 + floor(random()*array_length(jalan,1))::int] || ' No. ' || (1 + floor(random()*150)::int) || ', RT 0' || (1+floor(random()*9)::int) || '/RW 0' || (1+floor(random()*9)::int),
              wil_kota[w], wil_kec[w], wil_kp[w], 'member', 0, to_char(t_member AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));

    saldo := 0;
    n_order := floor(random()*13)::int;        -- 0..12 transaksi per member
    t := t_member;
    FOR j IN 1..n_order LOOP
      t := t + interval '1 hour' * (6 + random() * greatest(24, extract(epoch FROM (now() - t)) / 3600 / (n_order - j + 2)));
      EXIT WHEN t > now() - interval '30 minutes';
      -- item belanja
      items := '[]'::jsonb; sub := 0; berat := 0;
      FOR k IN 1..(1 + floor(random()*4)::int) LOOP
        pid := prod_ids[1 + floor(random()*array_length(prod_ids,1))::int];
        SELECT * INTO pr FROM products WHERE id = pid;
        IF random() < 0.15 AND pr.harga_slof IS NOT NULL THEN sat := 'slof'; isi := pr.isi_slof; harga := pr.harga_slof; qty := 1 + floor(random()*2)::int;
        ELSE sat := 'pack'; isi := 1; harga := pr.harga; qty := 1 + floor(random()*5)::int; END IF;
        items := items || jsonb_build_object('id', pr.id, 'nama', pr.nama, 'satuan', sat, 'isi', isi, 'harga', harga, 'qty', qty, 'berat', pr.berat_gram * isi);
        sub := sub + harga * qty; berat := berat + pr.berat_gram * isi * qty;
      END LOOP;
      -- kurir: GoSend untuk wilayah ≤ 40 km (60%), sisanya J&T
      la := wil_lat[w] + (random()-0.5)*0.03; lo := wil_lng[w] + (random()-0.5)*0.03;
      km := 2 * 6371 * asin(sqrt(sin(radians(la - toko_lat)/2)^2 + cos(radians(toko_lat))*cos(radians(la))*sin(radians(lo - toko_lng)/2)^2)) * 1.3;
      IF km <= 40 AND random() < 0.6 THEN
        kurir := 'GoSend'; layanan := 'Instant';
        ongkir := least(80000, least(ceil(greatest(km,1))::int, 20) * 2500 + greatest(0, ceil(greatest(km,1))::int - 20) * 3000);
        etd := to_char(km, 'FM990.0') || ' km · 1–3 jam'; tujuan := to_char(la,'FM990.000000') || ',' || to_char(lo,'FM9990.000000');
      ELSE
        kurir := 'J&T'; layanan := 'EZ';
        ongkir := greatest(1, ceil((berat - 300) / 1000.0)::int) * wil_tarif[w];
        etd := CASE WHEN wil_tarif[w] <= 9000 THEN '1-2 hari' ELSE '2-4 hari' END; tujuan := '';
      END IF;
      -- status
      IF t < now() - interval '3 days' THEN
        st := (ARRAY['selesai','selesai','selesai','selesai','selesai','selesai','selesai','selesai','selesai','batal'])[1 + floor(random()*10)::int];
      ELSE
        st := (ARRAY['menunggu','dikonfirmasi','dikirim','dikirim','selesai'])[1 + floor(random()*5)::int];
      END IF;
      stb := CASE WHEN st IN ('selesai','dikirim','dikonfirmasi') THEN 'lunas' ELSE 'belum' END;
      resi := CASE WHEN st IN ('dikirim','selesai') THEN CASE WHEN kurir = 'J&T' THEN 'JX' || lpad(floor(random()*1e10)::bigint::text, 10, '0') ELSE 'GK-' || lpad(floor(random()*1e8)::bigint::text, 8, '0') END ELSE '' END;
      mb := CASE WHEN random() < 0.65 THEN 'qris' ELSE 'transfer' END;
      -- tukar poin jadi potongan (kadang-kadang, belanja ≥ 100rb)
      pakai := 0;
      IF st <> 'batal' AND sub >= 100000 AND saldo >= 50 AND random() < 0.2 THEN pakai := least(saldo, sub + ongkir); END IF;
      tot := sub + ongkir - pakai;
      seq := seq + 1;
      kode := 'ORD' || to_char(t AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || lpad(seq::text, 5, '0');
      INSERT INTO orders (kode, member_id, items, subtotal, berat_gram, kurir, layanan, ongkir, etd, total,
          penerima_nama, penerima_hp, penerima_alamat, penerima_kota, penerima_kecamatan, penerima_kodepos, tujuan_id,
          status, resi, metode_bayar, status_bayar, poin_dipakai, potongan_poin, dicetak_at, created_at)
        SELECT kode, mid, items::text, sub, berat, kurir, layanan, ongkir, etd, tot,
          p.nama, p.no_hp, p.alamat, p.kota, p.kecamatan, p.kodepos, tujuan,
          st, resi, mb, stb, pakai, pakai,
          CASE WHEN resi <> '' THEN to_char((t + interval '5 hour') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END,
          to_char(t AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        FROM profiles p WHERE p.id = mid;
      IF st <> 'batal' THEN
        FOR k IN 0..jsonb_array_length(items)-1 LOOP
          UPDATE products SET stok = stok - ((items->k->>'qty')::int * (items->k->>'isi')::int) WHERE id = (items->k->>'id')::int;
        END LOOP;
      END IF;
      IF pakai > 0 THEN
        saldo := saldo - pakai;
        INSERT INTO point_logs (member_id, delta, saldo_akhir, keterangan, oleh, created_at)
          VALUES (mid, -pakai, saldo, 'Tukar poin jadi potongan harga pesanan ' || kode, mid, to_char(t AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
      END IF;
      -- poin belanja (1 poin tiap Rp1.000) diberikan saat pesanan selesai
      IF st = 'selesai' THEN
        dapat := floor(sub / 1000.0)::int;
        IF random() < 0.15 THEN dapat := dapat + (ARRAY[50,100,200])[1 + floor(random()*3)::int]; END IF;   -- bonus program
        saldo := saldo + dapat;
        INSERT INTO point_logs (member_id, delta, saldo_akhir, keterangan, oleh, created_at)
          VALUES (mid, dapat, saldo, 'Poin belanja pesanan ' || kode, admin_id, to_char((t + interval '2 day') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
        -- tukar hadiah (random)
        IF random() < 0.35 THEN
          SELECT id, nama, poin INTO r_id, r_nama, r_poin FROM rewards WHERE poin <= saldo AND stok > 0 ORDER BY random() LIMIT 1;
          IF r_id IS NOT NULL THEN
            r_st := (ARRAY['disetujui','disetujui','disetujui','disetujui','disetujui','disetujui','disetujui','menunggu','menunggu','ditolak'])[1 + floor(random()*10)::int];
            saldo := saldo - r_poin;
            INSERT INTO redemptions (member_id, reward_id, reward_nama, poin, status, catatan_admin, created_at)
              VALUES (mid, r_id, r_nama, r_poin, r_st, CASE r_st WHEN 'disetujui' THEN 'Hadiah sudah diambil di toko' WHEN 'ditolak' THEN 'Stok hadiah sedang kosong' ELSE '' END,
                      to_char((t + interval '3 day') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
            INSERT INTO point_logs (member_id, delta, saldo_akhir, keterangan, oleh, created_at)
              VALUES (mid, -r_poin, saldo, 'Tukar hadiah: ' || r_nama, mid, to_char((t + interval '3 day') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
            IF r_st = 'ditolak' THEN
              saldo := saldo + r_poin;
              INSERT INTO point_logs (member_id, delta, saldo_akhir, keterangan, oleh, created_at)
                VALUES (mid, r_poin, saldo, 'Pengembalian poin (penukaran ditolak): ' || r_nama, admin_id, to_char((t + interval '4 day') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
            ELSE
              UPDATE rewards SET stok = stok - 1 WHERE id = r_id;
            END IF;
            r_id := NULL;
          END IF;
        END IF;
      END IF;
    END LOOP;
    -- poin sambutan member baru (acak)
    IF random() < 0.3 THEN
      dapat := (ARRAY[50,100,150])[1 + floor(random()*3)::int]; saldo := saldo + dapat;
      INSERT INTO point_logs (member_id, delta, saldo_akhir, keterangan, oleh, created_at)
        VALUES (mid, dapat, saldo, 'Bonus program member aktif', admin_id, now_iso());
    END IF;
    UPDATE profiles SET poin = saldo WHERE id = mid;
  END LOOP;
  UPDATE counters SET value = seq WHERE name = 'order_kode';
END $$;

-- 30 pesanan aktif (2 hari terakhir) untuk demo proses admin: menunggu / dikonfirmasi / dikirim
DO $$
DECLARE m record; pr record; st text; t timestamptz; seq int; qty int; kur text; ong int; kode text; lat float8; lng float8; km float8;
BEGIN
  SELECT value INTO seq FROM counters WHERE name='order_kode';
  FOR m IN SELECT * FROM profiles WHERE role='member' ORDER BY random() LIMIT 30 LOOP
    SELECT * INTO pr FROM products WHERE aktif=1 ORDER BY random() LIMIT 1;
    qty := 2 + floor(random()*8)::int; seq := seq + 1;
    t := now() - interval '1 minute' * floor(random()*2880);
    st := (ARRAY['menunggu','menunggu','dikonfirmasi','dikirim','dikirim'])[1+floor(random()*5)::int];
    lat := -7.30 + (random()-0.5)*0.12; lng := 112.66 + (random()-0.5)*0.2;
    km := 2*6371*asin(sqrt(sin(radians(lat+7.261802)/2)^2 + cos(radians(-7.261802))*cos(radians(lat))*sin(radians(lng-112.567277)/2)^2))*1.3;
    IF random() < 0.6 THEN kur := 'GoSend'; ong := least(80000, least(ceil(km)::int,20)*2500 + greatest(0, ceil(km)::int-20)*3000);
    ELSE kur := 'J&T'; ong := 8000; END IF;
    kode := 'ORD' || to_char(t AT TIME ZONE 'Asia/Jakarta','YYMMDD') || lpad(seq::text,5,'0');
    INSERT INTO orders (kode, member_id, items, subtotal, berat_gram, kurir, layanan, ongkir, etd, total, penerima_nama, penerima_hp, penerima_alamat, penerima_kota, penerima_kecamatan, penerima_kodepos, tujuan_id, status, resi, metode_bayar, status_bayar, created_at)
    VALUES (kode, m.id, jsonb_build_array(jsonb_build_object('id',pr.id,'nama',pr.nama,'satuan','pack','isi',1,'harga',pr.harga,'qty',qty,'berat',pr.berat_gram))::text,
      pr.harga*qty, pr.berat_gram*qty, kur, CASE WHEN kur='GoSend' THEN 'Instant' ELSE 'EZ' END, ong,
      CASE WHEN kur='GoSend' THEN to_char(km,'FM990.0')||' km · 1–3 jam' ELSE '1-2 hari' END, pr.harga*qty+ong,
      m.nama, m.no_hp, m.alamat, m.kota, m.kecamatan, m.kodepos,
      CASE WHEN kur='GoSend' THEN to_char(lat,'FM990.000000')||','||to_char(lng,'FM9990.000000') ELSE '' END,
      st, CASE WHEN st='dikirim' THEN CASE WHEN kur='J&T' THEN 'JX'||lpad(floor(random()*1e10)::bigint::text,10,'0') ELSE 'GK-'||lpad(floor(random()*1e8)::bigint::text,8,'0') END ELSE '' END,
      CASE WHEN random()<0.65 THEN 'qris' ELSE 'transfer' END, CASE WHEN st='menunggu' THEN 'belum' ELSE 'lunas' END,
      to_char(t AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
    UPDATE products SET stok = stok - qty WHERE id = pr.id;
  END LOOP;
  UPDATE counters SET value = seq WHERE name='order_kode';
END $$;

-- keranjang yang belum di-checkout (90 member, produk favorit lebih sering muncul)
DELETE FROM keranjang;
INSERT INTO keranjang (member_id, product_id, satuan, isi, harga, qty, updated_at)
SELECT m.id, p.id, CASE WHEN r2 < 0.2 THEN 'slof' ELSE 'pack' END, CASE WHEN r2 < 0.2 THEN p.isi_slof ELSE 1 END,
       CASE WHEN r2 < 0.2 THEN p.harga_slof ELSE p.harga END, 1 + floor(random()*4)::int,
       to_char((now() - interval '1 hour' * floor(random()*336)) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
FROM (SELECT id FROM profiles WHERE role='member' ORDER BY random() LIMIT 90) m
CROSS JOIN LATERAL (SELECT id, isi_slof, harga_slof, harga, random() r2 FROM products WHERE aktif=1
  ORDER BY random() * (CASE WHEN id IN (44,45,48,49,64,65,71) THEN 0.35 ELSE 1 END) + (m.id <> '')::int * 0
  LIMIT (1 + floor(random()*4)::int)) p
ON CONFLICT DO NOTHING;
