# E-COMMERS DUMMY — Cloudflare Worker + Neon Postgres

Versi demo (untuk presentasi) dari katalog belanja ala Shopee + member poin. Klon Warung Dini (versi D1) yang:

- **database pindah ke Neon** (PostgreSQL) — `schema.sql`, `seed.sql`, `seed-dummy.sql`
- **ongkir GoSend (Gojek) seperti WARJO41**: Rp2.500/km s.d. km ke-20, Rp3.000/km sesudahnya, maks Rp80.000, jangkauan 40 km, maks 20 kg.
  Titik penerima dari GPS / link Google Maps, jarak via OSRM (cadangan: garis lurus × 1,3). J&T tetap tersedia.
- **data dummy siap demo**: 200 member, ±1.300 transaksi random (J&T & GoSend), poin random, penukaran hadiah random
  (disetujui / menunggu / ditolak), 8 program hadiah, 30 pesanan aktif untuk demo proses admin.

| Bagian | Isi |
|---|---|
| `src/index.js` | API Worker (login, data, pesanan, poin, hadiah, ongkir, upload) — koneksi Neon via `@neondatabase/serverless` |
| `public/` | tampilan web (PWA) |
| KV `FILES` | foto upload admin |

## Akun demo
Login owner/admin memakai ID `dummy`, member memakai ID `MEMBER1`, `MEMBER2`, `MEMBER3` (password diberikan terpisah, tidak ditulis di repo publik).
Semua 200 member memakai password yang sama (email terlihat di menu admin **Member & Poin**).

## Deploy (Cloudflare Workers Builds)
1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pilih repo ini.
   Build command: kosong · Deploy command: `npx wrangler deploy`.
2. Worker **ecommers-dummy → Settings → Variables and Secrets → Add** (tipe *Secret*):
   - `DATABASE_URL` → connection string Neon project **ecommers-dummy**
   - `JWT_SECRET` → teks acak min. 32 karakter
3. Deploy ulang (Deployments → Retry / push commit baru).

## Reset data dummy
Jalankan isi `seed-dummy.sql` di Neon SQL Editor — data member/transaksi lama dihapus lalu dibuat ulang.

Develop Program By Nurman Catra
