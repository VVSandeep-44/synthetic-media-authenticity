from PIL import Image


def preprocess_image(image: Image.Image, input_size: int) -> Image.Image:
    return image.resize((input_size, input_size))
