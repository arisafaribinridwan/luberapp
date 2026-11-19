# 📘 Design Guideline & System Architecture — LuberApp
---

## 1. Visi Produk & Konteks UI/UX

Aplikasi **Luber** adalah platform pencatatan dan transparansi keuangan organisasi/komunitas. Setelah pelaksanaan *Rapat Anggota Darurat*, fokus utama antarmuka dialihkan pada **transparansi pemulihan kas** dan **kepercayaan anggota (*trust & clarity*)**.

### 🚫 Aturan Terlarang (Do NOT Include):
1. **JANGAN** menampilkan nomor/kode akun akuntansi formal seperti `(1-1001)`, `(1-1002)`, atau `(3-1001)` pada antarmuka pengguna utama.
2. **JANGAN** memasukkan tombol "Masuk Admin" di card header utama pengguna.
3. **JANGAN** memasukkan tag statis seperti `"Transparan • Read-Only"`.
4. **JANGAN** menampilkan timestamp pembaruan statis di kaki kartu kas utama.

---

## 2. Sistem Warna (Color Palette)

### 🎨 Primary Brand Color: `#135BEC` (Electric Royal Blue)
Warna utama mewakili keandalan, stabilitas finansial, dan kesan profesional modern.

```json
{
  "brand": {
    "50":  "#EEF4FF",
    "100": "#E0EBFF",
    "200": "#C7D9FE",
    "300": "#9EBCFD",
    "400": "#6B93FB",
    "500": "#3B6CF6",
    "600": "#135BEC", // PRIMARY BRAND COLOR
    "700": "#1049C7",
    "800": "#133CA0",
    "900": "#15357E",
    "950": "#0F204D"
  }
}
```

### 🟢 Status & Contextual Colors
- **Success / Dana Masuk / Hibah**: Emerald Green (`#10B981` / Tailwind `emerald-600` untuk teks, `emerald-50` untuk background badge).
- **Defisit / Alokasi Darurat**: Amber Gold (`#D97706` / Tailwind `amber-300` pada kartu biru, `amber-50` untuk badge transaksi).
- **Dana Keluar / Netral**: Slate Text (`#334155` / Tailwind `slate-700`).
- **Background Container (Option 2 Primary)**: Slate Light (`#F8FAFC` / `#FFFFFF` dengan border `#E2E8F0`).

---

## 3. Tipografi (Typography)

- **Font Family Utama**: `Plus Jakarta Sans`, sans-serif (Google Fonts).
- **Alternatif**: `Inter`, `Roboto`, atau System UI Sans-Serif.

### Skala Ukuran Teks:
| Peran Teks | Size (px / Tailwind) | Weight | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Hero Balance** | `text-3xl` (30px) | `font-extrabold` (800) | Angka Kas Utama `Rp 21.250.000` |
| **Section Title** | `text-sm` (14px) | `font-bold` (700) | `Riwayat Transaksi Terbaru` |
| **Card Sub-Metric**| `text-xs` (12px) | `font-bold` (700) | Angka Hibah / Defisit / Piutang |
| **Item Title** | `text-xs` (12px) | `font-bold` (700) | Nama Anggota (`Budi Santoso`) |
| **Meta / Date** | `text-[10px]` (10px)| `font-medium` (500) | `31 Jan 2026` |
| **Badge Label** | `text-[10px]` (10px)| `font-semibold` (600)| `Hibah Penyehatan Kas` |

---
