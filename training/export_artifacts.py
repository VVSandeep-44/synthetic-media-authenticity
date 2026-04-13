from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'artifacts'


def main() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    class_names = ['Authentic', 'Synthetic']
    model_config = {'input_size': 224, 'threshold': 0.5, 'labels': class_names}

    model_config_path = ARTIFACTS / 'model_config.json'
    if model_config_path.exists():
        try:
            loaded_config = json.loads(model_config_path.read_text(encoding='utf-8'))
            if isinstance(loaded_config, dict):
                model_config.update(loaded_config)
                if isinstance(model_config.get('labels'), list) and model_config['labels']:
                    class_names = [str(label) for label in model_config['labels']]
        except Exception:
            pass

    (ARTIFACTS / 'class_names.json').write_text(json.dumps(class_names, indent=2), encoding='utf-8')
    model_config['labels'] = class_names
    (ARTIFACTS / 'model_config.json').write_text(json.dumps(model_config, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
