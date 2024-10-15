import React, { useState } from 'react';
import axios from 'axios';
import 'flowbite/dist/flowbite.min.css'; // Make sure Flowbite is imported

function App() {
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [dbData, setDBData] = useState([]);
  const [message, setMessage] = useState('');

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Send the document for processing
  const processDocument = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/process', formData);
      setProcessedData(response.data);
      const extractedFields = response.data.extracted_fields;
      const supplier = extractedFields.find(field => field.name === "supplier_name");
      const issue_date = extractedFields.find(field => field.name === "issue_date");
      const pay_due_date = extractedFields.find(field => field.name === "pay_due_date");
      const invoice_number = extractedFields.find(field => field.name === "invoice_number");
      const total_amount = extractedFields.find(field => field.name === "total_amount");

      const desiredData = {
        document_name: file.name,
        supplier_name: supplier.values[0].value, 
        conf_supplier_name: supplier.values[0].confidence_score, 
        issue_date: issue_date.values[0].value, 
        conf_issue_date: issue_date.values[0].confidence_score, 
        pay_due_date: pay_due_date.values[0].value, 
        conf_pay_due_date: pay_due_date.values[0].confidence_score, 
        invoice_number: invoice_number.values[0].value, 
        conf_invoice_number: invoice_number.values[0].confidence_score,
        total_amount: total_amount.values[0].value, 
        conf_total_amount: total_amount.values[0].confidence_score,
      }
      setDBData(desiredData);
    } catch (error) {
      console.error('Error processing document', error);
    }
  };

  // Save the processed data
  const saveData = async () => {
    try {
      const response = await axios.post('http://localhost:8000/save', dbData);
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error saving data', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
      <h1 className="text-6xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600 mb-8 shadow-lg animate-bounce">
      Typless
      </h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
        </div>

        <button
          onClick={processDocument}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 mb-4"
        >
          Process Document
        </button>

        {processedData && (
          <div className="bg-gray-50 rounded-lg shadow p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Parsed Data:</h3>
            <ul className="list-disc pl-5">
              <li><b>Document Name:</b> {dbData.document_name}</li>
              <li><b>Supplier Name:</b> {dbData.supplier_name}</li>
              <li><b>Invoice Number:</b> {dbData.invoice_number}</li>
              <li><b>Total Amount:</b> {dbData.total_amount}</li>
              <li><b>Issue Date:</b> {dbData.issue_date}</li>
              <li><b>Pay Due Date:</b> {dbData.pay_due_date}</li>
            </ul>
            <button
              onClick={saveData}
              className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              Save Data
            </button>
          </div>
        )}

        {message && (
          <p className="text-green-500 text-center mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

export default App;
