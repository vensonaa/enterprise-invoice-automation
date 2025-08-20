#!/usr/bin/env python3.11
"""
Test script to debug invoice extraction
"""

import os
from dotenv import load_dotenv
from app.langgraph_workflow import extract_invoice_data

load_dotenv()

def test_extraction():
    print("🔍 Testing Invoice Extraction")
    print("=" * 50)
    
    # Check if Groq API key is set
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment")
        print("   Please set it in your .env file")
        return
    
    print(f"✅ GROQ_API_KEY found: {api_key[:10]}...")
    
    # Test extraction
    filename = "Distribution Finance Invoice.pdf"
    if not os.path.exists(filename):
        print(f"❌ File not found: {filename}")
        return
    
    print(f"📄 Testing extraction on: {filename}")
    print("-" * 50)
    
    try:
        result = extract_invoice_data(filename)
        
        print("📊 Extraction Result:")
        print(f"Status: {result.get('status')}")
        print(f"Processing Time: {result.get('processing_time', 0):.2f}s")
        print(f"Error Message: {result.get('error_message', 'None')}")
        
        print("\n📋 Extracted Data:")
        data = result.get('extracted_data', {})
        for key, value in data.items():
            print(f"  {key}: {value}")
        
        print("\n🎯 Confidence Scores:")
        scores = result.get('confidence_scores', {})
        for key, value in scores.items():
            print(f"  {key}: {value}")
            
    except Exception as e:
        print(f"❌ Extraction failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_extraction()
