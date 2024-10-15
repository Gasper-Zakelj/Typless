from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import sqlite3
import base64

app = Flask(__name__)
CORS(app)

# SQLite Database Setup
DATABASE = 'clients.db'

# Initialize SQLite Database
def init_db():
    print("DB initialization...")
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS document (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_name TEXT,
                   
            supplier_name TEXT,
            conf_supplier_name DOUBLE,
                   
            issue_date TEXT,
            conf_issue_date DOUBLE,

            pay_due_date TEXT,
            conf_pay_due_date DOUBLE,
                   
            total_amount TEXT,
            conf_total_amount DOUBLE,
                   
            invoice_number TEXT,
            conf_invoice_number DOUBLE
            
        )""")
    conn.commit()
    conn.close()

# Route to Process Document with Typless
@app.route('/process', methods=['POST'])
def process_document():

    # Get file from request
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    

    # file is uploaded succesfully

    url = "https://developers.typless.com/api/extract-data"

    payload = {
        "document_type_name": "simple-invoice",
        "file_name": file.filename,
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": "Token 650396bd5ff34d628b05c009c2e1cc48"
    }
    
    pdf_data = file.read()
    base64_bytes = base64.b64encode(pdf_data)
    base64_file = base64_bytes.decode('utf-8')

    payload["file"] = base64_file

    # Send the file to Typless for processing
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        processed_data = response.json()
        return jsonify(processed_data), 200
    else:
        return jsonify({"error": "Failed to process document"}), 400

# Route to Save Processed Data into SQLite
@app.route('/save', methods=['POST'])
def save_metadata():
    # Extract metadata from the request body
    data = request.json

    print(data)

    document_name = data.get('document_name')
    supplier_name = data.get('supplier_name')
    conf_supplier_name = data.get('conf_supplier_name')
    issue_date = data.get('issue_date')
    conf_issue_date = data.get('conf_issue_date')
    pay_due_date = data.get('pay_due_date')
    conf_pay_due_date = data.get('conf_pay_due_date')
    invoice_number = data.get('invoice_number')
    conf_invoice_number = data.get('conf_invoice_number')
    total_amount = data.get('total_amount')
    conf_total_amount = data.get('conf_total_amount')


    if not document_name:
        return jsonify({"error": "Missing data to save"}), 400

    # Save data into SQLite database
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    try:
        cursor.execute("""INSERT INTO document (document_name,
                    supplier_name, conf_supplier_name,
                    issue_date, conf_issue_date,
                        pay_due_date, conf_pay_due_date, 
                    invoice_number, conf_invoice_number,
                        total_amount, conf_total_amount) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", 
                    (document_name,
                    supplier_name, conf_supplier_name, 
                    issue_date, conf_issue_date, 
                    pay_due_date, conf_pay_due_date,
                    invoice_number, conf_invoice_number,
                    total_amount, conf_total_amount)
                    )
        
        conn.commit()

    except sqlite3.Error as e:
        print("DB Error occurred:", e)
    
    conn.close()

    return jsonify({"message": "Data saved successfully"}), 200

# Route to Retrieve Saved Metadata from SQLite
@app.route('/metadata', methods=['GET'])
def get_metadata():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM metadata')
    rows = cursor.fetchall()
    conn.close()

    # Transform the data into a list of dictionaries
    metadata = [{"id": row[0], "document_name": row[1], "processed_data": row[2]} for row in rows]

    return jsonify(metadata), 200



if __name__ == '__main__':
    init_db()
    app.run(port=8000, debug=True)
    