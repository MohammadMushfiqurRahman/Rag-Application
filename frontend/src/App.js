import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if(response.data.error) {
        setError(response.data.error)
      } else {
        setAnswer(response.data.message);
      }
    } catch (err) {
      setError('An error occurred during file upload.');
    }
    setLoading(false);
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleAsk = async () => {
    if (!question) {
      setError('Please enter a question.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('question', question);

    try {
      const response = await axios.post('http://127.0.0.1:8000/qa/', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if(response.data.error) {
        setError(response.data.error)
      } else {
        setAnswer(response.data.answer);
      }
    } catch (err) {
      setError('An error occurred while asking the question.');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">RAG Application</h1>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">1. Upload PDF</h5>
          <div className="input-group">
            <input type="file" className="form-control" onChange={handleFileChange} accept=".pdf" />
            <button className="btn btn-primary btn-hover" onClick={handleUpload} disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">2. Ask a Question</h5>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control" 
              value={question} 
              onChange={handleQuestionChange} 
              placeholder="Enter your question"
            />
            <button className="btn btn-primary btn-hover" onClick={handleAsk} disabled={loading}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </div>
        </div>
      </div>

      {error && 
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      }

      {answer && 
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Answer</h5>
            <p className="card-text">{answer}</p>
          </div>
        </div>
      }

    </div>
  );
}

export default App;