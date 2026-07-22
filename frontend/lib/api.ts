import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from './config';
import {
  RekapanOutgoing,
  CreateRekapanInput,
  UpdateRekapanInput,
  ApiResponse,
  SummaryData,
} from '@/types';

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

  // Get all rekapan
  async getRekapanList(
    page = 1,
    limit = 10,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<RekapanOutgoing[]>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

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
}

export const apiClient = new ApiClient();
