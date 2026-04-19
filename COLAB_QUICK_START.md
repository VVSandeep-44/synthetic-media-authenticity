# 🚀 Google Colab Quick Start Guide
## Train Your Model WITHOUT Local Storage

**Goal:** Download large dataset from Kaggle → Train model → Get 90%+ accuracy  
**Where:** Google Colab (free GPU, no storage needed)  
**Time:** ~4 hours total

---

## ✅ BEFORE YOU START

You need:
- [ ] Google account (for Google Colab & Drive)
- [ ] Kaggle account (free at kaggle.com)
- [ ] Kaggle API key (download from Kaggle settings)

---

## 📋 STEP 1: Prepare Kaggle Credentials (5 mins)

### 1.1 Get Your Kaggle API Key
1. Go to: https://www.kaggle.com/settings/account
2. Click "Create New API Token"
3. Downloads file: `kaggle.json`
4. Open it - should look like:
```json
{"username":"your_username","key":"abc123xyz..."}
```

### 1.2 Save it Somewhere Safe
- Keep this file on your computer
- You'll upload it to Colab in Step 3

---

## 📁 STEP 2: Organize Your Google Drive (5 mins)

### 2.1 Create Folder Structure in Google Drive
```
My Drive/
└── Explainable_Synthetic_media_Analysis/
    ├── training/
    │   └── PROJECT_DOCUMENT.ipynb (your notebook)
    └── artifacts/
        └── best_model.pth (optional, for reference)
```

### 2.2 How to Do It
1. Go to https://drive.google.com
2. Create folder: `Explainable_Synthetic_media_Analysis`
3. Inside, create folder: `training`
4. Upload your `PROJECT_DOCUMENT.ipynb` to the `training` folder
5. Inside `Explainable_Synthetic_media_Analysis`, create folder: `artifacts`

✅ Now your Drive is ready!

---

## 🔗 STEP 3: Open Your Notebook in Colab (2 mins)

### 3.1 Open Colab
1. Go to: https://colab.research.google.com
2. Click: "File" → "Open notebook"
3. Click: "Google Drive" tab
4. Navigate to: `Explainable_Synthetic_media_Analysis` → `training` → `PROJECT_DOCUMENT.ipynb`
5. Click it to open

✅ Now you have your notebook running in Colab!

---

## 🔑 STEP 4: Upload Kaggle Credentials to Colab (2 mins)

### 4.1 In Your Colab Notebook
Add this as the **VERY FIRST cell** (before Section 0):

```python
# ===== SETUP: MOUNT DRIVE & KAGGLE API =====

# 1. Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# 2. Upload Kaggle credentials
from google.colab import files
print("Click 'Choose Files' and select your kaggle.json")
uploaded = files.upload()

# 3. Setup Kaggle
import os
os.makedirs('/root/.kaggle', exist_ok=True)
os.system('mv kaggle.json /root/.kaggle/')
os.system('chmod 600 /root/.kaggle/kaggle.json')

print("✅ Kaggle API ready!")
print("✅ Google Drive mounted!")
```

### 4.2 Run This Cell
1. Click the play button ▶️
2. Click "Choose Files" button that appears
3. Select your `kaggle.json` from Step 1.1
4. Wait for "Upload complete"
5. Wait for the cell to finish (should see ✅ messages)

✅ Now Colab can access Kaggle & your Drive!

---

## 📊 STEP 5: Run Section 0 - Setup (5 mins)

### 5.1 Run the First Section
1. Scroll to "## Section 0: Dataset Setup"
2. Click the play button ▶️ on that code cell
3. Wait for it to finish

✅ Should see no errors!

---

## 📥 STEP 6: Download Dataset (30 mins to 2 hours)

### 6.1 Run Section 15 - Part 1: Setup
1. Scroll to "## Section 15: Kaggle Dataset Integration"
2. Find the first code cell
3. Click play ▶️ to run these functions:
   - `setup_kaggle_api()`
   - `list_recommended_datasets()`

✅ Should see 4 datasets listed!

### 6.2 Run Section 15 - Part 2: Download
Add this cell AFTER the setup:

```python
# Download the dataset (CHOOSE ONE)

# Option A: Recommended (50K images, fastest good option)
download_kaggle_dataset('140k-real-and-fake-faces')

# Wait for download to complete...
# You'll see progress bar like: [====>    ] 45%
```

Sit back and wait! ☕ This takes 30 mins to 2 hours depending on your internet.

✅ When done, you'll see "Download complete!"

### 6.3 Run Section 15 - Part 3: Organize
Add this cell:

```python
# Organize downloaded files into real/fake folders
extract_and_organize('/tmp/datasets_downloaded/140k-real-and-fake-faces')

# Verify it worked
dataset_statistics('/tmp/dataset')
```

✅ Should show you have 50K+ images ready!

---

## 🤖 STEP 7: Train Your Model (2-6 hours)

