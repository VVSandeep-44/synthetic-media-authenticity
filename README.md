# Explainable Synthetic Media Authenticity Analysis

An AI-powered deep learning application that detects whether an image or video is authentic or synthetically generated. The project combines Deep Learning with Explainable AI (XAI) techniques such as Grad-CAM to provide visual explanations for every prediction, improving model transparency and user trust.

---

## Features

- Detects authentic and synthetic media using a CNN-based deep learning model.
- Supports image and video upload for analysis.
- Generates prediction confidence scores.
- Visualizes model decisions using Grad-CAM heatmaps.
- RESTful backend built with FastAPI.
- Interactive frontend built with Next.js.
- Containerized deployment using Docker.

---

## Tech Stack

### Artificial Intelligence
- Python
- PyTorch
- OpenCV
- CNN (Convolutional Neural Network)
- Grad-CAM

### Backend
- FastAPI
- Uvicorn

### Frontend
- Next.js
- TypeScript
- React

### Deployment
- Docker
- Docker Compose

---

## Project Architecture

```
                Image / Video Upload
                        │
                        ▼
                Preprocessing Pipeline
                        │
                        ▼
               CNN Deep Learning Model
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
Prediction Label                 Confidence Score
        │
        ▼
Grad-CAM Heatmap Generation
        │
        ▼
Results Displayed in Next.js Frontend
```

---

## Project Structure

```
synthetic-media-authenticity/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── public/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── training/
│   └── Authenticity Analysis.ipynb
│
├── artifacts/
│   ├── model.pth
│   └── metadata.json
│
├── infra/
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── README.md
```

---

## Workflow

1. User uploads an image or video.
2. Backend validates and preprocesses the uploaded file.
3. The trained CNN model predicts whether the media is authentic or synthetic.
4. Grad-CAM generates visual explanations highlighting important regions.
5. Prediction label, confidence score, and explainability heatmap are returned.
6. Frontend displays the analysis results to the user.

---

## Model Pipeline

- Data Collection
- Data Preprocessing
- Image Augmentation
- CNN Model Training
- Model Validation
- Prediction
- Explainability using Grad-CAM
- Result Visualization

---

## Evaluation Metrics

The model is evaluated using:

- Accuracy
- Precision
- Recall
- F1 Score

---

## Running the Project

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/synthetic-media-authenticity.git
cd synthetic-media-authenticity
```

---

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

### Docker

```bash
cd infra
docker compose up --build
```

---

## Useful Commands

### Build Frontend

```bash
cd frontend
npm run build
```

### Backend Syntax Check

```bash
cd backend
python -m compileall app
```

---

## Future Enhancements

- Support additional deep learning architectures such as Vision Transformers (ViT).
- Improve video-level explainability.
- Deploy the application to cloud platforms.
- Add user authentication and history tracking.
- Optimize model inference for real-time performance.

---

## Author

**Veeramreddy Vijay Sandeep**

- GitHub: https://github.com/VVSandeep-44
- LinkedIn: https://www.linkedin.com/in/veeramreddy-vijay-sandeep-192541314
