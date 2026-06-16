import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import NumberInput from '../components/NumberInput';
import SearchSelect from '../components/SearchSelect';
import SlsSelect from '../components/SlsSelect';
import { wilayahApi, laporanApi } from '../utils/api';

export default function FormLaporan() {
  const [tanggal,  setTanggal]  = useState(todayStr());
  const [kecamatan,setKecamatan]= useState('');
  const [desa,     setDesa]     = useState('');
  const [slsId,    setSlsId]    = useState('');

  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList,      setDesaList]      = useState([]);
  const [slsList,       setSlsList]       = useState([]);
  const [wilayahInfo,   setWilayahInfo]   = useState(null);

  const [kel,      setKel]      = useState(0);
  const [usaha,    setUsaha]    = useState(0);
  const [kosong,   setKosong]   = useState(0);
  const [bangunan, setBangunan] = useState(0);
  const [catatan,  setCatatan]  = useState('');

  const [loading,     setLoading]     = useState(false);
  const [loadingKec,  setLoadingKec]  = useState(true);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [loadingSls,  setLoadingSls]  = useState(false);
  const [checkingExist, setCheckingExist] = useState(false);

  // Data laporan yang sudah ada (null = belum ada, object = sudah ada)
  const [existing, setExisting] = useState(null);
  // true setelah submit berhasil di sesi ini
  const [submitted, setSubmitted] = useState(false);

  // ── Load kecamatan ──
  useEffect(() => {
    wilayahApi.getKecamatan()
      .then(r => setKecamatanList(r.data))
      .catch(() => toast.error('Gagal memuat data wilayah'))
      .finally(() => setLoadingKec(false));
  }, []);

  // ── Cascade kecamatan → desa ──
  const handleKecamatan = (val) => {
    setKecamatan(val); setDesa(''); setSlsId('');
    setDesaList([]); setSlsList([]); setExisting(null); setSubmitted(false);
    if (!val) return;
    setLoadingDesa(true);
    wilayahApi.getDesa(val)
      .then(r => setDesaList(r.data))
      .catch(() => toast.error('Gagal memuat desa'))
      .finally(() => setLoadingDesa(false));
  };

  // ── Cascade desa → SLS ──
  const handleDesa = (val) => {
    setDesa(val); setSlsId(''); setSlsList([]);
    setExisting(null); setSubmitted(false);
    if (!val || !kecamatan) return;
    setLoadingSls(true);
    wilayahApi.getSls(kecamatan, val)
      .then(r => setSlsList(r.data))
      .catch(() => toast.error('Gagal memuat SLS'))
      .finally(() => setLoadingSls(false));
  };

  // ── Load info wilayah saat SLS dipilih ──
  useEffect(() => {
    if (!slsId) { setWilayahInfo(null); return; }
    wilayahApi.getDetail(slsId).then(r => setWilayahInfo(r.data)).catch(() => {});
  }, [slsId]);

  // ── Cek laporan existing setiap SLS atau tanggal berubah ──
  useEffect(() => {
    if (!slsId || !tanggal) {
      setExisting(null); setSubmitted(false);
      resetForm();
      return;
    }
    setCheckingExist(true);
    setSubmitted(false);
    laporanApi.check(tanggal, slsId)
      .then(r => {
        if (r.data) {
          setExisting(r.data);
          // Pre-fill form dengan data lama
          setKel(r.data.jumlah_keluarga_non_usaha);
          setUsaha(r.data.jumlah_usaha);
          setKosong(r.data.jumlah_bangunan_kosong);
          setBangunan(r.data.total_bangunan);
          setCatatan(r.data.catatan || '');
        } else {
          setExisting(null);
          resetForm();
        }
      })
      .catch(() => { setExisting(null); resetForm(); })
      .finally(() => setCheckingExist(false));
  }, [slsId, tanggal]);

  const resetForm = () => {
    setKel(0); setUsaha(0); setKosong(0); setBangunan(0); setCatatan('');
  };

  // ── Submit — always upsert (overwrite jika sama hari+SLS) ──
  const handleSubmit = async () => {
    if (!kecamatan || !desa || !slsId) {
      toast.error('Pilih Kecamatan, Desa, dan SLS terlebih dahulu');
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
        jumlah_keluarga_non_usaha: kel,
        jumlah_usaha:              usaha,
        jumlah_bangunan_kosong:    kosong,
        total_bangunan:            bangunan,
        catatan,
      });

      const isOverwrite = !!existing;
      toast.success(
        isOverwrite
          ? '🔄 Laporan diperbarui!'
          : '✅ Laporan berhasil dikirim!',
        { duration: 4000 }
      );
      setSubmitted(true);
      // Simpan sebagai existing agar tombol berubah
      setExisting({ dummy: true });
    } catch (err) {
      toast.error('Gagal: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Lapor wilayah lain (reset form tapi tetap tanggal) ──
  const handleLaporLain = () => {
    setKecamatan(''); setDesa(''); setSlsId('');
    setDesaList([]); setSlsList([]);
    setWilayahInfo(null); setExisting(null); setSubmitted(false);
    resetForm();
  };

  const step        = !kecamatan ? 0 : !desa ? 1 : !slsId ? 2 : 3;
  const isOverwrite = !!existing && !submitted || (submitted && !!existing?.dummy);
  const totalTerdata = kel + usaha;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>

      {/* ── Tanggal ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon purple">📅</div>
          <div>
            <div className="card-title-text">Tanggal Pelaporan</div>
            <div className="card-title-sub">Pilih tanggal pendataan Anda hari ini</div>
          </div>
        </div>
        <DateInput value={tanggal} onChange={(v) => { setTanggal(v); setSubmitted(false); }} />
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

        {/* Step indicator */}
        <div className="wilayah-steps">
          {['Kecamatan','Desa','SLS'].map((s, i) => (
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

      {/* ── Status existing — muncul sebelum form ── */}
      {slsId && !checkingExist && existing && !submitted && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>
              SLS ini sudah pernah melapor hari ini
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Data lama ditampilkan di bawah. Ubah angka yang perlu diperbaiki lalu tekan <strong>Perbarui Laporan</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ── Notif sukses overwrite ── */}
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

      {/* ── Checking indicator ── */}
      {slsId && checkingExist && (
        <div className="alert alert-info">
          <span>🔍</span>
          <span>Memeriksa riwayat laporan hari ini...</span>
        </div>
      )}

      {/* ── Form data progress — hanya muncul setelah SLS dipilih ── */}
      {slsId && !checkingExist && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon amber">📊</div>
            <div>
              <div className="card-title-text">
                {existing && !submitted ? 'Perbaiki Data Pendataan' : 'Data Progress Pendataan'}
              </div>
              <div className="card-title-sub">
                {existing && !submitted
                  ? 'Ubah angka yang perlu dikoreksi'
                  : 'Input hasil pendataan hari ini'}
              </div>
            </div>
          </div>

          <NumberInput
            label="Keluarga Non-Usaha Berhasil Didata"
            value={kel} onChange={setKel}
            helpText="Keluarga yang tidak memiliki usaha"
          />
          <NumberInput
            label="Usaha Berhasil Didata"
            value={usaha} onChange={setUsaha}
            helpText="Usaha dan keluarga yang memiliki usaha"
          />
          <NumberInput
            label="Bangunan Kosong / Non-Hunian"
            value={kosong} onChange={setKosong}
            helpText="Tempat ibadah, kantor, bangunan tidak berpenghuni"
          />
          <NumberInput
            label="Total Bangunan Sudah Stiker"
            value={bangunan} onChange={setBangunan}
            helpText="Jumlah bangunan yang sudah diberi stiker SE2026"
          />

          {totalTerdata > 0 && (
            <div className="alert alert-info" style={{ marginTop: 4 }}>
              <span>✨</span>
              <span>Total terdata: <strong>{totalTerdata.toLocaleString('id-ID')} unit</strong></span>
            </div>
          )}

          <div className="form-group" style={{ marginTop: 4 }}>
            <div className="form-label">Catatan / Kendala</div>
            <textarea
              className="form-control"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tuliskan kendala lapangan atau catatan khusus..."
              style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
            />
          </div>

          {/* Tombol Submit */}
          <div style={{ marginTop: 10 }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? '⏳ Menyimpan...'
                : existing && !submitted
                  ? '🔄 Perbarui Laporan'
                  : '✅ Kirim Laporan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