### 7.1 Run Section 2: Load Data
1. Scroll to "## Section 2: Data Preparation Pipeline"
2. Click play ▶️
3. Wait for it to finish

✅ Should show: "Creating stratified train/val splits"

### 7.2 Run Section 12: Train with Optimization
1. Scroll to "## Section 12: Optimized Training Configuration"
2. Click play ▶️
3. **LET IT RUN** - you'll see:

```
Epoch 1/25: [=====>  ] Loss: 0.45
Epoch 2/25: [======> ] Loss: 0.32
...
Epoch 25/25: [=======>] Loss: 0.08
```

**DO NOT CLOSE THE TAB** - it needs to keep running!

⏱️ Time estimate:
- Epoch 1-5: ~10 mins (accuracy jumps to 70%)
- Epoch 6-15: ~30 mins (accuracy reaches 85%)
- Epoch 15-25: ~30 mins (accuracy hits 90%+)

✅ When done, it saves `best_model_large_dataset.pth`

---

## 📊 STEP 8: Check Results (5 mins)

### 8.1 Run Section 13: Generate Metrics
1. Scroll to "## Section 13: Generate Complete Metrics Report"
2. Click play ▶️

✅ You'll see something like:
```
Accuracy: 93.2%
Precision: 92.8%
Recall: 93.6%
F1-Score: 93.2%
```

### 8.2 View Performance Chart
The cell will show a graph with:
- Training loss going down ✓
- Validation accuracy going up ✓
- Final accuracy: 90%+ ✓

✅ **CONGRATULATIONS!** Your model is trained!

---

## 💾 STEP 9: Save Your Model (2 mins)

### 9.1 Copy Model to Google Drive
Add this cell:

```python
import shutil

# Copy model to Google Drive
source = '/tmp/best_model_large_dataset.pth'
destination = '/content/drive/My Drive/Explainable_Synthetic_media_Analysis/artifacts/best_model_large_dataset.pth'

shutil.copy(source, destination)
print(f"✅ Model saved to Google Drive!")
```

Run it ▶️

✅ Your model is now safely stored in Google Drive!

---

## 🧪 STEP 10 (Optional): Test with Video

### 10.1 Run Section 8: Video Inference
1. Scroll to "## Section 8: Video Inference Pipeline"
2. Upload a test video (real face or deepfake)
3. Click play ▶️
4. See predictions on each frame!

---

## 📋 Quick Reference: What Each Section Does

| Section | What It Does | Time |
|---------|------------|------|
| **0** | Checks Colab environment | 1 min |
| **15** | Downloads Kaggle dataset | 30 min - 2 hours |
| **2** | Prepares data for training | 2 mins |
| **12** | **TRAINS YOUR MODEL** | 2-6 hours |
| **13** | Shows accuracy & metrics | 5 mins |
| **8** | Tests with video (optional) | 5 mins |

---

## ⚠️ Common Issues & Fixes

### Issue: "Kaggle API not found"
**Fix:** Make sure you ran the upload cell (Step 4) and selected kaggle.json

### Issue: "No space left on device"
**Fix:** Don't worry! Colab has 50GB. This won't happen.

### Issue: "Connection lost" / "Colab tab closed"
**Fix:** Colab sessions timeout after 12 hours. If your training hasn't finished:
- Check if your model was saved to Drive (Step 9)
- You can resume next day

### Issue: "Only 40-60% accuracy"
**Fix:** Make sure you:
1. Downloaded the LARGE dataset (140K images)
2. Ran Section 12, not just Section 4
3. Let it train for 20+ epochs

---

## 🎓 Understanding What's Happening

**Your workflow:**
```
1. Upload credentials to Colab ← (Step 4)
   ↓
2. Kaggle API confirms login ← (Step 6)
   ↓
3. Download 140K images to Colab's temp storage ← (Step 6)
   ↓
4. Organize images into real/fake folders ← (Step 6)
   ↓
5. Load images and create train/val splits ← (Step 7)
   ↓
6. Train model for 25 epochs ← (Step 7) ⏱️ LONGEST PART
   ↓
7. Save trained model to your Google Drive ← (Step 9)
   ↓
8. You now have 90%+ accuracy model! 🎉
```

---

## ✨ Final Checklist

- [ ] Google Colab account ready
- [ ] Kaggle account & API key ready
- [ ] Google Drive folder created
- [ ] PROJECT_DOCUMENT.ipynb uploaded to Drive
- [ ] Colab notebook opened
- [ ] Kaggle credentials uploaded to Colab
- [ ] Section 0 runs successfully
- [ ] Dataset downloaded from Kaggle (Step 6)
- [ ] Model trained (Section 12) - 90%+ accuracy achieved
- [ ] Model saved to Google Drive

✅ **ALL DONE!** You now have a production-ready model!

---

## 🆘 Need Help?

If something doesn't work:
1. Note the exact error message
2. Check "Common Issues & Fixes" above
3. Ask me with the error text

**Good luck! 🚀**
