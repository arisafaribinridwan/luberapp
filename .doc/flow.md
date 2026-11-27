# Application Flows

**Project:** Luber (Lunas Bersama)

## 1. Mobile-First UI, PWA Shell & Authentication Gate

UI menggunakan pendekatan mobile-first. Jika dibuka pada viewport desktop, aplikasi tetap menampilkan shell dengan lebar maksimum seperti aplikasi mobile dan berada di tengah layar; komponen dapat memakai ruang desktop secara bertahap tanpa mengubah alur utama mobile.

Halaman terautentikasi menggunakan layout Nuxt `app/layouts/default.vue` untuk header, navigasi bawah, dan slot konten. Konfigurasi judul serta tombol kembali diteruskan dari halaman melalui `definePageMeta` layout props. Halaman welcome, login, dan two-factor memakai `layout: false` karena memiliki shell publik sendiri.

Aplikasi tersedia sebagai Progressive Web App (PWA) dan dapat dipasang dari browser melalui HTTPS. Saat aplikasi dibuka, service worker memuat asset shell yang sudah dicache, lalu alur autentikasi berjalan sebagai berikut:

Semua pengguna wajib melewati alur berikut:

1. Pengguna membuka alamat website.
2. Aplikasi menampilkan **splash screen** untuk memuat konfigurasi dan memeriksa session.
3. Jika session aktif dan belum idle selama 1 jam, aplikasi membuka launchpad di `/`.
4. Jika tidak ada session atau session sudah kedaluwarsa, aplikasi menampilkan **welcome screen di `/`**.
5. Tombol **Get Started** di welcome screen membuka login screen; setelah login berhasil, pengguna diarahkan ke **launchpad di `/`**.
6. Setelah 1 jam tanpa aktivitas, session dihapus/dianggap kedaluwarsa dan pengguna dikembalikan ke welcome screen.

Login memakai email dan password untuk semua role. Pendaftaran mandiri tidak tersedia: admin membuat akun di panel pengguna dan menetapkan password. Pengguna yang lupa password perlu menghubungi admin.

Tidak ada launchpad, dashboard, data, atau operasi aplikasi yang dapat diakses sebelum login. Welcome screen dapat diakses tanpa session. Saat offline, PWA hanya menampilkan shell atau halaman cache yang aman; pembacaan data terbaru dan seluruh operasi transaksi tetap memerlukan koneksi serta session aktif.

### 1.1 Role-Based Navigation

* **Member**: launchpad, dashboard, dan data pribadi secara *read-only*.
* **Pengurus**: launchpad, akses member, dan pencatatan transaksi yang menjadi kewenangannya.
* **Admin**: launchpad dan akses penuh, termasuk pengguna, rekening manual, konfigurasi, Log Aktivitas, dan seluruh transaksi.

Launchpad di `/` adalah menu utama setelah login. Kartu atau tautan menu ditampilkan berdasarkan role: semua role mendapat akses ke dashboard dan area baca, `pengurus` mendapat menu pencatatan transaksi, dan `admin` mendapat menu pengelolaan serta Log Aktivitas. Pengguna tetap dapat kembali ke launchpad dari setiap area.

### 1.2 Riwayat Log Admin

Menu **Log Aktivitas** hanya muncul pada navigasi `admin`. Admin melihat daftar kejadian terbaru dalam urutan waktu menurun, dengan informasi waktu, jenis kejadian, pelaku, ringkasan, dan data yang terdampak bila tersedia.

Admin dapat memfilter berdasarkan rentang tanggal, jenis kejadian, atau pelaku. Tampilan cukup berupa tabel yang dapat digulir di mobile. Tidak tersedia tombol untuk mengubah atau menghapus log. Jika bukan admin yang membuka halaman atau endpoint ini, akses ditolak.

## 2. Functional Workflows & User Experience

### 2.1 Authenticated Dashboard & Member Lookup

1. **Summary Cards Widget**:
* **Kas Utama (`1-1001`)**: $\sum \text{Debit}(1-1001) - \sum \text{Kredit}(1-1001)$
* **Total Piutang (`1-1002`)**: $\sum \text{Debit}(1-1002) - \sum \text{Kredit}(1-1002)$
* **Total Modal Hibah (`3-1001`)**: $\sum \text{Kredit}(3-1001) - \sum \text{Debit}(3-1001)$


2. **Live Feed Transaksi**: Menampilkan urutan transaksi terbaru beserta tombol pratinjau bukti transaksi di Google Drive.
3. **Kartu Status Pemulihan Kas**:
* Menampilkan defisit kas awal, jumlah hibah yang sudah dialokasikan untuk menutup defisit, sisa defisit, dan sisa hibah/modal.
* Status berubah menjadi **Defisit Tertutup** hanya jika defisit tersisa bernilai nol.

4. **Kartu Mutasi Anggota**:
* Komponen pencarian anggota per `ID_Anggota`.
* Menampilkan **Total Simpanan Bersih** ($\text{Setoran} - \text{Penarikan}$) dan **Sisa Piutang** ($\text{Pinjaman} - \text{Angsuran}$).



