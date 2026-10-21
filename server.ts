import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to calculate total minutes from user input
function parseAlokasiWaktu(input: string): { totalMinutes: number; jp: number; perJp: number; summary: string } {
  if (!input) return { totalMinutes: 80, jp: 2, perJp: 40, summary: '2 JP x 40 Menit (80 Menit)' };
  
  // match patterns like "2JP X 40 Menit", "2 x 45", "3 jp x 35 menit", "90 menit"
  const jpMatch = input.match(/(\d+)\s*(?:jp|jam\s*pelajaran)?\s*[xX*×]\s*(\d+)\s*(?:menit|m)?/i);
  if (jpMatch) {
    const jp = parseInt(jpMatch[1], 10);
    const perJp = parseInt(jpMatch[2], 10);
    const total = jp * perJp;
    return { totalMinutes: total, jp, perJp, summary: `${jp} JP x ${perJp} Menit (${total} Menit)` };
  }
  
  const singleMinutesMatch = input.match(/(\d+)\s*(?:menit|m\b)/i);
  if (singleMinutesMatch) {
    const total = parseInt(singleMinutesMatch[1], 10);
    return { totalMinutes: total, jp: Math.round(total / 40), perJp: 40, summary: `${total} Menit` };
  }
  
  return { totalMinutes: 80, jp: 2, perJp: 40, summary: input };
}

// Gemini client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function cleanPertemuanText(val: string): string {
  if (!val) return 'PERTEMUAN 4';
  let str = val
    .replace(/siklus\s*([0-9ivxlcdm]+|\w+)?/gi, '')
    .replace(/[()]/g, '')
    .replace(/[-–,]\s*$/, '')
    .trim();
  if (/^\d+$/.test(str)) {
    return `PERTEMUAN ${str}`;
  }
  if (!/^pertemuan/i.test(str)) {
    str = `PERTEMUAN ${str}`;
  }
  return str.replace(/\s+/g, ' ').toUpperCase();
}

