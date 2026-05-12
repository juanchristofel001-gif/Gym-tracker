import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const images = [
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/holo_underweight_1778568418200.png',
    dest: 'public/bmi_underweight.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/holo_normal_1778568432584.png',
    dest: 'public/bmi_normal.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/holo_overweight_1778568478297.png',
    dest: 'public/bmi_overweight.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/holo_obese_1778568449151.png',
    dest: 'public/bmi_obese.png'
  }
];

images.forEach(img => {
  if (fs.existsSync(img.src)) {
    fs.copyFileSync(img.src, path.join(__dirname, img.dest));
    console.log(`Copied ${img.dest}`);
  } else {
    console.log(`Missing ${img.src}`);
  }
});
