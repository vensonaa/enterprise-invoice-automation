# Invoice Automation - GEN AI Solution

A comprehensive invoice document extraction system powered by **Groq** and **LangGraph**, featuring a modern web interface and SQLite database persistence.

## 🚀 Features

### Core Functionality
- **AI-Powered Extraction**: Uses Groq's LLM for intelligent invoice data extraction
- **Multi-Node Workflow**: LangGraph workflow with 5 specialized nodes for different extraction tasks
- **Real-time Processing**: Background task processing with live status updates
- **Database Persistence**: SQLite database with comprehensive invoice data storage
- **Modern UI**: React-based frontend with Tailwind CSS for beautiful user experience

### LangGraph Workflow Nodes
1. **Text Extraction**: Extracts raw text from PDF documents
2. **Header Information**: Extracts invoice number, dates, vendor, and customer details
3. **Financial Data**: Extracts subtotal, tax, total amounts, and currency
4. **Line Items**: Extracts individual line items with descriptions and prices
5. **Validation & Enhancement**: Validates and enhances extracted data with confidence scoring

### UI Features
- **Drag & Drop Upload**: Easy PDF file upload with progress tracking
- **Real-time Updates**: Auto-refresh to show processing status
- **Detailed View**: Comprehensive invoice details with multiple tabs
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Status Indicators**: Visual status tracking (processing, completed, failed)

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Groq**: High-performance LLM API for AI processing
- **LangGraph**: Workflow orchestration for multi-step AI processing
- **SQLAlchemy**: Database ORM
- **SQLite**: Lightweight database for data persistence
- **PyPDF2**: PDF text extraction

### Frontend
- **React**: Modern JavaScript framework
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API communication
- **Font Awesome**: Icon library

## 📋 Prerequisites

- Python 3.8+
- Groq API key
- Modern web browser

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd enterprise-invoice-automation
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp env.example .env
```

Edit the `.env` file and add your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./invoice_automation.db
UPLOAD_DIR=./uploads
EXTRACT_DIR=./extracted
```

### 4. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

### 5. Run the Application
```bash
python -m app.main
```

The application will be available at `http://localhost:8000`

## 📖 Usage

### 1. Upload Invoice
1. Open your browser and navigate to `http://localhost:8000`
2. Click on the upload area or drag and drop a PDF invoice
3. The system will automatically start processing the document

### 2. Monitor Processing
- Watch the real-time status updates
- Processing typically takes 10-30 seconds depending on document complexity
- Status will change from "processing" to "completed" or "failed"

### 3. View Results
- Click on any invoice card to view detailed information
- Explore different tabs:
  - **Overview**: Key invoice information and financial summary
  - **Details**: Customer and vendor information
  - **Line Items**: Individual line items with pricing
  - **Raw Data**: Complete extracted JSON data

## 🏗️ Project Structure

```
enterprise-invoice-automation/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database models and configuration
│   └── langgraph_workflow.py # LangGraph workflow implementation
├── static/
│   └── index.html           # React frontend
├── uploads/                 # Uploaded PDF files
├── extracted/               # Extracted data files
├── requirements.txt         # Python dependencies
├── env.example             # Environment variables template
├── README.md               # This file
└── invoice_automation.db   # SQLite database (created automatically)
```

## 🔧 API Endpoints

### Upload Invoice
```
POST /upload-invoice/
Content-Type: multipart/form-data
Body: PDF file
```

### Get All Invoices
```
GET /invoices/
```

### Get Invoice Details
```
GET /invoices/{invoice_id}
```

## 🧠 LangGraph Workflow Details

The system uses a sophisticated 5-node LangGraph workflow:

### Node 1: Text Extraction
- Extracts raw text from PDF using PyPDF2
- Handles multi-page documents
- Provides error handling for corrupted files

### Node 2: Header Information Extraction
- Uses Groq LLM to extract:
  - Invoice number
  - Invoice date
  - Due date
  - Vendor name and address
  - Customer name and address

### Node 3: Financial Information Extraction
- Extracts monetary values:
  - Subtotal
  - Tax amount
  - Total amount
  - Currency

### Node 4: Line Items Extraction
- Identifies and extracts individual line items
- Captures description, quantity, unit price, and total price

### Node 5: Validation & Enhancement
- Validates extracted data consistency
- Calculates confidence scores
- Enhances missing information where possible

## 🎯 Extracted Data Fields

The system extracts the following information from invoices:

### Basic Information
- Invoice Number
- Invoice Date
- Due Date
- Status

### Vendor Information
- Vendor Name
- Vendor Address

### Customer Information
- Customer Name
- Customer Address

### Financial Information
- Subtotal
- Tax Amount
- Total Amount
- Currency

### Line Items
- Description
- Quantity
- Unit Price
- Total Price

### Processing Metadata
- Processing Time
- Confidence Score
- Extraction Method

## 🔍 Database Schema

The SQLite database includes a comprehensive `invoices` table with fields for:
- All extracted invoice data
- Processing metadata
- Confidence scores
- Timestamps

## 🚨 Error Handling

The system includes comprehensive error handling:
- Invalid file format detection
- PDF processing errors
- API rate limiting
- Database connection issues
- Network timeouts

## 🔒 Security Considerations

- File upload validation
- SQL injection prevention
- CORS configuration
- Environment variable protection

## 🚀 Performance Optimization

- Background task processing
- Efficient PDF text extraction
- Optimized database queries
- Real-time status updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section below
2. Review the API documentation
3. Open an issue on GitHub

## 🔧 Troubleshooting

### Common Issues

**1. Groq API Key Error**
```
Error: Invalid API key
```
Solution: Verify your API key in the `.env` file and ensure it's valid

**2. PDF Processing Failed**
```
Error: Text extraction failed
```
Solution: Ensure the PDF is not password-protected and contains extractable text

**3. Database Connection Error**
```
Error: Database connection failed
```
Solution: Check file permissions and ensure the database directory is writable

**4. Upload Directory Error**
```
Error: Upload directory not found
```
Solution: The system creates upload directories automatically, check file permissions

### Performance Tips

1. **Large PDFs**: Processing time increases with document size
2. **Image-based PDFs**: May have lower extraction accuracy
3. **Complex Layouts**: Tables and multi-column layouts may affect extraction
4. **API Rate Limits**: Groq has rate limits, consider implementing queuing for high-volume usage

## 🎉 Success Metrics

The system provides confidence scores for each extraction step:
- **Header Extraction**: Typically 85%+ confidence
- **Financial Extraction**: Typically 90%+ confidence  
- **Line Items Extraction**: Typically 80%+ confidence
- **Overall Confidence**: Weighted average of all extractions

## 🔮 Future Enhancements

- Support for additional file formats (images, scanned documents)
- OCR integration for image-based invoices
- Machine learning model fine-tuning
- Export functionality (CSV, Excel)
- Multi-language support
- Advanced analytics dashboard
- Integration with accounting software
