from dataclasses import dataclass


@dataclass(slots=True)
class HybridCNNViT:
    num_classes: int
    input_size: int

    def __call__(self, *args, **kwargs):
        raise NotImplementedError('Attach the trained HybridCNNViT model before inference.')
