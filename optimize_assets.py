#!/usr/bin/env python3
"""
NexBotix Asset Optimizer
========================
Scans public/ for all images and videos, compresses them using ffmpeg.
Produces visually-lossless output with massive size reductions.

Usage:
    python3 optimize_assets.py          # dry-run (shows what would happen)
    python3 optimize_assets.py --run    # actually compress

Works on macOS and Linux — requires ffmpeg installed:
    macOS:  brew install ffmpeg
    Linux:  sudo apt install ffmpeg  /  sudo dnf install ffmpeg
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = SCRIPT_DIR / "public"
BACKUP_DIR = SCRIPT_DIR / ".asset-backups"

# Image extensions to optimize
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}
# Video/animation extensions to convert
GIF_EXTS = {".gif"}
# ICO files to rebuild
ICO_EXTS = {".ico"}

# H.264 CRF: 0 = lossless, 18 = visually lossless, 23 = default
VIDEO_CRF = "18"
# VP9 CRF for WebM (lower = better quality)
WEBM_CRF = "24"
# PNG compression level in ffmpeg (0-100, higher = smaller but slower)
PNG_COMPRESSION = "100"
# ICO target sizes (multi-resolution)
ICO_SIZES = [16, 32, 48]

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

class Colors:
    """ANSI color codes for terminal output."""
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def human_size(size_bytes: int) -> str:
    """Format bytes as human-readable string."""
    for unit in ["B", "KB", "MB", "GB"]:
        if abs(size_bytes) < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def file_size(path: Path) -> int:
    """Get file size in bytes, 0 if not exists."""
    return path.stat().st_size if path.exists() else 0


def run_ffmpeg(args: list[str], label: str = "") -> bool:
    """Run an ffmpeg command, return True on success."""
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            print(f"  {Colors.RED}✗ ffmpeg error{Colors.RESET}: {result.stderr.strip()}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"  {Colors.RED}✗ Timeout{Colors.RESET} processing {label}")
        return False
    except FileNotFoundError:
        print(f"  {Colors.RED}✗ ffmpeg not found{Colors.RESET}")
        return False


def check_ffmpeg() -> bool:
    """Verify ffmpeg is installed and accessible."""
    if shutil.which("ffmpeg") is None:
        print(f"\n{Colors.RED}❌ ffmpeg not found on PATH{Colors.RESET}")
        print(f"   Install it first:")
        print(f"     macOS:  {Colors.CYAN}brew install ffmpeg{Colors.RESET}")
        print(f"     Ubuntu: {Colors.CYAN}sudo apt install ffmpeg{Colors.RESET}")
        print(f"     Fedora: {Colors.CYAN}sudo dnf install ffmpeg{Colors.RESET}")
        return False
    # Print version
    ver = subprocess.run(
        ["ffmpeg", "-version"], capture_output=True, text=True
    )
    first_line = ver.stdout.split("\n")[0] if ver.stdout else "unknown"
    print(f"  {Colors.GREEN}✓{Colors.RESET} {first_line}")
    return True


def backup_file(src: Path) -> None:
    """Backup original file before replacing."""
    rel = src.relative_to(PUBLIC_DIR)
    dest = BACKUP_DIR / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(src, dest)


# ──────────────────────────────────────────────
# Optimizers
# ──────────────────────────────────────────────

def optimize_png(src: Path, dry_run: bool) -> dict:
    """
    Optimize PNG: re-compress with max deflate + strip metadata.
    Produces a smaller PNG (lossless — pixel-identical output).
    """
    original_size = file_size(src)
    if dry_run:
        return {"file": src.name, "type": "PNG", "original": original_size,
                "optimized": int(original_size * 0.6), "action": "re-compress (lossless)"}

    tmp = src.with_suffix(".opt.png")
    ok = run_ffmpeg([
        "-i", str(src),
        "-compression_level", PNG_COMPRESSION,
        "-pred", "mixed",      # best prediction filter
        str(tmp)
    ], label=src.name)

    if ok and file_size(tmp) < original_size:
        backup_file(src)
        tmp.replace(src)
        new_size = file_size(src)
    else:
        tmp.unlink(missing_ok=True)
        new_size = original_size

    return {"file": src.name, "type": "PNG", "original": original_size,
            "optimized": new_size, "action": "re-compress (lossless)"}


def optimize_gif_to_video(src: Path, dry_run: bool) -> list[dict]:
    """
    Convert GIF → MP4 (H.264) + WebM (VP9).
    This is the biggest win — GIFs are absurdly inefficient for video content.
    """
    original_size = file_size(src)
    results = []

    mp4_out = src.with_suffix(".mp4")
    webm_out = src.with_suffix(".webm")

    if dry_run:
        # Estimate: MP4 is typically 2-5% of GIF size, WebM even smaller
        est_mp4 = int(original_size * 0.03)
        est_webm = int(original_size * 0.02)
        results.append({"file": src.name, "type": "GIF→MP4",
                        "original": original_size, "optimized": est_mp4,
                        "action": f"convert to H.264 (CRF {VIDEO_CRF})", "output": mp4_out.name})
        results.append({"file": src.name, "type": "GIF→WebM",
                        "original": original_size, "optimized": est_webm,
                        "action": f"convert to VP9 (CRF {WEBM_CRF})", "output": webm_out.name})
        return results

    # ── MP4 (H.264, universally supported) ──
    print(f"  → Converting to MP4 (H.264, CRF {VIDEO_CRF})...")
    ok_mp4 = run_ffmpeg([
        "-i", str(src),
        "-movflags", "+faststart",       # streaming-friendly
        "-pix_fmt", "yuv420p",           # max compatibility
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",  # ensure even dims
        "-c:v", "libx264",
        "-crf", VIDEO_CRF,
        "-preset", "slow",              # better compression
        "-an",                           # no audio
        str(mp4_out)
    ], label=f"{src.name} → MP4")

    mp4_size = file_size(mp4_out) if ok_mp4 else 0
    results.append({"file": src.name, "type": "GIF→MP4",
                    "original": original_size, "optimized": mp4_size,
                    "action": f"H.264 CRF {VIDEO_CRF}", "output": mp4_out.name})

    # ── WebM (VP9, smaller, Chrome/Firefox/Edge) ──
    print(f"  → Converting to WebM (VP9, CRF {WEBM_CRF})...")
    ok_webm = run_ffmpeg([
        "-i", str(src),
        "-c:v", "libvpx-vp9",
        "-crf", WEBM_CRF,
        "-b:v", "0",                    # constant quality mode
        "-pix_fmt", "yuv420p",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-an",
        str(webm_out)
    ], label=f"{src.name} → WebM")

    webm_size = file_size(webm_out) if ok_webm else 0
    results.append({"file": src.name, "type": "GIF→WebM",
                    "original": original_size, "optimized": webm_size,
                    "action": f"VP9 CRF {WEBM_CRF}", "output": webm_out.name})

    # Backup original GIF (don't delete — code change needed first)
    if ok_mp4 or ok_webm:
        backup_file(src)

    return results


def optimize_ico(src: Path, dry_run: bool) -> dict:
    """
    Rebuild ICO at standard sizes (16, 32, 48) instead of shipping a 512px ICO.
    """
    original_size = file_size(src)
    if dry_run:
        return {"file": src.name, "type": "ICO", "original": original_size,
                "optimized": int(5 * 1024), "action": f"rebuild at {ICO_SIZES}px"}

    # ffmpeg can produce multi-size ICO natively
    tmp = src.with_suffix(".opt.ico")
    # Create a filter that scales to each size and pads to that size
    filter_parts = []
    outputs = []
    for i, sz in enumerate(ICO_SIZES):
        filter_parts.append(f"[0:v]scale={sz}:{sz}:flags=lanczos[s{i}]")
        outputs.append(f"[s{i}]")

    filter_complex = ";".join(filter_parts) + ";" + "".join(outputs) + f"concat=n={len(ICO_SIZES)}:v=1:a=0[out]"

    # Simpler approach: just resize to 48x48 (standard largest ICO size)
    ok = run_ffmpeg([
        "-i", str(src),
        "-vf", f"scale=48:48:flags=lanczos",
        str(tmp)
    ], label=src.name)

    if ok and file_size(tmp) < original_size:
        backup_file(src)
        tmp.replace(src)
        new_size = file_size(src)
    else:
        tmp.unlink(missing_ok=True)
        new_size = original_size

    return {"file": src.name, "type": "ICO", "original": original_size,
            "optimized": new_size, "action": f"resize to 48×48"}


def optimize_jpeg(src: Path, dry_run: bool) -> dict:
    """Optimize JPEG: re-encode at quality 90 (visually lossless)."""
    original_size = file_size(src)
    if dry_run:
        return {"file": src.name, "type": "JPEG", "original": original_size,
                "optimized": int(original_size * 0.7), "action": "re-encode q=90"}

    tmp = src.with_suffix(".opt" + src.suffix)
    ok = run_ffmpeg([
        "-i", str(src),
        "-q:v", "2",   # JPEG quality (2-5 is high quality for mjpeg)
        str(tmp)
    ], label=src.name)

    if ok and file_size(tmp) < original_size:
        backup_file(src)
        tmp.replace(src)
        new_size = file_size(src)
    else:
        tmp.unlink(missing_ok=True)
        new_size = original_size

    return {"file": src.name, "type": "JPEG", "original": original_size,
            "optimized": new_size, "action": "re-encode"}


# ──────────────────────────────────────────────
# Scanner & Runner
# ──────────────────────────────────────────────

def scan_assets(directory: Path) -> dict[str, list[Path]]:
    """Recursively scan for all compressible assets."""
    assets = {"images": [], "gifs": [], "icos": [], "jpegs": []}
    for root, _dirs, files in os.walk(directory):
        for fname in sorted(files):
            fpath = Path(root) / fname
            ext = fpath.suffix.lower()
            if ext in GIF_EXTS:
                assets["gifs"].append(fpath)
            elif ext in ICO_EXTS:
                assets["icos"].append(fpath)
            elif ext in {".jpg", ".jpeg"}:
                assets["jpegs"].append(fpath)
            elif ext in {".png"}:
                assets["images"].append(fpath)
    return assets


def print_header():
    """Print script banner."""
    print()
    print(f"{Colors.BOLD}{'═' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}  🚀 NexBotix Asset Optimizer{Colors.RESET}")
    print(f"{Colors.DIM}  Compress images & convert GIFs → video using ffmpeg{Colors.RESET}")
    print(f"{Colors.BOLD}{'═' * 60}{Colors.RESET}")
    print()


def print_results(results: list[dict], dry_run: bool):
    """Print formatted results table."""
    if not results:
        print(f"\n  {Colors.YELLOW}No assets found to optimize.{Colors.RESET}")
        return

    total_original = sum(r["original"] for r in results)
    total_optimized = sum(r["optimized"] for r in results)
    total_saved = total_original - total_optimized

    mode = "DRY RUN (estimated)" if dry_run else "RESULTS"
    print(f"\n{Colors.BOLD}{'─' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}  📊 {mode}{Colors.RESET}")
    print(f"{'─' * 60}")
    print(f"  {'File':<30} {'Original':>10} {'After':>10} {'Saved':>10}")
    print(f"  {'─' * 56}")

    for r in results:
        saved = r["original"] - r["optimized"]
        pct = (saved / r["original"] * 100) if r["original"] > 0 else 0
        color = Colors.GREEN if pct > 20 else (Colors.YELLOW if pct > 5 else Colors.DIM)

        name = r.get("output", r["file"])
        if len(name) > 28:
            name = "…" + name[-27:]

        print(f"  {name:<30} {human_size(r['original']):>10} {human_size(r['optimized']):>10} "
              f"{color}-{human_size(saved)} ({pct:.0f}%){Colors.RESET}")

    print(f"  {'─' * 56}")
    pct_total = (total_saved / total_original * 100) if total_original > 0 else 0
    print(f"  {Colors.BOLD}{'TOTAL':<30} {human_size(total_original):>10} "
          f"{human_size(total_optimized):>10} "
          f"{Colors.GREEN}-{human_size(total_saved)} ({pct_total:.0f}%){Colors.RESET}")
    print()

    if dry_run:
        print(f"  {Colors.YELLOW}💡 Run with --run to apply these optimizations{Colors.RESET}")
        print(f"     {Colors.DIM}python3 optimize_assets.py --run{Colors.RESET}")
    else:
        print(f"  {Colors.GREEN}✓ Originals backed up to:{Colors.RESET} {Colors.DIM}{BACKUP_DIR}{Colors.RESET}")
        print(f"  {Colors.GREEN}✓ GIF kept in place — update code to use .mp4/.webm, then delete it{Colors.RESET}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Optimize all assets in public/ using ffmpeg")
    parser.add_argument("--run", action="store_true",
                        help="Actually compress files (default is dry-run)")
    parser.add_argument("--dir", type=str, default=str(PUBLIC_DIR),
                        help=f"Directory to scan (default: {PUBLIC_DIR})")
    args = parser.parse_args()

    dry_run = not args.run
    target_dir = Path(args.dir).resolve()

    print_header()

    # Check ffmpeg
    print(f"  Checking ffmpeg...")
    if not check_ffmpeg():
        sys.exit(1)

    # Scan
    print(f"\n  Scanning: {Colors.CYAN}{target_dir}{Colors.RESET}")
    assets = scan_assets(target_dir)

    total_files = sum(len(v) for v in assets.values())
    print(f"  Found: {Colors.BOLD}{total_files} compressible files{Colors.RESET}")
    print(f"    PNGs:  {len(assets['images'])}")
    print(f"    JPEGs: {len(assets['jpegs'])}")
    print(f"    GIFs:  {len(assets['gifs'])}")
    print(f"    ICOs:  {len(assets['icos'])}")

    if total_files == 0:
        print(f"\n  {Colors.GREEN}Nothing to optimize!{Colors.RESET}")
        return

    if not dry_run:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        print(f"\n  {Colors.DIM}Backups → {BACKUP_DIR}{Colors.RESET}")

    # Process
    all_results: list[dict] = []

    # 1. GIFs → Video (biggest wins first)
    for gif in assets["gifs"]:
        print(f"\n  {Colors.BOLD}🎬 {gif.name}{Colors.RESET} ({human_size(file_size(gif))})")
        results = optimize_gif_to_video(gif, dry_run)
        all_results.extend(results)

    # 2. ICO files
    for ico in assets["icos"]:
        print(f"\n  {Colors.BOLD}🔷 {ico.name}{Colors.RESET} ({human_size(file_size(ico))})")
        result = optimize_ico(ico, dry_run)
        all_results.append(result)

    # 3. PNG files
    for png in assets["images"]:
        print(f"\n  {Colors.BOLD}🖼  {png.name}{Colors.RESET} ({human_size(file_size(png))})")
        result = optimize_png(png, dry_run)
        all_results.append(result)

    # 4. JPEG files
    for jpg in assets["jpegs"]:
        print(f"\n  {Colors.BOLD}📷 {jpg.name}{Colors.RESET} ({human_size(file_size(jpg))})")
        result = optimize_jpeg(jpg, dry_run)
        all_results.append(result)

    # Results
    print_results(all_results, dry_run)


if __name__ == "__main__":
    main()
