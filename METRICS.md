# Performance Metrics - Explainable Synthetic Media Analysis

## Model Overview

| Property | Value |
|----------|-------|
| **Model Name** | Hybrid CNN-ViT Synthetic Media Detector |
| **Model Type** | Binary Classification (Real vs Fake) |
| **Architecture** | ResNet18 (CNN) + ViT B-16 (Transformer) |
| **Input Size** | 224 × 224 × 3 |
| **Total Parameters** | ~45.3M |
| **Trainable Parameters** | ~2.8M |
| **Backend Framework** | PyTorch |

---

## Dataset Information

| Metric | Value |
|--------|-------|
| **Training Samples** | — |
| **Validation Samples** | — |
| **Classes** | Real, Fake |
| **Class Distribution (Train)** | Fake: —, Real: — |
| **Class Distribution (Val)** | Fake: —, Real: — |
| **Augmentations** | RandomHorizontalFlip, RandomRotation(10°) |
| **Normalization** | ImageNet (μ=[0.485, 0.456, 0.406], σ=[0.229, 0.224, 0.225]) |

---

## Training Configuration

| Parameter | Value |
|-----------|-------|
| **Optimizer** | Adam |
| **Learning Rate** | 1e-4 |
| **Loss Function** | BCEWithLogitsLoss |
| **Batch Size** | 32 |
| **Epochs** | 5 |
| **Early Stopping** | Best validation accuracy |

---

## Performance Metrics

### Overall Performance

| Metric | Score |
|--------|-------|
| **Overall Accuracy** | — |
| **Macro Avg Precision** | — |
| **Macro Avg Recall** | — |
| **Macro Avg F1-Score** | — |

### FAKE Class (Inauthentic Media)

| Metric | Value |
|--------|-------|
| **Precision** | — |
| **Recall** | — |
| **F1-Score** | — |
| **Support** | — |

### REAL Class (Authentic Media)

| Metric | Value |
|--------|-------|
| **Precision** | — |
| **Recall** | — |
| **F1-Score** | — |
| **Support** | — |

---

## Confusion Matrix

```
                 Predicted
                Fake    Real
Actual  Fake  [  TN  ]  [  FP  ]
        Real  [  FN  ]  [  TP  ]
```

| Metric | Count |
|--------|-------|
| **True Negatives (TN)** | — |
| **False Positives (FP)** | — |
| **False Negatives (FN)** | — |
| **True Positives (TP)** | — |

**Sensitivity (Recall)** = TP / (TP + FN) = —  
**Specificity** = TN / (TN + FP) = —

---

## Training History

| Epoch | Train Loss | Train Acc | Val Loss | Val Acc | Best? |
|-------|-----------|-----------|----------|---------|-------|
| 1 | — | — | — | — | — |
| 2 | — | — | — | — | — |
| 3 | — | — | — | — | — |
| 4 | — | — | — | — | — |
| 5 | — | — | — | — | ✓ |

**Best Validation Accuracy:** —

---

## Explainability Metrics

### Grad-CAM (CNN Branch)
- **Purpose:** Visualize local texture artifacts and suspicious pixel patterns
- **Method:** Weighted average of CNN layer 4 activations
- **Heatmap Color:** JET (red=high importance, blue=low importance)
- **Thresholding:** Values < 0.4 set to zero for clarity

### ViT Attention Rollout (Transformer Branch)
- **Purpose:** Visualize global context understanding and high-level inconsistencies
- **Method:** Aggregated multi-head attention across transformer layers
- **Head Fusion:** Mean across attention heads
- **Heatmap Color:** VIRIDIS (yellow=high focus, purple=low focus)
- **Patch Grid:** 14 × 14 patches (196 patches for 224×224 input)

### Fusion Strategy
Both branches fuse via feature concatenation:
- CNN features: [512 dims from ResNet18]
- ViT features: [768 dims from ViT]
- Concatenated: 1280 dims → Dense classifier head
- Final decision: Average of CNN + ViT reasoning

---

## Cross-Validation & Robustness

| Cross-Val Fold | Accuracy | Precision | Recall | F1-Score |
|----------------|----------|-----------|--------|----------|
| Fold 1 | — | — | — | — |
| Fold 2 | — | — | — | — |
| Fold 3 | — | — | — | — |
| Fold 4 | — | — | — | — |
| Fold 5 | — | — | — | — |
| **Mean ± Std** | — | — | — | — |

---

## Inference Performance

| Scenario | Latency | Memory Used | Notes |
|----------|---------|-------------|-------|
| **Single Image (CPU)** | — ms | — MB | 224×224 RGB |
| **Single Image (GPU)** | — ms | — MB | NVIDIA GPU |
| **Video Frame (16 fps extraction)** | — ms | — MB | Per frame |
| **Batch of 32 Images (GPU)** | — ms | — MB | Throughput |

---

## Error Analysis

### Common False Positives (Fake predicted as Real)
- **Count:** —
- **Characteristics:** —
- **Causes:** —

### Common False Negatives (Real predicted as Fake)
- **Count:** —
- **Characteristics:** —
- **Causes:** —

### High-Confidence Mistakes
- **Example 1:** —
- **Example 2:** —

---

## Model Strengths & Limitations

### Strengths ✓
- Hybrid architecture combines texture (CNN) + semantic (ViT) understanding
- Explainability via Grad-CAM + Attention Rollout for transparency
- Stratified train/val split ensures class balance
- Fine-tuning approach leverages pre-trained weights

### Limitations ✗
- Requires high-resolution faces (224×224 minimum)
- Limited to binary classification (Real/Fake)
- CNN layer freezing reduces adaptation to domain specifics
- No temporal modeling for video (per-frame inference only)

---

## Recommendations for Improvement

1. **Data Augmentation:** Add brightness/contrast jitter, blur, JPEG compression
2. **Ensemble Methods:** Combine CNN-ViT with other architectures (EfficientNet, DenseNet)
3. **Temporal Modeling:** Implement 3D CNN or LSTM for temporal context in videos
4. **Hard Negative Mining:** Focus training on near-boundary cases
5. **Domain Adaptation:** Fine-tune on target dataset with synthetic samples
6. **Threshold Tuning:** Adjust decision boundary (0.5 → optimal threshold for F1)
7. **Post-Processing:** Temporal smoothing for video predictions

---

## Generation Information

- **Generated Date:** —
- **Training Duration:** — hours
- **Hardware:** —
- **Git Commit:** —
- **Notebook:** `training/PROJECT_DOCUMENT.ipynb`