### 2.2 Pengurus/Admin Entry Panel & UX Enhancements

#### Pencatatan Pemulihan Kas Darurat

1. Saat setup awal, `admin` mencatat **Saldo Awal Kas Minus** berdasarkan notulen rapat darurat dan rekonsiliasi. Nominal harus positif sebagai nilai defisit, tetapi jurnal menghasilkan saldo Kas Utama negatif.
2. Pengurus/admin mencatat penerimaan hibah anggota dengan tujuan dana `PENUTUPAN_DEFISIT` atau `MODAL_PUTAR` dan melampirkan bukti transfer/hibah.
3. Admin mengonfirmasi **Alokasi Hibah untuk Menutup Defisit**. Sistem membatasi alokasi pada nilai defisit tersisa dan saldo hibah tersedia.
4. Sisa hibah setelah defisit tertutup tetap tampil sebagai Modal Hibah yang dapat dialokasikan sebagai modal putar sesuai keputusan organisasi.
5. Setiap tahap menyimpan notulen/referensi rapat, pembuat, waktu, dan bukti; transaksi yang sudah tercatat tidak diedit atau dihapus.

#### Operasi Input Lainnya

1. **Email Authentication**: Login seluruh role (`member`, `pengurus`, `admin`) dikelola via `@nuxtjs/better-auth` menggunakan email dan password. Server memeriksa role pada setiap operasi. Pembuatan akun hanya dilakukan admin melalui panel pengguna.
2. **Auto-complete Search Member**:
* Input text field pencarian anggota yang secara dinamis memfilter nama atau ID anggota saat pengurus/admin mengetik (misal: "Dewo" atau "MBR-001").
* Pilihan menyimpan `memberId` murni di latar belakang.


3. **Automatic Thousand Separator**:
* Saat pengurus/admin meng-input nominal (misal: `500000`), input field menampilkan format terstruktur `500.000` secara *real-time*.


4. **Mandatory Google Drive Upload**:
* Server Route Nuxt (`/api/admin/transactions`) menerima berkas struk/transfer via Multipart Form Data / Base64.
* Berkas diunggah ke Google Drive Folder via Drive API Service Account.
* Transaksi dibatalkan secara otomatis oleh Zod schema jika lampiran berkas tidak disertakan.

5. **Manual Account Selection**:
* Untuk jenis transaksi Dana Masuk (Hibah, Simpanan, Angsuran), form menampilkan field **Rekening Tujuan** dan mewajibkan `destinationAccount`.
* Untuk jenis transaksi Dana Keluar (Penarikan, Pencairan, Beban Operasional), form menampilkan field **Rekening Asal** dan mewajibkan `sourceAccount`.
* Field yang tidak relevan untuk arah transaksi disembunyikan atau dikosongkan agar tidak menimbulkan ambiguitas.
* Pilihan rekening menggunakan daftar rekening manual yang dapat dikonfigurasi; nilai yang disimpan menjadi bagian dari audit trail transaksi.

6. **Manual Account Settings**: Hanya `admin` yang dapat mengelola daftar rekening manual.
* Admin dapat melihat daftar rekening manual pada halaman pengaturan aplikasi.
* Admin dapat menambah rekening, mengubah nama/keterangan/pemilik, serta mengaktifkan atau menonaktifkan rekening.
* Form transaksi hanya menampilkan rekening yang berstatus aktif.
* Perubahan status dan data rekening dicatat bersama `updatedAt` dan identitas admin yang melakukan perubahan.

7. **Transfer Antar Rekening Pusat**:
* Hanya admin yang telah login dapat membuat transfer antar rekening manual yang berstatus aktif.
* Form transfer mewajibkan **Rekening Asal**, **Rekening Tujuan**, nominal, tanggal transfer, keterangan, dan bukti transfer.
* Rekening asal dan rekening tujuan tidak boleh sama, dan saldo rekening asal harus mencukupi.
* Setelah validasi berhasil, transfer langsung tercatat sebagai satu transaksi dan saldo kedua rekening diperbarui secara atomik.
* Transfer menampilkan pengurangan pada rekening asal dan penambahan pada rekening tujuan; total saldo kas komunitas tidak berubah.
* Riwayat transfer menyimpan admin pembuat dan waktu pencatatan. Transfer yang sudah tercatat tidak diedit atau dihapus; koreksi dilakukan melalui transaksi pembalik.

#### Log Kejadian

Setelah aksi penting diproses, server menambahkan log secara otomatis. Kejadian yang dicatat meliputi login berhasil/gagal, logout, transaksi atau transfer baru, perubahan rekening manual, perubahan pengguna atau role, dan perubahan konfigurasi. Jika aksi ditolak, log menyimpan ringkasan penolakan tanpa menyimpan data rahasia. Log bersifat hanya-baca dan hanya dapat ditampilkan kepada admin.



---

