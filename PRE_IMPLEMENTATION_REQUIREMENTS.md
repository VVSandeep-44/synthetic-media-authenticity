# Pre-Implementation Requirements Checklist

## 📋 BEFORE YOU START - MUST HAVE

### 1. **Development Environment**
- [ ] Python 3.8+ installed (`python --version`)
- [ ] pip package manager working
- [ ] Virtual environment created (`.venv` folder exists)
- [ ] Virtual environment activated
- [ ] Git installed (for version control)

**Verify:**
```powershell
python --version
pip --version
ls .venv
```

---

### 2. **Dataset Requirements** ⚠️ CRITICAL
Your dataset must exist and follow this structure:

```
dataset/
├── train/
│   ├── Authentic/  (or Real)
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── ...
│   └── Synthetic/  (or Fake)
│       ├── image1.jpg
│       ├── image2.jpg
│       └── ...
└── (optional) val/
    ├── Authentic/
    └── Synthetic/
```

**Requirements:**
- [ ] Minimum 1,000 total images (ideally 5,000+)
- [ ] 2 classes: Authentic/Real and Synthetic/Fake
- [ ] Balanced classes (ideally 50/50, or use WeightedRandomSampler if 70/30)
- [ ] Image formats: JPG, PNG, BMP, or WebP
- [ ] Image resolution: 224×224 preferred (will auto-resize)

**Check dataset:**
```powershell
cd training
python verify_dataset.py --dataset-root ../dataset
```

---

### 3. **Python Dependencies** 
All packages in `backend/requirements.txt` must be installed:

```
fastapi==0.115.8
uvicorn[standard]==0.34.0
pydantic==2.10.6
pydantic-settings==2.8.0
python-multipart==0.0.20
Pillow==11.1.0
numpy==1.26.4
opencv-python-headless==4.11.0.86
torch==2.2.0
torchvision==0.17.0
```

**Install:**
```powershell
cd backend
pip install -r requirements.txt
```

**Additional packages needed for training:**
```powershell
pip install scikit-learn  # For metrics
pip install tqdm  # Progress bars
```

**Verify installation:**
```powershell
python -c "import torch; print(torch.__version__)"
python -c "import torchvision; print(torchvision.__version__)"
python -c "from sklearn.metrics import classification_report; print('OK')"
```

---

### 4. **GPU/Hardware Considerations**

#### If using GPU (Recommended):
- [ ] NVIDIA GPU with CUDA Compute Capability 3.5+
- [ ] CUDA 11.8+ installed
- [ ] cuDNN 8.6+ installed
- [ ] NVIDIA Driver updated

**Verify GPU:**
```powershell
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name())"
```

#### If using CPU only:
- [ ] At least 16GB RAM recommended
- [ ] Training will be 10-20x slower
- [ ] Batch size may need to be reduced to 8-16

**Check available VRAM (GPU):**
```powershell
python -c "import torch; print(f'GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB')"
```

---

### 5. **Project Structure**
Verify this structure exists:

```
Explainable_Synthetic_media_Analysis/
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── ml/
│   │   │   ├── model_def.py  ← WILL BE MODIFIED
│   │   │   ├── preprocess.py
│   │   │   └── postprocess.py
│   │   └── ...
│   └── ...
├── training/
│   ├── train_model.py  ← WILL BE MODIFIED
│   ├── export_artifacts.py
│   └── ...
├── artifacts/
│   ├── best_model.pth  (placeholder, will be replaced)
│   ├── class_names.json
│   └── model_config.json
└── README.md
```

**Verify:**
```powershell
ls -Recurse | grep "model_def.py"
ls -Recurse | grep "train_model.py"
ls artifacts/
```

---

### 6. **Code Backup Strategy**
Before modifying code:

- [ ] Initialize Git repository (if not already done)
  ```powershell
  git init
  git add .
  git commit -m "Backup before optimization changes"
  ```

- [ ] OR manually backup files:
  ```powershell
  cp training/train_model.py training/train_model.py.backup
  cp backend/app/ml/model_def.py backend/app/ml/model_def.py.backup
  ```

---

### 7. **Storage Space Required**

| Component | Size | Notes |
|-----------|------|-------|
| Dataset (5000 images) | 2-5 GB | Varies by resolution |
| PyTorch + dependencies | 3-5 GB | GPU CUDA version larger |
| Model checkpoints | 200-300 MB | best_model.pth |
| Training logs | 10-50 MB | Metrics tracking |
| **Total** | **5-10 GB** | Minimum recommended |

**Check available space:**
```powershell
Get-Volume -DriveLetter D | Select-Object SizeRemaining
```

---

### 8. **Git & Version Control** (Optional but Recommended)

- [ ] Git initialized in project root
- [ ] Initial commit made
- [ ] .gitignore configured

**Setup:**
```powershell
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial project state"
```

---

### 9. **Editor/IDE Setup**

- [ ] VS Code open with workspace
- [ ] Python extension installed
- [ ] PyTorch/ML extensions (optional)
- [ ] Terminal accessible

**Verify in VS Code:**
```
- F1 → "Python: Select Interpreter" → Choose .venv
- Terminal shows (.venv) prefix
```

