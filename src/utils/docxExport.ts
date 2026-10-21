import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
} from 'docx';

export interface RPPData {
  identitas: {
    penyusun: string;
    sekolah: string;
    tahunPelajaran: string;
    semester: string;
    mataPelajaran: string;
    kelasFase: string;
    pertemuanKe?: string;
    topik: string;
    alokasiWaktu: string;
    totalMenit?: number;
  };
  identifikasi: {
    pengetahuanAwal: string;
    minatBelajar: string;
    kebutuhanBelajar: string;
    materiFaktual: string;
    materiKonseptual: string;
    materiProsedural: string;
    materiMetakognitif: string;
    dimensiProfilLulusan: string[];
  };
  desainPembelajaran: {
    capaianPembelajaran: string;
    lintasDisiplinIlmu: string;
    tujuanPembelajaran: string[];
    topikPembelajaran: string;
    pendekatan: string;
    modelPembelajaran: string;
    sintaksModel: string[];
    metode: string;
    kemitraanPembelajaran: string;
    lingkunganPembelajaran: string;
    pemanfaatanDigital: string;
  };
  pengalamanBelajar: {
    kegiatanAwal: {
      durasi: string;
      prinsip: string;
      langkah: string[];
    };
    kegiatanInti: {
      durasi: string;
      prinsip: string;
      tahapMemahami: {
        judul: string;
        estimasiWaktu: string;
        langkah: string[];
      };
      tahapMengaplikasikan: {
        judul: string;
        estimasiWaktu: string;
        langkah: string[];
      };
      tahapMerefleksi: {
        judul: string;
        estimasiWaktu: string;
        langkah: string[];
      };
    };
    kegiatanPenutup: {
      durasi: string;
      prinsip: string;
      langkah: string[];
    };
  };
  asesmenPembelajaran: {
    asesmenAwal: { jenis: string; bentuk: string; teknik: string };
    asesmenProses: { jenis: string; bentuk: string; teknik: string };
    asesmenAkhir: { jenis: string; bentuk: string; teknik: string };
    kepalaSekolah: { nama: string; nip?: string };
    guruMapel: { nama: string; nip?: string };
  };
  lampiran: {
    soalAsesmenAwal: Array<{ no: number; soal: string; jawaban: string; skor: number }>;
    rubrikSikap: Array<{ aspek: string; kurang: string; cukup: string; baik: string; sangatBaik: string }>;
    rubrikPengetahuan: Array<{ aspek: string; kurang: string; cukup: string; baik: string; sangatBaik: string }>;
    rubrikKeterampilan: Array<{ aspek: string; kurang: string; cukup: string; baik: string; sangatBaik: string }>;
  };
  lkpd: {
    pertemuanKe?: string;
    judul: string;
    topikLengkap?: string;
    identitas?: {
      namaPesertaDidikPlaceholder?: string;
      mataPelajaran?: string;
      noAbsenKelas?: string;
      hariTanggalPlaceholder?: string;
      kelompokPlaceholder?: string;
      nilaiCatatanPlaceholder?: string;
    };
    petunjukPenggunaan: string[];
    memahami: {
      sintaks: string;
      konsepKunci: string;
      rumusAturan: string[];
      contohPemodelan: string[];
      soal1Variasi: Array<{ kode: string; soal: string }>;
      soal2Variasi?: Array<{ kode: string; soal: string }>;
      soal3Penalaran: string;
    };
    mengaplikasikan: {
      sintaks: string;
      judulKasusKontekstual: string;
      kasusKontekstual: Array<{ nama: string; cerita: string }>;
      instruksiKerja: string[];
      ruangJawabanPerhitungan: Array<{ label: string; template: string }>;
      sketsaVisual?: string;
      latihanVariasi: Array<{ kode: string; soal: string }>;
    };
    merefleksikan: {
      sintaks: string;
      pertanyaanRefleksi: Array<{ pertanyaan: string }>;
    };
    penutup: {
      kataPenyemangat: string;
      cekPemahamanDiri: Array<{
        kategori: string;
        deskripsi: string;
      }>;
      catatanGuruPlaceholder?: string;
    };
  };
}

// Exactly matches the deep navy blue header from sample PDF
const SECTION_HEADER_BG = '1B365D'; // Dark Navy Blue as in sample PDF
const BORDER_COLOR = 'CBD5E1'; // Slate 300

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_COLOR,
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function cleanStepText(text: string): string {
  if (!text) return '';
  // Remove accidental decimal numbers like 1.1, 1.2, 2.1, or existing numbers at start
  return text.replace(/^(\d+(\.\d+)*\s*[-–.]\s*|\d+\.\s*)/, '').trim();
}

