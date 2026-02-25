from flask import Flask, render_template, request
import os
import random

app = Flask(__name__)

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['file']
    
    if file:
        filepath = os.path.join("static", file.filename)
        file.save(filepath)

        # Dummy prediction (temporary)
        result = random.choice(["Real", "Fake"])
        confidence = random.randint(70, 99)

        return render_template("index.html",
                               prediction=result,
                               confidence=confidence,
                               image_path=filepath)

    return "No file uploaded"

if __name__ == "__main__":
    app.run(debug=True)