---

### 10. **Documentation Review** (Before Coding)

- [ ] Read `QUICK_FIXES.md` (5 min)
- [ ] Read `CODE_DIFFS.md` (10 min)
- [ ] Understand the 5 critical changes
- [ ] Review current `TrainConfig` in `train_model.py`
- [ ] Review current model in `model_def.py`

---

## 🔧 SETUP SCRIPT (Optional - Run Everything)

Create `setup_environment.ps1`:

```powershell
# setup_environment.ps1

Write-Host "=== Environment Setup ===" -ForegroundColor Green

# 1. Check Python
Write-Host "`n1. Checking Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    exit 1
}

# 2. Create virtual environment if not exists
if (-not (Test-Path ".venv")) {
    Write-Host "`n2. Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# 3. Activate virtual environment
Write-Host "`n3. Activating virtual environment..." -ForegroundColor Yellow
& ".venv\Scripts\Activate.ps1"

# 4. Upgrade pip
Write-Host "`n4. Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# 5. Install dependencies
Write-Host "`n5. Installing dependencies..." -ForegroundColor Yellow
cd backend
pip install -r requirements.txt
cd ..

# 6. Install additional packages
Write-Host "`n6. Installing training utilities..." -ForegroundColor Yellow
pip install scikit-learn tqdm

# 7. Verify installations
Write-Host "`n7. Verifying installations..." -ForegroundColor Yellow
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import torchvision; print(f'TorchVision: {torchvision.__version__}')"
python -c "import sklearn; print('scikit-learn: OK')"

# 8. Check GPU
Write-Host "`n8. Checking GPU..." -ForegroundColor Yellow
python -c "import torch; print(f'GPU Available: {torch.cuda.is_available()}')"
if (torch.cuda.is_available()) {
    python -c "import torch; print(f'GPU: {torch.cuda.get_device_name()}')"
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
```

**Run it:**
```powershell
.\setup_environment.ps1
```

---

## ✅ FINAL PRE-FLIGHT CHECKLIST

Before starting ANY code changes, confirm all these:

- [ ] Virtual environment activated (`(.venv)` prefix visible in terminal)
- [ ] Python version ≥ 3.8
- [ ] PyTorch installed and working
- [ ] torchvision installed and working
- [ ] scikit-learn installed
- [ ] Dataset structure verified (2 classes, 1000+ images)
- [ ] Git repository initialized
- [ ] Code backed up (either Git or manual backup)
- [ ] Storage space available (5-10 GB)
- [ ] QUICK_FIXES.md and CODE_DIFFS.md reviewed
- [ ] GPU confirmed working (or CPU mode accepted)

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: "PyTorch not found"
```powershell
# Solution:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Issue: "CUDA not available" (but GPU exists)
```powershell
# Solution: Install CUDA version of PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Issue: "Dataset not found"
```powershell
# Solution: Create dataset structure
mkdir dataset/train/Authentic
mkdir dataset/train/Synthetic
# Then move images to appropriate folders
```

### Issue: "Virtual environment not working"
```powershell
# Solution: Recreate it
rmdir -Recurse -Force .venv
python -m venv .venv
& ".venv\Scripts\Activate.ps1"
```

### Issue: "Memory error during training"
```powershell
# Solution: Reduce batch size in train_model.py
batch_size: int = 16  # instead of 32 (or 8 for CPU)
```

---

## 📊 HARDWARE RECOMMENDATIONS

### Minimum (Acceptable but slow):
- CPU: Intel i5 or AMD Ryzen 5
- RAM: 16 GB
- GPU: Optional (training ~20x slower on CPU)
- Storage: 10 GB

### Recommended (Good):
- CPU: Intel i7/i9 or AMD Ryzen 7/9
- RAM: 32 GB
- GPU: NVIDIA RTX 3060 or better (12GB VRAM)
- Storage: 20 GB SSD

### Ideal (Fast):
- CPU: High-end workstation
- RAM: 64+ GB
- GPU: NVIDIA A100 or RTX 4090 (24GB+ VRAM)
- Storage: 50+ GB NVMe SSD

---

## 🚀 ESTIMATED TIME TO READY STATE

| Task | Time | Status |
|------|------|--------|
| Install dependencies | 10 min | ⏳ |
| Verify dataset | 5 min | ⏳ |
| Backup code | 5 min | ⏳ |
| Review documentation | 15 min | ⏳ |
| **Total readiness** | **35 min** | ⏳ |

---

## 📝 NEXT STEPS AFTER READY

Once all requirements are met:

1. ✅ Apply 5-minute quick fixes (CODE_DIFFS.md)
2. ✅ Add augmentation pipeline
3. ✅ Add focal loss class
4. ✅ Update model architecture
5. ✅ Run training command

---

## 🆘 NEED HELP?

If you have issues:

1. Check this requirements list first
2. Review error messages carefully
3. Check COMMON ISSUES section above
4. Run setup_environment.ps1 to refresh everything
5. Google the error + "PyTorch" or "CUDA"

---

**Once you've completed this checklist, you're ready to start the implementation! 🎯**