app.post('/api/generate-rpp', async (req: Request, res: Response) => {
  try {
    const {
      penyusun = 'Badaruddin, S.Pd., M.Pd., Gr.',
      sekolah = 'SMP / SMA',
      tahunPelajaran = '2026/2027',
      semester = '1 (Ganjil)',
      mataPelajaran = 'Matematika',
      kelasFase = 'SMP Kelas 7 (Fase D)',
      topik = '',
      pertemuanKe = 'Pertemuan 4',
      alokasiWaktu = '2JP X 40 Menit',
      capaianPembelajaran = '',
      tujuanPembelajaran = '',
      lintasDisiplinIlmu = '',
      modelPembelajaran = 'Project-Based Learning (PjBL)',
      modelPembelajaranLainnya = '',
      metode = 'Diskusi kelompok, Eksperimen/Praktik, Tanya Jawab, Penugasan',
      dimensiProfilLulusan = [],
      kemitraanPembelajaran = 'Orang tua / Komunitas belajar',
      lingkunganPembelajaran = 'Ruang kelas kolaboratif, Lingkungan sekolah berwawasan Adiwiyata',
      pemanfaatanDigital = 'Aplikasi interaktif, Padlet, Geogebra/PhET/Canva sesuai STEAM',
      namaKepalaSekolah = 'Edhi Purwoto, S.Pd.',
    } = req.body;

    const sanitizedPertemuanKe = cleanPertemuanText(pertemuanKe);
    const chosenModel = modelPembelajaran === 'Lainnya' && modelPembelajaranLainnya ? modelPembelajaranLainnya : modelPembelajaran;
    const timeInfo = parseAlokasiWaktu(alokasiWaktu);
    
    // Distribute time accurately
    let awalMin = 15;
    let penutupMin = 5;
    if (timeInfo.totalMinutes <= 60) {
      awalMin = 10;
      penutupMin = 5;
    } else if (timeInfo.totalMinutes >= 120) {
      awalMin = 15;
      penutupMin = 10;
    }
    const intiMin = Math.max(10, timeInfo.totalMinutes - awalMin - penutupMin);

    const dplText = dimensiProfilLulusan && dimensiProfilLulusan.length > 0
      ? dimensiProfilLulusan.join(', ')
      : 'Otomatis diselaraskan dengan Tujuan Pembelajaran dan Model Pembelajaran (pilih dari: Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi)';

    const systemPrompt = `Anda adalah seorang Konsultan Kurikulum Merdeka dan Master Teacher Indonesia yang ahli dalam menyusun Perencanaan Pembelajaran Mendalam (RPM) / RPP Kurikulum Merdeka terintegrasi STEAM.
Tugas Anda adalah membuat dokumen Perencanaan Pembelajaran Mendalam (RPM/RPP) lengkap, terperinci, siap pakai, dan Lembar Kerja Peserta Didik (LKPD) utuh dengan kualitas akademik tertinggi.

PANDUAN UTAMA STRUKTUR SESUAI FORMAT:
A. IDENTITAS:
- Penyusun: ${penyusun}
- Sekolah: ${sekolah}
- Tahun Pelajaran: ${tahunPelajaran}
- Semester: ${semester}
- Mata Pelajaran: ${mataPelajaran}
- Kelas/Fase Capaian: ${kelasFase}
- Topik: ${topik}
- Alokasi Waktu: ${alokasiWaktu} (Total: ${timeInfo.totalMinutes} Menit)

B. IDENTIFIKASI:
- Identifikasi Murid: Uraikan secara realistis dan mendalam mengenai:
  1. Pengetahuan Awal siswa
  2. Minat Belajar siswa
  3. Kebutuhan Belajar siswa
- Materi Pelajaran (Wajib dibagi ke dalam 4 jenis pengetahuan):
  1. Faktual: Fakta dasar, simbol spesifik, istilah, rumus awal.
  2. Konseptual: Hubungan antar-elemen dasar, kategori, prinsip, generalisasi, model/teori.
  3. Prosedural: Langkah-langkah sistematis, metode analisis, alur penyelesaian masalah.
  4. Metakognitif: Kesadaran strategi belajar, pemantauan kognisi diri, evaluasi mandiri.
- Dimensi Profil Lulusan: Cantumkan 8 dimensi profil lulusan yang relevan (${dplText}).

C. DESAIN PEMBELAJARAN:
- Capaian Pembelajaran (CP)
- Lintas Disiplin Ilmu: Kaitkan topik ini dengan minimal 2 mata pelajaran lain (misal Sains, Seni, Bahasa, dll).
- Tujuan Pembelajaran: Rumuskan tujuan pembelajaran yang merinci kompetensi kognitif (C1-C6: mengingat/memahami/menerapkan/menganalisis/merefleksi/mencipta) yang harus dikuasai murid dalam 1 pertemuan ini.
- Topik Pembelajaran: ${topik}
- Praktik Pedagogis:
  - Pendekatan: Pembelajaran Mendalam (Deep Learning) & STEAM (Science, Technology, Engineering, Art, Mathematics)
  - Model Pembelajaran: ${chosenModel}
  - Tuliskan sintaks / tahapan langkah lengkap dari model ${chosenModel}
  - Metode yang digunakan: ${metode}
- Kemitraan Pembelajaran: ${kemitraanPembelajaran}
- Lingkungan Pembelajaran: ${lingkunganPembelajaran}
- Pemanfaatan Digital: ${pemanfaatanDigital} (sesuaikan agar mendukung pendekatan STEAM)

D. PENGALAMAN BELAJAR (SINKRONISASI WAKTU HARUS TEPAT = ${timeInfo.totalMinutes} MENIT):
- Kegiatan Awal (Durasi: ${awalMin} Menit):
  * Wajib menerapkan prinsip pembelajaran berkesadaran (mindful), bermakna (meaningful), dan/atau menggembirakan (joyful).
  * Mencakup apersepsi, motivasi, dan pengkondisian.
  * Awali dengan salam, doa bersama, dan presensi.
  * Wajib ada integrasi komponen Adiwiyata yaitu cek kebersihan kelas dan mengajak murid membuang sampah pada tempatnya.
  * Tuliskan minimal 4 poin aktivitas konkret.
- Kegiatan Inti (Durasi: ${intiMin} Menit):
  * Wajib mindful, meaningful, dan joyful.
  * Menggunakan 3 alur Pembelajaran Mendalam:
    1. Tahap Memahami (disertai sintaks model terkait) (estimasi waktu)
    2. Tahap Mengaplikasikan (disertai sintaks model terkait) (estimasi waktu)
    3. Tahap Merefleksi (disertai sintaks model terkait) (estimasi waktu)
  * Format judul setiap tahap: [Nama Tahap Pembelajaran] (Sintaks Model) (Estimasi Waktu)
  * Setiap tahap wajib minimal 4 poin aktivitas bernomor.
  * Setiap aktivitas konkret guru dan murid.
  * Di akhir kalimat setiap aktivitas, cantumkan Dimensi Profil Lulusan dalam tanda kurung, misal: (DPL: Kolaborasi, Penalaran Kritis).
  * Di akhir kalimat setiap aktivitas, cantumkan juga Komponen STEAM terkait dalam tanda kurung, misal: (STEAM: Technology & Mathematics) atau (STEAM: Science & Art).
- Kegiatan Penutup (Durasi: ${penutupMin} Menit):
  * Menyimpulkan materi, umpan balik reflektif, tindak lanjut/tugas pertemuan berikutnya, doa penutup, salam.
  * Minimal 4 poin aktivitas.
* CATATAN PENTING: Total waktu Kegiatan Awal (${awalMin}m) + Kegiatan Inti (${intiMin}m) + Kegiatan Penutup (${penutupMin}m) = TEPAT ${timeInfo.totalMinutes} Menit!

E. ASESMEN PEMBELAJARAN:
- Asesmen Awal: Jenis, Bentuk, dan Teknik asesmen diagnostik.
- Asesmen Proses: Jenis, Bentuk, dan Teknik asesmen formatif selama pembelajaran.
- Asesmen Akhir: Jenis, Bentuk, dan Teknik asesmen sumatif / unjuk kerja.
- Pengesahan Tanda Tangan:
  - Kepala Sekolah: ${namaKepalaSekolah}
  - Guru Mata Pelajaran: ${penyusun}

F. LAMPIRAN ASESMEN (LENGKAP):
1. Soal Asesmen Awal: Tepat 5 soal essay kontekstual berserta Kunci Jawaban Lengkap dan Pedoman Penskoran.
2. Rubrik Penilaian Sikap: Tabel 4 skala (Kurang = 1, Cukup = 2, Baik = 3, Sangat Baik = 4) dengan kriteria indikator yang jelas.
3. Rubrik Penilaian Pengetahuan: Tabel 4 skala dengan kriteria indikator yang jelas.
4. Rubrik Penilaian Keterampilan: Tabel 4 skala dengan kriteria indikator unjuk kerja yang jelas.

G. LEMBAR KERJA PESERTA DIDIK (LKPD) LENGKAP & TERSTRUKTUR:
LKPD bukan sekadar format kosong, tapi harus berisi materi dan lembar kerja operasional yang siap dibagikan kepada peserta didik:
- Header: Tuliskan "LEMBAR KERJA PESERTA DIDIK (LKPD)". Tepat di bawah kalimat tersebut HANYA tertulis "PERTEMUAN ..." (misal PERTEMUAN 4 atau PERTEMUAN KE-4) TANPA kalimat atau kata siklus!
- Identitas LKPD: Kotak identitas peserta didik (Nama Peserta Didik, Mata Pelajaran, No Absen / Kelas, Hari / Tanggal, Kelompok, Nilai / Catatan).
- Penomoran Bagian Utama LKPD (WAJIB DIMULAI DARI 1):
  1. Petunjuk Penggunaan LKPD (5 butir langkah sistematis, alat bahan, cara kerja bernomor 1 sampai 5)
  2. Sintaks Pembelajaran & Pengalaman Belajar Mendalam:
     - A. Memahami: Sajian ringkasan stimulus materi/bacaan/studi awal, diikuti 3 pertanyaan pemahaman mendalam.
     - B. Mengaplikasikan: Studi kasus nyata kontekstual berbasis STEAM, instruksi tugas terperinci, dan panduan ruang pengerjaan / analisis.
     - C. Merefleksikan: 2-3 pertanyaan refleksi diri siswa mengenai proses belajar, kendala, dan rencana perbaikan.
  3. Bagian Penutup LKPD: Kata-kata motivasi penyemangat belajar, catatan apresiasi guru, dan tabel checklist pemahaman diri siswa (Skala pemahaman).
* Catatan LKPD: Pengalaman belajar mendalam diintegrasikan menjadi satu dan disajikan dalam bentuk lembar kerja berparagraf/berpoin komunikatif (bukan tabel kaku), menggunakan bahasa yang ramah siswa.

PERHATIAN KHUSUS SIMBOL & NOTASI MATEMATIKA / SAINS:
Jika materi berhubungan dengan Matematika, Fisika, atau Sains, tuliskan SEMUA notasi matematika, variabel, persamaan, dan simbol secara SEMPURNA dan RAPI:
- Gunakan simbol yang benar: perkalian (× atau \times), pembagian (÷ atau /), plus-minus (±), lebih kecil/besar sama dengan (≤, ≥), tidak sama dengan (≠), akar (√ atau \sqrt{}), pangkat (x², y³, xⁿ), indeks (x₁, x₂), derajat (30°), phi (π), alpha (α), beta (β).
- Tuliskan rumus lengkap dan jelas, misal L = p × l, V = ⅓ × π × r² × t, a² + b² = c², 2x + 5 = 15.
- Berikan format teks yang bersih dan elegan sehingga mudah dibaca dan dapat diekspor ke Word (.docx) secara sempurna tanpa karakter rusak.

FORMAT JSON OUTPUT:
Keluarkan hasil HANYA dalam format JSON valid dengan skema berikut:
{
  "identitas": {
    "penyusun": string,
    "sekolah": string,
    "tahunPelajaran": string,
    "semester": string,
    "mataPelajaran": string,
    "kelasFase": string,
    "pertemuanKe": string,
    "topik": string,
    "alokasiWaktu": string,
    "totalMenit": number
  },
  "identifikasi": {
    "pengetahuanAwal": string,
    "minatBelajar": string,
    "kebutuhanBelajar": string,
    "materiFaktual": string,
    "materiKonseptual": string,
    "materiProsedural": string,
    "materiMetakognitif": string,
    "dimensiProfilLulusan": string[]
  },
  "desainPembelajaran": {
    "capaianPembelajaran": string,
    "lintasDisiplinIlmu": string,
    "tujuanPembelajaran": string[],
    "topikPembelajaran": string,
    "pendekatan": string,
    "modelPembelajaran": string,
    "sintaksModel": string[],
    "metode": string,
    "kemitraanPembelajaran": string,
    "lingkunganPembelajaran": string,
    "pemanfaatanDigital": string
  },
  "pengalamanBelajar": {
    "kegiatanAwal": {
      "durasi": string,
      "prinsip": string,
      "langkah": string[]
    },
    "kegiatanInti": {
      "durasi": string,
      "prinsip": string,
      "tahapMemahami": {
        "judul": string,
        "estimasiWaktu": string,
        "langkah": string[]
      },
      "tahapMengaplikasikan": {
        "judul": string,
        "estimasiWaktu": string,
        "langkah": string[]
      },
      "tahapMerefleksi": {
        "judul": string,
        "estimasiWaktu": string,
        "langkah": string[]
      }
    },
    "kegiatanPenutup": {
      "durasi": string,
      "prinsip": string,
      "langkah": string[]
    }
  },
  "asesmenPembelajaran": {
    "asesmenAwal": { "jenis": string, "bentuk": string, "teknik": string },
    "asesmenProses": { "jenis": string, "bentuk": string, "teknik": string },
    "asesmenAkhir": { "jenis": string, "bentuk": string, "teknik": string },
    "kepalaSekolah": { "nama": string, "nip": string },
    "guruMapel": { "nama": string, "nip": string }
  },
  "lampiran": {
    "soalAsesmenAwal": Array<{ "no": number, "soal": string, "jawaban": string, "skor": number }>,
    "rubrikSikap": Array<{ "aspek": string, "kurang": string, "cukup": string, "baik": string, "sangatBaik": string }>,
    "rubrikPengetahuan": Array<{ "aspek": string, "kurang": string, "cukup": string, "baik": string, "sangatBaik": string }>,
    "rubrikKeterampilan": Array<{ "aspek": string, "kurang": string, "cukup": string, "baik": string, "sangatBaik": string }>
  },
  "lkpd": {
    "pertemuanKe": string,
    "judul": string,
    "topikLengkap": string,
    "identitas": {
      "namaPesertaDidikPlaceholder": string,
      "mataPelajaran": string,
      "noAbsenKelas": string,
      "hariTanggalPlaceholder": string,
      "kelompokPlaceholder": string,
      "nilaiCatatanPlaceholder": string
    },
    "petunjukPenggunaan": string[],
    "memahami": {
      "sintaks": string,
      "konsepKunci": string,
      "rumusAturan": string[],
      "contohPemodelan": string[],
      "soal1Variasi": Array<{ "kode": string, "soal": string }>,
      "soal2Variasi": Array<{ "kode": string, "soal": string }>,
      "soal3Penalaran": string
    },
    "mengaplikasikan": {
      "sintaks": string,
      "judulKasusKontekstual": string,
      "kasusKontekstual": Array<{ "nama": string, "cerita": string }>,
      "instruksiKerja": string[],
      "ruangJawabanPerhitungan": Array<{ "label": string, "template": string }>,
      "sketsaVisual": string,
      "latihanVariasi": Array<{ "kode": string, "soal": string }>
    },
    "merefleksikan": {
      "sintaks": string,
      "pertanyaanRefleksi": Array<{ "pertanyaan": string }>
    },
    "penutup": {
      "kataPenyemangat": string,
      "cekPemahamanDiri": Array<{
        "kategori": string,
        "deskripsi": string
      }>,
      "catatanGuruPlaceholder": string
    }
  }
}`;

    const userPrompt = `Buatkan Perencanaan Pembelajaran Mendalam (RPM / RPP) Kurikulum Merdeka terintegrasi STEAM dan Lembar Kerja Peserta Didik (LKPD) lengkap dengan data berikut:
- Penyusun: ${penyusun}
- Sekolah: ${sekolah}
- Tahun Pelajaran: ${tahunPelajaran}
- Semester: ${semester}
- Mata Pelajaran: ${mataPelajaran}
- Kelas/Fase Capaian: ${kelasFase}
- Topik / Materi Pokok: ${topik || 'Pilihkan materi yang esensial, menarik, dan relevan sesuai mapel dan fase'}
- Alokasi Waktu: ${alokasiWaktu} (Total: ${timeInfo.totalMinutes} Menit: Awal ${awalMin}m, Inti ${intiMin}m, Penutup ${penutupMin}m)
- Capaian Pembelajaran (CP): ${capaianPembelajaran || 'Rumuskan Capaian Pembelajaran yang relevan dengan topik dan fase ini secara resmi'}
- Tujuan Pembelajaran (TP): ${tujuanPembelajaran || 'Rumuskan Tujuan Pembelajaran merinci C1-C6 sesuai alokasi waktu'}
- Model Pembelajaran: ${chosenModel} (sesuaikan sintaks STEAM secara otomatis)
- Dimensi Profil Lulusan: ${dplText}
- Kepala Sekolah: ${namaKepalaSekolah}

KETENTUAN KHUSUS STRUKTUR LKPD (Wajib persis seperti contoh format dokumen resmi):
1. Header LKPD: Tuliskan "LEMBAR KERJA PESERTA DIDIK (LKPD)". Tepat di bawah kalimat tersebut HANYA tertulis "${sanitizedPertemuanKe}" TANPA kalimat atau kata siklus sama sekali (DILARANG mencantumkan kata siklus)! Lalu Topik lengkap dengan sub-konsep, dan Mata Pelajaran | Kelas/Fase | Sekolah.
2. Identitas diri di LKPD: Format kotak 2 kolom: Nama Peserta Didik, Mata Pelajaran, No. Absen / Kelas, Hari / Tanggal, Kelompok, Nilai / Catatan.
3. Penomoran Bagian Utama LKPD (WAJIB DIMULAI DARI 1):
   - "1. Petunjuk Penggunaan LKPD": 5 butir bernomor 1 sampai 5.
   - "2. Sintaks Pembelajaran & Pengalaman Belajar Mendalam":
     * Bagian A. MEMAHAMI (Sintaks 1: ...):
       - Ringkasan Materi & Aturan: Konsep Kunci, Rumus/Prinsip Utama, dan 4 Contoh Pemodelan bertahap.
       - Jawablah Pertanyaan Pemahaman Berikut:
         - No 1: Latihan pengubahan/penyelesaian dasar dengan format isian titik-titik (misal: "a. 9 - 15 = 9 + (..........) = ..........")
         - No 2: Penentuan nilai lawan/konsep (a. ..., b. ...)
         - No 3: Pertanyaan penalaran konseptual mendalam.
     * Bagian B. MENGAPLIKASIKAN (Sintaks 2 & 3: ...):
       - Tugas Kasus Nyata Kontekstual (Aplikasi kontekstual lokal/kehidupan siswa): Buatkan minimal 3 kasus konkret (Kasus 1, Kasus 2, Kasus 3).
       - Instruksi Kerja: 3 butir instruksi jelas.
       - Ruang Lembar Kerja Jawaban Siswa: format isian perhitungan kasus kontekstual titik-titik, representasi visual/sketsa/garis bilangan, dan 4 butir latihan variasi penerapan.
     * Bagian C. MEREFLEKSIKAN (Sintaks 4: ...):
       - Ayo Refleksikan Proses Belajarmu Hari Ini!
       - 3 butir pertanyaan refleksi diri (proses belajar, kesulitan/solusi, dan manfaat kehidupan sehari-hari).
   - "3. Bagian Penutup LKPD":
     * Kata motivasi: “Luar Biasa! Kamu telah berhasil...”
     * Lembar Cek Pemahaman Diri Siswa dengan 3 pilihan centang: [ ] Sangat Paham, [ ] Cukup Paham, [ ] Perlu Belajar Lagi beserta deskripsinya.
     * Baris Catatan / Umpan Balik Guru.

Sinkronisasi waktu pengalaman belajar harus pas ${timeInfo.totalMinutes} menit.
ATURAN PENOMORAN WAJIB:
- Semua langkah aktivitas (Kegiatan Awal, Kegiatan Inti Memahami/Mengaplikasikan/Merefleksi, Kegiatan Penutup) WAJIB bernomor bulat biasa 1, 2, 3, 4, dst. DILARANG KERAS menggunakan penomoran desimal/titik ganda seperti 1.1, 1.2, 2.1, 2.2, 3.1!
- Jika mata pelajaran adalah Pendidikan Agama Islam dan Budi Pekerti (PAI) atau terkait, WAJIB sertakan teks Arab berharakat lengkap (tasykil), transliterasi Latin, dan terjemahannya.
- Notasi matematika/simbol harus presisi dan sempurna (×, ÷, ², √, dll).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', parseError, text);
      return res.status(500).json({ error: 'Gagal memproses format respons AI. Silakan coba lagi.', raw: text });
    }

    // Sanitize pertemuanKe to ensure NO "siklus" ever appears in LKPD or Identitas
    if (parsedData.lkpd) {
      parsedData.lkpd.pertemuanKe = cleanPertemuanText(parsedData.lkpd.pertemuanKe || sanitizedPertemuanKe);
    }
    if (parsedData.identitas) {
      parsedData.identitas.pertemuanKe = cleanPertemuanText(parsedData.identitas.pertemuanKe || sanitizedPertemuanKe);
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Server error generating RPP:', error);
    return res.status(500).json({
      error: error?.message || 'Terjadi kesalahan pada server saat membuat RPM/RPP.',
    });
  }
});

// Endpoint Generator Teks Arab & Ayat / Hadits untuk PAI
app.post('/api/generate-arabic', async (req: Request, res: Response) => {
  try {
    const { topik = 'Menuntut Ilmu', jenis = 'Ayat Al-Qur\'an' } = req.body;

    const arabicPrompt = `Anda adalah seorang Master Guru Pendidikan Agama Islam (PAI) dan pakar bahasa Arab/Al-Quran.
Buatkan dalil / rujukan teks Arab yang otentik dan berharakat lengkap (tasykil/syakal sempurna) untuk topik/tema: "${topik}", jenis: "${jenis}".

Keluarkan HANYA dalam format JSON valid dengan skema berikut:
{
  "judul": string,
  "sumber": string,
  "teksArab": string,
  "transliterasiLatin": string,
  "terjemahan": string,
  "kandunganSingkat": string
}
Pastikan teks Arab ditulis dalam huruf hijaiyah yang benar dan memiliki harakat lengkap (fathah, kasrah, dhammah, sukun, tasydid, tanwin).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: arabicPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating Arabic text:', error);
    return res.status(500).json({ error: error?.message || 'Gagal menghasilkan teks Arab.' });
  }
});

// Production and Dev serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server RPP Generator running on http://localhost:${PORT}`);
  });
}

startServer();
