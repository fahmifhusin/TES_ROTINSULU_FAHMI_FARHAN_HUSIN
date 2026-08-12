
Bahasa/framework: 
Node.js (base server),  
Express.js (library BE),
Axios (Api Consumer)

Sistem informasi layanan kesehatan (proses administrasi ala rumah sakit/klinik), dengan 3 fokus penilaian:

1️⃣ Logika & Validasi Data
Membuat fungsi validasi string/angka dengan beberapa aturan sekaligus, plus fungsi generate ID otomatis yang formatnya melibatkan tanggal + nomor urut (increment & reset berkala)
open "
src/utils/validator.js, 
src/utils/idGenerator.js, 
src/controllers/patientController.js,
src/controllers/registrationController.js"

2️⃣ Konsumsi API (HTTP Client)
Kirim data ke endpoint (boleh mock sendiri), handle response sukses/gagal auth/server error/timeout, plus retry dengan backoff — tapi tidak semua jenis gagal perlu di-retry 😉
open "
src/services/httpClient.js,
"

3️⃣ Bikin Endpoint Sendiri (nilai tambah)
Endpoint REST sederhana yang validasi data lalu balas sesuai status code, tanpa perlu database (cukup in-memory).
open "
src/app.js, 
src/server.js,
src/controllers/patientController.js,
src/controllers/registrationController.js,
src/routes/patientRoutes.js,
src/routes/registrationRoutes.js,
src/middlewares/authMiddleware.js,
src/middlewares/errorHandler.js,
"

📚 Yang perlu di-refresh:
✅ Logika dasar & struktur data (untuk tes tertulis)
✅ Validasi format & tanggal
✅ HTTP status code & JSON
✅ Auth header (Bearer token)
✅ Timeout, retry, backoff
✅ Logging sederhana
✅ Bikin REST endpoint dasar

🛠️ Yang perlu disiapkan:
LAPTOP (Bawa Sendiri)
Environment sudah terpasang (bahasa, package manager, editor, library HTTP client/server)
Alat tulis untuk tes tertulis
Tools untuk screenshot/simpan log saat tes coding
Kebiasaan bikin README singkat

⚠️ Catatan penting:
Tes coding bersifat individual — boleh buka dokumentasi, tapi kodenya harus benar-benar Anda pahami karena akan didiskusikan saat wawancara. Yang dinilai itu proses berpikir, bukan kelengkapan 100%. Kalau waktu kurang, lebih baik jujur di README daripada solusi dipaksa "terlihat" lengkap.

Semangat & sampai jumpa di hari tes! 🚀

Salam,
Tim Rekrutmen SIRS Rotinsulu

Authorization: Bearer secret-health-token-123