import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Award,
  School,
  AlertCircle,
  PenTool,
  PlusCircle,
  ChevronDown,
  X,
  Edit3,
} from 'lucide-react';
import { RPPData, generateDocxBlob } from './utils/docxExport';
import { MathText } from './components/MathText';
import { ArabicGeneratorModal } from './components/ArabicGeneratorModal';

const JENJANG_FASE_OPTIONS = [
  { group: 'PAUD / TK', items: ['PAUD / TK (Fase Fondasi)'] },
  {
    group: 'Sekolah Dasar (SD)',
    items: [
      'SD Kelas 1 (Fase A)',
      'SD Kelas 2 (Fase A)',
      'SD Kelas 3 (Fase B)',
      'SD Kelas 4 (Fase B)',
      'SD Kelas 5 (Fase C)',
      'SD Kelas 6 (Fase C)',
    ],
  },
  {
    group: 'Sekolah Menengah Pertama (SMP)',
    items: [
      'SMP Kelas 7 (Fase D)',
      'SMP Kelas 8 (Fase D)',
      'SMP Kelas 9 (Fase D)',
    ],
  },
  {
    group: 'Sekolah Menengah Atas (SMA)',
    items: [
      'SMA Kelas 10 (Fase E)',
      'SMA Kelas 11 (Fase F)',
      'SMA Kelas 12 (Fase F)',
    ],
  },
  {
    group: 'Sekolah Menengah Kejuruan (SMK)',
    items: [
      'SMK Kelas 10 (Fase E)',
      'SMK Kelas 11 (Fase F)',
      'SMK Kelas 12 (Fase F)',
    ],
  },
];

const MATA_PELAJARAN_OPTIONS = [
  'Matematika',
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila / PKn',
  'Informatika',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Seni Rupa / Seni Musik / Seni Tari / Seni Teater',
  'Pendidikan Agama Kristen / Katolik / Hindu / Buddha',
  'Fisika',
  'Kimia',
  'Biologi',
  'Ekonomi',
  'Geografi',
  'Sosiologi',
  'Sejarah',
  'Dasar-Dasar Kejuruan (SMK)',
  'Prakarya dan Kewirausahaan (PKWU)',
  'Lainnya (Ketik Manual)',
];

const ALL_8_DIMENSI = [
  'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
];

const MODEL_PEMBELAJARAN_OPTIONS = [
  'Problem-Based Learning (PBL)',
  'Project-Based Learning (PjBL)',
  'Inquiry-Based Learning',
  'Discovery Learning',
  'Pendekatan STEAM Terpadu',
  'Teaching at the Right Level (TaRL)',
  'Culturally Responsive Teaching (CRT)',
  'Cooperative Learning',
  'Experiential Learning',
  'Pembelajaran Kontekstual (CTL)',
  'Flipped Classroom',
  'Lainnya (Ketik Manual)',
];

function calculateMinutes(text: string): { total: number; detail: string } {
  if (!text) return { total: 80, detail: '2 JP x 40 Menit = 80 Menit' };
  const match = text.match(/(\d+)\s*(?:jp|jam)?\s*[xX*×]\s*(\d+)/i);
  if (match) {
    const jp = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const total = jp * m;
    let awal = 15;
    let penutup = 5;
    if (total <= 60) {
      awal = 10;
      penutup = 5;
    } else if (total >= 120) {
      awal = 15;
      penutup = 10;
    }
    const inti = total - awal - penutup;
    return {
      total,
      detail: `${jp} JP x ${m} Menit = ${total} Menit (Awal: ${awal}m, Inti: ${inti}m, Penutup: ${penutup}m)`,
    };
  }
  const minOnly = text.match(/(\d+)\s*(?:menit|m\b)/i);
  if (minOnly) {
    const total = parseInt(minOnly[1], 10);
    return { total, detail: `Total: ${total} Menit` };
  }
  return { total: 80, detail: 'Format: [Angka]JP X [Angka] Menit' };
}

// Clean any pre-existing decimal numbering like 1.1, 1.2, or 1.
function cleanStep(text: string): string {
  if (!text) return '';
  return text.replace(/^(\d+(\.\d+)*\s*[-–.]\s*|\d+\.\s*)/, '').trim();
}

