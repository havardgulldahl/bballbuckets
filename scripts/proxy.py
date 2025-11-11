from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route("/api/org", methods=["GET"])
def get_org_data():
    api_url = "https://sf14-terminlister-prod-app.azurewebsites.net/org/Organisation?orgIds=20450"
    
    try:
        response = requests.get(api_url, headers={"Accept": "application/json"})
        response.raise_for_status()  # kaster feil hvis 4xx/5xx
        data = response.json()
        return jsonify(data)
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)

