# Keamanan — deployment pribadi (single user)

## Autentikasi

- **Supabase Auth** (email + kata sandi) via `@supabase/ssr`
- Sesi disimpan di cookie HTTP (diurus middleware + server client)

## Setup pengguna

1. Di [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → Users → **Add user**
2. Buat satu akun email/kata sandi untuk operator aplikasi
3. (Opsional) Set `ALLOWED_APP_EMAILS=email@anda.com` di Vercel / `.env.local`

## Lapisan proteksi

| Lapisan | Perilaku |
|--------|----------|
| `middleware.ts` | Tanpa sesi → redirect ke `/login` |
| `app/(protected)/layout.tsx` | Double-check sesi di Server Component |
| Server actions | `ensureAuthenticated()` di awal setiap aksi |

## Rute publik

- `/login`
- `/auth/callback` (pertukaran kode OAuth/magic link jika dipakai nanti)

Semua rute aplikasi internal (`/`, `/sales`, `/purchases`, dll.) memerlukan login.

## Pengujian manual

1. Buka `/` dalam jendela incognito → harus redirect ke `/login`
2. Login dengan akun Supabase → harus masuk dashboard
3. Klik Keluar → kembali ke `/login`, `/sales` tidak bisa dibuka
4. (Dev) Panggil server action tanpa cookie sesi → error unauthorized
