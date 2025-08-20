from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
import json
import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
import uvicorn

from app.database import get_db, Invoice
from app.database import SessionLocal
from app.langgraph_workflow import extract_invoice_data, chat_with_invoice, generate_suggested_questions
from pydantic import BaseModel

app = FastAPI(title="Invoice Automation API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload and extracted directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("extracted", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class InvoiceResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    status: str
    invoice_number: str | None = None
    invoice_date: str | None = None
    vendor_name: str | None = None
    total_amount: float | None = None
    currency: str | None = None
    confidence_score: float | None = None

class InvoiceDetailResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    status: str
    extracted_data: dict
    invoice_number: str | None = None
    invoice_date: str | None = None
    due_date: str | None = None
    vendor_name: str | None = None
    vendor_address: str | None = None
    customer_name: str | None = None
    customer_address: str | None = None
    subtotal: float | None = None
    tax_amount: float | None = None
    total_amount: float | None = None
    currency: str | None = None
    line_items: str | None = None
    processing_time: float | None = None
    confidence_score: float | None = None
    extraction_method: str | None = None

class ChatMessage(BaseModel):
    message: str
    invoice_id: int

class ChatResponse(BaseModel):
    response: str
    invoice_id: int
    timestamp: datetime

class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]
    invoice_id: int

