import os
import glob
from rembg import remove
from PIL import Image

input_dir = 'mobile/assets/pet'
jpg_files = glob.glob(os.path.join(input_dir, '*.jpg'))

print(f"Found {len(jpg_files)} JPG files.")

for jpg_path in jpg_files:
    png_path = jpg_path.replace('.jpg', '.png')
    print(f"Processing {jpg_path} -> {png_path} ...")
    try:
        input_image = Image.open(jpg_path)
        output_image = remove(input_image)
        output_image.save(png_path)
    except Exception as e:
        print(f"Error processing {jpg_path}: {e}")

print("All backgrounds removed!")
