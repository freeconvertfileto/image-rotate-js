class ImageRotate {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.canvas = document.getElementById('rotateCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.fileList = document.getElementById('fileList');
        this.rotateEditor = document.getElementById('rotateEditor');
        this.uploadContainer = document.getElementById('uploadContainer');

        // files array: [{file, image, rotation, flipH, flipV}]
        this.files = [];
        this.currentIndex = 0;

        // shared transform state applied to all files
        this.rotation = 0;   // cumulative degrees
        this.flipH = false;
        this.flipV = false;
        this.bgColor = '#ffffff';

        this.maxDisplayWidth = 800;

        this.init();
    }

    init() {
        this.setupUploadListeners();
        this.setupToolbarListeners();
    }

    // -----------------------------------------------------------------------
    // Upload / drag-drop
    // -----------------------------------------------------------------------

    setupUploadListeners() {
        const btnUpload = this.uploadArea.querySelector('.btn-upload');
        if (btnUpload) {
            btnUpload.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fileInput.click();
            });
        }

        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            // reset so same file can be re-selected
            this.fileInput.value = '';
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            this.uploadArea.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(evt => {
            this.uploadArea.addEventListener(evt, () => {
                this.uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            this.uploadArea.addEventListener(evt, () => {
                this.uploadArea.classList.remove('drag-over');
            });
        });

        this.uploadArea.addEventListener('drop', (e) => {
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(fileList) {
        const valid = Array.from(fileList).filter(f => this.isValidImage(f));
        if (valid.length === 0) {
            alert('Please select valid image files (JPG, PNG, WebP, GIF, BMP, TIFF, AVIF).');
            return;
        }

        const loadPromises = valid.map(file => this.loadImageFile(file));

        Promise.all(loadPromises).then(loaded => {
            loaded.forEach(item => this.files.push(item));

            if (this.files.length > 0) {
                this.showEditor();
                this.renderPreview(this.currentIndex);
                this.renderFileList();
            }
        }).catch(err => {
            console.error('Error loading images:', err);
            alert('Failed to load one or more images.');
        });
    }

    isValidImage(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif'].includes(ext);
    }

    loadImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({ file, image: img, rotation: 0, flipH: false, flipV: false });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load ' + file.name));
            };
            img.src = url;
        });
    }

    // -----------------------------------------------------------------------
    // Editor display
    // -----------------------------------------------------------------------

    showEditor() {
        this.uploadContainer.style.display = 'none';
        this.rotateEditor.style.display = 'block';
    }

    hideEditor() {
        this.rotateEditor.style.display = 'none';
        this.uploadContainer.style.display = 'block';
    }

    // -----------------------------------------------------------------------
    // Canvas rendering
    // -----------------------------------------------------------------------

    renderPreview(index) {
        if (!this.files[index]) return;
        this.currentIndex = index;
        const fd = this.files[index];
        this.drawToCanvas(this.canvas, this.ctx, fd.image, fd.rotation, fd.flipH, fd.flipV, true);
    }

    /**
     * Draw image with transforms onto a canvas context.
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} img
     * @param {number} rotation  - degrees
     * @param {boolean} flipH
     * @param {boolean} flipV
     * @param {boolean} fitDisplay - if true, scale down to maxDisplayWidth for preview
     * @returns {{width: number, height: number}} the canvas pixel dimensions used
     */
    drawToCanvas(canvas, ctx, img, rotation, flipH, flipV, fitDisplay) {
        const rad = (rotation % 360) * Math.PI / 180;
        const absRot = ((rotation % 360) + 360) % 360;

        // Determine output canvas dimensions
        let outW, outH;
        if (absRot === 90 || absRot === 270) {
            outW = img.naturalHeight;
            outH = img.naturalWidth;
        } else {
            // For arbitrary angles, use bounding box
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));
            outW = Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin);
            outH = Math.ceil(img.naturalWidth * sin + img.naturalHeight * cos);
        }

        let displayW = outW;
        let displayH = outH;

        if (fitDisplay && displayW > this.maxDisplayWidth) {
            const scale = this.maxDisplayWidth / displayW;
            displayW = Math.round(displayW * scale);
            displayH = Math.round(displayH * scale);
        }

        canvas.width = displayW;
        canvas.height = displayH;

        // Background fill
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, displayW, displayH);

        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;

        // Scale factor from natural size to display size
        const ds = displayW / outW;

        ctx.save();
        ctx.translate(displayW / 2, displayH / 2);
        ctx.rotate(rad);
        ctx.scale(scaleX * ds, scaleY * ds);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();

        return { width: outW, height: outH };
    }

    // -----------------------------------------------------------------------
    // File list
    // -----------------------------------------------------------------------

    renderFileList() {
        this.fileList.innerHTML = '';

        this.files.forEach((fd, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.dataset.index = index;

            const ext = fd.file.name.split('.').pop().toLowerCase();
            const baseName = fd.file.name.replace(/\.[^/.]+$/, '');

            item.innerHTML = `
                <div class="file-info">
                    <div class="file-details">
                        <div class="file-name">${this.escapeHtml(fd.file.name)}</div>
                        <div class="file-size">${this.formatSize(fd.file.size)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <select class="select-input format-select" data-index="${index}" style="width:90px">
                            <option value="png"${ext === 'png' ? ' selected' : ''}>PNG</option>
                            <option value="jpeg"${(ext === 'jpg' || ext === 'jpeg') ? ' selected' : ''}>JPG</option>
                            <option value="webp"${ext === 'webp' ? ' selected' : ''}>WebP</option>
                        </select>
                        <button class="btn-download preview-btn" data-index="${index}">Preview</button>
                        <button class="btn-primary download-btn" data-index="${index}">Download</button>
                    </div>
                </div>
            `;

            this.fileList.appendChild(item);

            // Preview button: set currentIndex and re-render canvas
            item.querySelector('.preview-btn').addEventListener('click', () => {
                this.renderPreview(index);
            });

            // Download button: apply transforms and trigger download
            item.querySelector('.download-btn').addEventListener('click', () => {
                const fmt = item.querySelector('.format-select').value;
                this.downloadTransformed(index, fmt);
            });
        });
    }

    // -----------------------------------------------------------------------
    // Transform application & download
    // -----------------------------------------------------------------------

    /**
     * Render image at full native resolution and trigger download.
     */
    downloadTransformed(index, format) {
        const fd = this.files[index];
        if (!fd) return;

        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');

        this.drawToCanvas(offCanvas, offCtx, fd.image, fd.rotation, fd.flipH, fd.flipV, false);

        const mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
        const quality = (format === 'jpeg' || format === 'webp') ? 0.92 : undefined;

        offCanvas.toBlob((blob) => {
            if (!blob) {
                alert('Failed to generate image for download.');
                return;
            }
            const baseName = fd.file.name.replace(/\.[^/.]+$/, '');
            const ext = format === 'jpeg' ? 'jpg' : format;
            this.triggerDownload(blob, baseName + '_rotated.' + ext);
        }, mimeType, quality);
    }

    triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // -----------------------------------------------------------------------
    // Toolbar button handlers
    // -----------------------------------------------------------------------

    setupToolbarListeners() {
        const btn = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };

        btn('rotate90L', () => this.applyRotation(-90));
        btn('rotate90R', () => this.applyRotation(90));
        btn('rotate180', () => this.applyRotation(180));
        btn('flipH', () => this.applyFlip('H'));
        btn('flipV', () => this.applyFlip('V'));

        btn('applyAngleBtn', () => {
            const input = document.getElementById('customAngle');
            const angle = parseFloat(input.value);
            if (isNaN(angle)) return;
            this.applyRotation(angle);
        });

        const bgColorInput = document.getElementById('bgColor');
        if (bgColorInput) {
            bgColorInput.addEventListener('input', (e) => {
                this.bgColor = e.target.value;
                this.renderPreview(this.currentIndex);
            });
        }

        btn('resetRotateBtn', () => this.resetTransforms());

        btn('uploadNewBtn', () => {
            this.files = [];
            this.currentIndex = 0;
            this.rotation = 0;
            this.flipH = false;
            this.flipV = false;
            this.fileList.innerHTML = '';
            this.hideEditor();
        });
    }

    applyRotation(degrees) {
        if (this.files.length === 0) return;
        const fd = this.files[this.currentIndex];
        fd.rotation = (fd.rotation + degrees) % 360;
        this.renderPreview(this.currentIndex);
    }

    applyFlip(axis) {
        if (this.files.length === 0) return;
        const fd = this.files[this.currentIndex];
        if (axis === 'H') {
            fd.flipH = !fd.flipH;
        } else {
            fd.flipV = !fd.flipV;
        }
        this.renderPreview(this.currentIndex);
    }

    resetTransforms() {
        if (this.files.length === 0) return;
        const fd = this.files[this.currentIndex];
        fd.rotation = 0;
        fd.flipH = false;
        fd.flipV = false;
        const angleInput = document.getElementById('customAngle');
        if (angleInput) angleInput.value = 0;
        this.renderPreview(this.currentIndex);
    }

    // -----------------------------------------------------------------------
    // Utilities
    // -----------------------------------------------------------------------

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageRotate();
});
