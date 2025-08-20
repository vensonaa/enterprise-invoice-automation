import axios from 'axios';
import type { Invoice, InvoiceDetail } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const invoiceApi = {
  // Get all invoices
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get('/invoices/');
    return response.data;
  },

  // Get invoice details
  getInvoiceDetail: async (id: number): Promise<InvoiceDetail> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Upload invoice
  uploadInvoice: async (file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload-invoice/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a specific invoice
  deleteInvoice: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  // Delete all invoices
  deleteAllInvoices: async (): Promise<{ message: string }> => {
    const response = await api.delete('/invoices/');
    return response.data;
  },
};

export default api;
