#!/usr/bin/env python3
"""
Test script to verify the Invoice Automation setup
"""

import sys
import os
from pathlib import Path

def test_imports():
    """Test if all required packages can be imported"""
    print("🔍 Testing package imports...")
    
    try:
        import fastapi
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import groq
        print("✅ Groq imported successfully")
    except ImportError as e:
        print(f"❌ Groq import failed: {e}")
        return False
    
    try:
        import langchain
        print("✅ LangChain imported successfully")
    except ImportError as e:
        print(f"❌ LangChain import failed: {e}")
        return False
    
    try:
        import sqlalchemy
        print("✅ SQLAlchemy imported successfully")
    except ImportError as e:
        print(f"❌ SQLAlchemy import failed: {e}")
        return False
    
    try:
        import PyPDF2
        print("✅ PyPDF2 imported successfully")
    except ImportError as e:
        print(f"❌ PyPDF2 import failed: {e}")
        return False
    
    return True

def test_environment():
    """Test environment configuration"""
    print("\n🔍 Testing environment configuration...")
    
    # Check if .env file exists
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file found")
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Check Groq API key
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key != "your_groq_api_key_here":
            print("✅ GROQ_API_KEY is set")
        else:
            print("⚠️  GROQ_API_KEY not configured (set to default value)")
    else:
        print("⚠️  .env file not found - please create one from env.example")
    
    return True

def test_directories():
    """Test if required directories exist or can be created"""
    print("\n🔍 Testing directory structure...")
    
    directories = ["uploads", "extracted", "static"]
    
    for directory in directories:
        dir_path = Path(directory)
        if dir_path.exists():
            print(f"✅ {directory}/ directory exists")
        else:
            try:
                dir_path.mkdir(exist_ok=True)
                print(f"✅ {directory}/ directory created")
            except Exception as e:
                print(f"❌ Failed to create {directory}/ directory: {e}")
                return False
    
    return True

def test_app_imports():
    """Test if app modules can be imported"""
    print("\n🔍 Testing app module imports...")
    
    try:
        from app import database
        print("✅ Database module imported successfully")
    except ImportError as e:
        print(f"❌ Database module import failed: {e}")
        return False
    
    try:
        from app import langgraph_workflow
        print("✅ LangGraph workflow module imported successfully")
    except ImportError as e:
        print(f"❌ LangGraph workflow module import failed: {e}")
        return False
    
    try:
        from app import main
        print("✅ Main app module imported successfully")
    except ImportError as e:
        print(f"❌ Main app module import failed: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🧪 Invoice Automation Setup Test")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_environment,
        test_directories,
        test_app_imports
    ]
    
    all_passed = True
    for test in tests:
        if not test():
            all_passed = False
    
    print("\n" + "=" * 40)
    if all_passed:
        print("🎉 All tests passed! Your setup is ready.")
        print("\n🚀 To start the application, run:")
        print("   python run.py")
        print("\n📚 For more information, see README.md")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\n🔧 Common solutions:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Create .env file: cp env.example .env")
        print("   3. Set your Groq API key in .env file")
        sys.exit(1)

if __name__ == "__main__":
    main()
