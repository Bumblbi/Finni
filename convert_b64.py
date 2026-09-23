import base64
import glob
import os

out_path = 'mobile/src/constants/petImages.ts'
with open(out_path, 'w', encoding='utf-8') as f_out:
    f_out.write('export const petImages: Record<string, string> = {\n')
    for p in glob.glob('mobile/assets/pet/*.png'):
        name = os.path.basename(p).split('.')[0]
        with open(p, 'rb') as img_f:
            b64 = base64.b64encode(img_f.read()).decode('utf-8')
        f_out.write(f'  "{name}": "data:image/png;base64,{b64}",\n')
    f_out.write('};\n')
print(f"Base64 images generated in {out_path}")
