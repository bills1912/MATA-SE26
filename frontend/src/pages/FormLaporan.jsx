import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DateInput, { todayStr, formatTanggal } from '../components/DateInput';
import NumberInput from '../components/NumberInput';
import SearchSelect from '../components/SearchSelect';
import SlsSelect from '../components/SlsSelect';
import { wilayahApi, laporanApi } from '../utils/api';

export default function FormLaporan() {
  const [tanggal,   setTanggal]   = useState(todayStr());
  const [kecamatan, setKecamatan] = useState('');
  const [desa,      setDesa]      = useState('');
  const [slsId,     setSlsId]     = useState('');

  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList,      setDesaList]      = useState([]);
  const [slsList,       setSlsList]       = useState([]);
  const [wilayahInfo,   setWilayahInfo]   = useState(null);

  // ── 6 field utama ──
  const [keluargaSubmit,   setKeluargaSubmit]   = useState(0); // P1
  const [usahaSubmit,      setUsahaSubmit]       = useState(0); // P2
  const [bkuSubmit,        setBkuSubmit]         = useState(0); // P3
  const [bangunanKosong,   setBangunanKosong]    = useState(0); // P4
  const [totalBangunan,    setTotalBangunan]     = useState(0); // P5
  const [belumSubmit,      setBelumSubmit]       = useState(0); // P6
  const [catatanBelumSubmit, setCatatanBelumSubmit] = useState(''); // wajib jika P6>0

  const [catatan, setCatatan] = useState('');

  const [loading,        setLoading]       = useState(false);
  const [loadingKec,     setLoadingKec]    = useState(true);
  const [loadingDesa,    setLoadingDesa]   = useState(false);
  const [loadingSls,     setLoadingSls]    = useState(false);
  const [checkingExist,  setCheckingExist] = useState(false);
  const [existing,       setExisting]      = useState(null);
  const [submitted,      setSubmitted]     = useState(false);

  // ── Load kecamatan ──
  useEffect(() => {
    wilayahApi.getKecamatan()
      .then(r => setKecamatanList(r.data))
      .catch(() => toast.error('Gagal memuat data wilayah'))
      .finally(() => setLoadingKec(false));
  }, []);

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

  useEffect(() => {
    if (!slsId) { setWilayahInfo(null); return; }
    wilayahApi.getDetail(slsId).then(r => setWilayahInfo(r.data)).catch(() => {});
  }, [slsId]);

  // ── Cek laporan existing ──
  useEffect(() => {
    if (!slsId || !tanggal) {
      setExisting(null); setSubmitted(false); resetForm(); return;
    }
    setCheckingExist(true);
    setSubmitted(false);
    laporanApi.check(tanggal, slsId)
      .then(r => {
        if (r.data) {
          setExisting(r.data);
          setKeluargaSubmit(r.data.jumlah_keluarga_submit ?? 0);
          setUsahaSubmit(r.data.jumlah_usaha_submit ?? 0);
          setBkuSubmit(r.data.jumlah_bku_submit ?? 0);
          setBangunanKosong(r.data.jumlah_bangunan_kosong ?? 0);
          setTotalBangunan(r.data.total_bangunan ?? 0);
          setBelumSubmit(r.data.jumlah_belum_submit ?? 0);
          setCatatanBelumSubmit(r.data.catatan_belum_submit ?? '');
          setCatatan(r.data.catatan ?? '');
        } else {
          setExisting(null); resetForm();
        }
      })
      .catch(() => { setExisting(null); resetForm(); })
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
      toast.success(existing ? '🔄 Laporan diperbarui!' : '✅ Laporan berhasil dikirim!', { duration: 4000 });
      setSubmitted(true);
      setExisting({ dummy: true });
    } catch (err) {
      toast.error('Gagal: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLaporLain = () => {
    setKecamatan(''); setDesa(''); setSlsId('');
    setDesaList([]); setSlsList([]);
    setWilayahInfo(null); setExisting(null); setSubmitted(false);
    resetForm();
  };

  const step        = !kecamatan ? 0 : !desa ? 1 : !slsId ? 2 : 3;
  const totalSubmit = keluargaSubmit + usahaSubmit + bkuSubmit;

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

      {/* ── Alert existing ── */}
      {slsId && !checkingExist && existing && !submitted && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>SLS ini sudah pernah melapor hari ini</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Data lama ditampilkan di bawah. Ubah angka yang perlu diperbaiki lalu tekan <strong>Perbarui Laporan</strong>.
            </div>
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
          <button className="btn btn-primary" style={{ marginTop: 4, padding: '10px 16px', fontSize: 14 }} onClick={handleLaporLain}>
            📍 Laporkan Wilayah Lain
          </button>
        </div>
      )}

      {/* ── Checking ── */}
      {slsId && checkingExist && (
        <div className="alert alert-info">
          <span>🔍</span>
          <span>Memeriksa riwayat laporan hari ini...</span>
        </div>
      )}

      {/* ── Form Data ── */}
      {slsId && !checkingExist && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon amber">📊</div>
            <div>
              <div className="card-title-text">
                {existing && !submitted ? 'Perbaiki Data Pendataan' : 'Data Progress Pendataan'}
              </div>
              <div className="card-title-sub">
                {existing && !submitted ? 'Ubah angka yang perlu dikoreksi' : 'Input hasil pendataan hari ini'}
              </div>
            </div>
          </div>

          {/* P1 */}
          <NumberInput
            label="1. Jumlah Keluarga yang Berhasil Disubmit"
            value={keluargaSubmit} onChange={setKeluargaSubmit}
            helpText="Keluarga yang tidak memiliki usaha dan sudah berhasil disubmit di aplikasi"
          />

          {/* P2 */}
          <NumberInput
            label="2. Jumlah Usaha dari Keluarga yang Berhasil Disubmit"
            value={usahaSubmit} onChange={setUsahaSubmit}
            helpText="Keluarga yang memiliki usaha dan sudah berhasil disubmit di aplikasi"
          />

          {/* P3 */}
          <NumberInput
            label="3. Jumlah BKU (Bangunan Khusus Usaha) yang Berhasil Disubmit"
            value={bkuSubmit} onChange={setBkuSubmit}
            helpText="Bangunan yang digunakan khusus untuk usaha (toko, warung, kantor, dll)"
          />

          {/* P4 */}
          <NumberInput
            label="4. Jumlah Bangunan Kosong / Non-Hunian yang Berhasil Disubmit"
            value={bangunanKosong} onChange={setBangunanKosong}
            helpText="Tempat ibadah, gedung kosong, bangunan tidak berpenghuni"
          />

          {/* P5 */}
          <NumberInput
            label="5. Total Bangunan yang Sudah Disticker"
            value={totalBangunan} onChange={setTotalBangunan}
            helpText="Jumlah seluruh bangunan yang sudah diberi stiker SE2026"
          />

          {/* Divider sebelum P6 */}
          <div style={{
            margin: '4px 0 16px',
            borderTop: '1px dashed var(--border)',
            paddingTop: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              ⏳ Responden Belum Submit
            </div>
          </div>

          {/* P6 */}
          <NumberInput
            label="6. Jumlah Responden Sudah Didata tapi Belum Submit"
            value={belumSubmit} onChange={setBelumSubmit}
            helpText="Responden yang sudah selesai wawancara tapi belum berhasil disubmit (HP rusak, sinyal, dll)"
          />

          {/* Catatan kendala — wajib jika P6 > 0 */}
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
                placeholder="Jelaskan kendala atau alasan responden belum berhasil disubmit (HP rusak, sinyal buruk, aplikasi error, dll)..."
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

          {/* Ringkasan total terdata */}
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

          {/* Catatan umum */}
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

          {/* Submit */}
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
