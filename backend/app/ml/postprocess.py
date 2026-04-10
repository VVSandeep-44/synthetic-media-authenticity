from __future__ import annotations

from typing import Sequence


def resolve_label(probabilities: Sequence[float], class_names: Sequence[str]) -> tuple[str, float]:
    if not probabilities or not class_names:
        return 'Unknown', 0.0

    index = max(range(len(probabilities)), key=probabilities.__getitem__)
    confidence = float(probabilities[index])
    label = class_names[index] if index < len(class_names) else f'class_{index}'
    return label, confidence
