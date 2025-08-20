import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { InvoiceDetail, LineItem } from '../types';

interface InvoiceModalProps {
  invoice: InvoiceDetail;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

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

  const formatConfidence = (confidence: number | null) => {
    if (confidence === null) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (confidence === null) return 'text-gray-600';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const parseLineItems = (): LineItem[] => {
    // First try to get from extracted_data (which is already parsed)
    if (invoice.extracted_data && invoice.extracted_data.line_items) {
      const items = invoice.extracted_data.line_items;
      // Normalize the keys to match our LineItem interface
      return items.map((item: any) => ({
        description: item.description || item.Description || item.desc || 'N/A',
        quantity: item.quantity || item.Quantity || item.qty || 0,
        unit_price: item.unit_price || item['Unit Price'] || item.unitPrice || 0,
        total_price: item.total_price || item['Total Price'] || item.totalPrice || 0
      }));
    }
    
    // Fallback to parsing the line_items string field
    if (!invoice.line_items) return [];
    try {
      const items = JSON.parse(invoice.line_items);
      return items.map((item: any) => ({
        description: item.description || item.Description || item.desc || 'N/A',
        quantity: item.quantity || item.Quantity || item.qty || 0,
        unit_price: item.unit_price || item['Unit Price'] || item.unitPrice || 0,
        total_price: item.total_price || item['Total Price'] || item.totalPrice || 0
      }));
    } catch {
      return [];
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'details', name: 'Details' },
    { id: 'line-items', name: 'Line Items' },
    { id: 'raw-data', name: 'Raw Data' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Invoice Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium capitalize ${
                  activeTab === tab.id 
                    ? 'text-primary-600 border-b-2 border-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Invoice #:</span> {invoice.invoice_number || 'N/A'}</div>
                    <div><span className="font-medium">Date:</span> {formatDate(invoice.invoice_date)}</div>
                    <div><span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${
                        invoice.status === 'completed' ? 'bg-green-500' :
                        invoice.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Vendor Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {invoice.vendor_name || 'N/A'}</div>
                    <div><span className="font-medium">Address:</span> {invoice.vendor_address || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Financial Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Subtotal:</span> {formatCurrency(invoice.subtotal, invoice.currency)}</div>
                    <div><span className="font-medium">Tax:</span> {formatCurrency(invoice.tax_amount, invoice.currency)}</div>
                    <div className="text-lg font-bold text-primary-600">
                      <span className="font-medium">Total:</span> {formatCurrency(invoice.total_amount, invoice.currency)}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Processing Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Processing Time:</span> {invoice.processing_time?.toFixed(2)}s</div>
                    <div><span className="font-medium">Confidence Score:</span> 
                      <span className={getConfidenceColor(invoice.confidence_score)}>
                        {formatConfidence(invoice.confidence_score)}
                      </span>
                    </div>
                    <div><span className="font-medium">Method:</span> {invoice.extraction_method || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {invoice.customer_name || 'N/A'}</div>
                  <div><span className="font-medium">Address:</span> {invoice.customer_address || 'N/A'}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Vendor Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {invoice.vendor_name || 'N/A'}</div>
                  <div><span className="font-medium">Address:</span> {invoice.vendor_address || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'line-items' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Line Items</h3>
              {parseLineItems().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Unit Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseLineItems().map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm">{item.description || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unit_price, invoice.currency)}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.total_price, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No line items found
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'raw-data' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Raw Extracted Data</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
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
