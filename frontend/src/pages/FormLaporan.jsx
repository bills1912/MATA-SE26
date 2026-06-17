import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import NumberInput from '../components/NumberInput';
import SearchSelect from '../components/SearchSelect';
import SlsSelect from '../components/SlsSelect';
import { wilayahApi, laporanApi } from '../utils/api';

function isTodayStr(dateStr) {
  if (!dateStr) return false;
  return dateStr === todayStr();
}

export default function FormLaporan() {
  const [tanggal, setTanggal] = useState(todayStr());
  const isHariIni = isTodayStr(tanggal);

  const [kecamatan, setKecamatan] = useState('');
  const [desa,      setDesa]      = useState('');
  const [slsId,     setSlsId]     = useState('');

  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList,      setDesaList]      = useState([]);
  const [slsList,       setSlsList]       = useState([]);
  const [wilayahInfo,   setWilayahInfo]   = useState(null);

  const [keluargaSubmit,     setKeluargaSubmit]     = useState(0);
  const [usahaSubmit,        setUsahaSubmit]         = useState(0);
  const [bkuSubmit,          setBkuSubmit]           = useState(0);
  const [bangunanKosong,     setBangunanKosong]      = useState(0);
  const [totalBangunan,      setTotalBangunan]       = useState(0);
  const [belumSubmit,        setBelumSubmit]         = useState(0);
  const [catatanBelumSubmit, setCatatanBelumSubmit]  = useState('');
  const [catatan,            setCatatan]             = useState('');

  const [loading,        setLoading]       = useState(false);
  const [loadingKec,     setLoadingKec]    = useState(true);
  const [loadingDesa,    setLoadingDesa]   = useState(false);
  const [loadingSls,     setLoadingSls]    = useState(false);
  const [checkingExist,  setCheckingExist] = useState(false);
  // existingData = data yang sudah ada di DB untuk tanggal+SLS ini (warning only)
  const [existingData,   setExistingData]  = useState(null);
  const [submitted,      setSubmitted]     = useState(false);

  useEffect(() => {
    wilayahApi.getKecamatan()
      .then(r => setKecamatanList(r.data))
      .catch(() => toast.error('Gagal memuat data wilayah'))
      .finally(() => setLoadingKec(false));
  }, []);

  // Reset saat tanggal berubah
  useEffect(() => {
    setExistingData(null);
    setSubmitted(false);
    resetForm();
  }, [tanggal]);

  const handleKecamatan = (val) => {
    setKecamatan(val); setDesa(''); setSlsId('');
    setDesaList([]); setSlsList([]);
    setExistingData(null); setSubmitted(false);
    if (!val) return;
    setLoadingDesa(true);
    wilayahApi.getDesa(val)
      .then(r => setDesaList(r.data))
      .catch(() => toast.error('Gagal memuat desa'))
      .finally(() => setLoadingDesa(false));
  };

  const handleDesa = (val) => {
    setDesa(val); setSlsId(''); setSlsList([]);
    setExistingData(null); setSubmitted(false);
    if (!val || !kecamatan) return;
    setLoadingSls(true);
    wilayahApi.getSls(kecamatan, val)
      .then(r => setSlsList(r.data))
      .catch(() => toast.error('Gagal memuat SLS'))
      .finally(() => setLoadingSls(false));
  };

  useEffect(() => {
    if (!slsId) { setWilayahInfo(null); return; }
    wilayahApi.getDetail(slsId).then(r => setWilayahInfo(r.data)).catch(() => {});
  }, [slsId]);

  // Cek existing untuk semua tanggal — hasilnya hanya untuk warning, form tetap kosong
  useEffect(() => {
    if (!slsId || !tanggal) {
      setExistingData(null); setSubmitted(false); resetForm(); return;
    }
    setCheckingExist(true);
    setSubmitted(false);
    resetForm(); // selalu mulai dari nol
    laporanApi.check(tanggal, slsId)
      .then(r => {
        // Simpan info existing hanya untuk warning, TIDAK mengisi form
        setExistingData(r.data || null);
      })
      .catch(() => setExistingData(null))
      .finally(() => setCheckingExist(false));
  }, [slsId, tanggal]);

  const resetForm = () => {
    setKeluargaSubmit(0); setUsahaSubmit(0); setBkuSubmit(0);
    setBangunanKosong(0); setTotalBangunan(0);
    setBelumSubmit(0); setCatatanBelumSubmit(''); setCatatan('');
  };

  const handleSubmit = async () => {
    if (!kecamatan || !desa || !slsId) {
      toast.error('Pilih Kecamatan, Desa, dan SLS terlebih dahulu');
      return;
    }
    if (belumSubmit > 0 && !catatanBelumSubmit.trim()) {
      toast.error('Isi catatan kendala / alasan untuk responden yang belum submit');
      return;
    }
    const sls = slsList.find(s => s.idsubsls === slsId);
    setLoading(true);
    try {
      await laporanApi.submit({
        tanggal, idsubsls: slsId,
        nmkec: kecamatan, nmdesa: desa,
        nmsubsls: sls?.nmsubsls || '',
        pencacah: wilayahInfo?.pencacah || '',
        pengawas: wilayahInfo?.pengawas || '',
        jumlah_keluarga_submit: keluargaSubmit,
        jumlah_usaha_submit:    usahaSubmit,
        jumlah_bku_submit:      bkuSubmit,
        jumlah_bangunan_kosong: bangunanKosong,
        total_bangunan:         totalBangunan,
        jumlah_belum_submit:    belumSubmit,
        catatan_belum_submit:   catatanBelumSubmit,
        catatan,
      });
      const isOverwrite = !!existingData;
      toast.success(
        isOverwrite ? '🔄 Data lama berhasil ditimpa!' : '✅ Laporan berhasil dikirim!',
        { duration: 4000 }
      );
      setSubmitted(true);
      setExistingData({ dummy: true }); // mark as ada data setelah submit
    } catch (err) {
      toast.error('Gagal: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLaporLain = () => {
    setKecamatan(''); setDesa(''); setSlsId('');
    setDesaList([]); setSlsList([]);
    setWilayahInfo(null); setExistingData(null); setSubmitted(false);
    resetForm();
  };

  const step        = !kecamatan ? 0 : !desa ? 1 : !slsId ? 2 : 3;
  const totalSubmit = keluargaSubmit + usahaSubmit + bkuSubmit;
  const hadExisting = existingData && !submitted; // ada data lama, belum submit ulang

  return (
    <div className="page" style={{ paddingBottom: 32 }}>

      {/* ── Tanggal ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon purple">📅</div>
          <div>
            <div className="card-title-text">Tanggal Pelaporan</div>
            <div className="card-title-sub">
              Pilih tanggal — tidak dapat memilih tanggal masa depan
            </div>
          </div>
        </div>
        <DateInput
          value={tanggal}
          onChange={(val) => {
            if (val && val > todayStr()) return;
            setTanggal(val || todayStr());
          }}
          label=""
          placeholder="— Pilih Tanggal —"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {isHariIni ? (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 20, padding: '3px 12px',
            }}>✅ Hari Ini</span>
          ) : (
            <>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'rgba(245,158,11,0.12)', color: '#fcd34d',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 20, padding: '3px 12px',
              }}>📅 Tanggal Lampau</span>
              <button
                style={{
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 20, padding: '3px 12px', fontFamily: 'inherit',
                }}
                onClick={() => setTanggal(todayStr())}
              >
                ↩ Kembali ke Hari Ini
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Wilayah ── */}
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="card-header">
          <div className="card-icon green">📍</div>
          <div>
            <div className="card-title-text">Wilayah Tugas</div>
            <div className="card-title-sub">Pilih kecamatan · desa · SLS</div>
          </div>
        </div>

        <div className="wilayah-steps">
          {['Kecamatan', 'Desa', 'SLS'].map((s, i) => (
            <div key={s} className={`step ${step > i ? 'done' : step === i ? 'active' : ''}`}>
              <div className="step-dot">{step > i ? '✓' : i + 1}</div>
              <div className="step-label">{s}</div>
            </div>
          ))}
        </div>

        <SearchSelect
          label="Kecamatan" icon="🏘️"
          placeholder={loadingKec ? '⏳ Memuat...' : '— Pilih Kecamatan —'}
          value={kecamatan} onChange={handleKecamatan}
          options={kecamatanList} disabled={loadingKec}
        />
        <SearchSelect
          label="Desa / Kelurahan" icon="🏡"
          placeholder={loadingDesa ? '⏳ Memuat...' : kecamatan ? '— Pilih Desa —' : '← Pilih kecamatan dulu'}
          value={desa} onChange={handleDesa}
          options={desaList} disabled={!kecamatan || loadingDesa}
        />
        <SlsSelect
          label="SLS / Sub-SLS"
          value={slsId} onChange={setSlsId}
          options={slsList} disabled={!desa || loadingSls}
        />
      </div>

      {/* ── Info Petugas ── */}
      {wilayahInfo && (
        <div className="petugas-card">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            👤 Petugas Terdaftar
          </div>
          <div className="petugas-row">
            <div className="petugas-avatar avatar-pcl">🧑</div>
            <div>
              <div className="petugas-name">{wilayahInfo.pencacah}</div>
              <div className="petugas-role">PCL — Pencacah</div>
            </div>
          </div>
          <div className="petugas-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4 }}>
            <div className="petugas-avatar avatar-pml">🧑‍💼</div>
            <div>
              <div className="petugas-name">{wilayahInfo.pengawas}</div>
              <div className="petugas-role">PML — Pengawas</div>
            </div>
          </div>
          <div className="id-pill">ID: {wilayahInfo.idsubsls}</div>
        </div>
      )}

      {/* ── Checking ── */}
      {slsId && checkingExist && (
        <div className="alert alert-info">
          <span>🔍</span>
          <span>Memeriksa riwayat laporan...</span>
        </div>
      )}

      {/* ── WARNING: sudah ada data di tanggal ini — form tetap kosong ── */}
      {slsId && !checkingExist && hadExisting && (
        <div className="alert alert-warning" style={{ flexDirection: 'column', gap: 0 }}>
          {/* Baris atas: ikon + judul */}
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                Data sudah pernah disubmit untuk wilayah ini
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
                <strong>{slsList.find(s => s.idsubsls === slsId)?.nmsubsls}</strong>
                {' · '}{desa}{' · '}{kecamatan}
                <br />
                Tanggal: <strong>{formatTanggal(tanggal)}</strong>
              </div>
            </div>
          </div>

          {/* Data lama — ringkasan */}
          <div style={{
            marginTop: 12,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 10, padding: '10px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px 0',
          }}>
            {[
              ['🏠 Keluarga', existingData.jumlah_keluarga_submit ?? 0],
              ['🏢 Usaha', existingData.jumlah_usaha_submit ?? 0],
              ['🏗️ BKU', existingData.jumlah_bku_submit ?? 0],
              ['⬜ Kosong', existingData.jumlah_bangunan_kosong ?? 0],
              ['📌 Stiker', existingData.total_bangunan ?? 0],
              ['⏳ Blm submit', existingData.jumlah_belum_submit ?? 0],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fcd34d', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: 'rgba(244,63,94,0.12)',
            border: '1px solid rgba(244,63,94,0.25)',
            borderRadius: 8,
            fontSize: 12, color: '#fda4af', fontWeight: 600, lineHeight: 1.5,
          }}>
            🔴 Form di bawah dimulai dari <strong>nol</strong>. Jika Anda mengisi dan mengirim,
            data lama di atas akan <strong>ditimpa seluruhnya</strong>.
          </div>
        </div>
      )}

      {/* ── Sukses ── */}
      {submitted && (
        <div className="alert alert-success" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span>✅</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>Laporan berhasil disimpan!</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {formatTanggal(tanggal)} · {desa} · {slsList.find(s => s.idsubsls === slsId)?.nmsubsls}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 4, padding: '10px 16px', fontSize: 14 }}
            onClick={handleLaporLain}
          >
            📍 Laporkan Wilayah Lain
          </button>
        </div>
      )}

      {/* ── Form Data ── */}
      {slsId && !checkingExist && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon amber">📊</div>
            <div>
              <div className="card-title-text">Data Progress Pendataan</div>
              <div className="card-title-sub">
                {hadExisting
                  ? '⚠️ Isi dari awal — data lama akan ditimpa jika dikirim'
                  : 'Input hasil pendataan'}
              </div>
            </div>
          </div>

          <NumberInput
            label="1. Jumlah Keluarga yang Berhasil Disubmit"
            value={keluargaSubmit} onChange={setKeluargaSubmit}
            helpText="Keluarga yang tidak memiliki usaha dan sudah berhasil disubmit di aplikasi"
          />
          <NumberInput
            label="2. Jumlah Usaha dari Keluarga yang Berhasil Disubmit"
            value={usahaSubmit} onChange={setUsahaSubmit}
            helpText="Keluarga yang memiliki usaha dan sudah berhasil disubmit di aplikasi"
          />
          <NumberInput
            label="3. Jumlah BKU (Bangunan Khusus Usaha) yang Berhasil Disubmit"
            value={bkuSubmit} onChange={setBkuSubmit}
            helpText="Bangunan yang digunakan khusus untuk usaha (toko, warung, kantor, dll)"
          />
          <NumberInput
            label="4. Jumlah Bangunan Kosong / Non-Hunian yang Berhasil Disubmit"
            value={bangunanKosong} onChange={setBangunanKosong}
            helpText="Tempat ibadah, gedung kosong, bangunan tidak berpenghuni"
          />
          <NumberInput
            label="5. Total Bangunan yang Sudah Disticker"
            value={totalBangunan} onChange={setTotalBangunan}
            helpText="Jumlah seluruh bangunan yang sudah diberi stiker SE2026"
          />

          <div style={{ margin: '4px 0 16px', borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              ⏳ Responden Belum Submit
            </div>
          </div>

          <NumberInput
            label="6. Jumlah Responden Sudah Didata tapi Belum Submit"
            value={belumSubmit} onChange={setBelumSubmit}
            helpText="Responden yang sudah selesai wawancara tapi belum berhasil disubmit (HP rusak, sinyal, dll)"
          />

          {belumSubmit > 0 && (
            <div className="form-group">
              <div className="form-label" style={{ color: 'var(--amber)' }}>
                Catatan Kendala / Alasan Belum Submit <span className="req">*</span>
              </div>
              <textarea
                className="form-control"
                value={catatanBelumSubmit}
                onChange={e => setCatatanBelumSubmit(e.target.value)}
                rows={3}
                placeholder="Jelaskan kendala atau alasan responden belum berhasil disubmit..."
                style={{
                  resize: 'vertical', minHeight: 80, lineHeight: 1.5,
                  borderColor: catatanBelumSubmit.trim() ? 'var(--border)' : 'rgba(245,158,11,0.5)',
                }}
              />
              {!catatanBelumSubmit.trim() && (
                <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 5, fontWeight: 600 }}>
                  ⚠️ Wajib diisi karena ada {belumSubmit} responden belum submit
                </div>
              )}
            </div>
          )}

          {totalSubmit > 0 && (
            <div className="alert alert-info" style={{ marginTop: 4 }}>
              <span>✨</span>
              <div>
                <span>Total berhasil disubmit: <strong>{totalSubmit.toLocaleString('id-ID')} unit</strong></span>
                <div style={{ fontSize: 11, marginTop: 3, opacity: 0.8 }}>
                  {keluargaSubmit > 0 && `🏠 ${keluargaSubmit.toLocaleString('id-ID')} keluarga`}
                  {usahaSubmit > 0 && `  🏢 ${usahaSubmit.toLocaleString('id-ID')} usaha`}
                  {bkuSubmit > 0 && `  🏗️ ${bkuSubmit.toLocaleString('id-ID')} BKU`}
                </div>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: 4 }}>
            <div className="form-label">Catatan / Kendala Lapangan (Opsional)</div>
            <textarea
              className="form-control"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan kendala lapangan atau catatan umum lainnya..."
              style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={hadExisting ? {
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                boxShadow: '0 4px 15px rgba(245,158,11,0.38)',
              } : {}}
            >
              {loading
                ? '⏳ Menyimpan...'
                : hadExisting
                  ? '⚠️ Timpa & Kirim Laporan Baru'
                  : '✅ Kirim Laporan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}