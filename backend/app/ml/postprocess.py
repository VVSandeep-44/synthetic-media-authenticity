from __future__ import annotations

from typing import Sequence


def resolve_label(
    probabilities: Sequence[float],
    class_names: Sequence[str],
    threshold: float = 0.5,
    positive_class_index: int = 1,
) -> tuple[str, float]:
    probability_values = [float(probability) for probability in probabilities]

    if not probability_values or not class_names:
        return 'Unknown', 0.0

    if len(probability_values) == 2 and len(class_names) >= 2:
        positive_index = max(0, min(positive_class_index, len(probability_values) - 1))
        negative_index = 0 if positive_index == 1 else 1
        positive_probability = probability_values[positive_index]

        if positive_probability >= threshold:
            label = class_names[positive_index]
            confidence = positive_probability
        else:
            label = class_names[negative_index]
            confidence = probability_values[negative_index]
        return label, confidence

    index = max(range(len(probability_values)), key=probability_values.__getitem__)
    confidence = probability_values[index]
    label = class_names[index] if index < len(class_names) else f'class_{index}'
    return label, confidence
