from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
import xgboost as xgb

# 1. Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Fraud Detection API", version="1.0")

# 2. Load mô hình nguyên bản của XGBoost
MODEL_PATH = Path(__file__).resolve().parent / "xgb_fraud_model.json"
model = xgb.Booster()
model.load_model(str(MODEL_PATH))

# 3. Định nghĩa chính xác danh sách tên cột mà XGBoost đòi hỏi
FEATURE_NAMES = ['scaled_amount', 'scaled_time'] + [f'V{i}' for i in range(1, 29)]

class TransactionData(BaseModel):
    features: list[float]

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": True}

# 4. API Endpoint
@app.post("/predict")
async def predict_fraud(data: TransactionData):
    if len(data.features) != 30:
        raise HTTPException(status_code=400, detail="Đầu vào phải chứa đúng 30 đặc trưng.")
    
    try:
        # Gắn tên cột (feature_names) vào DMatrix để mô hình chấp nhận
        input_data = xgb.DMatrix([data.features], feature_names=FEATURE_NAMES)
        
        # Dự đoán
        risk_score = float(model.predict(input_data)[0])
        is_fraud = bool(risk_score > 0.5)
        
        return {
            "status": "success",
            "is_fraud": is_fraud,
            "risk_score": risk_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))