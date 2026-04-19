# Software and Hardware Requirements

## 1. Purpose
This document defines the software and hardware requirements for the Explainable Synthetic Media Analysis project.

## 2. Software Requirements

### 2.1 Operating System
- Windows 10/11 (64-bit)
- Ubuntu 20.04+ (64-bit)
- macOS 12+

### 2.2 Required Runtimes and Tools
- Python 3.11
- Node.js 20.x
- npm 10.x or later
- Git 2.30+

Optional (containerized run):
- Docker 24+
- Docker Compose v2+

### 2.3 Backend Python Dependencies
- fastapi==0.115.8
- uvicorn[standard]==0.34.0
- pydantic==2.10.6
- pydantic-settings==2.8.0
- python-multipart==0.0.20
- Pillow==11.1.0
- numpy==1.26.4
- opencv-python-headless==4.11.0.86
- torch==2.2.0
- torchvision==0.17.0

### 2.4 Python Libraries (Detailed)
Required project libraries are installed from:
- backend/requirements.txt

Library roles:
- fastapi, uvicorn: API server runtime
- pydantic, pydantic-settings: request validation and configuration
- python-multipart: file upload support
- Pillow, opencv-python-headless: image and video processing
- numpy: numerical operations
- torch, torchvision: deep learning inference and training

Install command:
```powershell
cd backend
pip install -r requirements.txt
```

Notes:
- Python standard library modules used in training/backend (for example argparse, pathlib, json, tempfile) do not require separate installation.
- For notebook-based training in Colab, install the same core ML stack if not preinstalled in the runtime.

### 2.5 Frontend JavaScript/TypeScript Dependencies
- next==14.2.30
- react==18.3.1
- react-dom==18.3.1
- three (0.183.x)
- @react-three/fiber (8.18.x)
- @react-three/drei (9.122.x)
- typescript==5.7.3 (development)

### 2.6 External Accounts and Services (Training Workflow)
- Google account (Google Colab and Google Drive)
- Kaggle account
- Kaggle API token (kaggle.json)
- Internet connection for package install, model weights, and dataset download

### 2.7 Required Project Artifacts for Inference
The backend expects these files in artifacts:
- best_model.pth
- class_names.json
- model_config.json

## 3. Hardware Requirements

### 3.1 Local Development (Frontend + Backend + Basic Inference)
Minimum:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 10 GB free
- GPU: Not required

Recommended:
- CPU: 6 to 8 cores
- RAM: 16 GB
- Storage: 20+ GB SSD
- GPU: Optional NVIDIA GPU for faster inference

### 3.2 Local Training
Minimum (slower training):
- CPU: 8 cores
- RAM: 16 GB
- GPU: NVIDIA GPU with 8 GB VRAM
- Storage: 80 to 120 GB free

Recommended:
- CPU: 8+ cores
- RAM: 32 GB
- GPU: NVIDIA RTX-class GPU with 12+ GB VRAM
- Storage: 150+ GB SSD/NVMe

### 3.3 Google Colab Training (Recommended for this project)
- Colab runtime with GPU enabled
- Stable internet connection
- Sufficient Google Drive storage for notebook and model artifacts

## 4. Network and Port Requirements
- Backend API default port: 8000
- Frontend default port: 3000
- Allow local communication from frontend to backend on localhost

## 5. Deployment Sizing Guidance
Demo/POC deployment:
- 2 vCPU
- 4 GB RAM
- 20 GB disk

Moderate usage:
- 4 vCPU
- 8 to 16 GB RAM
- 40+ GB disk

GPU-backed inference is recommended when low latency is required for higher throughput.

## 6. Notes
- CPU-only execution is supported but slower for inference and training.
- If PyTorch loading fails on Windows due to memory pressure, increase paging file size or use a CPU-only PyTorch build.
- For consistent environments, use Docker-based setup from the infra folder.
