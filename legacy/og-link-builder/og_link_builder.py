"""สร้างลิงก์พรีวิว OG และเผยแพร่ไปยัง Cloudflare Pages.

ต้องมี Node.js (LTS) ติดตั้งไว้ โปรแกรมจะเรียก Wrangler ผ่าน npx และจะเปิด
Cloudflare Login เฉพาะครั้งแรกเท่านั้น. หน้าต่างหลักมีเพียงรูป, ลิงก์ และปุ่มเริ่ม.
"""

from __future__ import annotations

import html
import json
import os
import secrets
import shutil
import subprocess
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from urllib.parse import urlparse

from PIL import Image, ImageFilter, ImageOps


APP_DIR = Path(os.environ.get("APPDATA", Path.home())) / "OgPreviewLink"
CONFIG_PATH = APP_DIR / "config.json"
SITE_DIR = APP_DIR / "site"


class OgPreviewApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("สร้างลิงก์พรีวิว")
        self.resizable(False, False)
        self.image_path = tk.StringVar()
        self.target_url = tk.StringVar(value="https://s.shopee.co.th/7fYPYwZRji")
        self.result_url = tk.StringVar()
        self.status = tk.StringVar(value="เลือกภาพและวางลิงก์ แล้วกดเริ่ม")
        self._build_ui()

    def _build_ui(self) -> None:
        root = ttk.Frame(self, padding=20)
        root.grid(sticky="nsew")
        ttk.Label(root, text="รูปพรีวิว").grid(row=0, column=0, sticky="w")
        ttk.Entry(root, textvariable=self.image_path, width=56).grid(row=1, column=0, pady=(3, 13))
        ttk.Button(root, text="เลือกรูป", command=self.choose_image).grid(row=1, column=1, padx=(8, 0), pady=(3, 13))
        ttk.Label(root, text="ลิงก์ปลายทาง").grid(row=2, column=0, sticky="w")
        ttk.Entry(root, textvariable=self.target_url, width=68).grid(row=3, column=0, columnspan=2, sticky="ew", pady=(3, 13))
        self.start_button = ttk.Button(root, text="เริ่มสร้างลิงก์", command=self.start)
        self.start_button.grid(row=4, column=0, columnspan=2, sticky="ew")
        ttk.Label(root, textvariable=self.status, foreground="#555").grid(row=5, column=0, columnspan=2, sticky="w", pady=(13, 4))
        ttk.Entry(root, textvariable=self.result_url, width=56, state="readonly").grid(row=6, column=0, pady=(0, 2))
        self.copy_button = ttk.Button(root, text="คัดลอก", command=self.copy_link, state="disabled")
        self.copy_button.grid(row=6, column=1, padx=(8, 0), pady=(0, 2))

    def choose_image(self) -> None:
        filename = filedialog.askopenfilename(
            title="เลือกรูปพรีวิว", filetypes=[("Image", "*.png *.jpg *.jpeg *.webp"), ("All files", "*.*")]
        )
        if filename:
            self.image_path.set(filename)

    def copy_link(self) -> None:
        self.clipboard_clear()
        self.clipboard_append(self.result_url.get())
        self.status.set("คัดลอกลิงก์แล้ว")

    def start(self) -> None:
        image = Path(self.image_path.get())
        target = self.target_url.get().strip()
        if not image.is_file():
            messagebox.showerror("ยังไม่ได้เลือกรูป", "กรุณาเลือกไฟล์ภาพก่อน")
            return
        parsed = urlparse(target)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            messagebox.showerror("ลิงก์ไม่ถูกต้อง", "ลิงก์ต้องเริ่มด้วย https:// หรือ http://")
            return
        self.start_button.configure(state="disabled")
        self.copy_button.configure(state="disabled")
        self.status.set("กำลังสร้างและอัปโหลด…")
        threading.Thread(target=self.publish, args=(image, target), daemon=True).start()

    def run_wrangler(self, *args: str) -> None:
        # Windows ติดตั้ง npx เป็นไฟล์ npx.cmd; subprocess ต้องเรียกชื่อนี้ตรง ๆ.
        npx = "npx.cmd" if os.name == "nt" else "npx"
        command = [npx, "--yes", "wrangler", *args]
        result = subprocess.run(command, capture_output=True, text=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if result.returncode:
            message = (result.stderr or result.stdout or "Wrangler ทำงานไม่สำเร็จ").strip()
            raise RuntimeError(message[-1200:])

    def load_or_create_project(self) -> str:
        if CONFIG_PATH.is_file():
            try:
                project = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))["project"]
                if project:
                    return project
            except (json.JSONDecodeError, KeyError):
                pass
        project = "og-link-" + secrets.token_hex(5)
        self.ui_status("กำลังเชื่อมต่อ Cloudflare ครั้งแรก…")
        # เปิดเบราว์เซอร์เพื่อให้เจ้าของบัญชียืนยันสิทธิ์ หากยังไม่ได้ login.
        self.run_wrangler("login")
        self.ui_status("กำลังสร้างพื้นที่สำหรับลิงก์…")
        self.run_wrangler("pages", "project", "create", project, "--production-branch", "main")
        APP_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps({"project": project}), encoding="utf-8")
        return project

    def publish(self, image: Path, target: str) -> None:
        try:
            npx = "npx.cmd" if os.name == "nt" else "npx"
            if shutil.which(npx) is None:
                raise RuntimeError("ไม่พบ Node.js — กรุณาติดตั้ง Node.js LTS ก่อน แล้วเปิดโปรแกรมใหม่")
            project = self.load_or_create_project()
            slug = secrets.token_urlsafe(7).replace("-", "a").replace("_", "b")
            folder = SITE_DIR / slug
            folder.mkdir(parents=True, exist_ok=True)
            image_name = "preview.jpg"
            self.make_og_image(image, folder / image_name)
            page_url = f"https://{project}.pages.dev/{slug}/"
            image_url = page_url + image_name
            page = self.make_page(target, page_url, image_url)
            (folder / "index.html").write_text(page, encoding="utf-8")
            self.ui_status("กำลังเผยแพร่ลิงก์…")
            self.run_wrangler(
                "pages", "deploy", str(SITE_DIR), "--project-name", project,
                "--commit-dirty=true", "--commit-message", "Add share link",
            )
            self.after(0, self.publish_success, page_url)
        except Exception as error:
            self.after(0, self.publish_error, str(error))

    @staticmethod
    def make_og_image(source: Path, output: Path) -> None:
        """สร้าง OG image 1200x630 โดยไม่ตัดส่วนสำคัญของรูปต้นฉบับ."""
        size = (1200, 630)
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGBA")
            background = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
            background = background.filter(ImageFilter.GaussianBlur(radius=30))
            dimmed = Image.new("RGBA", size, (0, 0, 0, 105))
            canvas = Image.alpha_composite(background, dimmed)

            foreground = image.copy()
            foreground.thumbnail(size, Image.Resampling.LANCZOS)
            x = (size[0] - foreground.width) // 2
            y = (size[1] - foreground.height) // 2
            canvas.alpha_composite(foreground, (x, y))
            canvas.convert("RGB").save(output, "JPEG", quality=92, optimize=True)

    @staticmethod
    def make_page(target: str, page_url: str, image_url: str) -> str:
        title = "น้ำมันจะขึ้นราคา"
        description = "กดเพื่อดูสินค้าบน Shopee"
        safe = {key: html.escape(value, quote=True) for key, value in {
            "target": target, "page_url": page_url, "image_url": image_url,
            "title": title, "description": description,
        }.items()}
        return """<!doctype html><html lang=\"th\"><head><meta charset=\"utf-8\">
<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>{title}</title>
<meta property=\"og:type\" content=\"website\"><meta property=\"og:title\" content=\"{title}\">
<meta property=\"og:description\" content=\"{description}\"><meta property=\"og:url\" content=\"{page_url}\">
<meta property=\"og:image\" content=\"{image_url}\"><meta property=\"og:image:alt\" content=\"{title}\">
<meta property=\"og:image:type\" content=\"image/jpeg\"><meta property=\"og:image:width\" content=\"1200\"><meta property=\"og:image:height\" content=\"630\">
<meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:image\" content=\"{image_url}\">
<script>window.location.replace(\"{target}\")</script></head><body><a href=\"{target}\">เปิดลิงก์</a></body></html>""".format(**safe)

    def ui_status(self, text: str) -> None:
        self.after(0, self.status.set, text)

    def publish_success(self, link: str) -> None:
        self.result_url.set(link)
        self.status.set("เสร็จแล้ว — คัดลอกลิงก์ไปแชร์ได้เลย")
        self.copy_button.configure(state="normal")
        self.start_button.configure(state="normal")

    def publish_error(self, detail: str) -> None:
        self.status.set("สร้างลิงก์ไม่สำเร็จ")
        self.start_button.configure(state="normal")
        messagebox.showerror("สร้างลิงก์ไม่สำเร็จ", detail)


if __name__ == "__main__":
    OgPreviewApp().mainloop()
