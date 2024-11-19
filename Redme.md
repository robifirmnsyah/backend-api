Menjalankan Aplikasi:

Untuk pengembangan dengan nodemon:
bash
Copy code
npm run dev
Untuk menjalankan di latar belakang dengan pm2:
bash
Copy code
npm run start
Mengelola Proses pm2:

Cek status aplikasi yang berjalan di background:
bash
Copy code
pm2 list
Melihat log aplikasi:
bash
Copy code
pm2 logs my-app
Menghentikan aplikasi:
bash
Copy code
pm2 stop my-app
Menghapus aplikasi dari pm2:
bash
Copy code
pm2 delete my-app