from __future__ import annotations

from PIL import Image, ImageOps


IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def preprocess_image(image: Image.Image, input_size: int) -> Image.Image:
    return ImageOps.exif_transpose(image).convert('RGB').resize((input_size, input_size))


def preprocess_image_tensor(image: Image.Image, input_size: int):
    from torchvision import transforms

    pipeline = transforms.Compose([
        transforms.Resize(input_size),
        transforms.CenterCrop(input_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    normalized = preprocess_image(image, input_size)
    return pipeline(normalized)
