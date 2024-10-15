import React, { useState } from 'react';
import axios from 'axios';

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
    <div className="App">
      <h1>Document Processor</h1>
      
      <input type="file" onChange={handleFileChange} />
      <button onClick={processDocument}>Process</button>

      {processedData && (
        <div>
          <h3>
            Parsed data:
          </h3>
          <div>
          <ul>
            <li>Document name:<b> {dbData["document_name"]} </b></li>
            <li>Supplier name:<b> {dbData["supplier_name"]}</b></li>
            <li>invoice_number:<b> {dbData["invoice_number"]}</b></li>
            <li>total_amount:<b>{dbData["total_amount"]}</b></li>
            <li>issue_date:<b> {dbData["issue_date"]}</b></li>
            <li>pay_due_date:<b> {dbData["pay_due_date"]}</b></li>

          </ul>
         </div>
          <button onClick={saveData}>Save</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
