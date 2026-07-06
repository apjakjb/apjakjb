from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Security ke liye CORS enable karna zaroori hai

@app.route('/api/python-service', methods=['POST'])
def python_service():
    try:
        data = request.json
        action = data.get('action')
        username = data.get('username', 'Student')
        
        # 🚀 Yahan humara Python logic aayega (AI, PDF, etc.)
        if action == 'test_connection':
            return jsonify({
                "success": True, 
                "message": f"Hello {username}, Python Backend is successfully connected 🐍🔥!"
            })
            
        return jsonify({"success": False, "message": "Unknown Action received by Python."})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)