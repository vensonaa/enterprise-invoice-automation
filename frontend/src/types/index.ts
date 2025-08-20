export interface Invoice {
  id: number;
  filename: string;
  upload_date: string;
  status: 'processing' | 'completed' | 'failed';
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  total_amount: number | null;
  currency: string | null;
  confidence_score: number | null;
}

export interface InvoiceDetail extends Invoice {
  due_date: string | null;
  vendor_address: string | null;
  customer_name: string | null;
  customer_address: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  line_items: string | null;
  processing_time: number | null;
  extraction_method: string | null;
  extracted_data: Record<string, any>;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface UploadProgress {
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface DashboardStats {
  totalInvoices: number;
  completedInvoices: number;
  processingInvoices: number;
  failedInvoices: number;
  averageConfidence: number;
  totalAmount: number;
}

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}
