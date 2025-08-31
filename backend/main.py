from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
import io
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms import HuggingFaceHub
import os

# Set your Hugging Face API token
# It's recommended to set this as an environment variable
# os.environ["HUGGINGFACEHUB_API_TOKEN"] = "your-hf-token"

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store the vector store and the QA chain
vector_store = None
qa_chain = None

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    global vector_store, qa_chain
    if file.content_type != "application/pdf":
        return {"error": "Only PDF files are allowed"}
    
    try:
        pdf_content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(pdf_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        # 1. Split the text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        
        # 2. Create embeddings
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        # 3. Create a FAISS vector store
        vector_store = FAISS.from_texts(chunks, embeddings)
        
        # 4. Create a QA chain
        llm = HuggingFaceHub(repo_id="google/flan-t5-large", model_kwargs={"temperature":0.5, "max_length":512})
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever()
        )
        
        return {"filename": file.filename, "message": "File processed successfully. Ready to answer questions."}
    except Exception as e:
        return {"error": str(e)}

@app.post("/qa/")
async def ask_question(question: str = Form(...)):
    if not qa_chain:
        return {"error": "Please upload a document first."}
    
    try:
        result = qa_chain.run(question)
        return {"question": question, "answer": result}
    except Exception as e:
        return {"error": str(e)}
