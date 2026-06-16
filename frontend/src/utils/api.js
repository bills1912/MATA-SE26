import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: BASE_URL });

export const wilayahApi = {
  getKecamatan: () => api.get('/wilayah/kecamatan'),
  getDesa:   (kecamatan) => api.get('/wilayah/desa', { params: { kecamatan } }),
  getSls:    (kecamatan, desa) => api.get('/wilayah/sls', { params: { kecamatan, desa } }),
  getDetail: (idsubsls) => api.get(`/wilayah/${idsubsls}`),
};

export const laporanApi = {
  submit:     (data)      => api.post('/laporan', data),
  update:     (id, data)  => api.put(`/laporan/${id}`, data),
  delete:     (id)        => api.delete(`/laporan/${id}`),
  getList:    (params)    => api.get('/laporan', { params }),
  getRekap:   (params)    => api.get('/laporan/rekap', { params }),
  getSummary: (params)    => api.get('/laporan/summary', { params }),
  check: (tanggal, idsubsls) => api.get('/laporan/check', { params: { tanggal, idsubsls } }),
};

export const statsApi = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
  getBelumLapor:  (params) => api.get('/belum-lapor',  { params }),
  getTrend:       (params) => api.get('/trend',         { params }),
  exportCsv: (params) => {
    const q = new URLSearchParams(params).toString();
    window.open(`/api/export/csv?${q}`, '_blank');
  },
};

export default api;
