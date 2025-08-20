import json
import time
import re
from typing import Dict, Any, List
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
import os
from dotenv import load_dotenv
import PyPDF2
import io
from PIL import Image
import pytesseract
import cv2
import numpy as np

load_dotenv()

# Initialize Groq client
groq_client = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama3-8b-8192"
)

def extract_json_from_response(response_text: str) -> Dict[str, Any]:
    """Extract JSON from Groq response, handling markdown and explanatory text."""
    try:
        # First try direct JSON parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Look for JSON in markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Look for JSON object in the text
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # If all else fails, return empty dict
        return {}

def normalize_json_keys(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize JSON keys to match expected format."""
    normalized = {}
    key_mapping = {
        "Invoice Number": "invoice_number",
        "Invoice Date": "invoice_date", 
        "Due Date": "due_date",
        "Vendor Name": "vendor_name",
        "Vendor Address": "vendor_address",
        "Customer Name": "customer_name",
        "Customer Address": "customer_address",
        "Subtotal": "subtotal",
        "Tax Amount": "tax_amount",
        "Total Amount": "total_amount",
        "Currency": "currency"
    }
    
    for key, value in data.items():
        normalized_key = key_mapping.get(key, key.lower().replace(" ", "_"))
        normalized[normalized_key] = value
    
    return normalized

# Define the state structure
class InvoiceState:
    def __init__(self):
        self.filename: str = ""
        self.raw_text: str = ""
        self.extracted_data: Dict[str, Any] = {}
        self.confidence_scores: Dict[str, float] = {}
        self.processing_time: float = 0.0
        self.status: str = "processing"
        self.error_message: str = ""

# Node 1: Document Text Extraction
def extract_text_from_pdf(state: InvoiceState) -> InvoiceState:
    """Extract text from PDF document"""
    try:
        start_time = time.time()
        
        # Read PDF file
        with open(state.filename, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        
        state.raw_text = text
        state.processing_time = time.time() - start_time
        
        print(f"Text extraction completed in {state.processing_time:.2f}s")
        return state
        
    except Exception as e:
        state.error_message = f"Text extraction failed: {str(e)}"
        state.status = "failed"
        return state

# Node 2: Invoice Header Information Extraction
def extract_header_info(state: InvoiceState) -> InvoiceState:
    """Extract invoice header information using Groq"""
    try:
        system_prompt = """You are an expert invoice data extractor. Extract the following information from the invoice text:
        - Invoice Number
        - Invoice Date
        - Due Date
        - Vendor Name
        - Vendor Address
        - Customer Name
        - Customer Address
        
        Return ONLY a JSON object with these exact keys. If a field is not found, use null. Do not include any explanatory text."""
        
        user_prompt = f"Extract header information from this invoice:\n\n{state.raw_text[:2000]}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = groq_client.invoke(messages)
        
        # Parse JSON response with improved parsing
        try:
            raw_data = extract_json_from_response(response.content)
            header_data = normalize_json_keys(raw_data)
            state.extracted_data.update(header_data)
            state.confidence_scores["header_extraction"] = 0.85
            print(f"Header extraction successful: {header_data}")
        except Exception as e:
            # Fallback parsing
            state.extracted_data.update({
                "invoice_number": None,
                "invoice_date": None,
                "due_date": None,
                "vendor_name": None,
                "vendor_address": None,
                "customer_name": None,
                "customer_address": None
            })
            state.confidence_scores["header_extraction"] = 0.5
            print(f"Header extraction fallback: {e}")
        
        return state
        
    except Exception as e:
        state.error_message = f"Header extraction failed: {str(e)}"
        state.status = "failed"
        return state

# Node 3: Financial Information Extraction
def extract_financial_info(state: InvoiceState) -> InvoiceState:
    """Extract financial information using Groq"""
    try:
        system_prompt = """You are an expert invoice data extractor. Extract the following financial information:
        - Subtotal
        - Tax Amount
        - Total Amount
        - Currency
        
        Return ONLY a JSON object with these exact keys. Convert all amounts to float values. Do not include any explanatory text."""
        
        user_prompt = f"Extract financial information from this invoice:\n\n{state.raw_text}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = groq_client.invoke(messages)
        
        try:
            raw_data = extract_json_from_response(response.content)
            financial_data = normalize_json_keys(raw_data)
            
            # Convert string amounts to float
            for key in ['subtotal', 'tax_amount', 'total_amount']:
                if key in financial_data and financial_data[key]:
                    try:
                        # Remove currency symbols and commas
                        value = str(financial_data[key]).replace('$', '').replace(',', '')
                        financial_data[key] = float(value)
                    except (ValueError, TypeError):
                        financial_data[key] = 0.0
            
            state.extracted_data.update(financial_data)
            state.confidence_scores["financial_extraction"] = 0.90
            print(f"Financial extraction successful: {financial_data}")
        except Exception as e:
            state.extracted_data.update({
                "subtotal": 0.0,
                "tax_amount": 0.0,
                "total_amount": 0.0,
                "currency": "USD"
            })
            state.confidence_scores["financial_extraction"] = 0.5
            print(f"Financial extraction fallback: {e}")
        
        return state
        
    except Exception as e:
        state.error_message = f"Financial extraction failed: {str(e)}"
        state.status = "failed"
        return state

# Node 4: Line Items Extraction
def extract_line_items(state: InvoiceState) -> InvoiceState:
    """Extract line items from invoice"""
    try:
        system_prompt = """You are an expert invoice data extractor. Extract all line items from the invoice.
        Each line item should include:
        - Description
        - Quantity
        - Unit Price
        - Total Price
        
        Return ONLY a JSON array of objects with these keys. Do not include any explanatory text."""
        
        user_prompt = f"Extract line items from this invoice:\n\n{state.raw_text}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = groq_client.invoke(messages)
        
        try:
            raw_data = extract_json_from_response(response.content)
            # Handle both array and object responses
            if isinstance(raw_data, list):
                line_items = raw_data
            elif isinstance(raw_data, dict) and "line_items" in raw_data:
                line_items = raw_data["line_items"]
            else:
                line_items = []
            
            state.extracted_data["line_items"] = line_items
            state.confidence_scores["line_items_extraction"] = 0.80
            print(f"Line items extraction successful: {len(line_items)} items")
        except Exception as e:
            state.extracted_data["line_items"] = []
            state.confidence_scores["line_items_extraction"] = 0.5
            print(f"Line items extraction fallback: {e}")
        
        return state
        
    except Exception as e:
        state.error_message = f"Line items extraction failed: {str(e)}"
        state.status = "failed"
        return state

# Node 5: Data Validation and Enhancement
def validate_and_enhance_data(state: InvoiceState) -> InvoiceState:
    """Validate and enhance extracted data"""
    try:
        # Calculate line items total
        line_items = state.extracted_data.get("line_items", [])
        calculated_total = 0.0
        
        if line_items and isinstance(line_items, list):
            for item in line_items:
                if isinstance(item, dict):
                    # Try different possible keys for total price
                    total_price = item.get("total_price") or item.get("Total Price") or item.get("amount") or item.get("Amount") or 0.0
                    if isinstance(total_price, str):
                        # Remove currency symbols and commas
                        total_price = str(total_price).replace('$', '').replace(',', '').replace('£', '').replace('€', '')
                        try:
                            total_price = float(total_price)
                        except (ValueError, TypeError):
                            total_price = 0.0
                    elif isinstance(total_price, (int, float)):
                        total_price = float(total_price)
                    else:
                        total_price = 0.0
                    
                    calculated_total += total_price
        
        # Get extracted total amount
        extracted_total = state.extracted_data.get("total_amount", 0.0)
        if isinstance(extracted_total, str):
            extracted_total = str(extracted_total).replace('$', '').replace(',', '').replace('£', '').replace('€', '')
            try:
                extracted_total = float(extracted_total)
            except (ValueError, TypeError):
                extracted_total = 0.0
        elif not isinstance(extracted_total, (int, float)):
            extracted_total = 0.0
        
        # Check if totals match (allow for small rounding differences)
        tolerance = 0.01  # $0.01 tolerance
        totals_match = abs(calculated_total - extracted_total) <= tolerance
        
        if not totals_match and calculated_total > 0:
            print(f"Total amount mismatch detected:")
            print(f"  Extracted total: {extracted_total}")
            print(f"  Calculated from line items: {calculated_total}")
            print(f"  Difference: {abs(calculated_total - extracted_total)}")
            
            # Auto-correct the total amount
            state.extracted_data["total_amount"] = calculated_total
            print(f"  Auto-corrected total to: {calculated_total}")
            
            # Also update subtotal if it's missing or incorrect
            if not state.extracted_data.get("subtotal") or state.extracted_data.get("subtotal") == 0.0:
                state.extracted_data["subtotal"] = calculated_total
                print(f"  Updated subtotal to: {calculated_total}")
        
        # Use Groq for additional validation and enhancement
        system_prompt = """You are an expert invoice data validator. Review the extracted data and:
        1. Validate data consistency
        2. Fill in missing fields if possible
        3. Calculate confidence scores
        4. Suggest improvements
        5. Ensure line items total matches invoice total
        
        Return ONLY a JSON object with validation results and enhanced data. Do not include any explanatory text."""
        
        extracted_json = json.dumps(state.extracted_data, indent=2)
        user_prompt = f"Validate and enhance this extracted invoice data:\n\n{extracted_json}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = groq_client.invoke(messages)
        
        try:
            validation_result = extract_json_from_response(response.content)
            if "enhanced_data" in validation_result:
                enhanced_data = normalize_json_keys(validation_result["enhanced_data"])
                state.extracted_data.update(enhanced_data)
            if "overall_confidence" in validation_result:
                state.confidence_scores["overall"] = validation_result["overall_confidence"]
        except Exception as e:
            # Calculate average confidence
            confidences = list(state.confidence_scores.values())
            state.confidence_scores["overall"] = sum(confidences) / len(confidences) if confidences else 0.5
            print(f"Validation fallback: {e}")
        
        # Add validation metadata
        state.extracted_data["validation"] = {
            "totals_match": totals_match,
            "extracted_total": extracted_total,
            "calculated_total": calculated_total,
            "difference": abs(calculated_total - extracted_total),
            "auto_corrected": not totals_match and calculated_total > 0
        }
        
        state.status = "completed"
        return state
        
    except Exception as e:
        state.error_message = f"Validation failed: {str(e)}"
        state.status = "failed"
        return state

# Custom workflow implementation (LangGraph alternative)
class InvoiceExtractionWorkflow:
    """Custom workflow implementation for invoice extraction"""
    
    def __init__(self):
        self.nodes = [
            ("extract_text", extract_text_from_pdf),
            ("extract_header", extract_header_info),
            ("extract_financial", extract_financial_info),
            ("extract_line_items", extract_line_items),
            ("validate_data", validate_and_enhance_data)
        ]
    
    def run(self, initial_state: InvoiceState) -> InvoiceState:
        """Run the workflow with all nodes in sequence"""
        current_state = initial_state
        
        for node_name, node_func in self.nodes:
            try:
                print(f"Running node: {node_name}")
                current_state = node_func(current_state)
                
                if current_state.status == "failed":
                    print(f"Workflow failed at node: {node_name}")
                    break
                    
            except Exception as e:
                current_state.error_message = f"Error in node {node_name}: {str(e)}"
                current_state.status = "failed"
                break
        
        return current_state

# Main extraction function
def extract_invoice_data(filename: str) -> Dict[str, Any]:
    """Main function to extract invoice data using the custom workflow"""
    
    # Create workflow
    workflow = InvoiceExtractionWorkflow()
    
    # Initialize state
    initial_state = InvoiceState()
    initial_state.filename = filename
    
    # Run workflow
    try:
        final_state = workflow.run(initial_state)
        
        return {
            "status": final_state.status,
            "extracted_data": final_state.extracted_data,
            "confidence_scores": final_state.confidence_scores,
            "processing_time": final_state.processing_time,
            "error_message": final_state.error_message
        }
        
    except Exception as e:
        return {
            "status": "failed",
            "error_message": f"Workflow execution failed: {str(e)}",
            "extracted_data": {},
            "confidence_scores": {},
            "processing_time": 0.0
        }


def chat_with_invoice(invoice_data: Dict[str, Any], user_question: str) -> str:
    """Chat with an invoice using Groq to answer questions about the invoice content"""
    try:
        # Prepare the context with invoice data
        invoice_context = {
            "invoice_number": invoice_data.get("invoice_number"),
            "invoice_date": invoice_data.get("invoice_date"),
            "due_date": invoice_data.get("due_date"),
            "vendor_name": invoice_data.get("vendor_name"),
            "vendor_address": invoice_data.get("vendor_address"),
            "customer_name": invoice_data.get("customer_name"),
            "customer_address": invoice_data.get("customer_address"),
            "subtotal": invoice_data.get("subtotal"),
            "tax_amount": invoice_data.get("tax_amount"),
            "total_amount": invoice_data.get("total_amount"),
            "currency": invoice_data.get("currency"),
            "line_items": invoice_data.get("line_items", [])
        }
        
        system_prompt = """You are an expert invoice analyst assistant. You have access to detailed invoice data and can answer questions about:
        - Invoice details (number, dates, amounts)
        - Vendor and customer information
        - Line items and their details
        - Financial calculations and summaries
        - Payment terms and conditions
        - Any discrepancies or issues found
        
        Provide clear, accurate, and helpful responses based on the invoice data provided. If information is not available in the data, clearly state that.
        
        Format your response in a conversational but professional manner."""
        
        context_prompt = f"""Invoice Data:
        {json.dumps(invoice_context, indent=2)}
        
        User Question: {user_question}
        
        Please analyze the invoice data and provide a comprehensive answer to the user's question."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=context_prompt)
        ]
        
        response = groq_client.invoke(messages)
        return response.content
        
    except Exception as e:
        return f"Sorry, I encountered an error while processing your question: {str(e)}. Please try again."
