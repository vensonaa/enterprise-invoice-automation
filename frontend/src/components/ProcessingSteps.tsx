import React from 'react';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { UploadProgress } from '../types';

interface ProcessingStepsProps {
  progress: UploadProgress;
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ progress }) => {
  const steps = [
    {
      name: 'Text Extraction',
      description: 'Extracting text from PDF',
      icon: DocumentTextIcon,
      status: progress.status === 'uploading' ? 'completed' : 
              progress.status === 'processing' ? 'processing' : 'completed',
    },
    {
      name: 'Header Analysis',
      description: 'Extracting invoice metadata',
      icon: MagnifyingGlassIcon,
      status: progress.status === 'processing' && progress.percentage > 20 ? 'processing' : 
              progress.status === 'completed' ? 'completed' : 'pending',
    },
    {
      name: 'Financial Data',
      description: 'Extracting monetary values',
      icon: CalculatorIcon,
      status: progress.status === 'processing' && progress.percentage > 40 ? 'processing' : 
              progress.status === 'completed' ? 'completed' : 'pending',
    },
    {
      name: 'Line Items',
      description: 'Extracting individual items',
      icon: DocumentTextIcon,
      status: progress.status === 'processing' && progress.percentage > 60 ? 'processing' : 
              progress.status === 'completed' ? 'completed' : 'pending',
    },
    {
      name: 'Validation',
      description: 'Validating extracted data',
      icon: CheckCircleIcon,
      status: progress.status === 'processing' && progress.percentage > 80 ? 'processing' : 
              progress.status === 'completed' ? 'completed' : 'pending',
    },
  ];

  const getStepIcon = (step: typeof steps[0]) => {
    const Icon = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Icon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: typeof steps[0]) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        AI Processing Steps
      </h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${getStepColor(step)}`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            
            <div className="ml-4 flex-1">
              <h4 className="font-medium">{step.name}</h4>
              <p className="text-sm opacity-75">{step.description}</p>
            </div>
            
            {step.status === 'processing' && (
              <div className="flex-shrink-0">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 text-center">
          {progress.message}
        </p>
      </div>
    </div>
  );
};

export default ProcessingSteps;