@app.on_event("startup")
def mark_stale_processing_invoices():
    """Mark invoices stuck in processing for >15 minutes as failed (safety net)."""
    try:
        db = SessionLocal()
        threshold = datetime.utcnow() - timedelta(minutes=15)
        stale = (
            db.query(Invoice)
            .filter(Invoice.status == "processing")
            .filter(Invoice.upload_date < threshold)
            .all()
        )
        updated = 0
        for inv in stale:
            inv.status = "failed"
            updated += 1
        if updated:
            db.commit()
            print(f"Marked {updated} stale processing invoices as failed")
    except Exception as e:
        print(f"Startup stale processing check failed: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass

def process_invoice_background(invoice_id: int, filename: str):
    """Background task to process invoice with its own DB session, identified by id."""
    db = SessionLocal()
    try:
        # Extract data using LangGraph workflow
        result = extract_invoice_data(filename)

        # Update database
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if invoice:
            invoice.status = result.get("status", "failed")
            invoice.extracted_data = json.dumps(result.get("extracted_data", {}))
            invoice.processing_time = result.get("processing_time", 0.0)

            # Update individual fields
            data = result.get("extracted_data") or {}
            invoice.invoice_number = data.get("invoice_number")
            invoice.invoice_date = data.get("invoice_date")
            invoice.due_date = data.get("due_date")
            invoice.vendor_name = data.get("vendor_name")
            invoice.vendor_address = data.get("vendor_address")
            invoice.customer_name = data.get("customer_name")
            invoice.customer_address = data.get("customer_address")
            invoice.subtotal = data.get("subtotal")
            invoice.tax_amount = data.get("tax_amount")
            invoice.total_amount = data.get("total_amount")
            invoice.currency = data.get("currency", "USD")
            invoice.line_items = json.dumps(data.get("line_items", []))

            # Calculate overall confidence score
            confidence_scores = result.get("confidence_scores") or {}
            if confidence_scores:
                confidences = list(confidence_scores.values())
                invoice.confidence_score = sum(confidences) / len(confidences)

            invoice.extraction_method = "langgraph_groq"

            db.commit()
    except Exception as e:
        try:
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if invoice:
                invoice.status = "failed"
                db.commit()
        except Exception:
            pass
        print(f"Background processing failed: {str(e)}")
    finally:
        db.close()

@app.post("/upload-invoice/", response_model=InvoiceResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process an invoice"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create database record
    invoice = Invoice(
        filename=file.filename,
        status="processing"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Start background processing (use independent DB session in task)
    background_tasks.add_task(process_invoice_background, invoice.id, file_path)
    
    return InvoiceResponse(
        id=invoice.id,
        filename=invoice.filename,
        upload_date=invoice.upload_date,
        status=invoice.status
    )

@app.get("/invoices/", response_model=List[InvoiceResponse])
async def get_invoices(db: Session = Depends(get_db)):
    """Get all invoices"""
    invoices = db.query(Invoice).order_by(Invoice.upload_date.desc()).all()
    
    return [
        InvoiceResponse(
            id=invoice.id,
            filename=invoice.filename,
            upload_date=invoice.upload_date,
            status=invoice.status,
            invoice_number=invoice.invoice_number or None,
            invoice_date=invoice.invoice_date or None,
            vendor_name=invoice.vendor_name or None,
            total_amount=invoice.total_amount or None,
            currency=invoice.currency or None,
            confidence_score=invoice.confidence_score or None
        )
        for invoice in invoices
    ]

@app.get("/invoices/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice_detail(invoice_id: int, db: Session = Depends(get_db)):
    """Get detailed invoice information"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    extracted_data = {}
    if invoice.extracted_data:
        try:
            extracted_data = json.loads(invoice.extracted_data)
        except:
            extracted_data = {}
    
    return InvoiceDetailResponse(
        id=invoice.id,
        filename=invoice.filename,
        upload_date=invoice.upload_date,
        status=invoice.status,
        extracted_data=extracted_data,
        invoice_number=invoice.invoice_number or None,
        invoice_date=invoice.invoice_date or None,
        due_date=invoice.due_date or None,
        vendor_name=invoice.vendor_name or None,
        vendor_address=invoice.vendor_address or None,
        customer_name=invoice.customer_name or None,
        customer_address=invoice.customer_address or None,
        subtotal=invoice.subtotal or None,
        tax_amount=invoice.tax_amount or None,
        total_amount=invoice.total_amount or None,
        currency=invoice.currency or None,
        line_items=invoice.line_items or None,
        processing_time=invoice.processing_time or None,
        confidence_score=invoice.confidence_score or None,
        extraction_method=invoice.extraction_method or None
    )

@app.post("/invoices/{invoice_id}/reprocess", response_model=InvoiceResponse)
async def reprocess_invoice(invoice_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Reprocess a specific invoice (useful for stuck/failed ones)."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    file_path = os.path.join("uploads", invoice.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Original uploaded file not found on server")

    invoice.status = "processing"
    db.commit()

    background_tasks.add_task(process_invoice_background, invoice.id, file_path)

    return InvoiceResponse(
        id=invoice.id,
        filename=invoice.filename,
        upload_date=invoice.upload_date,
        status=invoice.status,
        invoice_number=invoice.invoice_number or None,
        invoice_date=invoice.invoice_date or None,
        vendor_name=invoice.vendor_name or None,
        total_amount=invoice.total_amount or None,
        currency=invoice.currency or None,
        confidence_score=invoice.confidence_score or None,
    )


@app.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete a specific invoice and its associated file."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    try:
        # Delete the uploaded file
        file_path = os.path.join("uploads", invoice.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted file: {file_path}")

        # Delete from database
        db.delete(invoice)
        db.commit()

        return {"message": f"Invoice {invoice_id} deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")


@app.delete("/invoices/")
async def delete_all_invoices(db: Session = Depends(get_db)):
    """Delete all invoices (use with caution)."""
    try:
        # Get all invoices
        invoices = db.query(Invoice).all()
        
        # Delete all uploaded files
        for invoice in invoices:
            file_path = os.path.join("uploads", invoice.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted file: {file_path}")

        # Delete all from database
        db.query(Invoice).delete()
        db.commit()

        return {"message": f"Deleted {len(invoices)} invoices successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete invoices: {str(e)}")


@app.post("/chat/", response_model=ChatResponse)
async def chat_with_invoice_endpoint(chat_message: ChatMessage, db: Session = Depends(get_db)):
    """Chat with a specific invoice to ask questions about its content."""
    # Get the invoice
    invoice = db.query(Invoice).filter(Invoice.id == chat_message.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != "completed":
        raise HTTPException(status_code=400, detail="Invoice processing not completed. Please wait for processing to finish.")
    
    # Parse the extracted data
    try:
        extracted_data = json.loads(invoice.extracted_data) if invoice.extracted_data else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid invoice data format")
    
    # Get AI response
    ai_response = chat_with_invoice(extracted_data, chat_message.message)
    
    return ChatResponse(
        response=ai_response,
        invoice_id=chat_message.invoice_id,
        timestamp=datetime.utcnow()
    )

@app.post("/invoices/{invoice_id}/suggest-questions", response_model=SuggestedQuestionsResponse)
async def get_suggested_questions(invoice_id: int, db: Session = Depends(get_db)):
    """Get suggested questions for a specific invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status != "completed":
        raise HTTPException(status_code=400, detail="Invoice processing not completed. Please wait for processing to finish.")

    try:
        extracted_data = json.loads(invoice.extracted_data) if invoice.extracted_data else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid invoice data format")

    questions = generate_suggested_questions(extracted_data)

    return SuggestedQuestionsResponse(
        questions=questions,
        invoice_id=invoice_id
    )

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