function createTableCell(
  children: Paragraph[],
  widthPercent: number,
  options?: { isHeader?: boolean; bgColor?: string }
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    shading: options?.bgColor
      ? { fill: options.bgColor, type: ShadingType.CLEAR }
      : undefined,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children,
  });
}

// Single Full-Width Blue Section Bar (A. Identitas, B. Identifikasi, etc.)
function makeSectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: SECTION_HEADER_BG, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                color: 'FFFFFF',
                size: 22,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// 2-Column Row without repeating Section Titles
function makeRow(label: string, content: Paragraph[] | string): TableRow {
  const rightColChildren: Paragraph[] =
    typeof content === 'string'
      ? [new Paragraph({ children: [new TextRun({ text: content, size: 20 })] })]
      : content;

  return new TableRow({
    children: [
      createTableCell(
        [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                color: '1E293B',
              }),
            ],
          }),
        ],
        28,
        { bgColor: 'F8FAFC' }
      ),
      createTableCell(rightColChildren, 72),
    ],
  });
}

export function cleanPertemuanText(val?: string): string {
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

export async function generateDocxBlob(data: RPPData): Promise<Blob> {
  const tableRows: TableRow[] = [];

  // A. IDENTITAS (Blue Bar written ONLY ONCE)
  tableRows.push(makeSectionHeaderRow('A. Identitas'));
  tableRows.push(makeRow('Penyusun', data.identitas.penyusun));
  tableRows.push(makeRow('Sekolah', data.identitas.sekolah));
  tableRows.push(makeRow('Tahun Pelajaran', data.identitas.tahunPelajaran));
  tableRows.push(makeRow('Semester', data.identitas.semester));
  tableRows.push(makeRow('Mata Pelajaran', data.identitas.mataPelajaran));
  tableRows.push(makeRow('Kelas/Fase Capaian', data.identitas.kelasFase));
  tableRows.push(makeRow('Pertemuan Ke', cleanPertemuanText(data.lkpd.pertemuanKe || data.identitas.pertemuanKe || 'PERTEMUAN 4')));
  tableRows.push(makeRow('Topik', data.identitas.topik));
  tableRows.push(makeRow('Alokasi Waktu', data.identitas.alokasiWaktu));

  // B. IDENTIFIKASI (Blue Bar written ONLY ONCE)
  tableRows.push(makeSectionHeaderRow('B. Identifikasi'));
  tableRows.push(
    makeRow('Identifikasi Murid', [
      new Paragraph({
        children: [
          new TextRun({ text: '• Pengetahuan Awal: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.pengetahuanAwal, size: 20 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Minat Belajar: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.minatBelajar, size: 20 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Kebutuhan Belajar: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.kebutuhanBelajar, size: 20 }),
        ],
      }),
    ])
  );
  tableRows.push(
    makeRow('Materi Pelajaran', [
      new Paragraph({
        children: [
          new TextRun({ text: '• Faktual: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.materiFaktual, size: 20 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Konseptual: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.materiKonseptual, size: 20 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Prosedural: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.materiProsedural, size: 20 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Metakognitif: ', bold: true, size: 20 }),
          new TextRun({ text: data.identifikasi.materiMetakognitif, size: 20 }),
        ],
      }),
    ])
  );
  tableRows.push(
    makeRow(
      'Dimensi Profil Lulusan',
      (data.identifikasi.dimensiProfilLulusan || []).map(
        (d) =>
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true, size: 20 }),
              new TextRun({ text: d, size: 20 }),
            ],
            spacing: { after: 40 },
          })
      )
    )
  );

  // C. DESAIN PEMBELAJARAN (Blue Bar written ONLY ONCE)
  tableRows.push(makeSectionHeaderRow('C. Desain Pembelajaran'));
  tableRows.push(makeRow('Capaian Pembelajaran (CP)', data.desainPembelajaran.capaianPembelajaran));
  tableRows.push(makeRow('Lintas Disiplin Ilmu', data.desainPembelajaran.lintasDisiplinIlmu));
  tableRows.push(
    makeRow(
      'Tujuan Pembelajaran',
      data.desainPembelajaran.tujuanPembelajaran.map(
        (tp, idx) =>
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
              new TextRun({ text: cleanStepText(tp), size: 20 }),
            ],
          })
      )
    )
  );
  tableRows.push(makeRow('Topik Pembelajaran', data.desainPembelajaran.topikPembelajaran));
  tableRows.push(
    makeRow('Praktik Pedagogis', [
      new Paragraph({
        children: [
          new TextRun({ text: '• Pendekatan: ', bold: true, size: 20 }),
          new TextRun({ text: data.desainPembelajaran.pendekatan, size: 20 }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Model Pembelajaran: ', bold: true, size: 20 }),
          new TextRun({ text: data.desainPembelajaran.modelPembelajaran, size: 20 }),
        ],
        spacing: { after: 50 },
      }),
      ...(data.desainPembelajaran.sintaksModel || []).map(
        (s, idx) =>
          new Paragraph({
            children: [
              new TextRun({ text: `   - Sintaks ${idx + 1}: `, bold: true, size: 20 }),
              new TextRun({ text: cleanStepText(s), size: 20 }),
            ],
            spacing: { after: 30 },
          })
      ),
      new Paragraph({
        children: [
          new TextRun({ text: '• Metode: ', bold: true, size: 20 }),
          new TextRun({ text: data.desainPembelajaran.metode, size: 20 }),
        ],
        spacing: { before: 50 },
      }),
    ])
  );
  tableRows.push(makeRow('Kemitraan Pembelajaran', data.desainPembelajaran.kemitraanPembelajaran));
  tableRows.push(makeRow('Lingkungan Pembelajaran', data.desainPembelajaran.lingkunganPembelajaran));
  tableRows.push(makeRow('Pemanfaatan Digital', data.desainPembelajaran.pemanfaatanDigital));

  // D. PENGALAMAN BELAJAR (Blue Bar written ONLY ONCE)
  tableRows.push(makeSectionHeaderRow('D. Pengalaman Belajar'));

  // Kegiatan Awal with clean integer numbering 1, 2, 3, 4
  const awalParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: `(Prinsip: ${data.pengalamanBelajar.kegiatanAwal.prinsip})`, italics: true, size: 20 }),
      ],
      spacing: { after: 80 },
    }),
    ...data.pengalamanBelajar.kegiatanAwal.langkah.map(
      (step, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: cleanStepText(step), size: 20 }),
          ],
        })
    ),
  ];
  tableRows.push(makeRow(`Kegiatan Awal (${data.pengalamanBelajar.kegiatanAwal.durasi})`, awalParagraphs));

  // Kegiatan Inti with clean integer numbering 1, 2, 3, 4 (NO 1.1 or 1.2!)
  const intiParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: `(Prinsip: ${data.pengalamanBelajar.kegiatanInti.prinsip})`, italics: true, size: 20 }),
      ],
      spacing: { after: 120 },
    }),
    // Tahap Memahami
    new Paragraph({
      children: [
        new TextRun({
          text: `[Memahami] ${data.pengalamanBelajar.kegiatanInti.tahapMemahami.judul} (${data.pengalamanBelajar.kegiatanInti.tahapMemahami.estimasiWaktu})`,
          bold: true,
          color: SECTION_HEADER_BG,
          size: 20,
        }),
      ],
      spacing: { before: 80, after: 60 },
    }),
    ...data.pengalamanBelajar.kegiatanInti.tahapMemahami.langkah.map(
      (step, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: cleanStepText(step), size: 20 }),
          ],
        })
    ),
    // Tahap Mengaplikasikan
    new Paragraph({
      children: [
        new TextRun({
          text: `[Mengaplikasikan] ${data.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.judul} (${data.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.estimasiWaktu})`,
          bold: true,
          color: SECTION_HEADER_BG,
          size: 20,
        }),
      ],
      spacing: { before: 100, after: 60 },
    }),
    ...data.pengalamanBelajar.kegiatanInti.tahapMengaplikasikan.langkah.map(
      (step, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: cleanStepText(step), size: 20 }),
          ],
        })
    ),
    // Tahap Merefleksi
    new Paragraph({
      children: [
        new TextRun({
          text: `[Merefleksi] ${data.pengalamanBelajar.kegiatanInti.tahapMerefleksi.judul} (${data.pengalamanBelajar.kegiatanInti.tahapMerefleksi.estimasiWaktu})`,
          bold: true,
          color: SECTION_HEADER_BG,
          size: 20,
        }),
      ],
      spacing: { before: 100, after: 60 },
    }),
    ...data.pengalamanBelajar.kegiatanInti.tahapMerefleksi.langkah.map(
      (step, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: cleanStepText(step), size: 20 }),
          ],
        })
    ),
  ];
  tableRows.push(makeRow(`Kegiatan Inti (${data.pengalamanBelajar.kegiatanInti.durasi})`, intiParagraphs));

  // Kegiatan Penutup with clean integer numbering 1, 2, 3, 4
  const penutupParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: `(Prinsip: ${data.pengalamanBelajar.kegiatanPenutup.prinsip})`, italics: true, size: 20 }),
      ],
      spacing: { after: 80 },
    }),
    ...data.pengalamanBelajar.kegiatanPenutup.langkah.map(
      (step, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: cleanStepText(step), size: 20 }),
          ],
        })
    ),
  ];
  tableRows.push(makeRow(`Kegiatan Penutup (${data.pengalamanBelajar.kegiatanPenutup.durasi})`, penutupParagraphs));

  // E. ASESMEN PEMBELAJARAN (Blue Bar written ONLY ONCE)
  tableRows.push(makeSectionHeaderRow('E. Asesmen Pembelajaran'));
  tableRows.push(
    makeRow('Awal (Diagnostik)', [
      new Paragraph({ children: [new TextRun({ text: `• Jenis: ${data.asesmenPembelajaran.asesmenAwal.jenis}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Bentuk: ${data.asesmenPembelajaran.asesmenAwal.bentuk}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Teknik: ${data.asesmenPembelajaran.asesmenAwal.teknik}`, size: 20 })] }),
    ])
  );
  tableRows.push(
    makeRow('Proses (Formatif)', [
      new Paragraph({ children: [new TextRun({ text: `• Jenis: ${data.asesmenPembelajaran.asesmenProses.jenis}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Bentuk: ${data.asesmenPembelajaran.asesmenProses.bentuk}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Teknik: ${data.asesmenPembelajaran.asesmenProses.teknik}`, size: 20 })] }),
    ])
  );
  tableRows.push(
    makeRow('Akhir (Sumatif)', [
      new Paragraph({ children: [new TextRun({ text: `• Jenis: ${data.asesmenPembelajaran.asesmenAkhir.jenis}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Bentuk: ${data.asesmenPembelajaran.asesmenAkhir.bentuk}`, size: 20 })] }),
      new Paragraph({ children: [new TextRun({ text: `• Teknik: ${data.asesmenPembelajaran.asesmenAkhir.teknik}`, size: 20 })] }),
    ])
  );

  const rppTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  // Tanda Tangan Table (Side by Side)
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({ text: 'Mengetahui,' }),
              new Paragraph({ text: `Kepala ${data.identitas.sekolah}` }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.asesmenPembelajaran.kepalaSekolah.nama || 'Edhi Purwoto, S.Pd.',
                    bold: true,
                    underline: {},
                  }),
                ],
              }),
              new Paragraph({
                text: data.asesmenPembelajaran.kepalaSekolah.nip
                  ? `NIP. ${data.asesmenPembelajaran.kepalaSekolah.nip}`
                  : 'NIP. 198311252014021001',
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({ text: `Pulau Maya, 22 Juli 2026` }),
              new Paragraph({ text: `Guru Mata Pelajaran ${data.identitas.mataPelajaran}` }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.identitas.penyusun || 'Badaruddin, M.Pd.',
                    bold: true,
                    underline: {},
                  }),
                ],
              }),
              new Paragraph({
                text: data.asesmenPembelajaran.guruMapel.nip
                  ? `NIP. ${data.asesmenPembelajaran.guruMapel.nip}`
                  : 'NIP. 199408072019031005',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Lampiran 1: Soal Asesmen Awal
  const soalParagraphs: Paragraph[] = (data.lampiran.soalAsesmenAwal || []).map((item) => {
    return new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${item.no}. `, bold: true, size: 21, color: SECTION_HEADER_BG }),
        new TextRun({ text: `${item.soal}\n`, size: 20 }),
        new TextRun({ text: `   Kunci Jawaban: `, bold: true, size: 20, color: '15803D' }),
        new TextRun({ text: `${item.jawaban} `, size: 20 }),
        new TextRun({ text: `(Skor: ${item.skor})`, italics: true, size: 19, color: '64748B' }),
      ],
    });
  });

  // Rubrik Table with Blue Header
  const makeRubrikTable = (
    rubrikItems: Array<{ aspek: string; kurang: string; cukup: string; baik: string; sangatBaik: string }>
  ) => {
    const rRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createTableCell([new Paragraph({ children: [new TextRun({ text: 'Indikator', bold: true, color: 'FFFFFF', size: 20 })] })], 24, { bgColor: SECTION_HEADER_BG }),
          createTableCell([new Paragraph({ children: [new TextRun({ text: 'Skala 1 (Perlu Bimbingan)', bold: true, color: 'FFFFFF', size: 19 })] })], 19, { bgColor: SECTION_HEADER_BG }),
          createTableCell([new Paragraph({ children: [new TextRun({ text: 'Skala 2 (Cukup)', bold: true, color: 'FFFFFF', size: 19 })] })], 19, { bgColor: SECTION_HEADER_BG }),
          createTableCell([new Paragraph({ children: [new TextRun({ text: 'Skala 3 (Baik)', bold: true, color: 'FFFFFF', size: 19 })] })], 19, { bgColor: SECTION_HEADER_BG }),
          createTableCell([new Paragraph({ children: [new TextRun({ text: 'Skala 4 (Sangat Baik)', bold: true, color: 'FFFFFF', size: 19 })] })], 19, { bgColor: SECTION_HEADER_BG }),
        ],
      }),
    ];

    rubrikItems.forEach((item) => {
      rRows.push(
        new TableRow({
          children: [
            createTableCell([new Paragraph({ children: [new TextRun({ text: item.aspek, bold: true, size: 19 })] })], 24),
            createTableCell([new Paragraph({ children: [new TextRun({ text: item.kurang, size: 19 })] })], 19),
            createTableCell([new Paragraph({ children: [new TextRun({ text: item.cukup, size: 19 })] })], 19),
            createTableCell([new Paragraph({ children: [new TextRun({ text: item.baik, size: 19 })] })], 19),
            createTableCell([new Paragraph({ children: [new TextRun({ text: item.sangatBaik, size: 19 })] })], 19),
          ],
        })
      );
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rRows,
    });
  };

  // LKPD Table Box
  const lkpdBoxTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'Nama Peserta Didik : ', bold: true, size: 19 }),
                new TextRun({ text: '...................................................', size: 19 }),
              ],
            }),
          ], 50),
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'Mata Pelajaran : ', bold: true, size: 19 }),
                new TextRun({ text: data.identitas.mataPelajaran, size: 19 }),
              ],
            }),
          ], 50),
        ],
      }),
      new TableRow({
        children: [
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'No. Absen / Kelas : ', bold: true, size: 19 }),
                new TextRun({ text: `......... / ${data.identitas.kelasFase}`, size: 19 }),
              ],
            }),
          ], 50),
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'Hari / Tanggal : ', bold: true, size: 19 }),
                new TextRun({ text: '...................................................', size: 19 }),
              ],
            }),
          ], 50),
        ],
      }),
      new TableRow({
        children: [
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'Kelompok : ', bold: true, size: 19 }),
                new TextRun({ text: '...................................................', size: 19 }),
              ],
            }),
          ], 50),
          createTableCell([
            new Paragraph({
              children: [
                new TextRun({ text: 'Nilai / Catatan : ', bold: true, size: 19 }),
                new TextRun({ text: '...................................................', size: 19 }),
              ],
            }),
          ], 50),
        ],
      }),
    ],
  });

  const lkpdParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'LEMBAR KERJA PESERTA DIDIK (LKPD)',
          bold: true,
          size: 26,
          color: SECTION_HEADER_BG,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: cleanPertemuanText(data.lkpd.pertemuanKe || data.identitas.pertemuanKe || 'PERTEMUAN 4'),
          bold: true,
          size: 22,
          color: '1E293B',
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Topik: ${data.lkpd.topikLengkap || data.identitas.topik}`,
          size: 20,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Mata Pelajaran: ${data.identitas.mataPelajaran} (${data.identitas.kelasFase}) | ${data.identitas.sekolah}`,
          size: 20,
          color: '475569',
        }),
      ],
      spacing: { after: 180 },
    }),
  ];

  const petunjukSteps = data.lkpd.petunjukPenggunaan && data.lkpd.petunjukPenggunaan.length > 0
    ? data.lkpd.petunjukPenggunaan
    : [
        'Berdoalah sebelum memulai mengerjakan LKPD ini.',
        'Siapkan alat tulis (pensil, pulpen, penggaris, dan penghapus).',
        'Bacalah ringkasan materi, aturan pengubahan konsep, dan petunjuk aktivitas secara cermat.',
        'Selesaikan seluruh aktivitas Memahami, Mengaplikasikan, dan Merefleksikan secara aktif bersama anggota kelompokmu.',
        'Apabila menemukan hambatan atau pertanyaan, tanyakan langsung kepada gurumu.',
      ];

  const lkpdBodyParagraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '1. Petunjuk Penggunaan LKPD', bold: true, size: 22, color: SECTION_HEADER_BG })],
      spacing: { before: 140, after: 80 },
    }),
    ...petunjukSteps.map((step, idx) => (
      new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: cleanStepText(step), size: 20 }),
        ],
        spacing: { after: 50 },
      })
    )),

    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '2. Sintaks Pembelajaran & Pengalaman Belajar Mendalam', bold: true, size: 22, color: SECTION_HEADER_BG })],
      spacing: { before: 180, after: 100 },
    }),

    // A. MEMAHAMI
    new Paragraph({
      children: [
        new TextRun({
          text: `A. MEMAHAMI (${data.lkpd.memahami?.sintaks || 'Sintaks 1: Orientasi Masalah & Formulasi Pertanyaan'})`,
          bold: true,
          size: 21,
          color: SECTION_HEADER_BG,
        }),
      ],
      spacing: { before: 80, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Ringkasan Materi & Aturan ${data.identitas.topik}:`, bold: true, size: 20 }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '• Konsep Kunci: ', bold: true, size: 20 }),
        new TextRun({ text: `"${data.lkpd.memahami?.konsepKunci || ''}"`, size: 20, italics: true }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '• Rumus Utama / Aturan Pengubahan:', bold: true, size: 20 }),
      ],
      spacing: { after: 50 },
    }),
    ...(data.lkpd.memahami?.rumusAturan || []).map((r, i) => (
      new Paragraph({
        children: [
          new TextRun({ text: `   ${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: cleanStepText(r), size: 20 }),
        ],
        spacing: { after: 40 },
      })
    )),
    new Paragraph({
      children: [
        new TextRun({ text: '• Contoh Pemodelan:', bold: true, size: 20 }),
      ],
      spacing: { before: 60, after: 50 },
    }),
    ...(data.lkpd.memahami?.contohPemodelan || []).map((c) => (
      new Paragraph({
        children: [
          new TextRun({ text: '   • ', bold: true, size: 20 }),
          new TextRun({ text: cleanStepText(c), size: 20 }),
        ],
        spacing: { after: 40 },
      })
    )),

    new Paragraph({
      children: [
        new TextRun({ text: 'Jawablah Pertanyaan Pemahaman Berikut:', bold: true, size: 20, color: SECTION_HEADER_BG }),
      ],
      spacing: { before: 100, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '1. Selesaikan operasi pengubahan konsep berikut:', bold: true, size: 20 })],
      spacing: { after: 40 },
    }),
    ...(data.lkpd.memahami?.soal1Variasi || []).map((item) => (
      new Paragraph({
        children: [
          new TextRun({ text: `   ${item.kode}. `, bold: true, size: 20 }),
          new TextRun({ text: item.soal, size: 20 }),
        ],
        spacing: { after: 50 },
      })
    )),

    ...(data.lkpd.memahami?.soal2Variasi && data.lkpd.memahami.soal2Variasi.length > 0 ? [
      new Paragraph({
        children: [new TextRun({ text: '2. Tentukan nilai / pasangan konsep berikut:', bold: true, size: 20 })],
        spacing: { before: 60, after: 40 },
      }),
      ...data.lkpd.memahami.soal2Variasi.map((item) => (
        new Paragraph({
          children: [
            new TextRun({ text: `   ${item.kode}. `, bold: true, size: 20 }),
            new TextRun({ text: item.soal, size: 20 }),
          ],
          spacing: { after: 50 },
        })
      )),
    ] : []),

    new Paragraph({
      children: [
        new TextRun({ text: `3. ${data.lkpd.memahami?.soal3Penalaran || 'Jelaskan konsep ini dengan penalaran mendalam:'}`, bold: true, size: 20 }),
      ],
      spacing: { before: 80, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Jawaban Siswa:\n..........................................................................................................................................................................\n..........................................................................................................................................................................', color: '94A3B8', size: 19 }),
      ],
      spacing: { after: 140 },
    }),

    // B. MENGAPLIKASIKAN
    new Paragraph({
      children: [
        new TextRun({
          text: `B. MENGAPLIKASIKAN (${data.lkpd.mengaplikasikan?.sintaks || 'Sintaks 2 & 3: Pengumpulan Data, Eksplorasi & Analisis'})`,
          bold: true,
          size: 21,
          color: SECTION_HEADER_BG,
        }),
      ],
      spacing: { before: 140, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.lkpd.mengaplikasikan?.judulKasusKontekstual || 'Tugas Kasus Nyata Kontekstual:'}`,
          bold: true,
          size: 20,
        }),
      ],
      spacing: { after: 60 },
    }),
    ...(data.lkpd.mengaplikasikan?.kasusKontekstual || []).map((k) => (
      new Paragraph({
        children: [
          new TextRun({ text: `• ${k.nama}: `, bold: true, size: 20 }),
          new TextRun({ text: k.cerita, size: 20 }),
        ],
        spacing: { after: 70 },
      })
    )),

    new Paragraph({
      children: [new TextRun({ text: 'Instruksi Kerja:', bold: true, size: 20 })],
      spacing: { before: 80, after: 50 },
    }),
    ...(data.lkpd.mengaplikasikan?.instruksiKerja || []).map((ins, i) => (
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: cleanStepText(ins), size: 20 }),
        ],
        spacing: { after: 40 },
      })
    )),

    new Paragraph({
      children: [new TextRun({ text: 'Ruang Lembar Kerja Jawaban Siswa:', bold: true, size: 20, color: SECTION_HEADER_BG })],
      spacing: { before: 100, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '1. Perhitungan Kasus Kontekstual:', bold: true, size: 20 })],
      spacing: { after: 50 },
    }),
    ...(data.lkpd.mengaplikasikan?.ruangJawabanPerhitungan || []).map((p) => (
      new Paragraph({
        children: [
          new TextRun({ text: ` - ${p.label} : `, bold: true, size: 20 }),
          new TextRun({ text: p.template, size: 20 }),
        ],
        spacing: { after: 50 },
      })
    )),

    new Paragraph({
      children: [
        new TextRun({
          text: `2. Gambarkan Panah Pergeseran Garis Bilangan / Sketsa Konsep Visual:\n`,
          bold: true,
          size: 20,
        }),
        new TextRun({
          text: `   ${data.lkpd.mengaplikasikan?.sketsaVisual || '<---|---|---|---|---|---|---|---|---|--->'}\n   -3  -2  -1   0   1   2   3   4   5`,
          size: 20,
          font: 'Courier New',
        }),
      ],
      spacing: { before: 80, after: 100 },
    }),

    new Paragraph({
      children: [new TextRun({ text: '3. Latihan Variasi Soal Penerapan:', bold: true, size: 20 })],
      spacing: { after: 50 },
    }),
    ...(data.lkpd.mengaplikasikan?.latihanVariasi || []).map((v) => (
      new Paragraph({
        children: [
          new TextRun({ text: `   ${v.kode}. `, bold: true, size: 20 }),
          new TextRun({ text: v.soal, size: 20 }),
        ],
        spacing: { after: 40 },
      })
    )),

    // C. MEREFLEKSIKAN
    new Paragraph({
      children: [
        new TextRun({
          text: `C. MEREFLEKSIKAN (${data.lkpd.merefleksikan?.sintaks || 'Sintaks 4: Presentasi & Refleksi Pembelajaran'})`,
          bold: true,
          size: 21,
          color: SECTION_HEADER_BG,
        }),
      ],
      spacing: { before: 160, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Ayo Refleksikan Proses Belajarmu Hari Ini!', bold: true, size: 20, italics: true })],
      spacing: { after: 80 },
    }),
    ...(data.lkpd.merefleksikan?.pertanyaanRefleksi || []).map((ref, i) => (
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
          new TextRun({ text: `${cleanStepText(ref.pertanyaan)}\n`, size: 20 }),
          new TextRun({ text: 'Refleksi Saya:\n..........................................................................................................................................................................\n..........................................................................................................................................................................', color: '94A3B8', size: 19 }),
        ],
        spacing: { after: 120 },
      })
    )),

    // 3. Bagian Penutup LKPD
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '3. Bagian Penutup LKPD', bold: true, size: 22, color: SECTION_HEADER_BG })],
      spacing: { before: 160, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `“${data.lkpd.penutup?.kataPenyemangat || 'Luar Biasa! Kamu telah berhasil memahami konsep pembelajaran hari ini! Teruslah berlatih dengan gembira dan penuh percaya diri!'}”`,
          bold: true,
          italics: true,
          size: 20,
          color: '15803D',
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Lembar Cek Pemahaman Diri Siswa (Berikan tanda centang [✓] pada salah satu pilihan):',
          bold: true,
          size: 20,
        }),
      ],
      spacing: { after: 80 },
    }),
  ];

  const checkOptions = data.lkpd.penutup?.cekPemahamanDiri || [
    {
      kategori: '[ ] Sangat Paham',
      deskripsi: 'Saya sudah memahami sepenuhnya konsep materi ini dan mahir menyelesaikan berbagai variasi persoalan secara mandiri.',
    },
    {
      kategori: '[ ] Cukup Paham',
      deskripsi: 'Saya sudah paham konsep dasarnya, namun masih butuh sedikit ketelitian saat menghadapi variasi persoalan yang lebih kompleks.',
    },
    {
      kategori: '[ ] Perlu Belajar Lagi',
      deskripsi: 'Saya masih merasa bingung pada beberapa langkah konsep dan membutuhkan latihan terbimbing kembali bersama guru/teman.',
    },
  ];

  const checkRows: TableRow[] = checkOptions.map((opt) => (
    new TableRow({
      children: [
        createTableCell([new Paragraph({ children: [new TextRun({ text: opt.kategori, bold: true, size: 20 })] })], 28),
        createTableCell([new Paragraph({ children: [new TextRun({ text: opt.deskripsi, size: 20 })] })], 72),
      ],
    })
  ));

  const checkTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: checkRows,
  });

  const catatanGuruParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Catatan / Umpan Balik Guru:\n', bold: true, size: 20 }),
      new TextRun({ text: '..........................................................................................................................................................................', color: '94A3B8', size: 19 }),
    ],
    spacing: { before: 140 },
  });

  // Construct complete Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header Judul Utama
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'PERENCANAAN PEMBELAJARAN MENDALAM (RPM)',
                bold: true,
                size: 26,
                color: SECTION_HEADER_BG,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: data.lkpd.pertemuanKe || 'PERTEMUAN KE-4',
                bold: true,
                size: 22,
                color: '334155',
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${data.identitas.mataPelajaran} | ${data.identitas.kelasFase} | ${data.identitas.sekolah}`,
                italics: true,
                size: 20,
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Topik: ${data.identitas.topik}`,
                italics: true,
                size: 20,
                color: '475569',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Tabel RPP 2 Kolom dengan Header Bar Biru 1 Kali
          rppTable,

          new Paragraph({ text: '', spacing: { before: 300 } }),

          // Pengesahan Tanda Tangan
          signatureTable,

          // Page Break ke Lampiran Asesmen
          new Paragraph({
            children: [new TextRun({ text: '', break: 1 })],
            pageBreakBefore: true,
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'LAMPIRAN ASESMEN PEMBELAJARAN',
                bold: true,
                size: 26,
                color: SECTION_HEADER_BG,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '(Terpisah dari Tabel RPP)',
                italics: true,
                size: 20,
                color: '64748B',
              }),
            ],
            spacing: { after: 140 },
          }),

          // 1. Soal Asesmen Awal
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. Soal Asesmen Awal Pertemuan 4 (5 Soal Essay + Kunci Jawaban)',
                bold: true,
                size: 22,
                color: SECTION_HEADER_BG,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
          ...soalParagraphs,

          // 2. Rubrik Sikap
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. Rubrik Penilaian Sikap (4 Skala)',
                bold: true,
                size: 22,
                color: SECTION_HEADER_BG,
              }),
            ],
            spacing: { before: 180, after: 100 },
          }),
          makeRubrikTable(data.lampiran.rubrikSikap || []),

          // 3. Rubrik Pengetahuan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. Rubrik Penilaian Pengetahuan (4 Skala)',
                bold: true,
                size: 22,
                color: SECTION_HEADER_BG,
              }),
            ],
            spacing: { before: 180, after: 100 },
          }),
          makeRubrikTable(data.lampiran.rubrikPengetahuan || []),

          // 4. Rubrik Keterampilan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '4. Rubrik Penilaian Keterampilan (4 Skala)',
                bold: true,
                size: 22,
                color: SECTION_HEADER_BG,
              }),
            ],
            spacing: { before: 180, after: 100 },
          }),
          makeRubrikTable(data.lampiran.rubrikKeterampilan || []),

          // Page Break ke LKPD
          new Paragraph({
            children: [new TextRun({ text: '', break: 1 })],
            pageBreakBefore: true,
          }),

          ...lkpdParagraphs,
          lkpdBoxTable,
          ...lkpdBodyParagraphs,
          checkTable,
          catatanGuruParagraph,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
