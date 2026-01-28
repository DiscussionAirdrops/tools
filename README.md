# Discussion Airdrops Tools

Aplikasi all-in-one untuk tracking airdrop, manajemen wallet multi-chain, dan tools Web3 lainnya. Dibangun dengan React + Vite dan Firebase sebagai backend.

![Discussion Airdrops Tools](https://img.shields.io/badge/Web3-Tools-cyan?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Backend-orange?style=for-the-badge&logo=firebase)

## Fitur Utama

### 1. Dashboard Airdrop Tracker
- Daftar dan kelola semua airdrop/tasks yang sedang dikerjakan
- Filter berdasarkan wallet, tag (Airdrop, Testnet, Waitlist, Info, Update, Yapping)
- Filter berdasarkan type (Daily, Retro, Testnet, Ongoing, Pending, Abu-abu, Scam, Winner)
- Pencarian tasks
- Quick add form untuk menambah task baru
- Tandai task sebagai Done/Pending
- Sistem favorites
- Import/Export data dalam format JSON
- Daily reset otomatis untuk tasks harian

### 2. Wallet Manager
- Tambah wallet dengan nama, address, dan pilihan chain
- Support 17+ blockchain networks:
  - **EVM**: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom, zkSync, Linea, Mantle, Celo, Gnosis, Harmony, Moonbeam
  - **Non-EVM**: Solana, Bitcoin
- Cek balance otomatis dari blockchain
- Multi-chain balance checker
- Search, filter by chain, sort by balance
- Export data ke CSV/JSON
- Total portfolio value dalam USD

### 3. Twitter Manager
- Tambah dan kelola akun Twitter via URL atau username
- Fetch profile data otomatis (foto, username)
- Tampilan grid untuk semua akun
- Copy URL, kunjungi profile, hapus akun

### 4. AI Assistant
- Support multi-provider AI:
  - **Groq** (Recommended - Free & Fast)
  - **OpenAI** (GPT-4, GPT-3.5)
  - **Anthropic** (Claude)
  - **Cohere**
  - **HuggingFace**
- Simpan API key di Firebase (aman per user)
- Chat interface dengan history
- Tanya jawab seputar crypto, airdrop, dan Web3

### 5. YouTube Learning
- Playlist pembelajaran Web3 dan Airdrops
- Tutorial-tutorial berguna
- Link ke channel Discussion Airdrops

### 6. Settings
- Setup Firebase environment variables
- Konfigurasi daily reset time
- Support/Donation section

### 7. Authentication
- Firebase Authentication
- Data tersimpan aman per user
- Sync across devices

## Teknologi yang Digunakan

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Groq, OpenAI, Anthropic, Cohere, HuggingFace
- **Blockchain**: Multi-chain RPC untuk balance checking
- **UI Components**: Shadcn/ui, Lucide Icons

## Cara Setup

### 1. Clone Repository

```bash
git clone https://github.com/DiscussionAirdrops/tools.git
cd tools
npm install
```

### 2. Setup Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat project baru atau gunakan yang sudah ada
3. Aktifkan **Firestore Database**
4. Aktifkan **Authentication** (Anonymous sign-in)
5. Copy Firebase config dan masukkan di aplikasi (Settings)

**Firestore Rules** (copy paste di Firebase Console > Firestore > Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Setup AI (Opsional)

Untuk menggunakan fitur AI Assistant, dapatkan API key dari salah satu provider:

- **Groq (Recommended)**: [https://console.groq.com/](https://console.groq.com/) - Gratis dan cepat
- **OpenAI**: [https://platform.openai.com/](https://platform.openai.com/)
- **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/)
- **Cohere**: [https://dashboard.cohere.com/](https://dashboard.cohere.com/)
- **HuggingFace**: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## Video Tutorial

Tonton video tutorial lengkap cara setup dan penggunaan aplikasi:

**[Tutorial Discussion Airdrops Tools](https://youtu.be/mzr1ykgvw1w)**

## Links

| Resource | Link |
|----------|------|
| Source Code | [GitHub Repository](https://github.com/DiscussionAirdrops/tools.git) |
| Firebase Console | [firebase.google.com](https://console.firebase.google.com/) |
| Groq AI | [console.groq.com](https://console.groq.com/) |
| Video Tutorial | [YouTube](https://youtu.be/mzr1ykgvw1w) |
| Twitter | [@inokrambol](https://x.com/inokrambol) |

## Support & Donasi

Jika aplikasi ini bermanfaat, Anda bisa mendukung pengembangan dengan donasi crypto:

**EVM Address (Semua Jaringan)**
```
0x2473EF56532306bEB024a0Af1065470771d92920
```

Support networks: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, zkSync, Linea, Mantle, dan semua jaringan EVM lainnya.

## Kontribusi

Kontribusi sangat diterima! Silakan buat pull request atau buka issue untuk saran dan bug report.

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

MIT License - Bebas digunakan dan dimodifikasi.

---

**Dibuat dengan oleh [ino krambol](https://x.com/inokrambol)**
