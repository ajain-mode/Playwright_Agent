#!/usr/bin/env python3
"""
Build a ~2.5–3 min walkthrough video of the Playwright AI Agent journey.
Scenes + Edge TTS voiceover + FFmpeg assembly.
"""

from __future__ import annotations

import asyncio
import json
import os
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SCENES = OUT / "scenes"
AUDIO = OUT / "audio"
ASSETS = OUT / "assets"

W, H = 1920, 1080

# Brand palette (dark product demo — not purple/cream clichés)
BG = (12, 18, 28)
PANEL = (22, 32, 48)
ACCENT = (56, 189, 248)  # cyan
ACCENT2 = (52, 211, 153)  # emerald
TEXT = (236, 242, 255)
MUTED = (148, 163, 184)
CODE_BG = (15, 23, 42)
WARN = (251, 191, 36)

VOICE = "en-US-JennyNeural"

# Narration (~390 words ≈ 2:40–2:55 at natural TTS pace)
SCENES_META = [
    {
        "id": "01_title",
        "title": "Title",
        "narration": (
            "Welcome to the Playwright AI Agent — an end-to-end system that turns "
            "manual QA test cases into executable Playwright automation for MODE Global's "
            "SunTeck TMS. In the next few minutes, we'll walk the full journey: the written "
            "test case, how the agent was built, how it generates code, and how that code "
            "runs in Chrome."
        ),
    },
    {
        "id": "02_testcase",
        "title": "The Test Case",
        "narration": (
            "We start with the smallest clean billing-toggle case: B T one one six nine oh nine. "
            "The manual steps are simple — log into B T M S, switch to the billing toggle user, "
            "open Finance Billing Queue, apply Last Week on Initial Toggle Date, search, "
            "and assert that rows and key columns are populated. That prose lives in the "
            "sample test cases catalog and drives generation."
        ),
    },
    {
        "id": "03_architecture",
        "title": "How the Agent Was Built",
        "narration": (
            "The agent is a four-stage pipeline. Agent one, the Step Processor, "
            "classifies each step and tracks page context — current page, edit versus view mode, "
            "and active tab. Agent two, the P O M Method Matcher, maps steps to existing page "
            "objects, or proposes new methods using locators mined from the live application source. "
            "Agent three, the Spec Validator, enforces guardrails and auto-fixes issues like "
            "missing navigate to base URL before header navigation. Agent four, the Spec Feedback Loop, "
            "cross-checks the generated spec against the original C S V steps, injects any missing "
            "steps, and flags low-confidence matches for review."
        ),
    },
    {
        "id": "04_generation",
        "title": "Code Generation",
        "narration": (
            "When you run npm run agent generate, the agent parses the case, pulls category "
            "test data from C S V, scores step mappings, and emits a typed Playwright spec "
            "under tests A I Agent. For billing toggle cases it always injects the required "
            "user switch. Assertions use global constants — never hardcoded strings — so "
            "specs stay maintainable and consistent with the framework."
        ),
    },
    {
        "id": "05_spec",
        "title": "Generated Spec",
        "narration": (
            "Here is the generated B T one one six nine oh nine spec. Five nested test steps "
            "mirror the written case: login and user switch, open Billing Queue, set the date "
            "preset, search, then hard-assert row count and column values for Initial Toggle Date, "
            "Agent or Current Toggle Date, and Waiting on Billing Count — all through page object methods."
        ),
    },
    {
        "id": "06_execution",
        "title": "Chrome Execution",
        "narration": (
            "Now watch the generated test execute live in Chrome. Playwright opens a shared "
            "browser context, logs into B T M S staging, switches to the billing toggle user, "
            "opens Finance Billing Queue, applies Last Week, searches, and asserts the columns. "
            "This is the real U I — the same Chrome session a tester would drive, fully automated."
        ),
    },
    {
        "id": "07_close",
        "title": "Closing",
        "narration": (
            "From written test case, through a four-agent pipeline, to generated Playwright "
            "and live Chrome execution — that is the Playwright AI Agent journey. Manual intent "
            "becomes reliable automation, faster, and aligned with your page objects and guardrails. "
            "Thank you for watching."
        ),
    },
]


