-- =====================================================================
-- Data awal E-COMMERS DUMMY (PostgreSQL / Neon) (produk, pengaturan, iklan, tarif manual)
-- Member, pesanan, riwayat poin, hadiah: KOSONG.
-- Akun admin awal → ID: DUMMY (password diberikan terpisah, ganti di menu Ganti password)
-- =====================================================================
INSERT INTO auth_users(id, email, pass_hash) VALUES ('751f3bc6-ac03-4248-96fc-7de1b9da82b1', 'dummy@ecommersdummy.com', 'pbkdf2$100000$En88Y/vwsoNZEB0lRw1CwA==$hzB91GPyyNzqZ3WyzsLJAa9aD8d0fZCI8/BkQeQX1VM=')
ON CONFLICT DO NOTHING;
INSERT INTO profiles(id, nama, email, role, wajib_ganti_pw) VALUES ('751f3bc6-ac03-4248-96fc-7de1b9da82b1', 'Owner Dummy', 'dummy@ecommersdummy.com', 'admin', 0)
ON CONFLICT DO NOTHING;
INSERT INTO products(id, nama, kategori, deskripsi, harga, berat_gram, stok, foto_url, aktif, harga_slof, harga_ball, isi_slof, isi_ball) VALUES
(43,'HS Matcha ice','Rokok','1 slop beda harga',27000,22,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794182470734-93071.jpg',1,260000,2630000,10,100),
(44,'Black Matcha Shiro','Rokok','',35000,22,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794182589874-93077.jpg',1,345000,3400000,10,100),
(45,'Black matcha Kuro','Rokok','',35000,22,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794182685903-93074.jpg',1,345000,3400000,10,100),
(46,'Tanda Tambah Guava','Rokok','',26000,22,99,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794182786249-93068.jpg',1,250000,2420000,10,100),
(47,'3vo matcha','Rokok','Harga 1 slop lebih murah',26000,22,14,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183036536-93084.jpg',1,250000,2480000,10,100),
(48,'Diplomat Hollow Berry rush','Rokok','Harga 1 slop lebih murah',28000,24,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183105095-93088.jpg',1,275000,2730000,10,100),
(49,'Diplomat Hollw Mango Rush','Rokok','Harga 1 slop lebih murah',28000,24,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183253434-93082.jpg',1,275000,2730000,10,100),
(50,'Wismilak Slim Berry Tea','Rokok','Harga 1 slop lebih murah',19000,26,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183410454-93091.jpg',1,178000,1750000,10,100),
(51,'Wismilak Slim Lychee Tea','Rokok','Harga 1 slop lebih murah',19000,26,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183472948-93108.jpg',1,178000,1750000,10,100),
(52,'Maxximil','Rokok','Harga 1 slop lebih murah',25000,22,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183510932-93112.jpg',1,246000,2450000,10,100),
(53,'Black ice Tea','Rokok','Harga 1 slop lebih murah',25000,24,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183554485-93105.jpg',1,249000,2485000,10,100),
(54,'Grow Guava','Rokok','Harga 1 slop lebih murah',24000,20,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183631856-93128.jpg',1,239000,2370000,10,100),
(55,'Grow Watermelon','Rokok','Harga 1 slop lebih murah',24000,20,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183667601-93127.jpg',1,234000,2333000,10,100),
(56,'Aroma Max Apple','Rokok','Harga 1 slop lebih murah',12500,26,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183705678-93124.jpg',1,117000,1150000,10,100),
(57,'Grow original','Rokok','Harga 1 slop lebih murah',24000,20,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183786844-93132.jpg',1,234000,2333000,10,100),
(58,'Tanda Tambah Watermelon','Rokok','Harga 1 slop lebih murah',26000,22,79,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183820568-93133.jpg',1,250000,2420000,10,100),
(59,'Tanda Tambah Original','Rokok','Harga 1 slop lebih',26000,22,100,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794183848872-93131.jpg',1,250000,2420000,10,100),
(64,'3vo sleek manggo apel','Rokok','',35000,23,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651696511-94369.jpg',1,347000,3450000,10,100),
(65,'3vo sleek melon apel','Rokok','',35000,23,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651762797-94378.jpg',1,347000,3450000,10,100),
(66,'Win juicy','Rokok','',26000,100,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651815724-94370.jpg',1,255000,2520000,10,100),
(67,'Win klik berry isi 20','Rokok','',32000,100,15,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651871851-94362.jpg',1,318000,3150000,10,100),
(68,'Diplomat lecy 16','Rokok','',28000,100,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651911199-94358.jpg',1,277000,2750000,10,100),
(69,'Diplomat Berry 16','Rokok','',28000,22,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794651966842-94357.jpg',1,278000,2750000,10,100),
(70,'Camel mild 16','Rokok','',25000,22,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794652006108-94372.jpg',1,248000,2450000,10,100),
(71,'Clas mild purple','Rokok','',32000,22,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794662723815-94359.jpg',1,315000,3100000,10,100),
(72,'Hs matcha kretek','Rokok','',12000,20,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663418307-94440.jpg',1,118000,1115000,10,100),
(73,'Black matcha kretek','Rokok','',18000,20,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663522186-94431.jpg',1,177000,1750000,10,100),
(74,'Goela aren Bumble Gum','Rokok','',11000,23,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663668734-94443.jpg',1,108000,1050000,10,100),
(75,'Goela Aren Apel','Rokok','',11000,23,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663713239-94437.jpg',1,108000,1050000,10,100),
(76,'Goela Aren Ice berry','Rokok','',12000,100,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663775490-94446.jpg',0,118000,1160000,10,100),
(77,'Djeka Matcha','Rokok','',12000,23,20,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794663824227-94434.jpg',1,118000,1160000,10,100),
(78,'Juara pisang susu','Rokok','',15000,28,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794664308063-94455.jpg',1,148000,1460000,10,100),
(79,'Juara Pucuk','Rokok','',15000,28,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794664382250-94452.jpg',1,148000,1460000,10,100),
(80,'Juara Klik PEACH','Rokok','',17000,28,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794664451882-94449.jpg',1,168000,1660000,10,100),
(81,'Juara Klik Green Grape','Rokok','',17000,28,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794664515314-94458.jpg',1,168000,1660000,10,100),
(82,'Juara Klik Sweet Mint','Rokok','',17000,28,12,'https://xkwaudqodbcwjfdhrunu.supabase.co/storage/v1/object/public/foto/produk/1794664574571-94461.jpg',1,168000,1660000,10,100)
ON CONFLICT DO NOTHING;
INSERT INTO settings(key, value) VALUES
('alamat_toko', 'Prambon, Boboh, Kec. Menganti, Kabupaten Gresik, Jawa Timur'),
('bank_atas_nama', 'E-COMMERS DUMMY'),
('bank_nama', 'BRI'),
('bank_norek', '0000-01-000000-50-0'),
('banner_url', ''),
('hp_toko', '081234567890'),
('link_pendek', ''),
('logo_url', ''),
('nama_toko', 'E-COMMERS DUMMY'),
('origin_id', '69597'),
('origin_nama', 'MENGANTI, MENGANTI, GRESIK, JAWA TIMUR, 61174'),
('poin_min_belanja', '100000'),
('poin_potongan_aktif', '1'),
('poin_rupiah', '1'),
('qris_url', ''),
('slogan', 'Belanja mudah, poin melimpah.'),
('tarif_default_per_kg', '15000'),
('toko_lat', '-7.261802'),
('toko_lng', '112.567277'),
('wa_toko', '081234567890'),
('gosend_aktif', '1')
ON CONFLICT DO NOTHING;
INSERT INTO tarif_manual(kota, tarif_per_kg, etd) VALUES
('Gresik', 8000, '1-2 hari'), ('Surabaya', 8000, '1-2 hari'), ('Sidoarjo', 9000, '1-2 hari'),
('Malang', 12000, '2-3 hari'), ('Jakarta', 18000, '2-4 hari'), ('Bandung', 19000, '2-4 hari')
ON CONFLICT DO NOTHING;

-- stok produk dibuat besar untuk demo
UPDATE products SET stok = 5000;
SELECT setval(pg_get_serial_sequence('products','id'), (SELECT max(id) FROM products));
