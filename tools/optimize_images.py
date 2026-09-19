"""Generate display derivatives; keep original images and original-image links intact."""
from pathlib import Path
from PIL import Image
import re, json

root = Path(__file__).resolve().parents[1] / 'dist'
out = root / 'optimized'
out.mkdir(exist_ok=True)
manifest = {}
for p in sorted(root.iterdir()):
    if p.suffix.lower() not in ('.jpg', '.png'):
        continue
    im = Image.open(p).convert('RGB')
    widths = [160, 320] if p.stem == 'portrait' else [160, 480, 800, 1200, im.width]
    widths = sorted(set(min(w, im.width) for w in widths))
    variants = []
    for w in widths:
        target = out / f'{p.stem}-{w}.webp'
        resized = im.resize((w, round(im.height*w/im.width)), Image.Resampling.LANCZOS)
        resized.save(target, 'WEBP', quality=86, method=6)
        variants.append({'src': target.relative_to(root).as_posix(), 'width': w, 'bytes': target.stat().st_size})
    manifest[p.name] = {'bytes': p.stat().st_size, 'dimensions': list(im.size), 'variants': variants}

for page in root.glob('*.html'):
    text = page.read_text(encoding='utf-8')
    def image(match):
        tag = match.group(0)
        src = re.search(r'\bsrc="([^"]+)"', tag)
        if not src or src[1] not in manifest:
            return tag
        name = src[1]
        variants = manifest[name]['variants']
        sizes = '(max-width: 700px) calc(100vw - 36px), (max-width: 1260px) calc(100vw - 60px), 1200px'
        if name == 'portrait.jpg':
            sizes = '(max-width: 700px) 99px, 149px'
        elif page.name == 'index.html':
            sizes = '(max-width: 700px) 300px, 288px'
        # Use the uncropped layout width; conservative full-width sizes keep
        # detail text legible even in narrow evidence columns.
        srcset = ', '.join(f"{v['src']} {v['width']}w" for v in variants)
        tag = tag.replace(src[0], f'src="{variants[-1]["src"]}" srcset="{srcset}" sizes="{sizes}"')
        tag = tag.replace('>', ' decoding="async">')
        if 'loading="lazy"' not in tag:
            tag = tag.replace('>', ' fetchpriority="high">')
        return tag
    text = re.sub(r'<img\b[^>]*>', image, text)
    text = re.sub(r'<script src=', '<script defer src=', text)
    page.write_text(text, encoding='utf-8', newline='\n')

# Preserve the complete print content, but do not create its DOM or fetch its
# images during ordinary screen browsing. beforeprint runs synchronously.
footer = root / 'footer.js'
text = footer.read_text(encoding='utf-8').split('// Print-only copies')[0].split('// Materialize the full print edition')[0]
cases = ''.join(re.search(r'<main\b.*?</main>', (root/f'project-{i}.html').read_text(encoding='utf-8'), re.S)[0] for i in (1,2,3))
text += '''// Materialize the full print edition only when printing is requested.
(()=>{
 if(!document.querySelector('.editorial-footer'))return;
 let collection;
 function preparePrint(){
  if(collection)return;
  collection=document.createElement('div');
  collection.className='print-case-collection';
  collection.innerHTML=CASE_CONTENT;
  collection.querySelectorAll('[id]').forEach(el=>{el.id='print-'+el.id;});
  collection.querySelectorAll('[aria-labelledby]').forEach(el=>{el.setAttribute('aria-labelledby',el.getAttribute('aria-labelledby').split(' ').map(id=>'print-'+id).join(' '));});
  collection.querySelectorAll('img').forEach(img=>{img.loading='eager';img.removeAttribute('srcset');img.removeAttribute('sizes');img.decoding='sync';});
  document.querySelector('.editorial-footer').before(collection);
 }
 window.addEventListener('beforeprint',preparePrint);
 window.addEventListener('afterprint',()=>{collection?.remove();collection=null;});
})();
'''.replace('CASE_CONTENT', json.dumps(cases, ensure_ascii=False))
footer.write_text(text, encoding='utf-8', newline='\n')
(root.parent/'tools'/'image-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