function cleanPertemuanText(val?: string): string {
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

export default function App() {
  // Main Screen View Switch: 'form' vs 'result'
  const [screenView, setScreenView] = useState<'form' | 'result'>('form');

  // Form State
  const [penyusun, setPenyusun] = useState('Badaruddin, M.Pd.');
  const [sekolah, setSekolah] = useState('SMPN 05 SATAP Pulau Maya');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState('1 (Ganjil)');
  const [mataPelajaranSelect, setMataPelajaranSelect] = useState('Matematika');
  const [mataPelajaranCustom, setMataPelajaranCustom] = useState('');
  const [kelasFase, setKelasFase] = useState('SMP Kelas 7 (Fase D)');
  const [topik, setTopik] = useState('Pengurangan Bilangan Bulat');
  const [pertemuanKe, setPertemuanKe] = useState('Pertemuan 4');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2JP X 40 Menit');
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState('Edhi Purwoto, S.Pd.');

  // Simplified Point B: Only CP and TP
  const [capaianPembelajaran, setCapaianPembelajaran] = useState(
    'Membaca, menulis, dan membandingkan bilangan bulat, bilangan rasional, bilangan desimal, bilangan berpangkat bulat dan akar, bilangan dalam notasi ilmiah; menerapkan operasi aritmatika pada bilangan real, dan memberikan estimasi/perkiraan dalam menyelesaikan masalah (termasuk berkaitan dengan literasi finansial).'
  );
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(
    'Melalui latihan soal, manipulasi garis bilangan, dan penalaran matematis, peserta didik kelas VII dapat memahami konsep pengurangan bilangan bulat sebagai penjumlahan dengan lawan serta menghitung hasil pengurangan bilangan bulat untuk menyelesaikan masalah kontekstual secara cermat, kritis, dan akurat (Level Kognitif: Memahami & Menerapkan / C2-C3).'
  );

  // Model Pembelajaran (Dropdown / Ketik Manual)
  const [modelPembelajaranSelect, setModelPembelajaranSelect] = useState('Problem-Based Learning (PBL)');
  const [modelPembelajaranCustom, setModelPembelajaranCustom] = useState('');

  // Dimensi Profil Lulusan Selected (Added one by one from dropdown)
  const [selectedDPL, setSelectedDPL] = useState<string[]>([
    'Penalaran Kritis',
    'Kolaborasi',
    'Komunikasi',
  ]);
  const [isDplAuto, setIsDplAuto] = useState(false);

  // Arabic Modal State
  const [isArabicModalOpen, setIsArabicModalOpen] = useState(false);

  // Generation & Results State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState<RPPData | null>(null);
  const [activeTab, setActiveTab] = useState<'tabel' | 'lampiran' | 'lkpd' | 'semua'>('tabel');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const timeCalc = calculateMinutes(alokasiWaktu);

  // Add Dimensi one by one from dropdown
  const handleAddDimensi = (value: string) => {
    if (!value) return;
    if (value === '__AUTO__') {
      setIsDplAuto(true);
      setSelectedDPL([]);
      return;
    }
    if (value === '__ALL__') {
      setIsDplAuto(false);
      setSelectedDPL([...ALL_8_DIMENSI]);
      return;
    }
    setIsDplAuto(false);
    if (!selectedDPL.includes(value)) {
      setSelectedDPL([...selectedDPL, value]);
    }
  };

  const handleRemoveDimensi = (dim: string) => {
    setSelectedDPL(selectedDPL.filter((d) => d !== dim));
  };

  // Progress Bar Simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setProgress(5);
      setLoadingStage('Menginisialisasi parameter kurikulum & identifikasi murid...');

      const stages = [
        { at: 15, msg: 'Menganalisis Capaian Pembelajaran (CP) & Dimensi Profil Lulusan...' },
        { at: 30, msg: 'Merumuskan 4 Jenis Pengetahuan (Faktual, Konseptual, Prosedural, Metakognitif)...' },
        { at: 48, msg: 'Menyusun Sintaks STEAM & Sinkronisasi Alokasi Waktu Pengalaman Belajar...' },
        { at: 65, msg: 'Menyempurnakan Notasi Matematika/Sains/Arab & Integrasi Adiwiyata...' },
        { at: 80, msg: 'Menyusun Asesmen Awal, Rubrik Sikap, Pengetahuan, dan Keterampilan 4 Skala...' },
        { at: 92, msg: 'Mengembangkan Format LKPD Resmi Sesuai Modul (Memahami, Mengaplikasikan, Merefleksi)...' },
        { at: 98, msg: 'Memfinalisasi Dokumen & Memformat Struktur Tabel Word...' },
      ];

      let currentStep = 0;
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return 98;
          const next = prev + Math.floor(Math.random() * 3) + 1;
          if (currentStep < stages.length && next >= stages[currentStep].at) {
            setLoadingStage(stages[currentStep].msg);
            currentStep++;
          }
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Handle Form Submit
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const actualMapel =
      mataPelajaranSelect === 'Lainnya (Ketik Manual)' ? mataPelajaranCustom : mataPelajaranSelect;

    const actualModel =
      modelPembelajaranSelect === 'Lainnya (Ketik Manual)'
        ? modelPembelajaranCustom || 'Problem-Based Learning (PBL)'
        : modelPembelajaranSelect;

    const chosenDpl = isDplAuto ? [] : selectedDPL;

    try {
      const response = await fetch('/api/generate-rpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          penyusun,
          sekolah,
          tahunPelajaran,
          semester,
          mataPelajaran: actualMapel,
          kelasFase,
          topik,
          pertemuanKe,
          alokasiWaktu,
          capaianPembelajaran,
          tujuanPembelajaran,
          modelPembelajaran: actualModel,
          dimensiProfilLulusan: chosenDpl,
          namaKepalaSekolah,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Gagal menghasilkan RPP dari server.');
      }

      setProgress(100);
      setLoadingStage('Selesai! Menampilkan dokumen RPP & LKPD...');
      setTimeout(() => {
        setResultData(resJson.data);
        setLoading(false);
        // Switch directly to main screen result view without scrolling down!
        setScreenView('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan atau server saat memproses RPP.');
      setLoading(false);
    }
  };

  // Reset or Create Another RPM
  const handleCreateAnotherRPM = () => {
    setScreenView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download Docx
  const handleDownloadDocx = async () => {
    if (!resultData) return;
    try {
      setIsDownloading(true);
      const blob = await generateDocxBlob(resultData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `RPM_dan_LKPD_${resultData.identitas.mataPelajaran.replace(/\s+/g, '_')}_${resultData.identitas.kelasFase.replace(/\s+/g, '_')}.docx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting docx:', err);
      alert('Gagal mengekspor berkas Word: ' + (err as any).message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy full text
  const handleCopyText = () => {
    if (!resultData) return;
    const textOutput = `PERENCANAAN PEMBELAJARAN MENDALAM (RPM)
${resultData.lkpd.pertemuanKe || 'PERTEMUAN KE-4'}
Mata Pelajaran: ${resultData.identitas.mataPelajaran} | ${resultData.identitas.kelasFase} | ${resultData.identitas.sekolah}
Topik: ${resultData.identitas.topik}

A. IDENTITAS
- Penyusun: ${resultData.identitas.penyusun}
- Sekolah: ${resultData.identitas.sekolah}
- Tahun Pelajaran: ${resultData.identitas.tahunPelajaran}
- Semester: ${resultData.identitas.semester}
- Mata Pelajaran: ${resultData.identitas.mataPelajaran}
- Kelas/Fase: ${resultData.identitas.kelasFase}
- Topik: ${resultData.identitas.topik}
- Alokasi Waktu: ${resultData.identitas.alokasiWaktu}

B. IDENTIFIKASI
- Pengetahuan Awal: ${resultData.identifikasi.pengetahuanAwal}
- Minat Belajar: ${resultData.identifikasi.minatBelajar}
- Kebutuhan Belajar: ${resultData.identifikasi.kebutuhanBelajar}
- Materi Faktual: ${resultData.identifikasi.materiFaktual}
- Materi Konseptual: ${resultData.identifikasi.materiKonseptual}
- Materi Prosedural: ${resultData.identifikasi.materiProsedural}
- Materi Metakognitif: ${resultData.identifikasi.materiMetakognitif}
- Dimensi Profil Lulusan: ${resultData.identifikasi.dimensiProfilLulusan.join(', ')}

C. DESAIN PEMBELAJARAN
- Capaian Pembelajaran: ${resultData.desainPembelajaran.capaianPembelajaran}
- Lintas Disiplin Ilmu: ${resultData.desainPembelajaran.lintasDisiplinIlmu}
- Tujuan Pembelajaran:
${resultData.desainPembelajaran.tujuanPembelajaran.map((t, i) => `  ${i + 1}. ${cleanStep(t)}`).join('\n')}
- Model Pembelajaran: ${resultData.desainPembelajaran.modelPembelajaran}

D. PENGALAMAN BELAJAR
[Kegiatan Awal (${resultData.pengalamanBelajar.kegiatanAwal.durasi})]
${resultData.pengalamanBelajar.kegiatanAwal.langkah.map((l, i) => `  ${i + 1}. ${cleanStep(l)}`).join('\n')}

[Kegiatan Inti (${resultData.pengalamanBelajar.kegiatanInti.durasi})]
${resultData.pengalamanBelajar.kegiatanInti.tahapMemahami.judul}
${resultData.pengalamanBelajar.kegiatanInti.tahapMemahami.langkah.map((l, i) => `  ${i + 1}. ${cleanStep(l)}`).join('\n')}

${resultData.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.judul}
${resultData.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.langkah.map((l, i) => `  ${i + 1}. ${cleanStep(l)}`).join('\n')}

${resultData.pengalamanBelajar.kegiatanInti.tahapMerefleksi.judul}
${resultData.pengalamanBelajar.kegiatanInti.tahapMerefleksi.langkah.map((l, i) => `  ${i + 1}. ${cleanStep(l)}`).join('\n')}

[Kegiatan Penutup (${resultData.pengalamanBelajar.kegiatanPenutup.durasi})]
${resultData.pengalamanBelajar.kegiatanPenutup.langkah.map((l, i) => `  ${i + 1}. ${cleanStep(l)}`).join('\n')}

E. ASESMEN PEMBELAJARAN
- Awal: ${resultData.asesmenPembelajaran.asesmenAwal.jenis}
- Proses: ${resultData.asesmenPembelajaran.asesmenProses.jenis}
- Akhir: ${resultData.asesmenPembelajaran.asesmenAkhir.jenis}

Mengetahui Kepala Sekolah: ${resultData.asesmenPembelajaran.kepalaSekolah.nama}
Guru Mata Pelajaran: ${resultData.identitas.penyusun}
`;
    navigator.clipboard.writeText(textOutput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Top Author Banner */}
      <header className="bg-gradient-to-r from-[#1B365D] via-teal-900 to-indigo-950 text-white shadow-xl border-b border-blue-900/40">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide mb-1.5 shadow-xs">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Dibuat Oleh Badaruddin, S.Pd., M.Pd., Gr.</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <BookOpen className="w-8 h-8 text-emerald-400 shrink-0" />
                <span>RPM & LKPD Generator</span>
              </h1>
              <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Perencanaan Pembelajaran Mendalam (RPM) dan Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka untuk semua jenjang & mata pelajaran, lengkap dengan ekspor Word (.docx).
              </p>
            </div>

            {/* Quick Arabic Generator Button in Header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsArabicModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              >
                <span>🕌</span>
                <span>Generator Teks Arab (PAI)</span>
              </button>

              {resultData && (
                <button
                  type="button"
                  onClick={() => setScreenView(screenView === 'form' ? 'result' : 'form')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition"
                >
                  {screenView === 'form' ? <FileText className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  <span>{screenView === 'form' ? 'Lihat Hasil RPM' : 'Ubah Form'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* VIEW 1: FORM INPUT (Displayed on main screen when screenView === 'form') */}
        {screenView === 'form' && (
          <form onSubmit={handleGenerate} className="no-print space-y-6 animate-fade-in">
            {/* Section 1: Identitas Dokumen & Informasi Umum */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="bg-[#1B365D] px-6 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  <School className="w-5 h-5 text-emerald-300" />
                  <span>A. Identitas Dokumen & Informasi Umum</span>
                </div>
                <span className="text-xs text-blue-200 font-medium">Langkah 1 dari 3</span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Penyusun */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Penyusun / Guru Mapel
                  </label>
                  <input
                    type="text"
                    required
                    value={penyusun}
                    onChange={(e) => setPenyusun(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition"
                    placeholder="Nama Lengkap dengan Gelar"
                  />
                </div>

                {/* Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Satuan Pendidikan / Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={sekolah}
                    onChange={(e) => setSekolah(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                    placeholder="Misal: SMPN 05 SATAP Pulau Maya"
                  />
                </div>

                {/* Kepala Sekolah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Kepala Sekolah (Penandatangan)
                  </label>
                  <input
                    type="text"
                    required
                    value={namaKepalaSekolah}
                    onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition"
                    placeholder="Edhi Purwoto, S.Pd."
                  />
                </div>

                {/* Tahun Pelajaran & Semester */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tahun Pelajaran
                    </label>
                    <input
                      type="text"
                      value={tahunPelajaran}
                      onChange={(e) => setTahunPelajaran(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    >
                      <option value="1 (Ganjil)">1 (Ganjil)</option>
                      <option value="2 (Genap)">2 (Genap)</option>
                    </select>
                  </div>
                </div>

                {/* Jenjang / Kelas / Fase */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jenjang / Kelas / Fase Capaian
                  </label>
                  <select
                    value={kelasFase}
                    onChange={(e) => setKelasFase(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium transition"
                  >
                    {JENJANG_FASE_OPTIONS.map((cat) => (
                      <optgroup key={cat.group} label={`── ${cat.group} ──`}>
                        {cat.items.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mata Pelajaran
                  </label>
                  <select
                    value={mataPelajaranSelect}
                    onChange={(e) => setMataPelajaranSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium transition"
                  >
                    {MATA_PELAJARAN_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {mataPelajaranSelect === 'Lainnya (Ketik Manual)' && (
                    <input
                      type="text"
                      required
                      value={mataPelajaranCustom}
                      onChange={(e) => setMataPelajaranCustom(e.target.value)}
                      placeholder="Ketik nama mata pelajaran manual..."
                      className="mt-2 w-full px-3.5 py-2 rounded-xl border border-emerald-400 bg-emerald-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Topik / Materi Pembelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Topik / Materi Pokok Pembelajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition"
                    placeholder="Misal: Pengurangan Bilangan Bulat, Teorema Pythagoras, Ekosistem..."
                  />
                </div>

                {/* Kolom Pertemuan Ke */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pertemuan Ke
                  </label>
                  <input
                    type="text"
                    required
                    value={pertemuanKe}
                    onChange={(e) => setPertemuanKe(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition"
                    placeholder="Contoh: Pertemuan 4 atau 1, 2, dst."
                  />
                </div>

                {/* Alokasi Waktu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Alokasi Waktu (Ketik Bebas)
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {timeCalc.total} Menit
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={alokasiWaktu}
                    onChange={(e) => setAlokasiWaktu(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition"
                    placeholder="Contoh: 2 x 40 Menit atau 2JP X 35 Menit"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-tight">
                    Sinkronisasi: <span className="text-emerald-700 font-semibold">{timeCalc.detail}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Poin B - Disederhanakan: Hanya CP & TP */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="bg-[#1B365D] px-6 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  <BookOpen className="w-5 h-5 text-emerald-300" />
                  <span>B. Capaian, Tujuan & Model Pembelajaran</span>
                </div>
                <span className="text-xs text-blue-200 font-medium">Langkah 2 dari 3</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Google Drive Link above CP */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        Bank Referensi Resmi CP, TP & Format RPM (Google Drive)
                      </h4>
                      <p className="text-xs text-slate-600">
                        Buka dokumen acuan resmi Capaian Pembelajaran untuk mempermudah pengisian.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://drive.google.com/drive/folders/1le10XatIBlD3-HEv0PgjG7AM05EaCxSh?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    <span>Buka Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Capaian Pembelajaran (CP) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Capaian Pembelajaran (CP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsArabicModalOpen(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                    >
                      <span>🕌 Sisipkan Dalil/Ayat Arab (PAI)</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={capaianPembelajaran}
                    onChange={(e) => setCapaianPembelajaran(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
                    placeholder="Salin atau ketik Capaian Pembelajaran dari dokumen resmi..."
                  />
                </div>

                {/* Tujuan Pembelajaran (TP) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tujuan Pembelajaran (TP)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={tujuanPembelajaran}
                    onChange={(e) => setTujuanPembelajaran(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
                    placeholder="Ketik Tujuan Pembelajaran untuk pertemuan ini..."
                  />
                </div>

                {/* Kolom Model Pembelajaran (Dropdown ke bawah atau ketik manual) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Model Pembelajaran
                  </label>
                  <select
                    value={modelPembelajaranSelect}
                    onChange={(e) => setModelPembelajaranSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium transition cursor-pointer"
                  >
                    {MODEL_PEMBELAJARAN_OPTIONS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {modelPembelajaranSelect === 'Lainnya (Ketik Manual)' && (
                    <input
                      type="text"
                      required
                      value={modelPembelajaranCustom}
                      onChange={(e) => setModelPembelajaranCustom(e.target.value)}
                      placeholder="Ketik model pembelajaran manual..."
                      className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    Pilih model dari dropdown atau pilih 'Lainnya (Ketik Manual)' untuk mengetik model sendiri.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Sintaks model pembelajaran, pendekatan STEAM, serta metode & kemitraan belajar diselaraskan secara otomatis oleh sistem.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Dimensi Profil Lulusan - Dropdown Kebawah Satu Persatu */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="bg-[#1B365D] px-6 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  <GraduationCap className="w-5 h-5 text-emerald-300" />
                  <span>C. Dimensi Profil Lulusan (Pilih Dropdown Satu Persatu)</span>
                </div>
                <span className="text-xs text-blue-200 font-medium">Langkah 3 dari 3</span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Dimensi Profil Lulusan (Pilih Satu Persatu dari Dropdown)
                  </label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => handleAddDimensi(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-medium transition pr-10 appearance-none shadow-xs cursor-pointer"
                    >
                      <option value="" disabled>
                        + Klik untuk memilih dimensi satu persatu...
                      </option>
                      {ALL_8_DIMENSI.map((dim, idx) => (
                        <option
                          key={dim}
                          value={dim}
                          disabled={selectedDPL.includes(dim)}
                        >
                          {idx + 1}. {dim} {selectedDPL.includes(dim) ? '(Sudah Dipilih)' : ''}
                        </option>
                      ))}
                      <option value="__ALL__">★ Pilih Semua (8 Dimensi Lengkap)</option>
                      <option value="__AUTO__">⚡ Otomatis (Diselaraskan AI Sesuai TP & Model)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Selected Dimensi Tags (Removable one by one) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">
                      Dimensi yang Aktif ({isDplAuto ? 'Otomatis AI' : `${selectedDPL.length} Dimensi`}):
                    </span>
                    {!isDplAuto && selectedDPL.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDPL([])}
                        className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>

                  {isDplAuto ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center justify-between">
                      <span>⚡ Mode Otomatis Aktif: AI akan memilih dimensi yang paling selaras dengan Capaian & Tujuan Pembelajaran.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDplAuto(false);
                          setSelectedDPL(['Penalaran Kritis', 'Kolaborasi', 'Komunikasi']);
                        }}
                        className="text-xs text-emerald-700 underline font-bold"
                      >
                        Ubah ke Manual
                      </button>
                    </div>
                  ) : selectedDPL.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500">
                      Belum ada dimensi yang dipilih. Pilih salah satu dari dropdown di atas atau biarkan kosong untuk mode otomatis.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedDPL.map((dim) => (
                        <span
                          key={dim}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold shadow-xs"
                        >
                          <span>✓ {dim}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDimensi(dim)}
                            className="w-4 h-4 rounded-full hover:bg-blue-200 text-blue-800 flex items-center justify-center transition"
                            title="Hapus"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Format output memenuhi struktur kurikulum, asesmen 4 rubrik, dan LKPD operasional.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-base shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-3 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Buat RPP & RPM Sekarang</span>
              </button>
            </div>
          </form>
        )}

        {/* LOADING MODAL WITH PERCENTAGE & MANDATORY TEXT */}
        {loading && (
          <div className="my-8 p-8 bg-white rounded-3xl shadow-xl border border-emerald-200 text-center animate-fade-in">
            <div className="max-w-xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold text-sm sm:text-base shadow-xs animate-pulse">
                <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                <span>Sabar ya! Tunggu 3-5 Menit</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                Sedang Merancang Dokumen RPM & LKPD STEAM
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 px-1">
                  <span>Proses Pembuatan Dokumen:</span>
                  <span className="text-emerald-700 text-lg font-black">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 font-medium">
                <span className="text-emerald-700 font-bold mr-1.5">Aktivitas:</span>
                {loadingStage}
              </div>

              <p className="text-xs text-slate-400">
                Sistem sedang mengintegrasikan 4 jenis pengetahuan, notasi matematika presisi, teks Arab PAI, alur STEAM, Adiwiyata, rubrik penilaian, serta lembar kerja siswa.
              </p>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE DISPLAY */}
        {errorMsg && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Terjadi Kesalahan</h4>
              <p className="text-xs sm:text-sm text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* VIEW 2: RESULTS DISPLAYED DIRECTLY ON MAIN SCREEN (Simple & Clean) */}
        {screenView === 'result' && resultData && !loading && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Navigation & Action Bar on Main Screen */}
            <div className="no-print p-4 sm:p-5 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Hasil Dokumen Resmi</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                  {resultData.identitas.topik}
                </h2>
                <p className="text-xs text-slate-500">
                  {resultData.identitas.mataPelajaran} • {resultData.identitas.kelasFase} • {resultData.identitas.alokasiWaktu}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Buat RPM Lagi */}
                <button
                  type="button"
                  onClick={handleCreateAnotherRPM}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat RPM Lagi</span>
                </button>

                {/* Download Word Button */}
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={isDownloading}
                  className="px-4 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#152a4a] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-900/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-200" />
                  <span>{isDownloading ? 'Membuat Word...' : 'Download Dokumen Word (.docx)'}</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="no-print flex border-b border-slate-200 bg-white px-4 pt-3 rounded-t-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('tabel')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'tabel'
                    ? 'border-[#1B365D] text-[#1B365D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tabel RPM (Format Resmi)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lampiran')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'lampiran'
                    ? 'border-[#1B365D] text-[#1B365D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Lampiran Asesmen & 4 Rubrik</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lkpd')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'lkpd'
                    ? 'border-[#1B365D] text-[#1B365D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Lembar Kerja Peserta Didik (LKPD)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'semua'
                    ? 'border-[#1B365D] text-[#1B365D]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Semua Dokumen</span>
              </button>
            </div>

            {/* TAB CONTENT: TABEL RPP / RPM (WITH SINGLE BLUE HEADER ROWS IDENTICAL TO PDF) */}
            {(activeTab === 'tabel' || activeTab === 'semua') && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1B365D] uppercase">
                    PERENCANAAN PEMBELAJARAN MENDALAM (RPM)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    {cleanPertemuanText(resultData.lkpd.pertemuanKe || resultData.identitas.pertemuanKe || pertemuanKe)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    Mata Pelajaran: {resultData.identitas.mataPelajaran} | {resultData.identitas.kelasFase} | {resultData.identitas.sekolah}
                  </p>
                  <p className="text-xs font-semibold text-slate-600">
                    Topik: {resultData.identitas.topik}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs sm:text-sm">
                    <tbody>
                      {/* A. IDENTITAS - BLUE HEADER ROW WRITTEN ONLY ONCE */}
                      <tr className="bg-[#1B365D] text-white">
                        <td colSpan={2} className="border border-slate-300 px-4 py-2.5 font-bold text-sm sm:text-base">
                          A. Identitas
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 w-1/4">Penyusun</td>
                        <td className="border border-slate-300 px-4 py-2 font-medium">{resultData.identitas.penyusun}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Sekolah</td>
                        <td className="border border-slate-300 px-4 py-2">{resultData.identitas.sekolah}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Tahun Pelajaran</td>
                        <td className="border border-slate-300 px-4 py-2">{resultData.identitas.tahunPelajaran}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Semester</td>
                        <td className="border border-slate-300 px-4 py-2">{resultData.identitas.semester}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Mata Pelajaran</td>
                        <td className="border border-slate-300 px-4 py-2 font-medium">{resultData.identitas.mataPelajaran}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Kelas/Fase Capaian</td>
                        <td className="border border-slate-300 px-4 py-2 font-medium">{resultData.identitas.kelasFase}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Pertemuan Ke</td>
                        <td className="border border-slate-300 px-4 py-2 font-bold text-slate-900">
                          {cleanPertemuanText(resultData.lkpd.pertemuanKe || resultData.identitas.pertemuanKe || pertemuanKe)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Topik</td>
                        <td className="border border-slate-300 px-4 py-2 font-bold text-slate-900">
                          <MathText content={resultData.identitas.topik} />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">Alokasi Waktu</td>
                        <td className="border border-slate-300 px-4 py-2 font-bold text-emerald-800">
                          {resultData.identitas.alokasiWaktu}
                        </td>
                      </tr>

                      {/* B. IDENTIFIKASI - BLUE HEADER ROW WRITTEN ONLY ONCE */}
                      <tr className="bg-[#1B365D] text-white">
                        <td colSpan={2} className="border border-slate-300 px-4 py-2.5 font-bold text-sm sm:text-base">
                          B. Identifikasi
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Identifikasi Murid
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-2">
                          <div>
                            <span className="font-semibold text-slate-800">• Pengetahuan Awal: </span>
                            <MathText content={resultData.identifikasi.pengetahuanAwal} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">• Minat Belajar: </span>
                            <MathText content={resultData.identifikasi.minatBelajar} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">• Kebutuhan Belajar: </span>
                            <MathText content={resultData.identifikasi.kebutuhanBelajar} />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Materi Pelajaran
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-2">
                          <p>
                            <span className="font-semibold">• Faktual: </span>
                            <MathText content={resultData.identifikasi.materiFaktual} />
                          </p>
                          <p>
                            <span className="font-semibold">• Konseptual: </span>
                            <MathText content={resultData.identifikasi.materiKonseptual} />
                          </p>
                          <p>
                            <span className="font-semibold">• Prosedural: </span>
                            <MathText content={resultData.identifikasi.materiProsedural} />
                          </p>
                          <p>
                            <span className="font-semibold">• Metakognitif: </span>
                            <MathText content={resultData.identifikasi.materiMetakognitif} />
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Dimensi Profil Lulusan
                        </td>
                        <td className="border border-slate-300 px-4 py-2">
                          <ul className="list-disc list-outside pl-4 space-y-1">
                            {(resultData.identifikasi.dimensiProfilLulusan || []).map((d, i) => (
                              <li key={i} className="font-medium text-slate-800">
                                {d}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>

                      {/* C. DESAIN PEMBELAJARAN - BLUE HEADER ROW WRITTEN ONLY ONCE */}
                      <tr className="bg-[#1B365D] text-white">
                        <td colSpan={2} className="border border-slate-300 px-4 py-2.5 font-bold text-sm sm:text-base">
                          C. Desain Pembelajaran
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Capaian Pembelajaran (CP)
                        </td>
                        <td className="border border-slate-300 px-4 py-3 leading-relaxed">
                          <MathText content={resultData.desainPembelajaran.capaianPembelajaran} />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Lintas Disiplin Ilmu
                        </td>
                        <td className="border border-slate-300 px-4 py-2">
                          {resultData.desainPembelajaran.lintasDisiplinIlmu}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Tujuan Pembelajaran
                        </td>
                        <td className="border border-slate-300 px-4 py-2 space-y-1.5">
                          {resultData.desainPembelajaran.tujuanPembelajaran.map((tp, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="font-bold text-emerald-700">{i + 1}.</span>
                              <MathText content={cleanStep(tp)} />
                            </div>
                          ))}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Topik Pembelajaran
                        </td>
                        <td className="border border-slate-300 px-4 py-2 font-bold text-slate-900">
                          <MathText content={resultData.desainPembelajaran.topikPembelajaran} />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Praktik Pedagogis
                        </td>
                        <td className="border border-slate-300 px-4 py-2 space-y-1.5">
                          <p>
                            <span className="font-semibold">• Pendekatan:</span>{' '}
                            {resultData.desainPembelajaran.pendekatan}
                          </p>
                          <p>
                            <span className="font-semibold">• Model Pembelajaran:</span>{' '}
                            <span className="font-bold text-slate-800">
                              {resultData.desainPembelajaran.modelPembelajaran}
                            </span>
                          </p>
                          {(resultData.desainPembelajaran.sintaksModel || []).map((s, idx) => (
                            <p key={idx} className="text-slate-700 pl-3">
                              - Sintaks {idx + 1}: {cleanStep(s)}
                            </p>
                          ))}
                          <p className="pt-1">
                            <span className="font-semibold">• Metode:</span>{' '}
                            {resultData.desainPembelajaran.metode}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Kemitraan Pembelajaran
                        </td>
                        <td className="border border-slate-300 px-4 py-2">
                          {resultData.desainPembelajaran.kemitraanPembelajaran}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Lingkungan Pembelajaran
                        </td>
                        <td className="border border-slate-300 px-4 py-2">
                          {resultData.desainPembelajaran.lingkunganPembelajaran}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800 align-top">
                          Pemanfaatan Digital
                        </td>
                        <td className="border border-slate-300 px-4 py-2 text-indigo-900 font-medium">
                          {resultData.desainPembelajaran.pemanfaatanDigital}
                        </td>
                      </tr>

                      {/* D. PENGALAMAN BELAJAR - BLUE HEADER ROW WRITTEN ONLY ONCE */}
                      <tr className="bg-[#1B365D] text-white">
                        <td colSpan={2} className="border border-slate-300 px-4 py-2.5 font-bold text-sm sm:text-base">
                          D. Pengalaman Belajar
                        </td>
                      </tr>

                      {/* Kegiatan Awal with clean integer numbering 1, 2, 3, 4 */}
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Kegiatan Awal ({resultData.pengalamanBelajar.kegiatanAwal.durasi})
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-2">
                          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            (Prinsip: {resultData.pengalamanBelajar.kegiatanAwal.prinsip})
                          </div>
                          <ol className="list-decimal list-outside pl-4 space-y-1.5 mt-2">
                            {resultData.pengalamanBelajar.kegiatanAwal.langkah.map((l, i) => (
                              <li key={i} className="leading-relaxed">
                                <MathText content={cleanStep(l)} />
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>

                      {/* Kegiatan Inti with clean integer numbering 1, 2, 3, 4 */}
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Kegiatan Inti ({resultData.pengalamanBelajar.kegiatanInti.durasi})
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-4">
                          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            (Prinsip: {resultData.pengalamanBelajar.kegiatanInti.prinsip})
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-[#1B365D] text-xs sm:text-sm">
                              [Memahami] {resultData.pengalamanBelajar.kegiatanInti.tahapMemahami.judul} (
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMemahami.estimasiWaktu})
                            </h5>
                            <ol className="list-decimal list-outside pl-4 space-y-1.5 mt-2 text-xs sm:text-sm">
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMemahami.langkah.map(
                                (l, i) => (
                                  <li key={i} className="leading-relaxed">
                                    <MathText content={cleanStep(l)} />
                                  </li>
                                )
                              )}
                            </ol>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-[#1B365D] text-xs sm:text-sm">
                              [Mengaplikasikan] {resultData.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.judul} (
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.estimasiWaktu})
                            </h5>
                            <ol className="list-decimal list-outside pl-4 space-y-1.5 mt-2 text-xs sm:text-sm">
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.langkah.map(
                                (l, i) => (
                                  <li key={i} className="leading-relaxed">
                                    <MathText content={cleanStep(l)} />
                                  </li>
                                )
                              )}
                            </ol>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-[#1B365D] text-xs sm:text-sm">
                              [Merefleksi] {resultData.pengalamanBelajar.kegiatanInti.tahapMerefleksi.judul} (
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMerefleksi.estimasiWaktu})
                            </h5>
                            <ol className="list-decimal list-outside pl-4 space-y-1.5 mt-2 text-xs sm:text-sm">
                              {resultData.pengalamanBelajar.kegiatanInti.tahapMerefleksi.langkah.map(
                                (l, i) => (
                                  <li key={i} className="leading-relaxed">
                                    <MathText content={cleanStep(l)} />
                                  </li>
                                )
                              )}
                            </ol>
                          </div>
                        </td>
                      </tr>

                      {/* Kegiatan Penutup with clean integer numbering 1, 2, 3, 4 */}
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Kegiatan Penutup ({resultData.pengalamanBelajar.kegiatanPenutup.durasi})
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-2">
                          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            (Prinsip: {resultData.pengalamanBelajar.kegiatanPenutup.prinsip})
                          </div>
                          <ol className="list-decimal list-outside pl-4 space-y-1.5 mt-2">
                            {resultData.pengalamanBelajar.kegiatanPenutup.langkah.map((l, i) => (
                              <li key={i} className="leading-relaxed">
                                <MathText content={cleanStep(l)} />
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>

                      {/* E. ASESMEN PEMBELAJARAN - BLUE HEADER ROW WRITTEN ONLY ONCE */}
                      <tr className="bg-[#1B365D] text-white">
                        <td colSpan={2} className="border border-slate-300 px-4 py-2.5 font-bold text-sm sm:text-base">
                          E. Asesmen Pembelajaran
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Awal (Diagnostik)
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-1">
                          <p>• Jenis: {resultData.asesmenPembelajaran.asesmenAwal.jenis}</p>
                          <p>• Bentuk: {resultData.asesmenPembelajaran.asesmenAwal.bentuk}</p>
                          <p>• Teknik: {resultData.asesmenPembelajaran.asesmenAwal.teknik}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Proses (Formatif)
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-1">
                          <p>• Jenis: {resultData.asesmenPembelajaran.asesmenProses.jenis}</p>
                          <p>• Bentuk: {resultData.asesmenPembelajaran.asesmenProses.bentuk}</p>
                          <p>• Teknik: {resultData.asesmenPembelajaran.asesmenProses.teknik}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800 align-top">
                          Akhir (Sumatif)
                        </td>
                        <td className="border border-slate-300 px-4 py-3 space-y-1">
                          <p>• Jenis: {resultData.asesmenPembelajaran.asesmenAkhir.jenis}</p>
                          <p>• Bentuk: {resultData.asesmenPembelajaran.asesmenAkhir.bentuk}</p>
                          <p>• Teknik: {resultData.asesmenPembelajaran.asesmenAkhir.teknik}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Block */}
                <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
                  <div>
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="font-bold text-slate-800">Kepala {resultData.identitas.sekolah}</p>
                    <div className="h-20" />
                    <p className="font-bold text-slate-900 underline">
                      {resultData.asesmenPembelajaran.kepalaSekolah.nama || 'Edhi Purwoto, S.Pd.'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {resultData.asesmenPembelajaran.kepalaSekolah.nip
                        ? `NIP. ${resultData.asesmenPembelajaran.kepalaSekolah.nip}`
                        : 'NIP. 198311252014021001'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-600">Pulau Maya, 22 Juli 2026</p>
                    <p className="font-bold text-slate-800">Guru Mata Pelajaran {resultData.identitas.mataPelajaran}</p>
                    <div className="h-20" />
                    <p className="font-bold text-slate-900 underline">
                      {resultData.identitas.penyusun || 'Badaruddin, M.Pd.'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {resultData.asesmenPembelajaran.guruMapel.nip
                        ? `NIP. ${resultData.asesmenPembelajaran.guruMapel.nip}`
                        : 'NIP. 199408072019031005'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LAMPIRAN ASESMEN & 4 RUBRIK */}
            {(activeTab === 'lampiran' || activeTab === 'semua') && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
                <div className="text-center pb-4 border-b border-slate-200">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1B365D] uppercase">
                    LAMPIRAN PERTEMUAN KE-4
                  </h3>
                  <p className="text-xs text-slate-500 italic">
                    (Terpisah dari Tabel RPP)
                  </p>
                </div>

                {/* 1. Soal Asesmen Awal */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      1
                    </span>
                    <span>1. Soal Asesmen Awal Pertemuan 4 (5 Soal Essay + Kunci Jawaban)</span>
                  </h4>
                  <div className="space-y-4">
                    {(resultData.lampiran.soalAsesmenAwal || []).map((item) => (
                      <div
                        key={item.no}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {item.no}. <MathText content={cleanStep(item.soal)} />
                          </span>
                          <span className="shrink-0 text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                            Skor: {item.skor}
                          </span>
                        </div>
                        <div className="pt-2 text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-bold text-emerald-800">Kunci Jawaban: </span>
                          <MathText content={item.jawaban} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Rubrik Sikap (4 Skala with Blue Header) */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      2
                    </span>
                    <span>2. Rubrik Penilaian Sikap (4 Skala)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-[#1B365D] text-white">
                          <th className="border border-slate-300 p-2.5 font-bold w-1/4">Indikator Sikap</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 1 (Perlu Bimbingan)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 2 (Cukup)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 3 (Baik)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 4 (Sangat Baik)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultData.lampiran.rubrikSikap || []).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2.5 font-bold text-slate-800">{r.aspek}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.kurang}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.cukup}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-700 font-medium">{r.baik}</td>
                            <td className="border border-slate-300 p-2.5 text-emerald-900 font-semibold bg-emerald-50/30">
                              {r.sangatBaik}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Rubrik Pengetahuan (4 Skala with Blue Header) */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      3
                    </span>
                    <span>3. Rubrik Penilaian Pengetahuan (4 Skala)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-[#1B365D] text-white">
                          <th className="border border-slate-300 p-2.5 font-bold w-1/4">Indikator Pengetahuan</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 1 (Perlu Bimbingan)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 2 (Cukup)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 3 (Baik)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 4 (Sangat Baik)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultData.lampiran.rubrikPengetahuan || []).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2.5 font-bold text-slate-800">{r.aspek}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.kurang}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.cukup}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-700 font-medium">{r.baik}</td>
                            <td className="border border-slate-300 p-2.5 text-emerald-900 font-semibold bg-emerald-50/30">
                              {r.sangatBaik}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Rubrik Keterampilan (4 Skala with Blue Header) */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1B365D] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      4
                    </span>
                    <span>4. Rubrik Penilaian Keterampilan (4 Skala)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-[#1B365D] text-white">
                          <th className="border border-slate-300 p-2.5 font-bold w-1/4">Indikator Keterampilan</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 1 (Perlu Bimbingan)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 2 (Cukup)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 3 (Baik)</th>
                          <th className="border border-slate-300 p-2.5 font-bold">Skala 4 (Sangat Baik)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultData.lampiran.rubrikKeterampilan || []).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-2.5 font-bold text-slate-800">{r.aspek}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.kurang}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-600">{r.cukup}</td>
                            <td className="border border-slate-300 p-2.5 text-slate-700 font-medium">{r.baik}</td>
                            <td className="border border-slate-300 p-2.5 text-emerald-900 font-semibold bg-emerald-50/30">
                              {r.sangatBaik}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEMBAR KERJA PESERTA DIDIK (LKPD) */}
            {(activeTab === 'lkpd' || activeTab === 'semua') && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                {/* Header LKPD */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1B365D] uppercase">
                    LEMBAR KERJA PESERTA DIDIK (LKPD)
                  </h3>
                  <h4 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                    {cleanPertemuanText(resultData.lkpd.pertemuanKe || resultData.identitas.pertemuanKe || pertemuanKe)}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 italic mt-1">
                    Topik: {resultData.lkpd.topikLengkap || resultData.identitas.topik}
                  </p>
                  <p className="text-xs text-slate-500">
                    Mata Pelajaran: {resultData.identitas.mataPelajaran} ({resultData.identitas.kelasFase}) | {resultData.identitas.sekolah}
                  </p>
                </div>

                {/* Identitas Diri Box (2 Columns Bordered) */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
                    <div className="p-3 space-y-2">
                      <p>
                        <span className="font-semibold text-slate-700">Nama Peserta Didik : </span>
                        <span className="text-slate-400 font-mono">...................................................</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">No. Absen / Kelas : </span>
                        <span className="text-slate-800 font-medium">......... / {resultData.identitas.kelasFase}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Kelompok : </span>
                        <span className="text-slate-400 font-mono">...................................................</span>
                      </p>
                    </div>

                    <div className="p-3 space-y-2">
                      <p>
                        <span className="font-semibold text-slate-700">Mata Pelajaran : </span>
                        <span className="text-slate-800 font-medium">{resultData.identitas.mataPelajaran}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Hari / Tanggal : </span>
                        <span className="text-slate-400 font-mono">...................................................</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Nilai / Catatan : </span>
                        <span className="text-slate-400 font-mono">...................................................</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. Petunjuk Penggunaan LKPD */}
                <div>
                  <h4 className="text-sm font-bold text-[#1B365D] mb-2">
                    1. Petunjuk Penggunaan LKPD
                  </h4>
                  <ol className="list-decimal list-outside pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
                    {(resultData.lkpd.petunjukPenggunaan && resultData.lkpd.petunjukPenggunaan.length > 0
                      ? resultData.lkpd.petunjukPenggunaan
                      : [
                          'Berdoalah sebelum memulai mengerjakan LKPD ini.',
                          'Siapkan alat tulis (pensil, pulpen, penggaris, dan penghapus).',
                          'Bacalah ringkasan materi, aturan pengubahan konsep, dan petunjuk aktivitas secara cermat.',
                          'Selesaikan seluruh aktivitas Memahami, Mengaplikasikan, dan Merefleksikan secara aktif bersama anggota kelompokmu.',
                          'Apabila menemukan hambatan atau pertanyaan, tanyakan langsung kepada gurumu.',
                        ]
                    ).map((p, i) => (
                      <li key={i}>{cleanStep(p)}</li>
                    ))}
                  </ol>
                </div>

                {/* 2. Sintaks Pembelajaran & Pengalaman Belajar Mendalam */}
                <div className="space-y-6 pt-2">
                  <h4 className="text-sm sm:text-base font-bold text-[#1B365D] border-b pb-2">
                    2. Sintaks Pembelajaran & Pengalaman Belajar Mendalam
                  </h4>

                  {/* A. MEMAHAMI */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-[#1B365D]">
                      A. MEMAHAMI ({resultData.lkpd.memahami?.sintaks || 'Sintaks 1: Orientasi Masalah & Formulasi Pertanyaan'})
                    </h5>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2">
                      <p className="font-bold text-slate-800">
                        Ringkasan Materi & Aturan {resultData.identitas.topik}:
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">• Konsep Kunci:</span>{' '}
                        <span className="italic font-medium">"{resultData.lkpd.memahami?.konsepKunci}"</span>
                      </p>

                      <div>
                        <span className="font-semibold text-slate-700">• Rumus Utama / Aturan Pengubahan:</span>
                        <div className="pl-4 space-y-1 mt-1 font-mono text-xs">
                          {(resultData.lkpd.memahami?.rumusAturan || []).map((r, i) => (
                            <div key={i}>
                              <span className="font-bold">{i + 1}. </span>
                              <MathText content={cleanStep(r)} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-700">• Contoh Pemodelan:</span>
                        <div className="pl-4 space-y-1 mt-1 font-mono text-xs text-slate-800">
                          {(resultData.lkpd.memahami?.contohPemodelan || []).map((c, i) => (
                            <div key={i}>
                              <span className="font-bold">• </span>
                              <MathText content={cleanStep(c)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-xs sm:text-sm">
                      <p className="font-bold text-[#1B365D]">Jawablah Pertanyaan Pemahaman Berikut:</p>

                      {/* 1. Soal Isian */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <p className="font-semibold text-slate-800">
                          1. Selesaikan operasi pengubahan konsep berikut:
                        </p>
                        <div className="pl-4 space-y-1.5 font-mono text-xs">
                          {(resultData.lkpd.memahami?.soal1Variasi || []).map((item, idx) => (
                            <div key={idx} className="text-slate-800">
                              <span className="font-bold">{item.kode}. </span>
                              <MathText content={item.soal} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Soal Lawan / Pasangan */}
                      {resultData.lkpd.memahami?.soal2Variasi && resultData.lkpd.memahami.soal2Variasi.length > 0 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <p className="font-semibold text-slate-800">
                            2. Tentukan nilai / pasangan konsep berikut:
                          </p>
                          <div className="pl-4 space-y-1.5 font-mono text-xs">
                            {resultData.lkpd.memahami.soal2Variasi.map((item, idx) => (
                              <div key={idx} className="text-slate-800">
                                <span className="font-bold">{item.kode}. </span>
                                <MathText content={item.soal} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Soal Penalaran */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <p className="font-semibold text-slate-800">
                          3. <MathText content={resultData.lkpd.memahami?.soal3Penalaran || 'Jelaskan konsep ini dengan penalaran mendalam:'} />
                        </p>
                        <div className="pt-1">
                          <p className="font-semibold text-slate-600">Jawaban Siswa:</p>
                          <div className="mt-1 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400 font-mono text-xs">
                            ..........................................................................................................................................................................<br />
                            ..........................................................................................................................................................................
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* B. MENGAPLIKASIKAN */}
                  <div className="space-y-3 pt-4">
                    <h5 className="font-bold text-sm text-[#1B365D]">
                      B. MENGAPLIKASIKAN ({resultData.lkpd.mengaplikasikan?.sintaks || 'Sintaks 2 & 3: Pengumpulan Data, Eksplorasi & Analisis'})
                    </h5>

                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs sm:text-sm space-y-2">
                      <p className="font-bold text-[#1B365D]">
                        {resultData.lkpd.mengaplikasikan?.judulKasusKontekstual || 'Tugas Kasus Nyata Kontekstual:'}
                      </p>
                      {(resultData.lkpd.mengaplikasikan?.kasusKontekstual || []).map((k, idx) => (
                        <div key={idx} className="leading-relaxed">
                          <span className="font-bold text-slate-800">• {k.nama}: </span>
                          <MathText content={k.cerita} />
                        </div>
                      ))}
                    </div>

                    <div className="text-xs sm:text-sm space-y-1">
                      <p className="font-bold text-slate-800">Instruksi Kerja:</p>
                      <ol className="list-decimal list-outside pl-5 space-y-1 text-slate-700">
                        {(resultData.lkpd.mengaplikasikan?.instruksiKerja || []).map((ins, idx) => (
                          <li key={idx}>
                            <MathText content={cleanStep(ins)} />
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Ruang Jawaban Siswa */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs sm:text-sm">
                      <p className="font-bold text-[#1B365D]">Ruang Lembar Kerja Jawaban Siswa:</p>

                      <div>
                        <p className="font-semibold text-slate-800 mb-1">1. Perhitungan Selisih Kasus Kontekstual:</p>
                        <div className="pl-3 space-y-1.5 font-mono text-xs">
                          {(resultData.lkpd.mengaplikasikan?.ruangJawabanPerhitungan || []).map((p, idx) => (
                            <div key={idx} className="text-slate-800">
                              <span className="font-semibold">{p.label} : </span>
                              <MathText content={p.template} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Visual Sketch / Number Line */}
                      <div>
                        <p className="font-semibold text-slate-800 mb-1">
                          2. Gambarkan Panah Pergeseran Garis Bilangan / Sketsa Konsep:
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-slate-300 font-mono text-xs text-center overflow-x-auto text-slate-700">
                          {resultData.lkpd.mengaplikasikan?.sketsaVisual || '<---|---|---|---|---|---|---|---|---|--->'}<br />
                          -3  -2  -1   0   1   2   3   4   5
                        </div>
                      </div>

                      {/* Latihan Variasi */}
                      <div>
                        <p className="font-semibold text-slate-800 mb-1">3. Latihan Variasi Pengurangan Bilangan Bulat:</p>
                        <div className="pl-3 space-y-1.5 font-mono text-xs">
                          {(resultData.lkpd.mengaplikasikan?.latihanVariasi || []).map((v, idx) => (
                            <div key={idx} className="text-slate-800">
                              <span className="font-bold">{v.kode}. </span>
                              <MathText content={v.soal} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* C. MEREFLEKSIKAN */}
                  <div className="space-y-3 pt-4">
                    <h5 className="font-bold text-sm text-[#1B365D]">
                      C. MEREFLEKSIKAN ({resultData.lkpd.merefleksikan?.sintaks || 'Sintaks 4: Presentasi & Refleksi Pembelajaran'})
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 italic font-medium">
                      Ayo Refleksikan Proses Belajarmu Hari Ini!
                    </p>

                    <div className="space-y-3 text-xs sm:text-sm">
                      {(resultData.lkpd.merefleksikan?.pertanyaanRefleksi || []).map((ref, idx) => (
                        <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                          <p className="font-semibold text-slate-800">
                            {idx + 1}. <MathText content={cleanStep(ref.pertanyaan)} />
                          </p>
                          <div className="pt-1">
                            <p className="font-semibold text-slate-600">Refleksi Saya:</p>
                            <div className="mt-1 p-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400 font-mono text-xs">
                              ..........................................................................................................................................................................<br />
                              ..........................................................................................................................................................................
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Bagian Penutup LKPD */}
                  <div className="space-y-3 pt-4 border-t">
                    <h5 className="font-bold text-sm text-[#1B365D]">
                      3. Bagian Penutup LKPD
                    </h5>

                    <p className="text-xs sm:text-sm font-semibold text-emerald-800 italic bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      “{resultData.lkpd.penutup?.kataPenyemangat || 'Luar Biasa! Kamu telah berhasil memahami konsep pembelajaran hari ini! Teruslah berlatih dengan gembira dan penuh percaya diri!'}”
                    </p>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mb-2">
                        Lembar Cek Pemahaman Diri Siswa (Berikan tanda centang [✓] pada salah satu pilihan):
                      </p>
                      <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <tbody>
                            {(resultData.lkpd.penutup?.cekPemahamanDiri || [
                              {
                                kategori: '[ ] Sangat Paham',
                                deskripsi: 'Saya sudah memahami sepenuhnya konsep materi ini dan mahir menyelesaikan berbagai variasi persoalan secara mandiri.',
                              },
                              {
                                kategori: '[ ] Cukup Paham',
                                deskripsi: 'Saya sudah paham cara mengubah operasi menjadi penjumlahan lawan, namun masih butuh sedikit ketelitian saat menghitung.',
                              },
                              {
                                kategori: '[ ] Perlu Belajar Lagi',
                                deskripsi: 'Saya masih merasa bingung pada beberapa langkah konsep dan butuh bantuan guru/teman.',
                              },
                            ]).map((c, i) => (
                              <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-800 w-1/4 border-r border-slate-300 bg-slate-50/70">
                                  {c.kategori}
                                </td>
                                <td className="p-3 text-slate-700 leading-relaxed">
                                  {c.deskripsi}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 mb-1">Catatan / Umpan Balik Guru:</p>
                      <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 font-mono text-slate-400">
                        ..........................................................................................................................................................................
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom LKPD Action Buttons */}
                <div className="no-print pt-6 border-t flex flex-wrap justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCreateAnotherRPM}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buat RPM Lagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    disabled={isDownloading}
                    className="px-6 py-3 rounded-xl bg-[#1B365D] hover:bg-[#152a4a] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-cyan-200" />
                    <span>Download Seluruh Dokumen RPM & LKPD (.docx)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Arabic Generator Modal Component */}
      <ArabicGeneratorModal
        isOpen={isArabicModalOpen}
        onClose={() => setIsArabicModalOpen(false)}
        onInsertToCp={(text) => setCapaianPembelajaran((prev) => `${prev} ${text}`)}
        onInsertToTp={(text) => setTujuanPembelajaran((prev) => `${prev} ${text}`)}
      />

      {/* Footer without the author phrase after the title */}
      <footer className="no-print mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Aplikasi RPM & LKPD Generator • Kurikulum Merdeka
        </p>
      </footer>
    </div>
  );
}
