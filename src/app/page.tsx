"use client";

import React, { useMemo, useRef, useState } from "react";

type ExportMode = "post" | "square" | "reels";
type DragTarget = "guest" | null;

function toDataUrl(file: File, setter: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => setter(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function hasUnsafeColorFn(value?: string | null) {
  if (!value) return false;
  const v = value.toLowerCase();
  return (
    v.includes("lab(") ||
    v.includes("lch(") ||
    v.includes("oklab(") ||
    v.includes("oklch(") ||
    v.includes("color(")
  );
}

function sanitizeHtml2CanvasTree(root: HTMLElement, win?: Window | null) {
  const all = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];

  for (const el of all) {
    const inline = el.style;

    const inlineProps = [
      "color",
      "background",
      "backgroundColor",
      "backgroundImage",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "boxShadow",
      "textShadow",
      "caretColor",
      "fill",
      "stroke",
    ] as const;

    for (const prop of inlineProps) {
      const val = inline[prop];
      if (typeof val === "string" && hasUnsafeColorFn(val)) {
        switch (prop) {
          case "color":
          case "textDecorationColor":
          case "caretColor":
          case "fill":
          case "stroke":
            inline[prop] = "#ffffff";
            break;
          case "background":
          case "backgroundColor":
            inline[prop] = "transparent";
            break;
          case "backgroundImage":
            inline[prop] = "none";
            break;
          case "borderColor":
          case "borderTopColor":
          case "borderRightColor":
          case "borderBottomColor":
          case "borderLeftColor":
            inline[prop] = "rgba(255,255,255,0.12)";
            break;
          case "outlineColor":
            inline[prop] = "transparent";
            break;
          case "boxShadow":
          case "textShadow":
            inline[prop] = "none";
            break;
        }
      }
    }

    if (win) {
      const cs = win.getComputedStyle(el);

      if (hasUnsafeColorFn(cs.color)) el.style.color = "#ffffff";
      if (hasUnsafeColorFn(cs.backgroundColor)) el.style.backgroundColor = "transparent";
      if (hasUnsafeColorFn(cs.backgroundImage)) el.style.backgroundImage = "none";
      if (hasUnsafeColorFn(cs.borderColor)) el.style.borderColor = "rgba(255,255,255,0.12)";
      if (hasUnsafeColorFn(cs.outlineColor)) el.style.outlineColor = "transparent";
      if (hasUnsafeColorFn(cs.textDecorationColor)) el.style.textDecorationColor = "#ffffff";
      if (hasUnsafeColorFn(cs.boxShadow)) el.style.boxShadow = "none";
      if (hasUnsafeColorFn(cs.textShadow)) el.style.textShadow = "none";
      if (hasUnsafeColorFn(cs.caretColor)) el.style.caretColor = "#ffffff";
      if (hasUnsafeColorFn(cs.fill)) el.style.fill = "#ffffff";
      if (hasUnsafeColorFn(cs.stroke)) el.style.stroke = "#ffffff";
    }
  }
}

const exportSizes: Record<ExportMode, { label: string; width: number; height: number }> = {
  post: { label: "Post 1080×1350", width: 1080, height: 1350 },
  square: { label: "Square 1080×1080", width: 1080, height: 1080 },
  reels: { label: "Reels 1080×1920", width: 1080, height: 1920 },
};

function FileUploadBox({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#475569]">{label}</label>
      <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-4 py-3 transition hover:border-[#94a3b8] hover:bg-[#f8fafc]">
        <span className="text-sm font-medium text-[#0f172a]">Choose file</span>
        <span className="rounded-xl bg-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#334155]">
          Image
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
        />
      </label>
    </div>
  );
}

export default function Page() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    target: DragTarget;
    startX: number;
    startY: number;
    startGuestX: number;
    startGuestY: number;
  } | null>(null);

  const [exportMode, setExportMode] = useState<ExportMode>("post");
  const [headline, setHeadline] = useState("तपाईंको मुख्य समाचार शीर्षक यहाँ आउँछ");
  const [subheadline, setSubheadline] = useState("छोटो समाचार वा मुख्य विवरण यहाँ राख्न सकिन्छ।");
  const [category, setCategory] = useState("मुख्य समाचार");
  const [tag, setTag] = useState("नेपाल");
  const [footerText, setFooterText] = useState("प्रविधिसँगसँगै...");
  const [accent, setAccent] = useState("#ef1c23");
  const [darkTone, setDarkTone] = useState("#0d57a7");
  const [lightTone, setLightTone] = useState("#ffffff");
  const [bgImage, setBgImage] = useState("");
  const [guestImage, setGuestImage] = useState("");

  const logoImage = "/logo_ict_sam.png";

  const [bgScale, setBgScale] = useState(100);
  const [bgPosX, setBgPosX] = useState(50);
  const [bgPosY, setBgPosY] = useState(50);

  const [guestScale, setGuestScale] = useState(100);
  const [guestPosX, setGuestPosX] = useState(76);
  const [guestPosY, setGuestPosY] = useState(42);
  const [guestRoundness, setGuestRoundness] = useState(24);

  const [headlineSize, setHeadlineSize] = useState(58);
  const [subheadlineSize, setSubheadlineSize] = useState(24);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentSize = exportSizes[exportMode];
  const previewMaxWidth = exportMode === "reels" ? 420 : 520;
  const previewScale = previewMaxWidth / currentSize.width;
  const previewWidth = Math.round(currentSize.width * previewScale);
  const previewHeight = Math.round(currentSize.height * previewScale);

  const cardBackgroundStyle = useMemo(() => {
    if (bgImage) {
      return {
        backgroundImage: `linear-gradient(180deg, rgba(13,87,167,.10) 0%, rgba(8,20,40,.15) 35%, rgba(7,18,38,.78) 72%, rgba(7,18,38,.95) 100%), url(${bgImage})`,
        backgroundSize: `${bgScale}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0f172a",
      } as React.CSSProperties;
    }

    return {
      background: `linear-gradient(135deg, ${darkTone} 0%, #0b2f63 55%, ${accent} 100%)`,
      backgroundColor: "#0f172a",
    } as React.CSSProperties;
  }, [bgImage, bgScale, bgPosX, bgPosY, darkTone, accent]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const startGuestDrag = (clientX: number, clientY: number) => {
    dragStateRef.current = {
      target: "guest",
      startX: clientX,
      startY: clientY,
      startGuestX: guestPosX,
      startGuestY: guestPosY,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStateRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragStateRef.current.startY) / rect.height) * 100;

    if (dragStateRef.current.target === "guest") {
      setGuestPosX(clamp(dragStateRef.current.startGuestX + dx, 0, 100));
      setGuestPosY(clamp(dragStateRef.current.startGuestY + dy, 0, 100));
    }
  };

  const stopDrag = () => {
    dragStateRef.current = null;
  };

  // ── Pure Canvas 2D export — no html2canvas involved at all ───────────────
  // Draws every layer of the card programmatically so font metrics are always
  // exact. This is the only reliable way to get Devanagari text centred.

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const pill = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
  ) => {
    const r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Draws text perfectly centred inside a rect using actual ink bounds.
  // Works for any script including Devanagari.
  const drawCentredText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,   // centre x of target rect
    cy: number,   // centre y of target rect
  ) => {
    const m = ctx.measureText(text);
    const inkTop = m.actualBoundingBoxAscent;
    const inkBot = m.actualBoundingBoxDescent;
    const inkH = inkTop + inkBot;
    const x = cx - m.width / 2;
    const y = cy - inkH / 2 + inkTop;
    ctx.fillText(text, x, y);
  };

  const createExportCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const W = currentSize.width;
    const H = currentSize.height;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // ── 1. Background ────────────────────────────────────────────────────────
    if (bgImage) {
      try {
        const img = await loadImage(bgImage);
        // Replicate: backgroundSize: `${bgScale}%`, backgroundPosition: `${bgPosX}% ${bgPosY}%`
        const scale = bgScale / 100;
        const imgW = W * scale;
        const imgH = (img.naturalHeight / img.naturalWidth) * imgW;
        const dx = (bgPosX / 100) * (W - imgW);
        const dy = (bgPosY / 100) * (H - imgH);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, dx, dy, imgW, imgH);

        // Gradient overlay matching the CSS
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    "rgba(13,87,167,0.10)");
        grad.addColorStop(0.35, "rgba(8,20,40,0.15)");
        grad.addColorStop(0.72, "rgba(7,18,38,0.78)");
        grad.addColorStop(1,    "rgba(7,18,38,0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } catch {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      // gradient(135deg, darkTone 0%, #0b2f63 55%, accent 100%)
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0,    darkTone);
      grad.addColorStop(0.55, "#0b2f63");
      grad.addColorStop(1,    accent);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // ── 2. Bottom vignette overlay ───────────────────────────────────────────
    const vig = ctx.createLinearGradient(0, H, 0, 0);
    vig.addColorStop(0,    "rgba(2,8,23,0.95)");
    vig.addColorStop(0.28, "rgba(2,8,23,0.68)");
    vig.addColorStop(0.58, "rgba(2,8,23,0.15)");
    vig.addColorStop(1,    "rgba(2,8,23,0.02)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── 3. Guest image ───────────────────────────────────────────────────────
    if (guestImage) {
      try {
        const img = await loadImage(guestImage);
        const guestW = W * 0.22 * (guestScale / 100);
        const aspect = img.naturalHeight / img.naturalWidth;
        const guestH = guestW * aspect;
        const gx = (guestPosX / 100) * W - guestW / 2;
        const gy = (guestPosY / 100) * H - guestH / 2;

        // Clip with rounded rect
        ctx.save();
        ctx.beginPath();
        const r2 = guestRoundness;
        ctx.moveTo(gx + r2, gy);
        ctx.arcTo(gx + guestW, gy, gx + guestW, gy + guestH, r2);
        ctx.arcTo(gx + guestW, gy + guestH, gx, gy + guestH, r2);
        ctx.arcTo(gx, gy + guestH, gx, gy, r2);
        ctx.arcTo(gx, gy, gx + guestW, gy, r2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, gx, gy, guestW, guestH);
        ctx.restore();
      } catch { /* skip if image fails */ }
    }

    // ── 4. Logo ──────────────────────────────────────────────────────────────
    try {
      const logo = await loadImage(logoImage);
      const logoMaxW = exportMode === "reels" ? W * 0.58 * 0.6 : W * 0.504 * 0.6;
      const logoMaxH = exportMode === "reels" ? 173 : 137;
      const logoAspect = logo.naturalWidth / logo.naturalHeight;
      let logoW = logoMaxW;
      let logoH = logoW / logoAspect;
      if (logoH > logoMaxH) { logoH = logoMaxH; logoW = logoH * logoAspect; }
      ctx.drawImage(logo, W - 24 - logoW, 24, logoW, logoH);
    } catch { /* skip */ }

    // ── 5. Bottom text block — anchored from the BOTTOM like `absolute bottom-0` ──
    const pad = 48; // p-6 = 24px each side, but card uses p-8 = 32px at md
    const bottomPad = 48; // distance from bottom edge
    const maxLineW = W - pad * 2;

    // Helper: word-wrap a string, returns array of lines
    const wrapText = (text: string, font: string): string[] => {
      ctx.font = font;
      const words2 = text.split(" ");
      const result: string[] = [];
      let cur = "";
      for (const w of words2) {
        const test = cur ? cur + " " + w : w;
        if (ctx.measureText(test).width <= maxLineW) {
          cur = test;
        } else {
          if (cur) result.push(cur);
          cur = w;
        }
      }
      if (cur) result.push(cur);
      return result;
    };

    const headlineFont   = `800 ${headlineSize}px sans-serif`;
    const subFont        = `400 ${subheadlineSize}px sans-serif`;
    const footerFont     = `500 24px sans-serif`;
    const headlineLineH  = headlineSize * 1.08;
    const subLineH       = subheadlineSize * 1.6;
    const footerLineH    = 24 * 1.4;

    const headlineLines = wrapText(headline, headlineFont);
    const subLines2     = wrapText(subheadline, subFont);

    // Total height of each block
    const footerBlockH    = footerLineH;
    const subBlockH       = subLines2.length * subLineH + 16; // mt-3 ≈ 12px + gap
    const headlineBlockH  = headlineLines.length * headlineLineH + 12; // mt-3 gap before sub
    const dividerGap      = 20; // pt-5 = 20px above divider text

    const totalTextH = dividerGap + headlineBlockH + subBlockH + footerBlockH;

    // Divider line Y — sits above all the text
    const dividerY = H - bottomPad - totalTextH;

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, dividerY);
    ctx.lineTo(W - pad, dividerY);
    ctx.stroke();

    // ── 6. Headline ───────────────────────────────────────────────────────────
    ctx.font = headlineFont;
    ctx.fillStyle = lightTone;
    ctx.textAlign = "left";

    let curY = dividerY + dividerGap;
    headlineLines.forEach((line) => {
      const m = ctx.measureText(line);
      curY += m.actualBoundingBoxAscent;
      ctx.fillText(line, pad, curY);
      curY += m.actualBoundingBoxDescent + (headlineLineH - headlineSize) / 2;
    });

    // ── 7. Subheadline ────────────────────────────────────────────────────────
    ctx.font = subFont;
    ctx.fillStyle = lightTone + "E6";
    curY += 12; // mt-3

    subLines2.forEach((line) => {
      const m = ctx.measureText(line);
      curY += m.actualBoundingBoxAscent;
      ctx.fillText(line, pad, curY);
      curY += m.actualBoundingBoxDescent + (subLineH - subheadlineSize) / 2;
    });

    // ── 8. Footer text ────────────────────────────────────────────────────────
    ctx.font = footerFont;
    ctx.fillStyle = lightTone + "CC";
    curY += 16; // mt-4
    const footerM = ctx.measureText(footerText);
    curY += footerM.actualBoundingBoxAscent;
    ctx.fillText(footerText, pad, curY);

    // ── 9. Category + Tag badges — perfectly centred using ink bounds ─────────
    const badgeH = 64;
    const badgeY = 24;
    const catPadX = 34;
    const tagPadX = 28;
    const badgeGap = 16;

    // Category
    ctx.font = `600 34px sans-serif`;
    const catM = ctx.measureText(category);
    const catPillW = Math.max(220, catM.width + catPadX * 2);
    const catPillX = 24;

    pill(ctx, catPillX, badgeY, catPillW, badgeH);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.fillStyle = lightTone;
    drawCentredText(ctx, category, catPillX + catPillW / 2, badgeY + badgeH / 2);

    // Tag
    if (tag) {
      ctx.font = `500 30px sans-serif`;
      const tagM = ctx.measureText(tag);
      const tagPillW = Math.max(150, tagM.width + tagPadX * 2);
      const tagPillX = catPillX + catPillW + badgeGap;

      pill(ctx, tagPillX, badgeY, tagPillW, badgeH);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = lightTone;
      drawCentredText(ctx, tag, tagPillX + tagPillW / 2, badgeY + badgeH / 2);
    }

    return canvas;
  };

  const downloadCard = async () => {
    try {
      setIsProcessing(true);

      const canvas = await createExportCanvas();
      if (!canvas) {
        alert("Could not generate image.");
        return;
      }

      const filename = `ictsamachar-${exportMode}.png`;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1);
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return;
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const shareCard = async () => {
    try {
      setIsProcessing(true);

      const canvas = await createExportCanvas();
      if (!canvas) {
        alert("Could not generate image.");
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1);
      });

      if (!blob) {
        alert("Could not prepare image for sharing.");
        return;
      }

      const file = new File([blob], `ictsamachar-${exportMode}.png`, {
        type: "image/png",
      });

      const canNativeShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] });

      if (canNativeShare) {
        await navigator.share({
          files: [file],
          title: "ictsamachar News Card",
          text: "Shared from ictsamachar card studio",
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ictsamachar-${exportMode}.png`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1500);
      alert("Native sharing is not supported here, so the image was downloaded instead.");
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Share error:", error);
      alert("Sharing is not supported here. Use Download instead.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sectionClass = "rounded-2xl bg-[#f8fafc] p-4 space-y-3";

  // Badge height in full-res px — used for both display and lineHeight so
  // html2canvas never has to rely on flexbox vertical centering.
  const BADGE_HEIGHT = 64;

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">

      {/* Site Header */}
      <header className="bg-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo_ict_sam.png"
              alt="ICT Samachar logo"
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-[#0d57a7]">
              ICT Samachar Graphics Studio
            </span>
          </div>
          <a
            href="https://ictsamachar.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#0d57a7] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b4a8f]"
          >
            Home
          </a>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto rounded-3xl bg-[#ffffff] p-5 shadow-xl self-start">
          <div className="space-y-4 pb-2">
            <h1 className="text-xl font-semibold text-[#0f172a]">ictsamachar Card Studio</h1>

            <details open className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">Layout</summary>
              <div>
                <label className="mb-2 mt-3 block text-sm font-medium text-[#0f172a]">Export mode</label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value as ExportMode)}
                >
                  <option value="post">Post (1080×1350)</option>
                  <option value="square">Square (1080×1080)</option>
                  <option value="reels">Reels (1080×1920)</option>
                </select>
              </div>
            </details>

            <details open className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">Text</summary>
              <div>
                <label className="mb-2 mt-3 block text-sm font-medium text-[#0f172a]">Category</label>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">Tag</label>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">Headline</label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  rows={4}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">Short news</label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  rows={3}
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">Footer text</label>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-[#0f172a]"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">
                  Headline font size: {headlineSize}px
                </label>
                <input
                  type="range"
                  min="28"
                  max="96"
                  value={headlineSize}
                  onChange={(e) => setHeadlineSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">
                  Short news font size: {subheadlineSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="40"
                  value={subheadlineSize}
                  onChange={(e) => setSubheadlineSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </details>

            <details open className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">Colors & uploads</summary>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f172a]">Accent</label>
                  <input
                    type="color"
                    className="h-11 w-full rounded-xl border"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f172a]">Blue tone</label>
                  <input
                    type="color"
                    className="h-11 w-full rounded-xl border"
                    value={darkTone}
                    onChange={(e) => setDarkTone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0f172a]">Text tone</label>
                  <input
                    type="color"
                    className="h-11 w-full rounded-xl border"
                    value={lightTone}
                    onChange={(e) => setLightTone(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
                <p className="text-xs font-medium text-[#475569]">Logo</p>
                <p className="mt-1 text-sm text-[#0f172a]">ICT Samachar fixed logo is enabled</p>
              </div>

              <FileUploadBox
                label="Background image"
                onChange={(file) => toDataUrl(file, setBgImage)}
              />

              <FileUploadBox
                label="Guest image (optional)"
                onChange={(file) => toDataUrl(file, setGuestImage)}
              />
            </details>

            <details className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">Background controls</summary>
              <div className="pt-3">
                <label className="mb-1 block text-xs text-[#475569]">Scale: {bgScale}%</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={bgScale}
                  onChange={(e) => setBgScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">Left/right: {Math.round(bgPosX)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgPosX}
                  onChange={(e) => setBgPosX(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">Up/down: {Math.round(bgPosY)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgPosY}
                  onChange={(e) => setBgPosY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </details>

            <details className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">Guest controls</summary>
              <div className="pt-3">
                <label className="mb-1 block text-xs text-[#475569]">Scale: {guestScale}%</label>
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={guestScale}
                  onChange={(e) => setGuestScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">Left/right: {Math.round(guestPosX)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guestPosX}
                  onChange={(e) => setGuestPosX(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">Up/down: {Math.round(guestPosY)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guestPosY}
                  onChange={(e) => setGuestPosY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#475569]">Roundness: {guestRoundness}px</label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={guestRoundness}
                  onChange={(e) => setGuestRoundness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </details>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={downloadCard}
                className="rounded-2xl bg-[#0f172a] px-4 py-3 text-[#ffffff] disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Download"}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={shareCard}
                className="rounded-2xl bg-[#2563eb] px-4 py-3 text-[#ffffff] disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Share"}
              </button>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl bg-[#ffffff] p-4 shadow-xl self-start">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-sm font-semibold text-[#0f172a]">Live preview</p>
              <p className="text-xs text-[#64748b] break-words">
                Preview is scaled. Export uses a clean full-size clone.
              </p>
            </div>
            <div className="shrink-0 text-xs text-[#64748b]">
              {currentSize.width} × {currentSize.height}
            </div>
          </div>

          <div className="overflow-auto rounded-2xl bg-[#f1f5f9] p-3">
            <div
              className="flex w-full items-start justify-center"
              style={{ minHeight: previewHeight + 24 }}
            >
              <div
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  id="ictsamachar-export-card"
                  ref={cardRef}
                  className="relative overflow-hidden select-none"
                  style={{
                    width: currentSize.width,
                    height: currentSize.height,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                    ...cardBackgroundStyle,
                  }}
                  onPointerMove={onPointerMove}
                  onPointerUp={stopDrag}
                  onPointerLeave={stopDrag}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,8,23,.95)_0%,rgba(2,8,23,.68)_28%,rgba(2,8,23,.15)_58%,rgba(2,8,23,.02)_100%)]" />

                  {guestImage && (
                    <div
                      className="absolute z-20 cursor-move"
                      style={{
                        width: `${22 * (guestScale / 100)}%`,
                        left: `${guestPosX}%`,
                        top: `${guestPosY}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onPointerDown={(e) => startGuestDrag(e.clientX, e.clientY)}
                    >
                      <img
                        src={guestImage}
                        alt="Guest"
                        crossOrigin="anonymous"
                        className="w-full object-cover shadow-2xl"
                        style={{ borderRadius: `${guestRoundness}px` }}
                      />
                    </div>
                  )}

                  {/* ── Category + Tag badges ─────────────────────────────────────────
                      FIX: display:table (outer) + display:table-cell + vertical-align:middle
                      (inner) is the ONLY centering method html2canvas reproduces correctly
                      for non-Latin scripts like Devanagari, where font ascender/descender
                      metrics break lineHeight-based centering.
                  ──────────────────────────────────────────────────────────────────── */}
                  <div data-badge-row className="absolute left-6 top-6 z-10 flex items-center gap-4">
                    {/* Category pill — outer sets shape/bg, inner centres text */}
                    <div
                      style={{
                        display: "table",
                        backgroundColor: accent,
                        borderRadius: "999px",
                        height: `${BADGE_HEIGHT}px`,
                        minWidth: "220px",
                        padding: "0 34px",
                        boxSizing: "border-box",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          display: "table-cell",
                          verticalAlign: "middle",
                          textAlign: "center",
                          color: lightTone,
                          fontSize: "34px",
                          fontWeight: 600,
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {category}
                      </span>
                    </div>

                    {tag && (
                      /* Tag pill */
                      <div
                        style={{
                          display: "table",
                          backgroundColor: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.20)",
                          borderRadius: "999px",
                          height: `${BADGE_HEIGHT}px`,
                          minWidth: "150px",
                          padding: "0 28px",
                          boxSizing: "border-box",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "table-cell",
                            verticalAlign: "middle",
                            textAlign: "center",
                            color: lightTone,
                            fontSize: "30px",
                            fontWeight: 500,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tag}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className="absolute right-6 top-6 z-10 flex items-center justify-end"
                    style={{
                      width: exportMode === "reels" ? "58%" : "50.4%",
                      minWidth: exportMode === "reels" ? "216px" : "198px",
                      maxWidth: exportMode === "reels" ? "324px" : "288px",
                      pointerEvents: "none",
                    }}
                  >
                    <img
                      src={logoImage}
                      alt="ictsamachar logo"
                      crossOrigin="anonymous"
                      className="block h-auto w-full object-contain"
                      style={{
                        maxHeight: exportMode === "reels" ? "173px" : "137px",
                      }}
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 z-10 w-full p-6 md:p-8">
                    <div
                      className="w-full pt-5"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
                    >
                      <h2
                        className="font-extrabold leading-[1.08]"
                        style={{
                          color: lightTone,
                          fontSize: `${headlineSize}px`,
                        }}
                      >
                        {headline}
                      </h2>
                      <p
                        className="mt-3 leading-relaxed"
                        style={{
                          color: `${lightTone}E6`,
                          fontSize: `${subheadlineSize}px`,
                        }}
                      >
                        {subheadline}
                      </p>
                      <div
                        className="mt-4 text-sm font-medium"
                        style={{ color: `${lightTone}CC` }}
                      >
                        {footerText}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      </main>

      {/* Site Footer */}
      <footer className="bg-[#0f172a] py-4 text-center text-sm text-[#94a3b8]">
        Developed by:{" "}
        <span className="font-semibold text-white">ictsamachar</span>
      </footer>

    </div>
  );
}