# 🤖 Gemini FileSearch Chat

Chat with your documents using Google Gemini 2.5 FileSearch and FastAPI

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.121+-green.svg)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange.svg)](https://ai.google.dev/)

## 📸 Screenshots

### Upload Interface
![Upload Interface](Screenshot%202025-11-09%20173330.png)

### Chat Interface
![Chat Interface](Screenshot%202025-11-09%20175415.png)

## ✨ Features

- 📄 **Multi-format Support** - Upload PDF, TXT, or MD files
- 💬 **Bilingual Chat** - Works with both Thai and English
- 🔍 **RAG-Powered** - Accurate answers using Google FileSearch
- 🎨 **Beautiful UI** - Modern, responsive design with gradient backgrounds
- 📊 **Smart Formatting** - Automatic table and markdown rendering
- 🚀 **Fast & Lightweight** - Built with FastAPI for high performance

## 🛠️ Tech Stack

- **Backend:** FastAPI + Uvicorn
- **AI Model:** Google Gemini 2.5 Flash
- **RAG:** Google FileSearch API
- **Frontend:** Vanilla JavaScript (No frameworks!)
- **Styling:** Custom CSS3 with responsive design

## 📋 Prerequisites

- Python 3.11 or higher
- Google API Key ([Get one here](https://aistudio.google.com/app/apikey))

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/spped2000/gemini-filesearch-chat.git
   cd gemini-filesearch-chat
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn python-multipart aiofiles google-genai python-dotenv
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google API key
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   ```
   http://localhost:8000
   ```

## How to Use

1. **Upload a Document**:
   - Drag and drop a file onto the upload area, or
   - Click "Or Browse Files" to select a file from your computer
   - Supported formats: PDF, TXT, MD

2. **Chat with Your Document**:
   - Once uploaded, you'll be taken to the chat interface
   - Type your question in the input field
   - Press Enter or click the send button
   - The AI will search through your document and provide relevant answers

3. **Start Over**:
   - Click the × button next to the document name to close and upload a new document

## 🔧 Technical Details

### Backend
- **Framework**: FastAPI with async/await support
- **Server**: Uvicorn ASGI server
- **File Handling**: python-multipart + aiofiles for async file operations
- **Environment**: python-dotenv for configuration

### AI & RAG
- **Model**: Google Gemini 2.5 Flash
- **RAG System**: Google FileSearch API
- **Document Processing**: Automatic file upload and indexing
- **Search**: Vector-based document retrieval

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **Modern CSS3** - Gradient backgrounds, animations
- **Responsive Design** - Works on desktop and mobile
- **Markdown Rendering** - Smart formatting for tables and structured data

### Features Implementation
- **Drag & Drop**: Native HTML5 drag-drop API
- **File Upload**: FormData with async fetch
- **Chat Interface**: Real-time message streaming
- **Table Formatting**: Markdown to HTML conversion
- **Bilingual Support**: Automatic Thai/English detection

## API Endpoints

- `GET /` - Main application interface
- `POST /upload` - Upload a document and create a file search store
- `POST /chat` - Send a message and get AI response
- `GET /stores` - List all uploaded documents
- `DELETE /store/{store_id}` - Delete a document store

## Project Structure

```
file_search_test/
├── app.py                 # FastAPI backend
├── test_filesearch.py     # Original test script
├── .env                   # Environment variables
├── static/
│   ├── index.html        # Main UI
│   ├── styles.css        # Styling
│   └── script.js         # Frontend logic
└── uploads/              # Uploaded files directory
```

## Notes

- Files are automatically renamed to ASCII-safe names to avoid encoding issues
- Each document upload creates a unique file search store
- Chat history is maintained per session but not persisted
- The application runs on port 8000 by default
