from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import numpy as np
import pickle

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/predict', methods=['POST'])
def predict():
    print("Before model load")
    # Load the model and encoder
    with open('rf_model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)
    with open('encoder.pkl', 'rb') as encoder_file:
        encoder = pickle.load(encoder_file)
        
    print("after model load")
    
    # Get input values from the request body
    data = request.json
    age = data.get('age')
    sex = data.get('sex')
    chest_pain = data.get('CpainType')
    resting_bp = data.get('RestingBP')
    cholesterol = data.get('Cholesterol')
    fasting_bs = data.get('FastingBP')
    resting_ecg = data.get('RestingECG')
    exercise_angina = data.get('Angina')
    st_slope = data.get('St_Slope')
    latest_maxHR = data.get('latest_maxHR')
    oldpeak = data.get('OldPeak')
    
    print("data reading completed")
    # Encode categorical features
    user_input = np.array([[sex, chest_pain, resting_ecg, exercise_angina, st_slope]])
    user_input_encoded = encoder.transform(user_input).flatten()
    
    # Combine all features
    features = np.array([age, resting_bp, cholesterol, fasting_bs, latest_maxHR, oldpeak])
    features = np.concatenate([features, user_input_encoded])
    
    print("encoding complete")
    # Make prediction
    prediction = model.predict([features])
    print("Prediction complete")
    print(prediction[0])
    # Return appropriate message based on the prediction
    if prediction[0] == 1:
        return jsonify({"message": "The patient has high risk of heart disease"})
    else:
        return jsonify({"message": "The patient is not at risk of heart disease"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5100)  # Run the app on all interfaces