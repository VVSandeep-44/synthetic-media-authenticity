from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'artifacts'


def main() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / 'class_names.json').write_text(json.dumps(['Authentic', 'Synthetic'], indent=2), encoding='utf-8')
    (ARTIFACTS / 'model_config.json').write_text(
        json.dumps({'input_size': 224, 'threshold': 0.5, 'labels': ['Authentic', 'Synthetic']}, indent=2),
        encoding='utf-8'
    )


if __name__ == '__main__':
    main()
