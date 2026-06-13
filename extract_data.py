import fitz  # PyMuPDF
import os
import re
import uuid
import pandas as pd
from PIL import Image
import io

def extract_pdf_data(pdf_path, base_dir):
    doc = fitz.open(pdf_path)
    
    raw_text_path = os.path.join(base_dir, "raw.txt")
    part_images_dir = os.path.join(base_dir, "part_images")
    named_images_dir = os.path.join(base_dir, "named_images")
    
    if not os.path.exists(part_images_dir):
        os.makedirs(part_images_dir)
    if not os.path.exists(named_images_dir):
        os.makedirs(named_images_dir)

    all_parts = []
    all_images = []
    
    item_code_pattern = re.compile(r'[A-Z]{2,3}-\d{4}-[A-Z0-9]{2,3}')

    print(f"Processing {len(doc)} pages...")

    full_text = ""
    for page_index in range(len(doc)):
        page = doc[page_index]
        text = page.get_text("text")
        full_text += text + "\n" + "="*50 + "\n"
        
        # Extract images per page
        image_list = page.get_images(full=True)
        # Sort images by their vertical position (y0) to match row order
        # To do this, we need the image rects
        page_images = []
        for img_info in page.get_image_info(xrefs=True):
            xref = img_info['xref']
            bbox = img_info['bbox'] # (x0, y0, x1, y1)
            
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            width = base_image["width"]
            height = base_image["height"]
            size_kb = len(image_bytes) / 1024
            
            # Use a more realistic filter for this PDF
            if size_kb > 2 and width > 50 and height > 50:
                page_images.append({
                    "xref": xref,
                    "bbox": bbox,
                    "image": image_bytes,
                    "ext": base_image["ext"]
                })
        
        # Sort by y position (top to bottom)
        page_images.sort(key=lambda x: x['bbox'][1])
        
        for img_data in page_images:
            img_name = f"img_{page_index}_{img_data['xref']}.{img_data['ext']}"
            img_path = os.path.join(part_images_dir, img_name)
            with open(img_path, "wb") as f:
                f.write(img_data['image'])
            all_images.append({
                "path": img_path,
                "page": page_index
            })

    # Save raw text
    with open(raw_text_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    # Parsing the text
    lines = [l.strip() for l in full_text.split('\n') if l.strip()]
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Look for S/O (a number)
        if line.isdigit() and int(line) < 5000:
            potential_so = int(line)
            
            # Next line should be Item Code or nearby
            item_code = None
            if i + 1 < len(lines):
                match = item_code_pattern.search(lines[i+1])
                if match:
                    item_code = match.group()
                    
            if item_code:
                # We have a row!
                row = {
                    "serial_no": potential_so,
                    "item_code": item_code,
                    "model": lines[i+2] if i+2 < len(lines) else "",
                    "description": lines[i+3] if i+3 < len(lines) else "",
                    "cp_price": 0.0
                }
                
                # Try to find price in next few lines
                for j in range(i+4, i+7):
                    if j < len(lines):
                        p_str = lines[j].replace(',', '')
                        try:
                            row["cp_price"] = float(p_str)
                            i = j # Move pointer to price line
                            break
                        except ValueError:
                            continue
                
                all_parts.append(row)
                i += 1
            else:
                i += 1
        else:
            i += 1

    return all_parts, all_images

def refine_parts_data(all_parts, all_images, base_dir):
    refined_parts = []
    # Mapping 1:1 if possible
    # We'll use the minimum length to avoid errors, or just map sequentially
    print(f"Mapping {len(all_images)} images to {len(all_parts)} parts.")
    
    for i, part in enumerate(all_parts):
        if i < len(all_images):
            part["image_path"] = all_images[i]["path"]
            new_img_name = f"{part['item_code']}.png"
            new_img_path = os.path.join(base_dir, "named_images", new_img_name)
            
            try:
                img = Image.open(part["image_path"])
                img.save(new_img_path, "PNG")
                part["renamed_image"] = new_img_name
            except Exception as e:
                print(f"Error processing image for {part['item_code']}: {e}")
                part["renamed_image"] = None
        else:
            part["renamed_image"] = None
        
        part["id"] = str(uuid.uuid4())
        part["name"] = part["description"] if part["description"] else part["model"]
        if not part["name"]: part["name"] = part.get("item_code", "Unknown Part")
        
        slug_base = part["name"].lower() + "_" + part["item_code"]
        part["slug"] = re.sub(r'[^a-z0-9]+', '_', slug_base).strip('_')
        
        part["price"] = part["cp_price"]
        part["stock_qty"] = 0
        part["is_active"] = 1
        part["product_type"] = 'part'
        part["created_at"] = pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
        
        refined_parts.append(part)
        
    return refined_parts

def main():
    base_dir = "processing"
    pdf_path = os.path.join(base_dir, "abc.pdf")
    
    all_parts, all_images = extract_pdf_data(pdf_path, base_dir)
    print(f"Extracted {len(all_parts)} parts and {len(all_images)} images.")
    
    final_parts = refine_parts_data(all_parts, all_images, base_dir)
    
    df = pd.DataFrame(final_parts)
    csv_fields = ['id', 'serial_no', 'item_code', 'model', 'description', 
                  'cp_price', 'name', 'slug', 'price', 'stock_qty', 'is_active', 
                  'product_type', 'created_at']
    
    for field in csv_fields:
        if field not in df.columns:
            df[field] = ""
            
    df[csv_fields].to_csv(os.path.join(base_dir, "parts.csv"), index=False)
    print("parts.csv generated.")

if __name__ == "__main__":
    main()
