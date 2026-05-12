import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const images = [
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/bmi_underweight_1778558463727.png',
    dest: 'public/bmi_underweight.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/bmi_normal_1778558481916.png',
    dest: 'public/bmi_normal.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/bmi_overweight_1778558500171.png',
    dest: 'public/bmi_overweight.png'
  },
  {
    src: 'C:/Users/User/.gemini/antigravity/brain/0c915541-f220-4070-a434-a38a5a9896d6/bmi_obese_1778558513803.png',
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
