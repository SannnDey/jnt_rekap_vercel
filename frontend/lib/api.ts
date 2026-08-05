import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from './config';
import {
  RekapanOutgoing,
  CreateRekapanInput,
  UpdateRekapanInput,
  ApiResponse,
  SummaryData,
  KasbonRecord,
  KasbonSummary,
} from '@/types';
import {
  RekapanInternalRecord,
  CreateRekapanInternalInput,
  UpdateRekapanInternalInput,
  RekapanInternalSummary,
} from '@/types/internal';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Response:`, response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ Error:`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Create rekapan
  async createRekapan(data: CreateRekapanInput): Promise<ApiResponse<RekapanOutgoing>> {
    const response = await this.client.post('/rekapan', data);
    return response.data;
  }

  // Bulk import rekapan rows
  async importRekapan(rows: CreateRekapanInput[]): Promise<ApiResponse<{ imported: number }>> {
    const response = await this.client.post('/rekapan/import', { rows });
    return response.data;
  }

  // Get all rekapan
  async getRekapanList(
    page = 1,
    limit = 10,
    search?: string,
    startDate?: string,
    endDate?: string,
    provinsi?: string,
    metodePembayaran?: string,
    sortBy?: string,
    sortOrder?: string,
    all?: boolean
  ): Promise<ApiResponse<RekapanOutgoing[]>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (provinsi) params.provinsi = provinsi;
    if (metodePembayaran) params.metodePembayaran = metodePembayaran;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (all) params.all = true;

    const response = await this.client.get('/rekapan', { params });
    return response.data;
  }

  // Get rekapan by ID
  async getRekapanById(id: string): Promise<ApiResponse<RekapanOutgoing>> {
    const response = await this.client.get(`/rekapan/${id}`);
    return response.data;
  }

  // Update rekapan
  async updateRekapan(id: string, data: UpdateRekapanInput): Promise<ApiResponse<RekapanOutgoing>> {
    const response = await this.client.put(`/rekapan/${id}`, data);
    return response.data;
  }

  // Delete rekapan
  async deleteRekapan(id: string): Promise<ApiResponse<RekapanOutgoing>> {
    const response = await this.client.delete(`/rekapan/${id}`);
    return response.data;
  }

  // Get summary
  async getRekapanSummary(startDate?: string, endDate?: string): Promise<ApiResponse<SummaryData>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await this.client.get('/rekapan/summary', { params });
    return response.data;
  }

  // Rekapan internal harian
  async createRekapanInternal(
    data: CreateRekapanInternalInput
  ): Promise<ApiResponse<RekapanInternalRecord>> {
    const response = await this.client.post('/rekapan-internal', data);
    return response.data;
  }

  async importRekapanInternal(
    rows: CreateRekapanInternalInput[]
  ): Promise<ApiResponse<undefined>> {
    const response = await this.client.post('/rekapan-internal/import', { rows });
    return response.data;
  }

  async getRekapanInternalList(
    page = 1,
    limit = 10,
    search?: string,
    startDate?: string,
    endDate?: string,
    sortBy?: string,
    sortOrder?: string,
    all?: boolean
  ): Promise<ApiResponse<RekapanInternalRecord[]>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (all) params.all = true;

    const response = await this.client.get('/rekapan-internal', { params });
    return response.data;
  }

  async getRekapanInternalById(id: string): Promise<ApiResponse<RekapanInternalRecord>> {
    const response = await this.client.get(`/rekapan-internal/${id}`);
    return response.data;
  }

  async updateRekapanInternal(
    id: string,
    data: UpdateRekapanInternalInput
  ): Promise<ApiResponse<RekapanInternalRecord>> {
    const response = await this.client.put(`/rekapan-internal/${id}`, data);
    return response.data;
  }

  async deleteRekapanInternal(id: string): Promise<ApiResponse<RekapanInternalRecord>> {
    const response = await this.client.delete(`/rekapan-internal/${id}`);
    return response.data;
  }

  async getRekapanInternalSummary(startDate?: string, endDate?: string): Promise<ApiResponse<RekapanInternalSummary>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await this.client.get('/rekapan-internal/summary', { params });
    return response.data;
  }

  // Kasbon
  async getKasbonList(
    page = 1,
    limit = 50,
    employee?: string,
    startDate?: string,
    endDate?: string,
    all?: boolean
  ): Promise<ApiResponse<KasbonRecord[]>> {
    const params: any = { page, limit };
    if (employee) params.employee = employee;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (all) params.all = true;
    const response = await this.client.get('/kasbon', { params });
    return response.data;
  }

  async getKasbonSummary(startDate?: string, endDate?: string): Promise<ApiResponse<KasbonSummary>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await this.client.get('/kasbon/summary', { params });
    return response.data;
  }

  // Pengeluaran
  async getPengeluaranList(
    page = 1,
    limit = 50,
    kategori?: string,
    startDate?: string,
    endDate?: string,
    all?: boolean
  ): Promise<ApiResponse<any[]>> {
    const params: any = { page, limit };
    if (kategori) params.kategori = kategori;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (all) params.all = true;
    const response = await this.client.get('/pengeluaran', { params });
    return response.data;
  }

  async getPengeluaranSummary(kategori?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params: any = {};
    if (kategori) params.kategori = kategori;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await this.client.get('/pengeluaran/summary', { params });
    return response.data;
  }

  async createPengeluaran(data: { tanggal: string | Date; jenis: string; nominal: number; metodePembayaran: string; kategori: string; tipeKendaraan?: string; jenisBahanBakar?: string; liter?: number; km?: number }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/pengeluaran', data);
    return response.data;
  }

  async updatePengeluaran(id: string, data: { tanggal?: string | Date; jenis?: string; nominal?: number; metodePembayaran?: string; kategori?: string; tipeKendaraan?: string | null; jenisBahanBakar?: string | null; liter?: number | null; km?: number | null }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/pengeluaran/${id}`, data);
    return response.data;
  }

  async deletePengeluaran(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/pengeluaran/${id}`);
    return response.data;
  }

  async createKasbon(data: { employee: string; tanggal: string | Date; amount: number; description?: string | null; settled?: boolean }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/kasbon', data);
    return response.data;
  }

  async updateKasbon(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/kasbon/${id}`, data);
    return response.data;
  }

  async deleteKasbon(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/kasbon/${id}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
