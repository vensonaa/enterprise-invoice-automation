#!/usr/bin/env python3.11
"""
Invoice Automation - GEN AI Solution
Startup script for the FastAPI application
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting Invoice Automation System...")
    print("📊 Powered by Groq & LangGraph")
    print("🌐 Web interface will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("-" * 50)
    
    # Check if Groq API key is set
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️  Warning: GROQ_API_KEY not found in environment variables")
        print("   Please set your Groq API key in the .env file")
        print("   Get your API key from: https://console.groq.com/")
    
    # Start the server
    # Disable reload to avoid dev server restarts from frontend/node_modules changes
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
