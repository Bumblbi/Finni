from rembg import remove
from PIL import Image

input_path = r'd:\finiki\Finni\frontend\assets\finni.png'
output_path = r'd:\finiki\Finni\frontend\assets\finni.png'

print("Removing background...")
input_image = Image.open(input_path)
output_image = remove(input_image)
output_image.save(output_path)
print("Done!")
