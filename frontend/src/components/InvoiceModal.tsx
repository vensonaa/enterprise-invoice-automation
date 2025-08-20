import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { InvoiceDetail, LineItem } from '../types';

interface InvoiceModalProps {
  invoice: InvoiceDetail;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const parseLineItems = (): LineItem[] => {
    // First try to use the already parsed line items from extracted_data
    if (invoice.extracted_data?.line_items && Array.isArray(invoice.extracted_data.line_items)) {
      return invoice.extracted_data.line_items.map((item: any) => ({
        description: item.description || item.Description || item.desc || item.Desc || 'N/A',
        quantity: item.quantity || item.Quantity || item.qty || item.Qty || 1,
        unit_price: item.unit_price || item['Unit Price'] || item.price || item.Price || 0,
        total_price: item.total_price || item['Total Price'] || item.amount || item.Amount || 0,
      }));
    }
    
    // Fallback to parsing the line_items string
    if (invoice.line_items) {
      try {
        const parsed = JSON.parse(invoice.line_items);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            description: item.description || item.Description || item.desc || item.Desc || 'N/A',
            quantity: item.quantity || item.Quantity || item.qty || item.Qty || 1,
            unit_price: item.unit_price || item['Unit Price'] || item.price || item.Price || 0,
            total_price: item.total_price || item['Total Price'] || item.amount || item.Amount || 0,
          }));
        }
      } catch (e) {
        console.error('Error parsing line items:', e);
      }
    }
    
    return [];
  };

  const lineItems = parseLineItems();
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const validation = invoice.extracted_data?.validation;
  const totalsMatch = validation?.totals_match ?? true;
  const wasAutoCorrected = validation?.auto_corrected ?? false;

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'details', name: 'Details', icon: '📄' },
    { id: 'line-items', name: 'Line Items', icon: '📝' },
    { id: 'raw-data', name: 'Raw Data', icon: '🔍' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{invoice.filename}</h2>
            <p className="text-gray-600 mt-1">
              Status: <span className={`font-medium ${invoice.status === 'completed' ? 'text-green-600' : invoice.status === 'processing' ? 'text-yellow-600' : 'text-red-600'}`}>
                {invoice.status}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Validation Alert */}
        {wasAutoCorrected && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Total Amount Auto-Corrected</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The invoice total was automatically corrected from {formatCurrency(validation?.extracted_total || 0, invoice.currency)} 
                  to {formatCurrency(validation?.calculated_total || 0, invoice.currency)} based on line items.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Invoice Number:</span>
                      <span>{invoice.invoice_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Invoice Date:</span>
                      <span>{formatDate(invoice.invoice_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Due Date:</span>
                      <span>{formatDate(invoice.due_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Vendor:</span>
                      <span>{invoice.vendor_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Tax Amount:</span>
                      <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-800">Total Amount:</span>
                      <span className="text-primary-600">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Line Items Total:</span>
                      <span className={totalsMatch ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(lineItemsTotal, invoice.currency)}
                        {!totalsMatch && <span className="ml-1">⚠️</span>}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Processing Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Confidence Score:</span>
                      <span>{invoice.confidence_score ? `${(invoice.confidence_score * 100).toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Processing Time:</span>
                      <span>{invoice.processing_time ? `${invoice.processing_time.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Vendor Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{invoice.vendor_address || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{invoice.customer_address || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'line-items' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Line Items ({lineItems.length})</h3>
                <div className="text-sm text-gray-600">
                  Total: {formatCurrency(lineItemsTotal, invoice.currency)}
                </div>
              </div>
              
              {lineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No line items found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lineItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unit_price, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.total_price, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw-data' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw Extracted Data</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 overflow-x-auto">
                  {JSON.stringify(invoice.extracted_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
