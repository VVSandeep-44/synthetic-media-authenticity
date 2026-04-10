# Explainable Synthetic Media Analysis

Full-stack app for synthetic media authenticity detection with explainability.

## Structure
- `frontend/`: Next.js UI for upload, result display, and heatmap views.
- `backend/`: FastAPI service for prediction, explanation, and health endpoints.
- `training/`: notebook space for dataset work, experiments, validation, and artifact export.
- `artifacts/`: saved model files and metadata consumed by the backend.
- `infra/`: Docker and reverse-proxy files for local/container deployment.

## Workflow
1. A user uploads an image or video in the frontend.
2. The backend validates the file and runs preprocessing.
3. The prediction endpoint returns the label, confidence, and explainability outputs.
4. The frontend renders the original media, the confidence score, and the heatmap overlays.

## Implementation
- Training and experiment code stays in `training/Authenticity Analysis.ipynb`.
- Model definition, inference, and explainability logic live in `backend/app/`.
- The UI calls the API from `frontend/services/api.ts` and renders results in `frontend/components/`.
- `backend/app/services/` is the place to connect the real trained model and generate Grad-CAM and ViT rollout outputs.
