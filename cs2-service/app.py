from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configurações
PORT = int(os.getenv('CS2_SERVICE_PORT', 5000))

@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "cs2-api",
        "port": PORT
    })

@app.route('/cs2/test')
def test_endpoint():
    return jsonify({
        "status": "success",
        "message": "CS2 service is working!",
        "data": {
            "matches": [],
            "note": "HLTV integration will be added later"
        }
    })

if __name__ == '__main__':
    print(f"🚀 Starting CS2 service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False) 