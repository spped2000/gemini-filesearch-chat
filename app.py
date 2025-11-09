from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from google import genai
from google.genai import types
import os
import time
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="Chat With Your Document")

# Initialize Google GenAI client
client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

# Store file search stores in memory (in production, use a database)
file_stores = {}

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ChatRequest(BaseModel):
    question: str
    store_id: str


@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a document and create a file search store"""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.txt', '.md']
        file_ext = os.path.splitext(file.filename)[1].lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )

        # Generate a unique store ID
        store_id = str(uuid.uuid4())

        # Save file with ASCII-safe name
        safe_filename = f"{store_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Create file search store
        file_search_store = client.file_search_stores.create(
            config={'display_name': f'Store for {file.filename}'}
        )

        # Upload file to Google's file search store
        operation = client.file_search_stores.upload_to_file_search_store(
            file=file_path,
            file_search_store_name=file_search_store.name,
            config={
                'display_name': file.filename,
            }
        )

        # Wait for upload to complete
        max_wait_time = 120  # 2 minutes
        start_time = time.time()

        while not operation.done:
            if time.time() - start_time > max_wait_time:
                raise HTTPException(status_code=408, detail="File upload timeout")
            time.sleep(2)
            operation = client.operations.get(operation)

        # Store the file search store info
        file_stores[store_id] = {
            'store_name': file_search_store.name,
            'filename': file.filename,
            'file_path': file_path
        }

        return JSONResponse({
            "success": True,
            "store_id": store_id,
            "filename": file.filename,
            "message": "File uploaded and processed successfully"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat with the uploaded document"""
    try:
        if request.store_id not in file_stores:
            raise HTTPException(status_code=404, detail="Document not found. Please upload a document first.")

        store_info = file_stores[request.store_id]

        # Generate response using file search with better formatting instructions
        # Following Google's prompting strategies: clear instructions, structured output, examples
        prompt = f"""You are a helpful assistant that answers questions based on the provided document.

TASK:
Answer the following question using ONLY information from the document. The user may ask in Thai or English - respond in the same language they use.

QUESTION:
{request.question}

INSTRUCTIONS:
1. Search the document thoroughly for relevant information
2. Provide accurate, complete answers based only on the document content
3. If the document contains tables, charts, or structured data:
   - Present numerical data in clear, organized tables
   - Use markdown table format: | Column 1 | Column 2 |
4. Structure your response with:
   - Clear headings using ## for main topics and ### for subtopics
   - Bullet points (-) for lists
   - **Bold** for important terms or values
5. If there are multiple recipes, formulas, or steps:
   - Separate each one clearly with headings
   - Number steps when showing procedures
6. If the question asks for specific data from tables:
   - Present it in table format for easy reading
   - Include column headers and organize rows logically
7. Response language:
   - If the question is in Thai, respond in Thai
   - If the question is in English, respond in English
   - Maintain professional, clear language

IMPORTANT:
- Only use information from the document
- If information is not in the document, say so clearly
- Cite specific sections when relevant
- Format tables properly for readability
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_info['store_name']]
                        )
                    )
                ]
            )
        )

        return JSONResponse({
            "success": True,
            "answer": response.text,
            "filename": store_info['filename']
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stores")
async def get_stores():
    """Get list of all uploaded documents"""
    return JSONResponse({
        "stores": [
            {
                "store_id": store_id,
                "filename": info['filename']
            }
            for store_id, info in file_stores.items()
        ]
    })


@app.delete("/store/{store_id}")
async def delete_store(store_id: str):
    """Delete a document store"""
    if store_id in file_stores:
        # Remove the uploaded file
        file_path = file_stores[store_id]['file_path']
        if os.path.exists(file_path):
            os.remove(file_path)

        del file_stores[store_id]
        return JSONResponse({"success": True, "message": "Store deleted successfully"})

    raise HTTPException(status_code=404, detail="Store not found")


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
