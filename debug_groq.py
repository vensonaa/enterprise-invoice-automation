#!/usr/bin/env python3.11
"""
Debug Groq API calls
"""

import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

load_dotenv()

def test_groq_api():
    print("🔍 Testing Groq API Directly")
    print("=" * 50)
    
    # Check API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found")
        return
    
    print(f"✅ Using API key: {api_key[:10]}...")
    
    # Initialize Groq client
    try:
        groq_client = ChatGroq(
            groq_api_key=api_key,
            model_name="llama3-8b-8192"
        )
        print("✅ Groq client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Groq client: {e}")
        return
    
    # Test with sample invoice text
    sample_text = """
    BILL TO
    ABC Distribution Corp.
    456 Commerce Street
    Business Park, CA  90210
    Contact: John Smith
    Phone: (555) 987-6543
    Email: accounts@abcdistribution.com
    
    INVOICE DETAILS
    Invoice Number: INV-2025-001234
    Invoice Date: August 20, 2025
    Due Date: September 19, 2025
    Payment Terms: Net 30
    Client ID: CLI-5678
    
    ITEM DESCRIPTION SKU/CODE QTY UNIT PRICE TOTAL AMOUNT
    Samsung 55" 4K Smart TV Model: UN55TU8000FXZA SAM-TV-55-001 25 $549.99 $13,749.75
    Apple iPhone 15 Pro Max 256GB Natural Titanium APL-IP15PM-256 15 $1,199.99 $17,999.85
    """
    
    print("\n📄 Testing Header Extraction:")
    print("-" * 30)
    
    system_prompt = """You are an expert invoice data extractor. Extract the following information from the invoice text:
    - Invoice Number
    - Invoice Date
    - Due Date
    - Vendor Name
    - Vendor Address
    - Customer Name
    - Customer Address
    
    Return the data as a JSON object with these exact keys. If a field is not found, use null."""
    
    user_prompt = f"Extract header information from this invoice:\n\n{sample_text}"
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    try:
        print("🔄 Sending request to Groq...")
        response = groq_client.invoke(messages)
        print(f"✅ Got response from Groq")
        print(f"Response content: {response.content}")
        
        # Try to parse JSON
        try:
            parsed = json.loads(response.content)
            print(f"✅ JSON parsed successfully: {parsed}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Raw response: {response.content}")
            
    except Exception as e:
        print(f"❌ Groq API call failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_groq_api()