def find_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    windir = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
    if bold:
        candidates += [
            windir / "segoeuib.ttf",
            windir / "arialbd.ttf",
            windir / "calibrib.ttf",
        ]
    candidates += [
        windir / "segoeui.ttf",
        windir / "arial.ttf",
        windir / "calibri.ttf",
        windir / "consola.ttf",
    ]
    for p in candidates:
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def find_mono(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    windir = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
    for name in ("consola.ttf", "cascadiamono.ttf", "cour.ttf"):
        p = windir / name
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return find_font(size)


def rounded_rect(draw: ImageDraw.ImageDraw, box, fill, radius=18):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_header(draw: ImageDraw.ImageDraw, step: str, label: str):
    title_f = find_font(28, bold=True)
    label_f = find_font(22)
    draw.text((80, 48), "PLAYWRIGHT AI AGENT", font=title_f, fill=ACCENT)
    draw.text((80, 92), f"{step}  ·  {label}", font=label_f, fill=MUTED)
    draw.line((80, 130, W - 80, 130), fill=(40, 55, 75), width=2)


def wrap_text(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width)


def base_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    # subtle left accent bar
    draw.rectangle((0, 0, 8, H), fill=ACCENT)
    return img, draw


def scene_title() -> Image.Image:
    img, draw = base_canvas()
    f_hero = find_font(72, bold=True)
    f_sub = find_font(32)
    f_small = find_font(24)
    draw.text((80, 320), "Playwright AI Agent", font=f_hero, fill=TEXT)
    draw.text(
        (80, 420),
        "From manual test case → generated automation → Chrome execution",
        font=f_sub,
        fill=MUTED,
    )
    rounded_rect(draw, (80, 520, 520, 590), PANEL, 14)
    draw.text((110, 540), "Demo case: BT-116909  ·  ~3 min", font=f_small, fill=ACCENT2)
    draw.text((80, 980), "MODE Global  ·  SunTeck TMS  ·  QA AI Framework", font=f_small, fill=MUTED)
    return img


def scene_testcase() -> Image.Image:
    img, draw = base_canvas()
    draw_header(draw, "01", "How the test case looks")
    f_h = find_font(40, bold=True)
    f_b = find_font(26)
    f_mono = find_mono(22)

    draw.text((80, 160), "BT-116909 — Validate Billing Queue columns", font=f_h, fill=TEXT)

    steps = [
        "1. Login BTMS → switch to BILLINGTOGGLE_USER",
        "2. Finance → Billing Queue",
        "3. Initial Toggle Date filter → Preset: Last Week",
        "4. Click Search",
        "5. Expect: rows > 0 and columns populated",
        "    · Initial Toggle Date",
        "    · Agent / Current Toggle Date",
        "    · Waiting on Billing Count",
    ]
    y = 240
    rounded_rect(draw, (80, 220, 1180, 720), PANEL, 16)
    for s in steps:
        draw.text((110, y), s, font=f_b, fill=TEXT)
        y += 52

    rounded_rect(draw, (1240, 220, 1840, 720), CODE_BG, 16)
    draw.text((1270, 250), "Source of truth", font=find_font(24, True), fill=ACCENT)
    for i, line in enumerate(
        [
            "sample-testcases.csv",
            "Case ID | Test Steps | Expected",
            "",
            "Category CSV supplies",
            "runtime testData only",
            "",
            "Tag: @billingtoggle",
            "POM: BillingQueuePage",
        ]
    ):
        draw.text((1270, 310 + i * 40), line, font=f_mono, fill=MUTED if i else ACCENT2)
    return img


def scene_architecture() -> Image.Image:
    img, draw = base_canvas()
    draw_header(draw, "02", "How the agent was built")
    f_h = find_font(34, bold=True)
    f_b = find_font(20)
    f_s = find_font(18)

    draw.text((80, 155), "4-Agent Pipeline", font=f_h, fill=TEXT)

    boxes = [
        ("Agent 1", "StepProcessor", "Classify steps\nPageContext\nEdit vs View"),
        ("Agent 2", "POMMethodMatcher", "Map to POM\nAppSource IDs\nPropose APIs"),
        ("Agent 3", "SpecValidator", "Guardrails\nSAN / NAV-001\nCAT-BT-001"),
        ("Agent 4", "SpecFeedbackLoop", "CSV cross-check\nInject missing\nFlag low match"),
    ]
    x = 60
    box_w = 420
    gap = 28
    for i, (a, name, body) in enumerate(boxes):
        rounded_rect(draw, (x, 230, x + box_w, 580), PANEL, 16)
        draw.text((x + 22, 255), a, font=find_font(20, True), fill=ACCENT)
        draw.text((x + 22, 300), name, font=find_font(24, True), fill=TEXT)
        yy = 360
        for line in body.split("\n"):
            draw.text((x + 22, yy), "•  " + line, font=f_b, fill=MUTED)
            yy += 36
        if i < 3:
            ax = x + box_w + 4
            draw.polygon([(ax, 390), (ax + 18, 405), (ax, 420)], fill=ACCENT2)
        x += box_w + gap

    draw.text(
        (80, 620),
        "Supporting: AppSourceIndexer  ·  FieldRegistry  ·  StepMappings  ·  CsvDataService",
        font=f_s,
        fill=MUTED,
    )
    rounded_rect(draw, (80, 680, 1840, 980), CODE_BG, 16)
    flow_lines = [
        "CSV / JSON  →  TestCaseParser  →  Agent1 StepProcessor  →  Agent2 POMMethodMatcher",
        "→  Agent3 SpecValidator  →  Agent4 SpecFeedbackLoop  →  *.spec.ts  (re-validate if injected)",
    ]
    draw.text((110, 760), flow_lines[0], font=find_font(22), fill=ACCENT2)
    draw.text((110, 820), flow_lines[1], font=find_font(22), fill=ACCENT2)
    draw.text(
        (110, 900),
        "Agent 4 ensures every original CSV step is present — then SpecValidator runs again.",
        font=f_s,
        fill=MUTED,
    )
    return img


def scene_generation() -> Image.Image:
    img, draw = base_canvas()
    draw_header(draw, "03", "How Playwright code is generated")
    f_h = find_font(34, bold=True)
    f_b = find_font(24)
    f_mono = find_mono(22)

    draw.text((80, 160), "npm run agent:generate  →  typed Playwright spec", font=f_h, fill=TEXT)

    left = [
        ("Parse", "Category + fields from steps / CSV"),
        ("Map", "Best-match StepMappings scoring"),
        ("Locate", "Exact #ids from mono / dme source"),
        ("Assemble", "PageManager + nested test.step"),
        ("Validate", "SAN / NAV / CAT auto-fixes"),
    ]
    rounded_rect(draw, (80, 230, 900, 900), PANEL, 16)
    y = 270
    for title, desc in left:
        draw.ellipse((120, y + 8, 148, y + 36), fill=ACCENT)
        draw.text((180, y), title, font=find_font(28, True), fill=TEXT)
        draw.text((180, y + 42), desc, font=f_b, fill=MUTED)
        y += 110

    rounded_rect(draw, (960, 230, 1840, 900), CODE_BG, 16)
    draw.text((1000, 260), "Generated patterns", font=find_font(26, True), fill=ACCENT)
    code_lines = [
        "await pages.btmsLoginPage.BTMSLogin(...);",
        "await pages.homePage.clickSwitchAccountButton();",
        "await pages.agentAccountsPage",
        "  .clickOnUserNameIfVisible(",
        "    USER_ROLES.BILLINGTOGGLE_USER);",
        "",
        "await pages.basePage.hoverOverHeaderByText(",
        "  HEADERS.FINANCE);",
        "await pages.billingQueuePage",
        "  .selectDateFilterPreset(...);",
        "",
        "expect(rowCount).toBeGreaterThan(0);",
    ]
    y = 320
    for line in code_lines:
        color = ACCENT2 if line.startswith("await") or line.startswith("expect") else MUTED
        if "USER_ROLES" in line or "HEADERS" in line:
            color = WARN
        draw.text((1000, y), line, font=f_mono, fill=color)
        y += 36
    return img


def scene_spec() -> Image.Image:
    img, draw = base_canvas()
    draw_header(draw, "04", "Generated spec — BT-116909")
    f_mono = find_mono(20)
    rounded_rect(draw, (80, 160, 1840, 980), CODE_BG, 16)
    draw.text((110, 190), "src/tests/AIAgent/billingtoggle/BT-116909.spec.ts", font=find_font(24, True), fill=ACCENT)

    # Pull a readable excerpt from the real file
    spec_path = ROOT / "src/tests/AIAgent/billingtoggle/BT-116909.spec.ts"
    lines = spec_path.read_text(encoding="utf-8").splitlines()
    # Show the meaningful middle of the test
    excerpt = lines[33:91]
    y = 240
    for i, line in enumerate(excerpt[:28]):
        display = line[:95]
        color = MUTED
        if "test.step" in line:
            color = ACCENT
        elif "await " in line:
            color = ACCENT2
        elif "expect" in line:
            color = WARN
        elif line.strip().startswith("//") or line.strip().startswith("*"):
            color = (100, 116, 139)
        draw.text((110, y), f"{34 + i:3d}  {display}", font=f_mono, fill=color)
        y += 26
    return img


def scene_execution() -> Image.Image:
    img, draw = base_canvas()
    draw_header(draw, "05", "Execution in Chrome")
    f_h = find_font(30, bold=True)
    f_b = find_font(24)

    draw.text((80, 160), "npx playwright test BT-116909.spec.ts  ·  channel: chrome", font=f_h, fill=TEXT)

    # Compose real BTMS screenshot into the frame
    shot_candidates = [
        ROOT / "commands/reports/execution/27450/test-failed-1.png",
        ROOT / "commands/reports/execution/171324/test-failed-2.png",
    ]
    shot = None
    for c in shot_candidates:
        if c.exists():
            shot = Image.open(c).convert("RGB")
            break

    rounded_rect(draw, (80, 220, 1280, 980), (30, 41, 59), 16)
    if shot:
        # Fit into browser chrome mock
        max_w, max_h = 1160, 680
        shot.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
        # browser top bar
        draw.rounded_rectangle((100, 250, 1260, 310), radius=10, fill=(15, 23, 42))
        for i, col in enumerate([(239, 68, 68), (234, 179, 8), (34, 197, 94)]):
            draw.ellipse((120 + i * 28, 270, 136 + i * 28, 286), fill=col)
        draw.text((220, 268), "BTMS Staging  ·  Chrome", font=find_font(20), fill=MUTED)
        ox = 100 + (1160 - shot.width) // 2
        oy = 330
        img.paste(shot, (ox, oy))
    else:
        draw.text((120, 500), "Chrome session running BTMS automation", font=f_b, fill=MUTED)

    # Right rail checklist
    rounded_rect(draw, (1340, 220, 1840, 980), PANEL, 16)
    draw.text((1380, 260), "Runtime", font=find_font(26, True), fill=ACCENT)
    items = [
        "Shared BrowserContext",
        "BTMSLogin + user switch",
        "Finance → Billing Queue",
        "Date preset Last Week",
        "Search + column asserts",
        "Trace + screenshots on",
        "Allure / Testmo reports",
    ]
    y = 330
    for it in items:
        draw.ellipse((1380, y + 8, 1404, y + 32), fill=ACCENT2)
        draw.text((1420, y), it, font=f_b, fill=TEXT)
        y += 70
    return img


def scene_close() -> Image.Image:
    img, draw = base_canvas()
    f_hero = find_font(56, bold=True)
    f_b = find_font(28)
    f_s = find_font(24)
    draw.text((80, 280), "Manual intent → Reliable automation", font=f_hero, fill=TEXT)

    pills = [
        ("Test case", "BT-116909"),
        ("Pipeline", "4 Agents"),
        ("Output", "Playwright spec"),
        ("Runtime", "Chrome"),
    ]
    x = 80
    for title, val in pills:
        rounded_rect(draw, (x, 420, x + 400, 560), PANEL, 16)
        draw.text((x + 30, 450), title, font=f_s, fill=MUTED)
        draw.text((x + 30, 500), val, font=find_font(32, True), fill=ACCENT2)
        x += 440

    draw.text(
        (80, 700),
        "Playwright AI Agent  ·  MODE Global QA",
        font=f_b,
        fill=ACCENT,
    )
    draw.text((80, 760), "Thank you for watching.", font=f_b, fill=MUTED)
    return img


SCENE_BUILDERS = {
    "01_title": scene_title,
    "02_testcase": scene_testcase,
    "03_architecture": scene_architecture,
    "04_generation": scene_generation,
    "05_spec": scene_spec,
    "06_execution": scene_execution,
    "07_close": scene_close,
}


def render_scenes():
    SCENES.mkdir(parents=True, exist_ok=True)
    paths = []
    for meta in SCENES_META:
        img = SCENE_BUILDERS[meta["id"]]()
        path = SCENES / f"{meta['id']}.png"
        img.save(path, "PNG")
        paths.append(path)
        print(f"  scene: {path.name}")
    return paths


async def synthesize_audio():
    import edge_tts

    AUDIO.mkdir(parents=True, exist_ok=True)
    audio_paths = []
    for meta in SCENES_META:
        out = AUDIO / f"{meta['id']}.mp3"
        communicate = edge_tts.Communicate(meta["narration"], VOICE, rate="-5%")
        await communicate.save(str(out))
        audio_paths.append(out)
        print(f"  audio: {out.name}")
    return audio_paths


def ffprobe_duration(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        str(path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(json.loads(r.stdout)["format"]["duration"])


def find_chrome_recording() -> Path | None:
    """Latest Playwright recordVideo .webm under chrome-recording/."""
    rec_dir = OUT / "chrome-recording"
    if not rec_dir.exists():
        return None
    videos = sorted(rec_dir.rglob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
    return videos[0] if videos else None


def assemble_chrome_clip(chrome_webm: Path, audio: Path, slide: Path, out_clip: Path) -> float:
    """
    Overlay narration on a sped-up Chrome recording framed with the slide chrome chrome UI.
    Target length ≈ narration + pad; speed up the browser footage to fit.
    """
    narr_dur = ffprobe_duration(audio)
    pad = 0.6
    # Prefer narration length so the journey stays near 3 min; allow a bit more if short
    target = narr_dur + pad + 4.0  # ~4s extra so viewers see more UI motion
    chrome_dur = ffprobe_duration(chrome_webm)
    speed = max(chrome_dur / target, 1.0) if chrome_dur > target else 1.0
    setpts = f"PTS/{speed:.4f}"

    # Scale chrome into 1920x1080 with dark pad + small header banner from slide text area
    vf = (
        f"setpts={setpts},"
        "scale=1920:980:force_original_aspect_ratio=decrease,"
        "pad=1920:980:(ow-iw)/2:(oh-ih)/2:color=0x0c121c,"
        "pad=1920:1080:0:100:color=0x0c121c,"
        "drawbox=x=0:y=0:w=1920:h=100:color=0x162032:t=fill,"
        "drawtext=text='LIVE CHROME  ·  BT-116909 execution':"
        "fontcolor=0x38bdf8:fontsize=28:x=80:y=36"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(chrome_webm),
        "-i",
        str(audio),
        "-filter_complex",
        f"[0:v]{vf}[v]",
        "-map",
        "[v]",
        "-map",
        "1:a",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-t",
        f"{target:.3f}",
        "-r",
        "30",
        str(out_clip),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        # drawtext may fail without fontconfig on Windows — retry without drawtext
        vf2 = (
            f"setpts={setpts},"
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0c121c"
        )
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(chrome_webm),
            "-i",
            str(audio),
            "-filter_complex",
            f"[0:v]{vf2}[v]",
            "-map",
            "[v]",
            "-map",
            "1:a",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-t",
            f"{target:.3f}",
            "-r",
            "30",
            str(out_clip),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    print(f"  chrome clip: src={chrome_dur:.1f}s speed={speed:.2f}x -> {target:.1f}s")
    return target


def assemble(scene_paths: list[Path], audio_paths: list[Path]):
    """Create per-scene clips (image + audio), splice live Chrome into execution scene."""
    clips_dir = OUT / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    clip_list = []
    total = 0.0
    chrome = find_chrome_recording()

    for i, (scene, audio) in enumerate(zip(scene_paths, audio_paths)):
        meta_id = SCENES_META[i]["id"]
        clip = clips_dir / f"clip_{i:02d}.mp4"

        if meta_id == "06_execution" and chrome is not None:
            out_dur = assemble_chrome_clip(chrome, audio, scene, clip)
            total += out_dur
            clip_list.append(clip)
            print(f"  clip {i + 1}/{len(scene_paths)}: {out_dur:.1f}s (LIVE CHROME)")
            continue

        dur = ffprobe_duration(audio)
        pad = 0.45
        out_dur = dur + pad
        total += out_dur
        cmd = [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            str(scene),
            "-i",
            str(audio),
            "-c:v",
            "libx264",
            "-tune",
            "stillimage",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-pix_fmt",
            "yuv420p",
            "-shortest",
            "-t",
            f"{out_dur:.3f}",
            "-vf",
            "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
            "-r",
            "30",
            str(clip),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        clip_list.append(clip)
        print(f"  clip {i + 1}/{len(scene_paths)}: {out_dur:.1f}s")

    concat_file = OUT / "concat.txt"
    with concat_file.open("w", encoding="utf-8") as f:
        for c in clip_list:
            p = c.resolve().as_posix().replace("'", r"'\''")
            f.write(f"file '{p}'\n")

    final = OUT / "Playwright-AI-Agent-Journey.mp4"
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file),
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        str(final),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"\nFINAL: {final}")
    print(f"DURATION: ~{total:.1f}s ({total / 60:.2f} min)")
    if chrome:
        print(f"CHROME SOURCE: {chrome}")
    else:
        print("CHROME SOURCE: (none — used still slide for execution)")
    return final, total


def ensure_ffmpeg():
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        return
    # WinGet install path may not be on this shell's PATH yet
    winget_root = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/WinGet/Packages"
    bins = list(winget_root.glob("Gyan.FFmpeg*/ffmpeg-*/bin"))
    if bins:
        os.environ["PATH"] = str(bins[0]) + os.pathsep + os.environ.get("PATH", "")
    if not (shutil.which("ffmpeg") and shutil.which("ffprobe")):
        raise RuntimeError("ffmpeg/ffprobe not found on PATH")


async def main():
    ensure_ffmpeg()
    print("Rendering scenes...")
    scenes = render_scenes()
    print("Synthesizing voiceover (Edge TTS)...")
    audios = await synthesize_audio()
    print("Assembling video...")
    final, total = assemble(scenes, audios)
    # Write a short readme for the user
    readme = OUT / "README.md"
    readme.write_text(
        textwrap.dedent(
            f"""\
            # Playwright AI Agent — Journey Video

            **Output:** `{final.name}`  
            **Duration:** ~{total:.0f}s ({total/60:.2f} min)  
            **Voice:** {VOICE} (Microsoft Edge neural TTS)  
            **Demo case:** BT-116909 (smallest billing-toggle queue validation)

            1. Title — product overview  
            2. Test case — BT-116909 steps & expected  
            3. Architecture — **4-agent** pipeline (incl. SpecFeedbackLoop)  
            4. Generation — how specs are produced  
            5. Generated code — real BT-116909.spec.ts excerpt  
            6. Chrome execution — **live Playwright recording** (sped to fit)  
            7. Closing  

            ## Agents
            1. StepProcessor  
            2. POMMethodMatcher  
            3. SpecValidator  
            4. SpecFeedbackLoop (CSV cross-check / inject missing steps)  

            ## Rebuild
            ```bash
            python commands/demo-video/build_video.py
            ```
            Place a `.webm` from `recordVideo` under `commands/demo-video/chrome-recording/` to splice live Chrome into scene 6.
            """
        ),
        encoding="utf-8",
    )
    print(f"Wrote {readme}")


if __name__ == "__main__":
    asyncio.run(main())
