# Image Rotate

Rotate and flip images by preset increments or any custom angle, with live preview, entirely in the browser.

**Live Demo:** https://file-converter-free.com/en/image-tools/image-rotate

## How It Works

Each loaded image maintains a per-file state object tracking its current rotation angle and flip flags. The core `drawToCanvas()` function calculates the correct output bounding box for any arbitrary rotation angle using `Math.sin` and `Math.cos` applied to the original width and height, so the canvas is always sized to contain the full rotated image without clipping. Canvas context transformations (`translate`, `rotate`, `scale`) are applied before `drawImage`. A visible preview canvas shows a downscaled live render. A separate full-resolution offscreen canvas is used to export the final file at native quality. Supported operations are rotate 90 left, 90 right, 180, custom angle, flip horizontal, and flip vertical.

## Features

- Rotate 90 left, 90 right, 180, or any custom angle
- Flip horizontal and flip vertical
- Automatic bounding-box calculation prevents clipping at arbitrary angles
- Per-file rotation state for batch processing
- Live scaled preview

## Browser APIs Used

- Canvas API (2D context, `drawImage`, `toBlob`, `translate`/`rotate`/`scale`)
- FileReader API
- Blob / URL.createObjectURL

## Code Structure

| File | Description |
|------|-------------|
| `image-rotate.js` | `ImageRotate` class — per-file state, sin/cos bounding-box math, preview and full-res canvas export |

## Usage

| Element ID | Purpose |
|------------|---------|
| `dropZone` | Drag-and-drop target for image files |
| `fileInput` | File picker input |
| `rotate90L` | Rotate 90 degrees left |
| `rotate90R` | Rotate 90 degrees right |
| `rotate180` | Rotate 180 degrees |
| `customAngle` | Custom rotation angle input |
| `flipH` | Flip horizontal |
| `flipV` | Flip vertical |
| `previewCanvas` | Live preview of current rotation state |
| `downloadBtn` | Download rotated/flipped image |

## License

MIT
