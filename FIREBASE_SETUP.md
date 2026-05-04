# Firebase setup untuk sistem ini

Project ini sudah ditukar daripada Google Apps Script kepada Firebase dengan cara paling selamat: UI asal dikekalkan, tetapi layer `api.js` dan `auth.js` sekarang guna Firebase.

## 1) Servis yang perlu enable

- Firebase Authentication → Email/Password
- Firestore Database
- Hosting (optional, untuk deploy web app)

## 2) Fail yang paling penting

- `js/firebase-init.js` → bootstrap Firebase SDK
- `js/firebase-config.local.example.js` → contoh config project
- `js/api.js` → semua operasi asset / dashboard / PPM ke Firestore
- `js/auth.js` → login / auth check / logout guna Firebase Auth
- `firestore.rules` → rules permulaan
- `js/import-to-firestore.js` → helper import data lama

## 3) Struktur Firestore

### User profile
Collection: `users`

Cadangan document ID = `uid` user Firebase Auth.

Contoh:
```json
{
  "username": "admin",
  "email": "admin@hospital.com",
  "role": "admin",
  "defaultModule": "FEMS"
}
```

### Counter untuk generate ID
Collection: `counters`

Contoh document:
- `fems_asset`
- `bems_asset`

Contoh isi:
```json
{
  "value": 145,
  "module": "FEMS"
}
```

### Asset documents
Path:
- `modules/fems/assets/{assetId}`
- `modules/bems/assets/{assetId}`

Gunakan field sedia ada daripada sistem lama. Contoh:
- FEMS: `assetNo`, `equipmentName`, `typeCode`, `codeLocation`, `startDate`, `endDate`, `1st`, `done_1st`
- BEMS: `assetNumber`, `assetNumberKonsesi`, `assetDescription`, `warrantyStart`, `warrantyEnd`, `1st`, `done_1st`

## 4) Cara isi Firebase config

Salin fail contoh:
- `js/firebase-config.local.example.js`
menjadi
- `js/firebase-config.local.js`

Kemudian isi config sebenar project Firebase kau.

## 5) Cara login user

Sistem support 2 cara:
- login terus guna email
- login guna username

Kalau login guna username, sistem akan cari email dalam collection `users`, kemudian sign in ke Firebase Auth pakai email tersebut.

## 6) Cara import data lama

Selepas kau dah ada array data lama dalam browser console, load fail `js/import-to-firestore.js` dan panggil:

```javascript
importAssetsToFirestore({
  module: 'FEMS',
  assets: oldAssetsArray
});
```

atau

```javascript
importAssetsToFirestore({
  module: 'BEMS',
  assets: oldAssetsArray
});
```

## 7) Deploy ringkas

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## 8) Perkara yang masih kau kena buat

- isi config Firebase sebenar
- create user dalam Firebase Auth
- create profile document dalam `users`
- import data lama dari Sheet/API lama ke Firestore
- test flow add asset, login, update ppm, update post
