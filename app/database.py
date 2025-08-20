from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./invoice_automation.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processing")  # processing, completed, failed
    extracted_data = Column(Text)  # JSON string of extracted data
    
    # Invoice fields
    invoice_number = Column(String)
    invoice_date = Column(String)
    due_date = Column(String)
    vendor_name = Column(String)
    vendor_address = Column(Text)
    customer_name = Column(String)
    customer_address = Column(Text)
    subtotal = Column(Float)
    tax_amount = Column(Float)
    total_amount = Column(Float)
    currency = Column(String, default="USD")
    
    # Line items (stored as JSON)
    line_items = Column(Text)
    
    # Processing metadata
    processing_time = Column(Float)
    confidence_score = Column(Float)
    extraction_method = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)
