# Bot Discord Ngobrol :robot:
Bot Discord multifungsi buat nemenin server tongkrongan lu

## :rocket: Cara Install dan Pakai
Buat kalian yang mau nge-*host* atau jalanin bot ini sendiri di PC atau server, gampang banget. Ikutin aja langkah-langkah di bawah ini:

### 1. Persiapan Awal
Pastiin kalian udah install **Node.js** di perangkat kalian.

### 2. Download Source Code
Kalian bisa *download* code bot ini dengan cara klik tombol hijau **Code** di atas lalu pilih **Download ZIP**, atau lewat terminal/CMD:
`git clone https://github.com/sunandar3221/Bot-Server-Discord.git`

### 3. Install Dependencies
Buka terminal atau CMD, arahin ke folder bot ini, terus install semua bahan yang dibutuhin:
* Kalau JS: ketik `npm install`

### 4. Setting Token (Penting!)
Bot ini butuh token rahasia dari Discord Developer Portal biar bisa nyala.
1. Buka file namanya `.env` di dalam folder utama bot ini. Kalau tidak ada, pastikan settingan file tersembunyi dinyalakan
2. Masukin token kalian di file itu. Formatnya kayak gini:
   `DISCORD_TOKEN=masukin_token_rahasia_kalian_di_sini`
   
### 5. Setting Client ID
Bot discord ini juga butuh Client Id agar command nya bisa muncul. Bagaimana cara setting Client Id?
1. Di Discord Developer Portal, kalian buka bot discord kalian, pergi ke oauth2. Disana, kalian akan lihat Client ID. Copy isinya
2. Masukin hasilnya ke file .env, kalian pilih CLIENT_ID, ganti isinya yang sebelumnya CLIENT_ID_KAMU jadi Client ID yang kalian copy tadi

### 6. Jalanin Bot
Kalau semuanya udah beres, tinggal nyalain botnya lewat terminal:
* Kalau JS: ketik `node index.js`

### 7. Enjoy!
Sekarang kalian bisa pakai bot nya, kalian bisa otak Atik kode nya sesuka hati. Selamat Ngoding!
  
Kalau ada *error* atau *bug*, feel free buat buka **Issues** di repo ini ya!
