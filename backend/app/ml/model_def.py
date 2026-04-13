import torch
import torch.nn as nn
from torchvision.models import efficientnet_v2_s, ViT_B_16_Weights, vit_b_16


class HybridCNNViT(nn.Module):
    """
    Hybrid model combining EfficientNetV2-S (CNN) and Vision Transformer (ViT) features.
    - CNN branch: Feature extraction and spatial reasoning
    - ViT branch: Attention-based global pattern understanding
    - Fusion: Concatenate features and classify with MLP head
    """

    def __init__(self, num_classes: int = 2, input_size: int = 224, dropout: float = 0.3):
        super().__init__()
        self.num_classes = num_classes
        self.input_size = input_size

        # CNN Branch: EfficientNetV2-S
        self.cnn = efficientnet_v2_s(pretrained=True)
        cnn_out_dim = self.cnn.classifier[1].in_features
        self.cnn.classifier = nn.Identity()  # Remove original classifier

        # ViT Branch: Vision Transformer B/16
        vit_weights = ViT_B_16_Weights.DEFAULT
        self.vit = vit_b_16(weights=vit_weights)
        vit_out_dim = self.vit.heads[0].in_features
        self.vit.heads = nn.Identity()  # Remove original head

        # Fusion & Classification Head
        fusion_dim = cnn_out_dim + vit_out_dim
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes),
        )

        # Hook state for explainability
        self.cnn_features = None
        self.cnn_gradients = None
        self.vit_features = None
        self.vit_gradients = None

        # Register Hooks
        self.cnn.features[-1].register_forward_hook(self._cnn_forward_hook)
        self.cnn.features[-1].register_full_backward_hook(self._cnn_backward_hook)
        self.vit.encoder.layers[-1].register_forward_hook(self._vit_forward_hook)
        self.vit.encoder.layers[-1].register_full_backward_hook(self._vit_backward_hook)

    def _cnn_forward_hook(self, module, input, output):
        self.cnn_features = output

    def _cnn_backward_hook(self, module, grad_input, grad_output):
        self.cnn_gradients = grad_output[0]

    def _vit_forward_hook(self, module, input, output):
        self.vit_features = output

    def _vit_backward_hook(self, module, grad_input, grad_output):
        self.vit_gradients = grad_output[0]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Input image tensor of shape (B, 3, H, W)

        Returns:
            Logits of shape (B, num_classes)
        """
        # CNN features
        cnn_features = self.cnn(x)

        # ViT features
        # ViT expects (B, C, H, W) and internally patches them
        vit_features = self.vit(x)

        # Fusion: concatenate CNN and ViT features
        fused = torch.cat([cnn_features, vit_features], dim=1)

        # Classification
        logits = self.classifier(fused)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Returns class probabilities."""
        with torch.no_grad():
            logits = self.forward(x)
            return torch.softmax(logits, dim=1)
