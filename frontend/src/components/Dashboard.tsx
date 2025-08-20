import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { invoiceApi } from '../services/api';
import type { Invoice, DashboardStats, UploadProgress } from '../types';
import UploadArea from './UploadArea';
import InvoiceCard from './InvoiceCard';
import InvoiceModal from './InvoiceModal';
import StatsCards from './StatsCards';
import ProcessingSteps from './ProcessingSteps';

const Dashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    completedInvoices: 0,
    processingInvoices: 0,
    failedInvoices: 0,
    averageConfidence: 0,
    totalAmount: 0,
  });

  // Fetch invoices on component mount and every 5 seconds
  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats when invoices change
  useEffect(() => {
    calculateStats();
  }, [invoices]);

  const fetchInvoices = async () => {
    try {
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const calculateStats = () => {
    const totalInvoices = invoices.length;
    const completedInvoices = invoices.filter(inv => inv.status === 'completed').length;
    const processingInvoices = invoices.filter(inv => inv.status === 'processing').length;
    const failedInvoices = invoices.filter(inv => inv.status === 'failed').length;
    
    const completedInvoicesWithConfidence = invoices.filter(inv => inv.confidence_score !== null);
    const averageConfidence = completedInvoicesWithConfidence.length > 0
      ? completedInvoicesWithConfidence.reduce((sum, inv) => sum + (inv.confidence_score || 0), 0) / completedInvoicesWithConfidence.length
      : 0;

    const totalAmount = invoices
      .filter(inv => inv.total_amount !== null)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    setStats({
      totalInvoices,
      completedInvoices,
      processingInvoices,
      failedInvoices,
      averageConfidence,
      totalAmount,
    });
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress({
      percentage: 0,
      status: 'uploading',
      message: 'Uploading file...',
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return prev;
          if (prev.percentage >= 90) {
            clearInterval(progressInterval);
            return { ...prev, percentage: 90, status: 'processing', message: 'Processing with AI...' };
          }
          return { ...prev, percentage: prev.percentage + 10 };
        });
      }, 200);

      const newInvoice = await invoiceApi.uploadInvoice(file);
      
      clearInterval(progressInterval);
      setUploadProgress({
        percentage: 100,
        status: 'completed',
        message: 'Upload completed!',
      });

      // Add new invoice to list
      setInvoices(prev => [newInvoice, ...prev]);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({
        percentage: 0,
        status: 'failed',
        message: 'Upload failed. Please try again.',
      });
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 3000);
    }
  };

  const handleInvoiceClick = async (invoice: Invoice) => {
    try {
      const detail = await invoiceApi.getInvoiceDetail(invoice.id);
      setSelectedInvoice(detail);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      await invoiceApi.deleteInvoice(id);
      // Remove from local state
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      // Close modal if the deleted invoice was selected
      if (selectedInvoice && selectedInvoice.id === id) {
        setIsModalOpen(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL invoices? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await invoiceApi.deleteAllInvoices();
      setInvoices([]);
      setIsModalOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error deleting all invoices:', error);
      alert('Failed to delete all invoices. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <DocumentTextIcon className="w-10 h-10 mr-3" />
                Invoice Automation
              </h1>
              <p className="text-xl opacity-90">
                GEN AI Solution powered by Groq & LangGraph
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <div className="text-sm opacity-75">Invoices Processed</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Upload Section */}
        <div className="mb-8">
          <UploadArea 
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Processing Steps (shown during upload) */}
        {isUploading && uploadProgress && (
          <div className="mb-8">
            <ProcessingSteps progress={uploadProgress} />
          </div>
        )}

        {/* Invoices List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2" />
              Processed Invoices
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {invoices.length} invoices
              </span>
              {invoices.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              )}
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-xl text-gray-600 mb-2">
                No invoices processed yet
              </div>
              <div className="text-gray-500">
                Upload your first invoice to get started
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => handleInvoiceClick(invoice)}
                  onDelete={handleDeleteInvoice}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
