import React from 'react';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import type { Invoice } from '../types';

interface InvoiceCardProps {
  invoice: Invoice;
  onClick: () => void;
  onDelete?: (id: number) => void;
  onChat?: (id: number) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onClick, onDelete, onChat }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatConfidence = (confidence: number | null) => {
    if (confidence === null) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Are you sure you want to delete "${invoice.filename}"?`)) {
      onDelete(invoice.id);
    }
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChat) {
      onChat(invoice.id);
    }
  };

  // Check if totals match (for completed invoices)
  const validation = invoice.extracted_data?.validation;
  const totalsMatch = validation?.totals_match ?? true;
  const wasAutoCorrected = validation?.auto_corrected ?? false;

  return (
    <div 
      className="card hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
      onClick={onClick}
    >
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Chat Button - only for completed invoices */}
        {invoice.status === 'completed' && onChat && (
          <button
            onClick={handleChat}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            title="Chat with invoice"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Delete invoice"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Validation Warning */}
      {invoice.status === 'completed' && !totalsMatch && (
        <div className="absolute top-2 left-2 p-1 bg-yellow-100 text-yellow-800 rounded-full">
          <ExclamationTriangleIcon className="w-4 h-4" title="Total amount doesn't match line items" />
        </div>
      )}

      {/* Auto-corrected Indicator */}
      {wasAutoCorrected && (
        <div className="absolute top-2 left-2 p-1 bg-blue-100 text-blue-800 rounded-full">
          <CheckCircleIcon className="w-4 h-4" title="Total amount was auto-corrected" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <DocumentTextIcon className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(invoice.status)}
            <span className="capitalize">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* File Name */}
      <h3 className="font-semibold text-gray-800 mb-3 truncate group-hover:text-primary-600 transition-colors">
        {invoice.filename}
      </h3>

      {/* Invoice Details */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {invoice.invoice_number && (
          <div className="flex justify-between">
            <span className="font-medium">Invoice #:</span>
            <span>{invoice.invoice_number}</span>
          </div>
        )}
        
        {invoice.vendor_name && (
          <div className="flex justify-between">
            <span className="font-medium">Vendor:</span>
            <span className="truncate ml-2">{invoice.vendor_name}</span>
          </div>
        )}
        
        {invoice.total_amount !== null && (
          <div className="flex justify-between">
            <span className="font-medium">Total:</span>
            <span className={`font-semibold ${!totalsMatch ? 'text-yellow-600' : 'text-gray-800'}`}>
              {formatCurrency(invoice.total_amount, invoice.currency)}
              {!totalsMatch && <span className="ml-1 text-xs">⚠️</span>}
            </span>
          </div>
        )}
        
        {invoice.confidence_score !== null && (
          <div className="flex justify-between">
            <span className="font-medium">Confidence:</span>
            <span className={invoice.confidence_score > 0.8 ? 'text-green-600' : 
                           invoice.confidence_score > 0.6 ? 'text-yellow-600' : 'text-red-600'}>
              {formatConfidence(invoice.confidence_score)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {formatDate(invoice.upload_date)}
        </div>
        <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700 transition-colors">
          <EyeIcon className="w-4 h-4 mr-1" />
          View Details
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
