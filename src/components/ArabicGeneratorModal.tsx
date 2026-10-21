import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Plus, BookOpen, Search, Loader2 } from 'lucide-react';

interface ArabicResult {
  judul: string;
  sumber: string;
  teksArab: string;
  transliterasiLatin: string;
  terjemahan: string;
  kandunganSingkat: string;
}

interface ArabicGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToCp?: (text: string) => void;
  onInsertToTp?: (text: string) => void;
}

const PRESET_TOPICS = [
  { label: 'Menuntut Ilmu (QS. Al-Mujadilah: 11)', query: 'Kewajiban dan Keutamaan Menuntut Ilmu QS Al-Mujadilah ayat 11', type: 'Ayat Al-Qur\'an' },
  { label: 'Kebersihan Sebagian dari Iman', query: 'Kebersihan adalah sebagian dari iman Thaharah', type: 'Hadits Nabi SAW' },
  { label: 'Berbakti Kepada Orang Tua (QS. Luqman: 14)', query: 'Berbakti kepada orang tua Birrul Walidain QS Luqman 14', type: 'Ayat Al-Qur\'an' },
  { label: 'Toleransi & Keberagaman (QS. Al-Hujurat: 13)', query: 'Persaudaraan toleransi dan keberagaman QS Al-Hujurat ayat 13', type: 'Ayat Al-Qur\'an' },
  { label: 'Doa Sebelum Belajar', query: 'Doa memohon ilmu yang bermanfaat sebelum belajar', type: 'Doa' },
  { label: 'Surat Al-Fatihah', query: 'Surat Al-Fatihah lengkap harakat', type: 'Ayat Al-Qur\'an' },
  { label: 'Kejujuran & Akhlak Mulia', query: 'Hadits tentang kejujuran dan akhlak mulia', type: 'Hadits Nabi SAW' },
];

export const ArabicGeneratorModal: React.FC<ArabicGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertToCp,
  onInsertToTp,
}) => {
  const [topik, setTopik] = useState('Kewajiban dan Keutamaan Menuntut Ilmu');
  const [jenis, setJenis] = useState('Ayat Al-Qur\'an');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ArabicResult | null>({
    judul: 'QS. Al-Mujadilah Ayat 11 (Keutamaan Menuntut Ilmu)',
    sumber: 'Al-Qur\'an Surah Al-Mujadilah [58]: 11',
    teksArab: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ ۚ وَاللَّهُ بِمَا تَعْمَلُونَ خَبِيرٌ',
    transliterasiLatin: 'Yarfa\'illāhul-lażīna āmanū minkum wal-lażīna ūtul-\'ilma darajāt, wallāhu bimā ta\'malūna khabīr.',
    terjemahan: 'Niscaya Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat. Dan Allah Maha Mengetahui apa yang kamu kerjakan.',
    kandunganSingkat: 'Ayat ini menegaskan tingginya derajat orang yang berilmu serta keterpaduan antara keimanan dengan penguasaan ilmu pengetahuan.',
  });
  const [copied, setCopied] = useState(false);
  const [insertedNotice, setInsertedNotice] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topik.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/generate-arabic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topik, jenis }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan teks Arab');
      }
      setResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.judul}\n${result.teksArab}\n\nLatin: ${result.transliterasiLatin}\nArtinya: "${result.terjemahan}"\n(${result.sumber})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (target: 'cp' | 'tp') => {
    if (!result) return;
    const textToInsert = ` ${result.teksArab} (${result.terjemahan} - ${result.sumber})`;
    if (target === 'cp' && onInsertToCp) {
      onInsertToCp(textToInsert);
      setInsertedNotice('Berhasil disisipkan ke Capaian Pembelajaran (CP)!');
    } else if (target === 'tp' && onInsertToTp) {
      onInsertToTp(textToInsert);
      setInsertedNotice('Berhasil disisipkan ke Tujuan Pembelajaran (TP)!');
    }
    setTimeout(() => setInsertedNotice(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-lg">
              🕌
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Generator Teks Arab & Dalil PAI</h3>
              <p className="text-xs text-emerald-200">Ayat Al-Qur'an, Hadits, & Doa dengan Harakat Lengkap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Form Search */}
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Topik / Kata Kunci / Nama Surat
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    placeholder="Misal: Menuntut Ilmu, Thaharah, Sholat, QS Luqman..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jenis Rujukan
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  <option value="Ayat Al-Qur'an">Ayat Al-Qur'an</option>
                  <option value="Hadits Nabi SAW">Hadits Nabi SAW</option>
                  <option value="Doa">Doa Sehari-hari</option>
                  <option value="Istilah / Kosa Kata">Istilah / Kosa Kata</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-xs font-semibold text-slate-500 mr-1.5">Pilihan Populer:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRESET_TOPICS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTopik(p.query);
                      setJenis(p.type);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Menghasilkan Teks Arab...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Hasilkan Teks Arab & Terjemahan</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          {insertedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{insertedNotice}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-50/50 via-white to-slate-50 border border-amber-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <span className="text-xs font-bold text-amber-900">{result.judul}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                  {result.sumber}
                </span>
              </div>

              {/* Authentic Arabic Text with Amiri font and full harakat */}
              <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-inner">
                <p className="font-arabic text-2xl sm:text-3xl text-emerald-950 font-normal leading-loose tracking-wide">
                  {result.teksArab}
                </p>
              </div>

              {/* Latin & Terjemahan */}
              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                <p className="italic text-slate-600">
                  <span className="font-semibold not-italic text-slate-800">Transliterasi: </span>
                  {result.transliterasiLatin}
                </p>
                <p className="leading-relaxed">
                  <span className="font-semibold text-slate-800">Artinya: </span>
                  "{result.terjemahan}"
                </p>
                {result.kandunganSingkat && (
                  <p className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">Kandungan: </span>
                    {result.kandunganSingkat}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {onInsertToCp && (
                    <button
                      type="button"
                      onClick={() => handleInsert('cp')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sisipkan ke CP</span>
                    </button>
                  )}
                  {onInsertToTp && (
                    <button
                      type="button"
                      onClick={() => handleInsert('tp')}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-semibold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sisipkan ke TP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
