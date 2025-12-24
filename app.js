// --- app.js (TAM DÜZELTİLMİŞ SÜRÜM) ---

// --- SESLER ---
window.audio_click = new Audio('sesler/point-smooth-beep-230573.mp3');
let audio_click_src_set = false; 
window.audio_undo = new Audio('sesler/080918_bolt-sliding-back-4-39863 (3).mp3');
window.audio_draw = new Audio('sesler/drawing-a-line-69277.mp3'); 
window.audio_eraser = new Audio('sesler/pencil-eraser-107852.mp3');

// --- KANVAS AYARLARI ---
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
// --- RESİM YÜKLEME DEĞİŞKENLERİ ---
let backgroundImage = null; // Yüklenen resmi tutacak değişken
const uploadButton = document.getElementById('btn-upload');
const fileInput = document.getElementById('file-input');

// --- app.js (DÜZELTİLMİŞ BAŞLANGIÇ BÖLÜMÜ) ---

// --- SESLER ---
window.audio_click = new Audio('sesler/point-smooth-beep-230573.mp3'); 
window.audio_undo = new Audio('sesler/080918_bolt-sliding-back-4-39863 (3).mp3');
window.audio_draw = new Audio('sesler/drawing-a-line-69277.mp3'); 
window.audio_eraser = new Audio('sesler/pencil-eraser-107852.mp3');

// --- DEĞİŞKENLER ---
let isDrawing = false; 
let snapshotStart = null; 
const animateButton = document.getElementById('btn-animate');
let currentTool = 'none'; 
let isPinching = false;           // İki parmakla yakınlaştırma aktif mi?
let initialDistance = 0;          // Başlangıç parmak mesafesi (zoom için)
let initialScale = 0;             // Başlangıçta seçili nesnenin genişliği
let initialCenter = { x: 0, y: 0 }; // İki parmağın merkez noktası (pan için)
let currentPenColor = '#FFFFFF'; 
let currentPenWidth = 4;
window.currentLineColor = '#FFFFFF'; // Varsayılan Renk: BEYAZ
const SNAP_THRESHOLD = 10;
let returnToSnapshot = false; // İşlem bitince geri dönülecek mi? 
let previewLabel2D = document.createElement('div');
previewLabel2D.className = 'preview-3d-label'; // Aynı stili kullanıyoruz
document.body.appendChild(previewLabel2D);
let drawnStrokes = []; 
window.drawnStrokes = drawnStrokes;
let nextPointChar = 'A'; 
window.nextPointChar = nextPointChar;

let lineStartPoint = null; 
let currentMousePos = { x: 0, y: 0 }; 
let snapTarget = null; 
let snapHoverTimer = null;

window.tempPolygonData = null; 

let isDrawingLine = false; 
let isDrawingInfinityLine = false; 
let isDrawingSegment = false; 
let isDrawingRay = false; 
let isMoving = false;         
let selectedItem = null;      
let selectedPointKey = null;  
let rotationPivot = null;     
let dragStartPos = { x: 0, y: 0 }; 
let originalStartPos = {};
let currentPDF = null;       // Yüklenen PDF dosyası
let currentPDFPage = 1;      // Şu anki sayfa
let totalPDFPages = 0;       // Toplam sayfa
let pdfImageStroke = null;   // Ekrana çizilen PDF sayfası

// --- HTML ELEMENTLERİ ---
const body = document.body;

// 1. Sol Panel Araçları
const penButton = document.getElementById('btn-kalem');
const eraserButton = document.getElementById('btn-silgi');
const lineButton = document.getElementById('btn-cizgi');
const rulerButton = document.getElementById('btn-cetvel');
const gonyeButton = document.getElementById('btn-gonye');
const aciolcerButton = document.getElementById('btn-aciolcer');
const pergelButton = document.getElementById('btn-pergel');
const polygonButton = document.getElementById('btn-cokgenler');
const oyunlarButton = document.getElementById('btn-oyunlar');

// 2. Alt Menü Butonları ve Seçenekler
const penOptions = document.getElementById('pen-options');
const colorBoxes = document.querySelectorAll('#pen-options .color-box');
const lineOptions = document.getElementById('line-options');
const pointButton = document.getElementById('btn-nokta');
const straightLineButton = document.getElementById('btn-d_cizgi');
const infinityLineButton = document.getElementById('btn-dogru');
const segmentButton = document.getElementById('btn-dogru_parcasi');
const rayButton = document.getElementById('btn-isin');
const lineColorOptions = document.querySelectorAll('#line-color-options .color-box');
const polygonOptions = document.getElementById('polygon-options');
const polygonPreviewLabel = document.getElementById('polygon-preview-label');
const circleButton = document.getElementById('btn-cember');
const regularPolygonButtons = document.querySelectorAll('#polygon-options button[data-sides]');
const polygonColorOptions = document.querySelectorAll('#polygon-color-options .color-box');
const oyunlarOptions = document.getElementById('oyunlar-options');

// 3. Sağ Panel Araçları
const undoButton = document.getElementById('btn-undo');
const clearAllButton = document.getElementById('btn-clear-all');
const moveButton = document.getElementById('btn-move');
const fillButton = document.getElementById('btn-fill');
const fillOptions = document.getElementById('fill-options');
const fillColorBoxes = document.querySelectorAll('#fill-options .color-box');
let currentFillColor = '#FF69B4';

// 4. Resim ve PDF Yükleme Araçları


const pdfControls = document.getElementById('pdf-controls');
const pageCountLabel = document.getElementById('page-count-label');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');




// --- GÖRSEL YARDIMCILAR ---
const snapIndicator = document.createElement('div');
snapIndicator.id = 'snap-indicator';
body.appendChild(snapIndicator);
const eraserPreview = document.createElement('div');
eraserPreview.className = 'eraser-cursor-preview';
body.appendChild(eraserPreview);


// --- YARDIMCI FONKSİYONLAR ---

function distance(p1, p2) {
    // --- GÜVENLİK KONTROLÜ (BU SATIRI EKLE) ---
    // Eğer p1 veya p2 yoksa (null ise) 0 döndür ve hata verme.
    if (!p1 || !p2) return 0; 
    // ------------------------------------------

    const dx = p1.x - p2.x;  // Hata veren satır burasıydı, artık güvenli.
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function advanceChar(char) {
    let charCode = char.charCodeAt(0) + 1;
    if (charCode > 90) charCode = 65; 
    return String.fromCharCode(charCode);
}

function findSnapPoint(pos) {
    for (const stroke of drawnStrokes) {
        if (stroke.type === 'point') {
            if (distance(pos, stroke) < SNAP_THRESHOLD) return { x: stroke.x, y: stroke.y }; 
        } else if (stroke.type === 'straightLine' || stroke.type === 'segment') { 
            if (distance(pos, stroke.p1) < SNAP_THRESHOLD) return stroke.p1;
            if (distance(pos, stroke.p2) < SNAP_THRESHOLD) return stroke.p2;
        }
    }
    return null; 
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawAllStrokes();
}

function getEventPosition(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function drawDot(pos, color = '#00FFCC') {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI); 
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLabel(text, pos, color = '#FF69B4') {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = color; 
    ctx.fillText(text, pos.x + 8, pos.y + 5);
}

function drawInfinityLine(p1, p2, color, width, isRay = false) {
    const INFINITY = 5000;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return { ux: 0, uy: 0 }; 
    const ux = dx / mag;
    const uy = dy / mag;
    const drawP1 = isRay ? p1 : { x: p1.x - ux * INFINITY, y: p1.y - uy * INFINITY };
    const drawP2 = { x: p1.x + ux * INFINITY, y: p1.y + uy * INFINITY };
    ctx.beginPath();
    ctx.moveTo(drawP1.x, drawP1.y);
    ctx.lineTo(drawP2.x, drawP2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    return { ux, uy }; 
}

window.bringToolToFront = function(clickedElement) {
    const tools = [
        window.RulerTool ? window.RulerTool.rulerElement : null,
        window.GonyeTool ? window.GonyeTool.gonyeElement : null,
        window.AciolcerTool ? window.AciolcerTool.aciolcerElement : null,
        window.PergelTool ? window.PergelTool.pergelElement : null
    ];
    tools.forEach(tool => { if (tool) tool.style.zIndex = 5; });
    if (clickedElement) clickedElement.style.zIndex = 6;
}

// --- ÇİZİM FONKSİYONU (REDRAW) ---
// --- ÇİZİM FONKSİYONU (REDRAW) - DÜZELTİLMİŞ VE KORUMALI ---
// --- app.js ---
// BU FONKSİYONU MEVCUT 'redrawAllStrokes' İLE DEĞİŞTİRİN

function redrawAllStrokes() {
    // 1. Kanvası Temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Çizim Döngüsü
    for (const stroke of drawnStrokes) {
        // HATA KALKANI: Bir çizim bozuksa diğerlerini etkilemesin diye try-catch içinde
        try {
            ctx.beginPath(); // Her şekil için yeni yol başlat

            // A) KALEM (PEN) - YUMUŞATMA EKLENDİ
            if (stroke.type === 'pen') {
                if (stroke.path && stroke.path.length > 0) {
                    ctx.beginPath();
                    
                    // --- YUMUŞATMA ALGORİTMASI BAŞLANGICI ---
                    // Eğer nokta sayısı azsa (3'ten küçük), düz çizgi yeterlidir.
                    if (stroke.path.length < 3) {
                        ctx.moveTo(stroke.path[0].x, stroke.path[0].y);
                        for (let i = 1; i < stroke.path.length; i++) {
                            ctx.lineTo(stroke.path[i].x, stroke.path[i].y);
                        }
                    } 
                    // Nokta sayısı çoksa, araları eğriyle (Curve) doldurarak yumuşat
                    else {
                        ctx.moveTo(stroke.path[0].x, stroke.path[0].y);
                        let i;
                        for (i = 1; i < stroke.path.length - 2; i++) {
                            // İki nokta arasının tam ortasını (midpoint) bul
                            const xc = (stroke.path[i].x + stroke.path[i + 1].x) / 2;
                            const yc = (stroke.path[i].y + stroke.path[i + 1].y) / 2;
                            // Mevcut noktayı kontrol noktası yaparak ortaya kadar eğri çiz
                            ctx.quadraticCurveTo(stroke.path[i].x, stroke.path[i].y, xc, yc);
                        }
                        // Son kalan 2 noktayı bağla
                        ctx.quadraticCurveTo(stroke.path[i].x, stroke.path[i].y, stroke.path[i+1].x, stroke.path[i+1].y);
                    }
                    // --- YUMUŞATMA ALGORİTMASI BİTİŞİ ---
                    
                    // Renk ve Kalınlık Ayarları
                    ctx.strokeStyle = stroke.color || '#FFFFFF';
                    ctx.lineWidth = stroke.width || 4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }
            }

            // B) RESİM (IMAGE)
            else if (stroke.type === 'image') {
                if (stroke.img) {
                    ctx.save();
                    ctx.translate(stroke.x, stroke.y);
                    if (stroke.rotation) ctx.rotate(stroke.rotation * Math.PI / 180);
                    // Resmi çiz
                    ctx.drawImage(stroke.img, -stroke.width / 2, -stroke.height / 2, stroke.width, stroke.height);

                    // Seçiliyse Çerçeve Çiz
                    if (currentTool === 'move' && selectedItem === stroke) {
                        ctx.strokeStyle = '#00FFCC';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(-stroke.width / 2, -stroke.height / 2, stroke.width, stroke.height);
                        ctx.setLineDash([]); // Kesik çizgiyi kapat

                        // Boyutlandırma Tutamacı (Pembe)
                        ctx.beginPath();
                        ctx.arc(stroke.width / 2, stroke.height / 2, 10, 0, 2 * Math.PI);
                        ctx.fillStyle = '#FF00FF';
                        ctx.fill();
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }

            // C) NOKTA (POINT)
            else if (stroke.type === 'point') {
                drawDot(stroke, stroke.color); // drawDot fonksiyonunu kullan
                if (stroke.label) drawLabel(stroke.label, stroke, stroke.color);
            }

            // D) DÜZ ÇİZGİ (STRAIGHT LINE)
            else if (stroke.type === 'straightLine') {
                if (stroke.p1 && stroke.p2) {
                    ctx.moveTo(stroke.p1.x, stroke.p1.y);
                    ctx.lineTo(stroke.p2.x, stroke.p2.y);
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = stroke.width;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    // Etiket (Varsa)
                    if (stroke.lengthLabel) drawLabel(stroke.lengthLabel, stroke.lengthLabelPos, '#FFFF00');
                }
            }

            // E) DOĞRU (LINE - SONSUZ)
            else if (stroke.type === 'line') {
                if (stroke.p1 && stroke.p2) {
                    drawInfinityLine(stroke.p1, stroke.p2, stroke.color, stroke.width, false);
                    drawDot(stroke.p1, stroke.color);
                    drawDot(stroke.p2, stroke.color);
                    drawLabel(stroke.label1, stroke.p1, '#FF69B4');
                    drawLabel(stroke.label2, stroke.p2, '#FF69B4');
                }
            }

            // F) DOĞRU PARÇASI (SEGMENT)
            else if (stroke.type === 'segment') {
                if (stroke.p1 && stroke.p2) {
                    ctx.moveTo(stroke.p1.x, stroke.p1.y);
                    ctx.lineTo(stroke.p2.x, stroke.p2.y);
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = stroke.width || 3;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                    drawDot(stroke.p1, stroke.color);
                    drawDot(stroke.p2, stroke.color);
                    drawLabel(stroke.label1, stroke.p1, '#FF69B4');
                    drawLabel(stroke.label2, stroke.p2, '#FF69B4');
                    if (stroke.lengthLabel) drawLabel(stroke.lengthLabel, stroke.lengthLabelPos, '#FFFF00');
                }
            }

            // G) IŞIN (RAY)
            else if (stroke.type === 'ray') {
                if (stroke.p1 && stroke.p2) {
                    drawInfinityLine(stroke.p1, stroke.p2, stroke.color, stroke.width, true);
                    drawDot(stroke.p1, stroke.color);
                    drawDot(stroke.p2, stroke.color);
                    drawLabel(stroke.label1, stroke.p1, '#FF69B4');
                    drawLabel(stroke.label2, stroke.p2, '#FF69B4');
                }
            }

            // H) ÇOKGEN (POLYGON)
            else if (stroke.type === 'polygon') {
                if (window.PolygonTool && typeof window.PolygonTool.calculateVertices === 'function') {
                    // Köşeleri dinamik hesapla (döndürme/taşıma için)
                    const vertices = window.PolygonTool.calculateVertices(stroke.center, stroke.radius, stroke.sideCount, stroke.rotation);
                    stroke.vertices = vertices; // Güncel köşeleri kaydet

                    if (vertices && vertices.length > 0) {
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let i = 1; i < vertices.length; i++) {
                            ctx.lineTo(vertices[i].x, vertices[i].y);
                        }
                        ctx.closePath();

                        // İçini boya
                        if (stroke.fillColor) {
                            ctx.fillStyle = stroke.fillColor;
                            ctx.fill();
                        }
                        // Kenar çizgisi
                        ctx.strokeStyle = stroke.color;
                        ctx.lineWidth = stroke.width || 3;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.stroke();

                        // Noktalar ve Etiketler
                        drawDot(stroke.center, stroke.color);
                        if (stroke.label) drawLabel(stroke.label, stroke.center, '#FF69B4');
                        vertices.forEach(v => drawDot(v, stroke.color));

                        // Kenar Uzunlukları
                        if (stroke.showEdgeLabels && window.PolygonTool.getEdgeLength) {
                            for (let j = 0; j < vertices.length; j++) {
                                const v1 = vertices[j];
                                const v2 = vertices[(j + 1) % vertices.length];
                                const midPoint = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
                                const edgeLabel = window.PolygonTool.getEdgeLength(v1, v2);
                                drawLabel(edgeLabel, midPoint, '#FF69B4');
                            }
                        }

                        // Açı Etiketleri
                        if (stroke.showAngleLabels && window.PolygonTool.getInternalAngle) {
                            const angleLabel = window.PolygonTool.getInternalAngle(stroke.sideCount);
                            const arcRadius = 25;
                            for (let j = 0; j < vertices.length; j++) {
                                const v_current = vertices[j];
                                const v_prev = vertices[j === 0 ? vertices.length - 1 : j - 1];
                                const v_next = vertices[(j + 1) % vertices.length];
                                const startAngle = Math.atan2(v_prev.y - v_current.y, v_prev.x - v_current.x);
                                const endAngle = Math.atan2(v_next.y - v_current.y, v_next.x - v_current.x);
                                ctx.beginPath();
                                ctx.arc(v_current.x, v_current.y, arcRadius, endAngle, startAngle);
                                ctx.strokeStyle = '#FFFF00';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                                
                                const angle_label_x = (v_current.x * 0.8) + (stroke.center.x * 0.2);
                                const angle_label_y = (v_current.y * 0.8) + (stroke.center.y * 0.2);
                                drawLabel(angleLabel, { x: angle_label_x, y: angle_label_y }, '#FFFF00');
                            }
                        }

                        // Tutamaçlar (Sadece Move modunda ve seçiliyken)
                        if (currentTool === 'move' && selectedItem === stroke && window.PolygonTool.getRotateHandlePosition) {
                            // Yeşil Döndürme
                            const rotPos = window.PolygonTool.getRotateHandlePosition(stroke);
                            ctx.beginPath();
                            ctx.arc(rotPos.x, rotPos.y, 10, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                            ctx.fill();
                            ctx.strokeStyle = '#0F0';
                            ctx.stroke();

                            // Pembe Boyutlandırma
                            const resizePos = vertices.length > 0 ? vertices[0] : stroke.center;
                            ctx.beginPath();
                            ctx.arc(resizePos.x, resizePos.y, 8, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
                            ctx.fill();
                            ctx.strokeStyle = '#F0F';
                            ctx.stroke();
                        }
                    }
                }
            }

            // I) ÇEMBER / YAY (ARC)
            else if (stroke.type === 'arc') {
                const PI_RAD = Math.PI / 180;
                let startRad = stroke.startAngle * PI_RAD;
                let endRad = stroke.endAngle * PI_RAD;
                const totalAngleDrawn = Math.abs(stroke.endAngle - stroke.startAngle);

                if (totalAngleDrawn >= 359) { startRad = 0; endRad = 2 * Math.PI; }

                ctx.arc(stroke.cx, stroke.cy, stroke.radius, startRad, endRad, false);
                if (totalAngleDrawn >= 359) ctx.closePath();

                if (stroke.fillColor && stroke.fillColor !== 'transparent' && totalAngleDrawn >= 359) {
                    ctx.fillStyle = stroke.fillColor;
                    ctx.fill();
                }

                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width || 3;
                ctx.lineCap = 'round';
                ctx.stroke();

                const centerPos = { x: stroke.cx, y: stroke.cy };
                drawDot(centerPos, stroke.color);
                if (stroke.label) drawLabel(stroke.label, centerPos, '#FF69B4');

                // Çember Bilgisi
                if (stroke.showCircleInfo) {
                    ctx.beginPath();
                    ctx.moveTo(centerPos.x, centerPos.y);
                    ctx.lineTo(centerPos.x + stroke.radius, centerPos.y);
                    ctx.strokeStyle = '#FF69B4';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const PI = (window.PolygonTool && window.PolygonTool.PI_VALUE) ? window.PolygonTool.PI_VALUE : 3;
                    const r_px = stroke.radius;
                    const pixelPerCm = (window.PolygonTool && window.PolygonTool.PIXELS_PER_CM) ? window.PolygonTool.PIXELS_PER_CM : 30;
                    const r_cm_raw = (r_px / pixelPerCm);
                    const r_cm_calc = parseFloat(r_cm_raw.toFixed(2));
                    const r_cm_str = r_cm_raw.toFixed(2).replace('.', ',');
                    const circ_str = (2 * PI * r_cm_calc).toFixed(2).replace('.', ',');
                    const area_str = (PI * r_cm_calc * r_cm_calc).toFixed(2).replace('.', ',');

                    const labelX = centerPos.x + r_px + 10;
                    let labelY = centerPos.y - 20;

                    drawLabel(`r = ${r_cm_str} cm`, { x: centerPos.x + (r_px / 2) - 20, y: centerPos.y - 10 }, '#FFFF00');
                    drawLabel(`Ç = 2 . π . r`, { x: labelX, y: labelY }, '#FFFF00'); labelY += 20;
                    drawLabel(`= 2 . ${PI} . ${r_cm_str} = ${circ_str} cm`, { x: labelX, y: labelY }, '#FFFF00'); labelY += 25;
                    drawLabel(`A = π . r²`, { x: labelX, y: labelY }, '#FFFF00'); labelY += 20;
                    drawLabel(`= ${PI} . ${r_cm_str}² = ${area_str} cm²`, { x: labelX, y: labelY }, '#FFFF00'); labelY += 25;
                    drawLabel(`(π = ${PI} alındı)`, { x: labelX, y: labelY }, '#AAAAAA');
                }
            }

        } catch (err) {
            console.error("Çizim hatası:", err);
        }
    } // Döngü bitişi

    // 3. 3D Tutamaçları (Döngüden bağımsız en üstte çizilir)
    if (window.Scene3D && window.Scene3D.currentMesh && currentTool === 'move') {
        if (window.Scene3D.updateHandlePositions) window.Scene3D.updateHandlePositions();
        
        const h = window.Scene3D.handles;
        if (h.resize) {
            // Bağlantı Çizgisi
            ctx.beginPath();
            ctx.moveTo(h.center.x, h.center.y);
            ctx.lineTo(h.resize.x, h.resize.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pembe (Resize) Butonu
            ctx.beginPath();
            ctx.arc(h.resize.x, h.resize.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.stroke();
        }
    }
}

// Yardımcı Fonksiyon: Noktanın doğru parçasına uzaklığı
function distanceToSegment(p, v1, v2) {
    const l2 = Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2);
    if (l2 === 0) return distance(p, v1);
    let t = ((p.x - v1.x) * (v2.x - v1.x) + (p.y - v1.y) * (v2.y - v1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: v1.x + t * (v2.x - v1.x), y: v1.y + t * (v2.y - v1.y) };
    return distance(p, proj);
}
// Global atamalar
window.redrawAllStrokes = redrawAllStrokes;
window.advanceChar = advanceChar;
window.distance = distance; 


// --- ARAÇ SEÇİMİ ---
function setActiveTool(tool) {
window.currentTool = tool;
    penButton.classList.remove('active');
    eraserButton.classList.remove('active');
    lineButton.classList.remove('active');
    pointButton.classList.remove('active');
    straightLineButton.classList.remove('active');
    infinityLineButton.classList.remove('active');
    segmentButton.classList.remove('active');
    rayButton.classList.remove('active');
    rulerButton.classList.remove('active');
    gonyeButton.classList.remove('active');
    aciolcerButton.classList.remove('active');
    pergelButton.classList.remove('active');
    polygonButton.classList.remove('active');
    circleButton.classList.remove('active');
    moveButton.classList.remove('active');
    oyunlarButton.classList.remove('active');
    regularPolygonButtons.forEach(b => b.classList.remove('active'));
    if(fillButton) fillButton.classList.remove('active');

    body.classList.remove('cursor-pen');
    body.classList.remove('cursor-eraser');

    if (polygonOptions) { polygonOptions.classList.add('hidden'); polygonOptions.style.display = ''; }
    if (lineOptions) { lineOptions.classList.add('hidden'); lineOptions.style.display = ''; }
    if (oyunlarOptions) { oyunlarOptions.classList.add('hidden'); oyunlarOptions.style.display = ''; }
    if (fillOptions) { fillOptions.classList.add('hidden'); fillOptions.style.display = ''; }
    penOptions.classList.add('hidden'); 

    isDrawing = false;
    lineStartPoint = null;
    isDrawingLine = false;
    isDrawingInfinityLine = false; 
    isDrawingSegment = false; 
    isDrawingRay = false; 
    
    window.tempPolygonData = null; 
    polygonPreviewLabel.classList.add('hidden'); 
    
    if (window.RulerTool) window.RulerTool.hide();
    if (window.GonyeTool) window.GonyeTool.hide();
    if (window.AciolcerTool) window.AciolcerTool.hide();
    if (window.PergelTool) window.PergelTool.hide();
    
    if (snapIndicator) snapIndicator.style.display = 'none';
    
    if (window.RulerTool) window.RulerTool.interactionMode = 'none';
    if (window.GonyeTool) window.GonyeTool.interactionMode = 'none';
    if (window.AciolcerTool) window.AciolcerTool.interactionMode = 'none';
    if (window.PergelTool) window.PergelTool.interactionMode = 'none';

if (window.Scene3D) {
        // Eğer yeni seçilen araç bir 3D oluşturma aracı değilse
        if (tool !== 'sphere' && !tool.startsWith('prism') && !tool.startsWith('pyramid')) {
             window.Scene3D.activeTool = 'none'; 
             // DİKKAT: Gizleme (hidden) ve Silme (clearScene) kodlarını kaldırdık.
             // Böylece 3D şekiller ekranda kalır ve üzerlerine çizim yapabilirsiniz.
        }
    }  
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    redrawAllStrokes(); 

    currentTool = tool;

    if (tool === 'pen') {
        penButton.classList.add('active');
        body.classList.add('cursor-pen');
        penOptions.classList.remove('hidden'); 
    } else if (tool === 'eraser') {
        eraserButton.classList.add('active');
        body.classList.add('cursor-eraser');
    } else if (tool === 'point') {
        lineButton.classList.add('active'); 
        pointButton.classList.add('active');
        // lineOptions.classList.remove('hidden');  <-- BU SATIRI SİLİN VEYA YORUMA ALIN
    } else if (tool === 'straightLine') { 
        lineButton.classList.add('active');
        straightLineButton.classList.add('active');
        // lineOptions.classList.remove('hidden');  <-- BU SATIRI SİLİN VEYA YORUMA ALIN
    } else if (tool === 'line') { 
        lineButton.classList.add('active');
        infinityLineButton.classList.add('active');
        // lineOptions.classList.remove('hidden');  <-- BU SATIRI SİLİN VEYA YORUMA ALIN
    } else if (tool === 'segment') { 
        lineButton.classList.add('active');
        segmentButton.classList.add('active');
        // lineOptions.classList.remove('hidden');  <-- BU SATIRI SİLİN VEYA YORUMA ALIN
    } else if (tool === 'ray') { 
        lineButton.classList.add('active');
        rayButton.classList.add('active');
        // lineOptions.classList.remove('hidden');  <-- BU SATIRI SİLİN VEYA YORUMA ALIN
    } else if (tool === 'ruler') {
        rulerButton.classList.add('active');
        if (window.RulerTool) window.RulerTool.show();
    } else if (tool === 'gonye') {
        gonyeButton.classList.add('active');
        if (window.GonyeTool) window.GonyeTool.show();
    } else if (tool === 'aciolcer') {
        aciolcerButton.classList.add('active');
        if (window.AciolcerTool) window.AciolcerTool.show();
    } else if (tool === 'pergel') {
        pergelButton.classList.add('active');
        if (window.PergelTool) window.PergelTool.show();
    } else if (tool.startsWith('draw_polygon_')) { 
        polygonButton.classList.add('active');
    } else if (tool === 'move') {
        moveButton.classList.add('active');
    } else if (tool === 'fill') {
        if(fillButton) {
            fillButton.classList.add('active');
            fillOptions.classList.remove('hidden');
            fillOptions.style.display = 'flex';
            const buttonRect = fillButton.getBoundingClientRect();
            const panelRect = fillButton.parentElement.getBoundingClientRect();
            const topOffset = buttonRect.top - panelRect.top;
            fillOptions.style.top = `${topOffset}px`;
        }
    }
    
    redrawAllStrokes(); 
}

// --- BUTON OLAYLARI ---

penButton.addEventListener('click', () => setActiveTool(currentTool === 'pen' ? 'none' : 'pen'));
eraserButton.addEventListener('click', () => setActiveTool(currentTool === 'eraser' ? 'none' : 'eraser'));
rulerButton.addEventListener('click', () => { if (window.RulerTool) { window.RulerTool.toggle(); rulerButton.classList.toggle('active', !window.RulerTool.rulerElement.style.display); } });
gonyeButton.addEventListener('click', () => { if (window.GonyeTool) { window.GonyeTool.toggle(); gonyeButton.classList.toggle('active', !window.GonyeTool.gonyeElement.style.display); } });
aciolcerButton.addEventListener('click', () => { if (window.AciolcerTool) { window.AciolcerTool.toggle(); aciolcerButton.classList.toggle('active', !window.AciolcerTool.aciolcerElement.style.display); } });
pergelButton.addEventListener('click', () => { if (window.PergelTool) { window.PergelTool.toggle(); pergelButton.classList.toggle('active', !window.PergelTool.pergelElement.classList.contains('hidden')); } });
undoButton.addEventListener('click', undoLastStroke);
clearAllButton.addEventListener('click', clearAllStrokes);
moveButton.addEventListener('click', () => setActiveTool(currentTool === 'move' ? 'none' : 'move'));

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

if (prevPageBtn && nextPageBtn) {
    
    // Önceki Sayfa (<)
    prevPageBtn.addEventListener('click', () => {
        if (currentPDF && currentPDFPage > 1) {
            currentPDFPage--; // Sayfayı 1 azalt
            renderPDFPage(currentPDFPage); // Yeni sayfayı çiz
        }
    });

    // Sonraki Sayfa (>)
    nextPageBtn.addEventListener('click', () => {
        if (currentPDF && currentPDFPage < totalPDFPages) {
            currentPDFPage++; // Sayfayı 1 artır
            renderPDFPage(currentPDFPage); // Yeni sayfayı çiz
        }
    });
}

if (uploadButton && fileInput) {
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // --- DURUM A: PDF YÜKLEME ---
        if (file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = async function() {
                const typedarray = new Uint8Array(this.result);
                try {
                    // 1. PDF'i Yükle
                    currentPDF = await pdfjsLib.getDocument(typedarray).promise;
                    totalPDFPages = currentPDF.numPages;
                    
                    // 2. KULLANICIYA BAŞLANGIÇ SAYFASINI SOR
                    let startPage = prompt(`Bu kitap ${totalPDFPages} sayfa. Hangi sayfadan başlamak istersiniz?`, "1");
                    
                    // Girdi kontrolü (Geçersizse veya İptal ise 1'den başla)
                    currentPDFPage = parseInt(startPage);
                    if (!currentPDFPage || currentPDFPage < 1 || currentPDFPage > totalPDFPages) {
                        currentPDFPage = 1;
                    }

                    // 3. Paneli Göster
                    pdfControls.classList.remove('hidden');
                    pdfControls.style.display = 'flex';
                    
                    // 4. Seçilen Sayfayı Çiz
                    renderPDFPage(currentPDFPage);

                } catch (error) {
                    console.error("PDF hatası:", error);
                    alert("PDF okunurken bir hata oluştu.");
                }
            };
            fileReader.readAsArrayBuffer(file);
        } 
        // --- DURUM B: EĞER DOSYA RESİM İSE (JPG, PNG) ---
        else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    addToCanvasAsObject(img); // Ortak fonksiyonu çağır
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        e.target.value = ''; 
    });
}

// Resmi veya PDF Sayfasını Hafızaya Ekleyen Ortak Fonksiyon
function addToCanvasAsObject(img) {
    let startWidth = 400;
    if (img.width < 400) startWidth = img.width;
    
    let scaleFactor = startWidth / img.width;
    let startHeight = img.height * scaleFactor;

    drawnStrokes.push({
        type: 'image',
        img: img,
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: startWidth,
        height: startHeight,
        rotation: 0,
        isBackground: true // <--- İŞTE BU ETİKET EKSİKTİ!
    });
    
    redrawAllStrokes();
}

if(fillButton) fillButton.addEventListener('click', () => setActiveTool(currentTool === 'fill' ? 'none' : 'fill'));
if(fillColorBoxes) {
    fillColorBoxes.forEach(box => {
        const handler = (e) => {
            e.stopPropagation();
            fillColorBoxes.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            currentFillColor = e.target.dataset.color || e.target.style.backgroundColor;
            setActiveTool('fill');
        };
        box.addEventListener('click', handler);
        box.addEventListener('touchstart', handler, {passive:false});
    });
    if(fillColorBoxes.length>0) { fillColorBoxes[0].classList.add('selected'); currentFillColor = fillColorBoxes[0].dataset.color || fillColorBoxes[0].style.backgroundColor; }
}

colorBoxes.forEach(box => {
    box.addEventListener('click', (e) => {
        colorBoxes.forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        currentPenColor = e.target.style.backgroundColor;
    });
});
colorBoxes[0].classList.add('selected');
currentPenColor = colorBoxes[0].style.backgroundColor;

lineButton.addEventListener('click', () => {
    if (lineButton.classList.contains('active')) { setActiveTool('none'); } 
    else {
        setActiveTool('none'); 
        lineOptions.classList.remove('hidden'); lineOptions.style.display = 'flex'; lineButton.classList.add('active'); 
        const buttonRect = lineButton.getBoundingClientRect();
        const panelRect = lineButton.parentElement.getBoundingClientRect();
        lineOptions.style.top = `${buttonRect.top - panelRect.top}px`;
    }
});

// Çokgen Renk Seçimi (Varsayılan Beyaz)
if (polygonColorOptions.length > 0) {
    polygonColorOptions[0].classList.add('selected');
    window.currentLineColor = polygonColorOptions[0].dataset.color || '#FFFFFF'; 
    
    polygonColorOptions.forEach(box => {
        const handleColorSelect = (e) => {
            e.stopPropagation(); e.preventDefault();
            polygonColorOptions.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            const color = e.target.dataset.color || e.target.style.backgroundColor;
            window.currentLineColor = color; 
            try { if (window.audio_select) { window.audio_select.currentTime=0; window.audio_select.play(); } else if (window.audio_click) { window.audio_click.currentTime=0; window.audio_click.play(); } } catch(err){}
        };
        box.addEventListener('click', handleColorSelect);
        box.addEventListener('touchstart', handleColorSelect, { passive: false });
    });
}

polygonButton.addEventListener('click', () => {
    if (polygonButton.classList.contains('active')) { setActiveTool('none'); } 
    else {
        setActiveTool('none'); 
        polygonOptions.classList.remove('hidden'); polygonOptions.style.display = 'flex'; polygonButton.classList.add('active'); 
        const buttonRect = polygonButton.getBoundingClientRect();
        const panelRect = polygonButton.parentElement.getBoundingClientRect();
        const menuHeight = polygonOptions.offsetHeight;
        const windowHeight = window.innerHeight;
        const margin = 10;
        let topOffset = buttonRect.top - panelRect.top;
        if (buttonRect.top + menuHeight > (windowHeight - margin)) {
            topOffset = (windowHeight - menuHeight - margin) - panelRect.top;
        }
        polygonOptions.style.top = `${topOffset}px`;
    }
});

oyunlarButton.addEventListener('click', () => {
    if (oyunlarButton.classList.contains('active')) { setActiveTool('none'); } 
    else {
        setActiveTool('none'); 
        oyunlarOptions.innerHTML = ''; 
        if (window.OyunListesi && window.OyunListesi.length > 0) {
            window.OyunListesi.forEach(oyun => {
                const linkElement = document.createElement('a');
                linkElement.href = oyun.link;
                linkElement.innerText = oyun.isim;
                linkElement.target = "_blank";
                oyunlarOptions.appendChild(linkElement);
            });
        } else { oyunlarOptions.innerText = "Oyun bulunamadı."; }
        oyunlarOptions.classList.remove('hidden'); oyunlarOptions.style.display = 'flex'; oyunlarButton.classList.add('active'); 
        setTimeout(() => {
            const buttonRect = oyunlarButton.getBoundingClientRect();
            const panelRect = oyunlarButton.parentElement.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const margin = 10; 
            let topOffset = buttonRect.top - panelRect.top;
            const menuHeight = oyunlarOptions.offsetHeight;
            if (buttonRect.top + menuHeight > (windowHeight - margin)) {
                topOffset = (windowHeight - menuHeight - margin) - panelRect.top;
                if (topOffset < 0) topOffset = 0; 
            }
            oyunlarOptions.style.top = `${topOffset}px`;
        }, 0); 
    }
});

circleButton.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTool('draw_polygon_circle');
    window.PolygonTool.handleDrawClick(null, 0); 
    regularPolygonButtons.forEach(b => b.classList.remove('active'));
    circleButton.classList.add('active');
});

regularPolygonButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const sides = parseInt(e.target.dataset.sides);
        setActiveTool(`draw_polygon_${sides}_sides`);
        window.PolygonTool.handleDrawClick(null, sides); 
        regularPolygonButtons.forEach(b => b.classList.remove('active'));
        circleButton.classList.remove('active');
        e.target.classList.add('active');
    });
});

pointButton.addEventListener('click', (e) => {
    e.stopPropagation(); 
    if (window.audio_select) window.audio_select.play();
    if (!audio_click_src_set) { audio_click.src = 'sesler/point-smooth-beep-230573.mp3'; audio_click_src_set = true; }
    setActiveTool(currentTool === 'point' ? 'none' : 'point');
});
straightLineButton.addEventListener('click', (e) => { e.stopPropagation(); if(window.audio_select) window.audio_select.play(); setActiveTool(currentTool === 'straightLine' ? 'none' : 'straightLine'); });
infinityLineButton.addEventListener('click', (e) => { e.stopPropagation(); if(window.audio_select) window.audio_select.play(); setActiveTool(currentTool === 'line' ? 'none' : 'line'); });
segmentButton.addEventListener('click', (e) => { e.stopPropagation(); if(window.audio_select) window.audio_select.play(); setActiveTool(currentTool === 'segment' ? 'none' : 'segment'); });
rayButton.addEventListener('click', (e) => { e.stopPropagation(); if(window.audio_select) window.audio_select.play(); setActiveTool(currentTool === 'ray' ? 'none' : 'ray'); });

lineColorOptions.forEach(box => {
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        lineColorOptions.forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        const color = e.target.dataset.color || e.target.style.backgroundColor;
        window.currentLineColor = color; 
    });
});
lineColorOptions[0].classList.add('selected');
window.currentLineColor = lineColorOptions[0].dataset.color || lineColorOptions[0].style.backgroundColor; 

// --- app.js: Canlandır Butonu (Dokunmatik ve Tıklama GARANTİLİ) ---
if (animateButton) {
    const toggleAnimate = (e) => {
        // Dokunmatik ekranlarda çift tetiklenmeyi ve diğer araçların araya girmesini önle
        if (e && e.cancelable) e.preventDefault(); 
        if (e) e.stopPropagation(); 

        // Modu Değiştir
        setActiveTool(currentTool === 'snapshot' ? 'none' : 'snapshot');
        
        // Görsel Ayarlar (Aktiflik Rengi ve İmleç)
        if (currentTool === 'snapshot') {
            animateButton.classList.add('active');
            body.classList.add('cursor-snapshot'); 
        } else {
            animateButton.classList.remove('active');
            body.classList.remove('cursor-snapshot');
        }
    };

    // 1. Standart Tıklama (Mouse için)
    animateButton.addEventListener('click', toggleAnimate);
    
    // 2. Parmak Dokunuşu (Akıllı Tahta için ŞART olan kısım)
    animateButton.addEventListener('touchstart', toggleAnimate, { passive: false });
}

// --- 3D ŞEKİLLER MENÜ MANTIĞI ---

const btn3D = document.getElementById('btn-3d-shapes');
const options3D = document.getElementById('shapes-3d-options');
const btnPyramids = document.getElementById('btn-pyramids-toggle');
const listPyramids = document.getElementById('pyramids-list');
const btnPrisms = document.getElementById('btn-prisms-toggle');
const listPrisms = document.getElementById('prisms-list');

// app.js

// app.js

// 1. Ana "3D Şekiller" Butonu (TAM HİZALAMA)
if (btn3D) {
    btn3D.addEventListener('click', (e) => {
        e.stopPropagation();

        // Diğer menüleri kapat
        if (polygonOptions) polygonOptions.classList.add('hidden');
        if (lineOptions) lineOptions.classList.add('hidden');
        if (fillOptions) fillOptions.classList.add('hidden');
        if (oyunlarOptions) oyunlarOptions.classList.add('hidden');
        
        // Menüyü Aç/Kapat
        if (options3D.classList.contains('hidden')) {
            options3D.classList.remove('hidden');
            
            // --- HİZALAMA ---
            // Menünün tepesini (top), tıkladığımız butonun tepesine (offsetTop) eşitle
            // Böylece menü tam butonun yanından başlar.
            options3D.style.top = btn3D.offsetTop + 'px'; 
            
            btn3D.classList.add('active');
            setActiveTool('none'); 
        } else {
            options3D.classList.add('hidden');
            btn3D.classList.remove('active');
            
            // Alt menüleri de kapat ki sonraki açılışta temiz gelsin
            if(listPrisms) listPrisms.classList.add('hidden');
            if(listPyramids) listPyramids.classList.add('hidden');
        }
    });
}

// app.js

// 2. "Prizmalar" Butonu (AKILLI HİZALAMA EKLENDİ)
if (btnPrisms) {
    btnPrisms.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        // Diğerini kapat
        if(listPyramids) listPyramids.classList.add('hidden');
        
        // Bu menüyü aç/kapat
        listPrisms.classList.toggle('hidden');
        
        if (!listPrisms.classList.contains('hidden')) {
            listPrisms.style.display = 'flex';
            
            // 1. Varsayılan Konum: Butonun tam hizası
            let targetTop = btnPrisms.offsetTop;
            listPrisms.style.top = targetTop + 'px';
            
            // 2. Ekrana Sığıyor mu Kontrol Et (Gecikmeli kontrol daha sağlıklı)
            setTimeout(() => {
                const rect = listPrisms.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const margin = 10; // Alt boşluk

                // Eğer menünün altı ekranı geçiyorsa
                if (rect.bottom > windowHeight - margin) {
                    const overflow = rect.bottom - (windowHeight - margin);
                    targetTop = targetTop - overflow; // Taşan miktar kadar yukarı çek
                    listPrisms.style.top = targetTop + 'px';
                }
            }, 0);
        } else {
            listPrisms.style.display = 'none';
        }
        
        // Ok işaretlerini güncelle
        btnPrisms.innerText = listPrisms.classList.contains('hidden') ? 'Prizmalar ▶' : 'Prizmalar ◀';
        if(btnPyramids) btnPyramids.innerText = 'Piramitler ▶'; 
    });
}

// 3. "Piramitler" Butonu (AKILLI HİZALAMA EKLENDİ)
if (btnPyramids) {
    btnPyramids.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Diğerini kapat
        if(listPrisms) listPrisms.classList.add('hidden');
        
        // Bu menüyü aç/kapat
        listPyramids.classList.toggle('hidden');
        
        if (!listPyramids.classList.contains('hidden')) {
            listPyramids.style.display = 'flex';
            
            // 1. Varsayılan Konum: Butonun tam hizası
            let targetTop = btnPyramids.offsetTop;
            listPyramids.style.top = targetTop + 'px';
            
            // 2. Ekrana Sığıyor mu Kontrol Et
            setTimeout(() => {
                const rect = listPyramids.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const margin = 10;

                if (rect.bottom > windowHeight - margin) {
                    const overflow = rect.bottom - (windowHeight - margin);
                    targetTop = targetTop - overflow;
                    listPyramids.style.top = targetTop + 'px';
                }
            }, 0);
        } else {
            listPyramids.style.display = 'none';
        }
        
        // Ok işaretlerini güncelle
        btnPyramids.innerText = listPyramids.classList.contains('hidden') ? 'Piramitler ▶' : 'Piramitler ◀';
        if(btnPrisms) btnPrisms.innerText = 'Prizmalar ▶'; 
    });
}
// app.js içinde bul: "// 4. En Alt Seviye Seçim Butonları"

document.querySelectorAll('.tool-button-sub-item, #btn-sphere').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Görsel seçim
        document.querySelectorAll('.tool-button-sub-item, #btn-sphere').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const shapeType = btn.dataset.shape; 
        
        // Aracı aktif et
        setActiveTool(shapeType); 
        
        // 3D Motoruna ilet
        if (window.Scene3D) {
            window.Scene3D.setTool(shapeType);
        }

        // ▼▼▼ OTOMATİK KAPATMA KODU ▼▼▼
        // Seçim yapıldı, şimdi menüyü gizle
        const options3D = document.getElementById('shapes-3d-options');
        if (options3D) {
            options3D.classList.add('hidden');
            options3D.style.display = 'none';
        }
        // Ana 3D butonu aktif kalsın ki modun 3D olduğu belli olsun
        const btn3D = document.getElementById('btn-3d-shapes');
        if (btn3D) btn3D.classList.add('active');
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    });
});

// --- MOUSE OLAYLARI ---

// --- FARE TIKLAMA (MOUSEDOWN) - DÜZELTİLMİŞ ---
canvas.addEventListener('mousedown', (e) => {
    const pos = getEventPosition(e);

    // ▼▼▼ DÜZELTME BAŞLANGICI: Çizim yaparken 3D'yi yoksay ▼▼▼
    
    // Eğer çizim araçlarından biri seçiliyse, 3D etkileşimine izin verme
    const isDrawingTool = (
        currentTool === 'pen' || 
        currentTool === 'eraser' || 
        currentTool === 'point' || 
        currentTool === 'straightLine' || 
        currentTool === 'line' || 
        currentTool === 'segment' || 
        currentTool === 'ray' ||
        currentTool.startsWith('draw_polygon_') ||
        currentTool === 'draw_circle'
    );

    // 2. Silgiye özel komutu listenin DIŞINA ve ALTINA yaz
    if (currentTool === 'eraser') {
        isDrawing = true; // Sürükleme başlasın
        handleEraser(pos); // TIKLANDIĞI YERİ HEMEN SİL
        // Eğer bu touchstart içindeyse e.preventDefault() ekli olabilir, mousedown ise return yeterli.
        if (e.type === 'touchstart') e.preventDefault(); 
        return; // Başka işlem yapma
    }

    // 2. 3D Sahne Kontrolü (SADECE Çizim Aracı Seçili DEĞİLSE Çalışsın)
    // Böylece kalem seçiliyken 3D şekle dokunsanız bile şekil dönmez, çizim yapılır.
    if (!isDrawingTool && window.Scene3D && window.Scene3D.isInit) {
        const is3DHit = window.Scene3D.onDown(pos.x, pos.y);
        if (is3DHit) {
            e.preventDefault(); 
            return; 
        }
    }

    // 2. FİZİKSEL ARAÇ KONTROLÜ (Cetvel vb. üzerine tıklanırsa çizim yapma)
    const isToolElementClicked = e.target.closest('.ruler-container, .gonye-container, .aciolcer-container, #compass-container');
    if (isToolElementClicked) { 
        // Araçlara tıklanırsa çizim bayraklarını sıfırla
        isDrawingLine = false;
        isDrawingInfinityLine = false;
        isDrawingSegment = false;
        isDrawingRay = false;
        lineStartPoint = null;
        window.tempPolygonData = null; 
        if(typeof polygonPreviewLabel !== 'undefined') polygonPreviewLabel.classList.add('hidden');
        return; 
    }

    // 3. "TAŞI" (MOVE) MODU
    if (currentTool === 'move') {
        const pos = getEventPosition(e);
        
        // 3D Sahneye ileti (Döndürme/Boyutlandırma için)
        if (window.Scene3D) {
            const is3DHandle = window.Scene3D.onDown(pos.x, pos.y);
            if (is3DHandle) return; 
        }

        const hit = findHit(pos);
        if (hit) {
            // 3D Nesne Seçimi
            if (hit.is3D) {
                isMoving = true;
                dragStartPos = pos;
                selectedItem = { is3D: true }; 
                selectedPointKey = hit.action; 
                return;
            }

            if (hit.pointKey === 'toggle_circle_info') { 
                hit.item.showCircleInfo = !hit.item.showCircleInfo; 
                redrawAllStrokes(); 
                return; 
            }

            // Toggle İşlemleri
            if (hit.pointKey === 'toggle_edges') { hit.item.showEdgeLabels = !hit.item.showEdgeLabels; redrawAllStrokes(); return; }
            if (hit.pointKey === 'toggle_angles') { hit.item.showAngleLabels = !hit.item.showAngleLabels; redrawAllStrokes(); return; }
            if (hit.pointKey === 'toggle_circle_info') { hit.item.showCircleInfo = !hit.item.showCircleInfo; redrawAllStrokes(); return; }

            // Taşıma Başlat
            isMoving = true;
            selectedItem = hit.item;
            selectedPointKey = hit.pointKey;
            dragStartPos = pos;

            // Başlangıç Pozisyonunu Kaydet
            // Başlangıç Pozisyonunu Kaydet (MOUSEDOWN)
            if (hit.pointKey === 'self') {
                originalStartPos = { x: hit.item.x, y: hit.item.y };
            }
            else if (hit.pointKey === 'p1') {
                originalStartPos = { x: hit.item.p1.x, y: hit.item.p1.y };
            }
            else if (hit.pointKey === 'p2') {
                originalStartPos = { x: hit.item.p2.x, y: hit.item.p2.y };
            }
            else if (hit.pointKey === 'center') {
                // A) Çember/Yay
                if (hit.item.type === 'arc' || hit.item.type === 'circle') {
                    originalStartPos = { x: hit.item.cx, y: hit.item.cy };
                } 
                // B) Çokgen
                else {
                    originalStartPos = { x: hit.item.center.x, y: hit.item.center.y };
                }
            }
            else if (hit.pointKey === 'rotate' || hit.pointKey === 'resize' || hit.pointKey === 'image_resize') {
                originalStartPos = { 
                    radius: hit.item.radius, 
                    rotation: hit.item.rotation, 
                    width: hit.item.width, 
                    height: hit.item.height 
                };
            }

            // Pivot ve Diğer Ayarlar
            const itemType = hit.item.type;
            if ((itemType === 'line' || itemType === 'segment' || itemType === 'ray' || itemType === 'straightLine') && (hit.pointKey === 'p1' || hit.pointKey === 'p2')) {
                rotationPivot = (hit.pointKey === 'p1') ? hit.item.p2 : hit.item.p1;
                const movingPoint = (hit.pointKey === 'p1') ? hit.item.p1 : hit.item.p2;
                selectedItem.startRadius = distance(movingPoint, rotationPivot);
            } else {
                rotationPivot = null;
            }
            
            redrawAllStrokes();
            return;
        } else {
            // Boşa tıklandıysa seçimi kaldır ve taşıma modundan çık
            isMoving = false; // FIX: taşıma bayrağını sıfırla
            selectedItem = null;
            redrawAllStrokes();
        }
    }                

    // 4. ÇİZİM ARAÇLARI
    if (currentTool === 'none') return;
    const snapPos = snapTarget || pos;

    // Canlandırma Başlangıcı
    if (currentTool === 'snapshot') {
        snapshotStart = snapPos;
        return;
    }

    // Çokgen / Çember Başlangıcı
    if (currentTool.startsWith('draw_polygon_') || currentTool === 'draw_circle') {
        let type = 0;
        const parts = currentTool.split('_');
        if (parts.length > 2 && !isNaN(parseInt(parts[2]))) {
            type = parseInt(parts[2]);
        }
        
        window.tempPolygonData = {
            type: type,
            center: snapPos,
            radius: 0,
            rotation: 0
        };
        
        if(typeof polygonPreviewLabel !== 'undefined') {
            polygonPreviewLabel.classList.remove('hidden');
            polygonPreviewLabel.style.left = `${snapPos.x}px`;
            polygonPreviewLabel.style.top = `${snapPos.y - 40}px`;
            polygonPreviewLabel.innerText = "Merkez";
        }
        redrawAllStrokes(); 
        return; 
    }

    // Diğer Araçlar
    switch (currentTool) {
        case 'pen':
            isDrawing = true;
            drawnStrokes.push({ type: 'pen', path: [snapPos], color: currentPenColor, width: currentPenWidth });
window.tempPolygonData = null;
            break;

        case 'eraser':
            isDrawing = true;
            handleEraser(pos);
            break;

        case 'point':
            try { if (window.audio_click) { window.audio_click.currentTime = 0; window.audio_click.play(); } } catch(err){}
            isDrawing = false;
            drawnStrokes.push({ type: 'point', x: snapPos.x, y: snapPos.y, label: nextPointChar });
            nextPointChar = advanceChar(nextPointChar);
            redrawAllStrokes();
            break;

        case 'straightLine':
            try { if (window.audio_click) window.audio_click.play(); } catch(err){}
            isDrawingLine = true; lineStartPoint = snapPos;
            redrawAllStrokes(); drawDot(snapPos, currentLineColor);
            break;

        case 'line':
            try { if (window.audio_click) window.audio_click.play(); } catch(err){}
            isDrawingInfinityLine = true; lineStartPoint = pos;
            redrawAllStrokes(); drawDot(pos, currentLineColor);
            break;

        case 'segment':
            try { if (window.audio_click) window.audio_click.play(); } catch(err){}
            isDrawingSegment = true; lineStartPoint = snapPos;
            redrawAllStrokes(); drawDot(snapPos, currentLineColor);
            break;

        case 'ray':
            try { if (window.audio_click) window.audio_click.play(); } catch(err){}
            isDrawingRay = true; lineStartPoint = pos;
            redrawAllStrokes(); drawDot(pos, currentLineColor);
            break;
    }
});


// --- FARE HAREKETİ (MOUSEMOVE) - TAMİR EDİLMİŞ SÜRÜM ---
canvas.addEventListener('mousemove', (e) => {
    const pos = getEventPosition(e);

// --- CANLANDIRMA (SNAPSHOT) KUTUCUĞU ÖNİZLEMESİ ---
    if (currentTool === 'snapshot' && typeof snapshotStart !== 'undefined' && snapshotStart) {
        redrawAllStrokes(); // Önce arka planı (PDF/Resim) tekrar çiz
        
        const w = pos.x - snapshotStart.x;
        const h = pos.y - snapshotStart.y;

        ctx.save();
        ctx.setLineDash([5, 5]); // Kesik çizgi
        ctx.strokeStyle = '#FF0000'; // Kırmızı renk
        ctx.lineWidth = 2;
        ctx.strokeRect(snapshotStart.x, snapshotStart.y, w, h);
        ctx.restore();
        return; // Diğer çizim işlemlerini engelle
    }

// --- SİLGİ İMLECİNİ HAREKET ETTİR ---
    if (currentTool === 'eraser' && typeof eraserPreview !== 'undefined') {
        eraserPreview.style.left = `${pos.x}px`;
        eraserPreview.style.top = `${pos.y}px`;
        eraserPreview.style.display = 'block';
    } else if (typeof eraserPreview !== 'undefined') {
        eraserPreview.style.display = 'none';
    }

    currentMousePos = pos;

    // 1. 3D HAREKET KÖPRÜSÜ
    if (window.Scene3D) {
        if (window.Scene3D.activeTool !== 'none' && (currentTool === 'sphere' || currentTool.startsWith('prism') || currentTool.startsWith('pyramid'))) {
            window.Scene3D.onMove(pos.x, pos.y);
            return;
        }
        if (window.Scene3D.currentMesh) {
            window.Scene3D.onMove(pos.x, pos.y);
        }
    }

    // 2. TAŞIMA (MOVE) ARACI
    if (currentTool === 'move' && isMoving && selectedItem) {
        const dx = pos.x - dragStartPos.x;
        const dy = pos.y - dragStartPos.y;
        
        if (selectedItem.is3D) {
            // 3D taşıma Scene3D içinde hallediliyor
        } else {
            // 2D Nesne Taşıma
            if (selectedPointKey === 'image_resize') {
                const distFromCenterX = Math.abs(pos.x - selectedItem.x);
                const distFromCenterY = Math.abs(pos.y - selectedItem.y);
                selectedItem.width = Math.max(20, distFromCenterX * 2);
                selectedItem.height = Math.max(20, distFromCenterY * 2);
            }
            else if (selectedPointKey === 'rotate') {
                const center = selectedItem.center;
                if(center) {
                    const r_dx = pos.x - center.x;
                    const r_dy = pos.y - center.y;
                    const newAngleRad = Math.atan2(r_dy, r_dx); 
                    selectedItem.rotation = newAngleRad * (180 / Math.PI);
                }
            } 
            else if (selectedPointKey === 'resize') {
                if (selectedItem.type === 'arc' || selectedItem.type === 'circle') {
                    const center = { x: selectedItem.cx, y: selectedItem.cy };
                    selectedItem.radius = distance(center, pos);
                } else {
                    const center = selectedItem.center;
                    if(center) selectedItem.radius = distance(center, pos);
                }
            } 
            else if (rotationPivot) { 
                const pivot = rotationPivot;
                const movingPointKey = selectedPointKey; 
                const r_dx = pos.x - pivot.x;
                const r_dy = pos.y - pivot.y;
                const currentAngle = Math.atan2(r_dy, r_dx);
                if(selectedItem[movingPointKey]) {
                    selectedItem[movingPointKey].x = pivot.x + Math.cos(currentAngle) * selectedItem.startRadius;
                    selectedItem[movingPointKey].y = pivot.y + Math.sin(currentAngle) * selectedItem.startRadius;
                }
            } 
            else {
                if (selectedPointKey === 'self') {
                selectedItem.x = originalStartPos.x + dx;
                selectedItem.y = originalStartPos.y + dy;
            } else if (selectedPointKey === 'p1') {
                selectedItem.p1.x = originalStartPos.x + dx;
                selectedItem.p1.y = originalStartPos.y + dy;
            } else if (selectedPointKey === 'p2') {
                selectedItem.p2.x = originalStartPos.x + dx;
                selectedItem.p2.y = originalStartPos.y + dy;
            } else if (selectedPointKey === 'center') {
                // A) ÇEMBER (Arc / Circle) Taşıma
                if (selectedItem.type === 'arc') {
                    selectedItem.cx = originalStartPos.x + dx;
                    selectedItem.cy = originalStartPos.y + dy;
                }
                // B) ÇOKGEN (Polygon) Taşıma
                else if (selectedItem.type === 'polygon') {
                    selectedItem.center.x = originalStartPos.x + dx;
                    selectedItem.center.y = originalStartPos.y + dy;
                    // Köşeleri de güncelle
                    if(window.PolygonTool && window.PolygonTool.updateVertices) {
                        window.PolygonTool.updateVertices(selectedItem);
                    }
                }
            }
            }
        }
        redrawAllStrokes();
        return; 
    }

// --- KRİTİK DÜZELTME: KALEMİ EN BAŞA ALDIK ---
    if (isDrawing && currentTool === 'pen') {
        if (drawnStrokes.length > 0) {
            const currentStroke = drawnStrokes[drawnStrokes.length - 1];
            // Path dizisi var mı kontrol et, yoksa oluştur
            if (!currentStroke.path) currentStroke.path = [];
            
            currentStroke.path.push(pos);
            
            // Performans için sadece yeni parçayı çiz (isteğe bağlı) veya hepsini yenile
            redrawAllStrokes(); 
        }
        return; // Kalem aktifse aşağıdaki önizleme kodlarını çalıştırma
    }
    // --- KALEM BİTİŞ ---


    // 3. FİZİKSEL ARAÇ VE SNAP KONTROLÜ
    const isToolElementClicked = e.target.closest('.ruler-container, .gonye-container, .aciolcer-container, #compass-container');
    if (isToolElementClicked) return;

    // Akıllı Yakalama
    clearTimeout(snapHoverTimer); snapHoverTimer = null;
    const canSnap = (currentTool === 'point' || currentTool === 'straightLine' || currentTool === 'pen' || currentTool === 'segment');
    
    if (canSnap) {
        const potentialSnap = findSnapPoint(pos);
        if (potentialSnap) {
            snapHoverTimer = setTimeout(() => {
                snapTarget = potentialSnap;
                if(typeof snapIndicator !== 'undefined') {
                    snapIndicator.style.left = `${snapTarget.x}px`;
                    snapIndicator.style.top = `${snapTarget.y}px`;
                    snapIndicator.style.display = 'block';
                }
            }, 25);
        } else {
            snapTarget = null;
            if(typeof snapIndicator !== 'undefined') snapIndicator.style.display = 'none';
        }
    } else {
        snapTarget = null;
        if(typeof snapIndicator !== 'undefined') snapIndicator.style.display = 'none';
    }

    // --- 4. ŞEKİL VE ÇİZİM ÖNİZLEMELERİ ---
    let previewActive = false;
    const drawEndPos = snapTarget || pos;
// ---------------------------------------------------------
    // EKSİK OLAN ÇİZİM MANTIKLARI BURAYA EKLENDİ
    // ---------------------------------------------------------

    // A) Düz Çizgi
    // A) Düz Çizgi
    if (currentTool === 'straightLine' && isDrawingLine) {
        redrawAllStrokes(); 
        
        ctx.save(); 
        ctx.setLineDash([10, 5]); 
        ctx.globalAlpha = 0.6;    

        ctx.beginPath(); 
        ctx.moveTo(lineStartPoint.x, lineStartPoint.y); 
        ctx.lineTo(drawEndPos.x, drawEndPos.y);
        ctx.strokeStyle = currentLineColor; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        
        ctx.restore(); 

        drawDot(lineStartPoint, currentLineColor); 
        drawDot(drawEndPos, currentLineColor);

        // ▼▼▼ ETİKET GÜNCELLEME ▼▼▼
        const dist = distance(lineStartPoint, drawEndPos);
        const cmVal = (dist / 30).toFixed(1).replace('.', ',');
        previewLabel2D.innerText = `${cmVal} cm`;
        previewLabel2D.style.display = 'block';
        previewLabel2D.style.left = (drawEndPos.x + 15) + 'px';
        previewLabel2D.style.top = (drawEndPos.y - 25) + 'px';
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }
    // B) Doğru (Sonsuz)
    else if (currentTool === 'line' && isDrawingInfinityLine) {
        redrawAllStrokes();
        
        ctx.save(); 
        ctx.setLineDash([10, 5]); 
        ctx.globalAlpha = 0.6;

        drawInfinityLine(lineStartPoint, drawEndPos, currentLineColor, 3, false);
        
        ctx.restore();

        drawDot(lineStartPoint, currentLineColor); 
        drawDot(drawEndPos, currentLineColor);
    }
    // C) Doğru Parçası
    else if (currentTool === 'segment' && isDrawingSegment) {
        redrawAllStrokes(); 
        
        ctx.save(); 
        ctx.setLineDash([10, 5]); 
        ctx.globalAlpha = 0.6;

        ctx.beginPath(); 
        ctx.moveTo(lineStartPoint.x, lineStartPoint.y); 
        ctx.lineTo(drawEndPos.x, drawEndPos.y);
        ctx.strokeStyle = currentLineColor; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        
        ctx.restore();

        drawDot(lineStartPoint, currentLineColor); 
        drawDot(drawEndPos, currentLineColor);

        // ▼▼▼ ETİKET GÜNCELLEME ▼▼▼
        const dist = distance(lineStartPoint, drawEndPos);
        const cmVal = (dist / 30).toFixed(1).replace('.', ',');
        previewLabel2D.innerText = `${cmVal} cm`;
        previewLabel2D.style.display = 'block';
        previewLabel2D.style.left = (drawEndPos.x + 15) + 'px';
        previewLabel2D.style.top = (drawEndPos.y - 25) + 'px';
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    }
    // D) Işın
    else if (currentTool === 'ray' && isDrawingRay) {
        redrawAllStrokes(); 
        
        ctx.save(); 
        ctx.setLineDash([10, 5]); 
        ctx.globalAlpha = 0.6;

        drawInfinityLine(lineStartPoint, drawEndPos, currentLineColor, 3, true); 
        
        ctx.restore();

        drawDot(lineStartPoint, currentLineColor); 
        drawDot(drawEndPos, currentLineColor);
    }
    // E) Çokgen ve Çember Önizleme
    else if (window.tempPolygonData && window.tempPolygonData.center) {
        const center = window.tempPolygonData.center;
        const type = window.tempPolygonData.type;
        const currentRadius = distance(center, drawEndPos);
        const dx = drawEndPos.x - center.x;
        const dy = drawEndPos.y - center.y;
        const currentRotationDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        // Veriyi güncelle
        window.tempPolygonData.rotation = currentRotationDeg;
        window.tempPolygonData.radius = currentRadius;

        redrawAllStrokes(); // Temizle

        ctx.save();
        ctx.beginPath();
        // Çember
        if (type === 0) {
             ctx.arc(center.x, center.y, currentRadius, 0, 2 * Math.PI);
        } 
        // Çokgenler
        else if (window.PolygonTool && window.PolygonTool.calculateVertices) {
             const vertices = window.PolygonTool.calculateVertices(center, currentRadius, type, currentRotationDeg);
             if (vertices.length > 0) {
                 ctx.moveTo(vertices[0].x, vertices[0].y);
                 for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
                 ctx.closePath();
             }
        }
        ctx.globalAlpha = 0.6; 
        ctx.setLineDash([10, 5]);
        ctx.strokeStyle = currentLineColor; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        drawDot(center, currentLineColor);
        ctx.restore();
        
        // Etiket Güncelleme
        if(typeof polygonPreviewLabel !== 'undefined') {
            polygonPreviewLabel.style.left = `${drawEndPos.x}px`;
            polygonPreviewLabel.style.top = `${drawEndPos.y - 50}px`;
            polygonPreviewLabel.classList.remove('hidden');
            const pixelPerCm = (window.PolygonTool && window.PolygonTool.PIXELS_PER_CM) ? window.PolygonTool.PIXELS_PER_CM : 30;
            const cmRadius = (currentRadius / pixelPerCm).toFixed(1);
            polygonPreviewLabel.innerText = (type === 0) ? `Yarıçap: ${cmRadius} cm` : `Boyut: ${cmRadius} cm`;
        }
    }
    // F) Kalem (Sürekli Çizim - Mouse)
    if (typeof isDrawing !== 'undefined' && isDrawing) {
        
        // A) SİLGİ
        if (currentTool === 'eraser') {
            handleEraser(pos); 
        }
        // B) KALEM
        else if (currentTool === 'pen') {
            if (drawnStrokes.length > 0) {
                const currentStroke = drawnStrokes[drawnStrokes.length - 1];
                
                // snapPos (varsa) yoksa normal pos kullan
                const drawPos = (typeof snapPos !== 'undefined' && snapPos) ? snapPos : pos;
                
                // Path dizisi güvenliği
                if (!currentStroke.path) currentStroke.path = [];
                
                currentStroke.path.push(drawPos);
                redrawAllStrokes();
            }
        }
    }

});


// --- app.js: TAM VE EKSİKSİZ TOUCHSTART BLOĞU ---

canvas.addEventListener('touchstart', (e) => {
    const pos = getEventPosition(e);

    // 1. ÖNCE ÇİFT PARMAK (PINCH ZOOM) KONTROLÜ
    if (e.touches.length === 2) {
        // 3D Nesne Zoom Başlangıcı
        if (window.Scene3D && window.Scene3D.currentMesh) {
            const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
            const dist = distance(p1, p2);
            window.Scene3D.startPinch(dist);
            return; // 2D zoom'u engelle
        }

        // 2D Zoom Başlangıcı
        isPinching = true;
        isMoving = false;
        const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
        initialDistance = distance(p1, p2);
        
        // Seçili 2D resim varsa onun boyutunu al
        if (selectedItem && selectedItem.type === 'image') {
            initialScale = selectedItem.width; 
        }
        return;
    }

// ▼▼▼ DÜZELTME BURADA: Çizim Aracı Kontrolü ▼▼▼
    
    // Eğer bir çizim aracı seçiliyse, 3D motorunu devre dışı bırak
    const isDrawingTool = (
        currentTool === 'pen' || 
        currentTool === 'eraser' || 
        currentTool === 'point' || 
        currentTool === 'straightLine' || 
        currentTool === 'line' || 
        currentTool === 'segment' || 
        currentTool === 'ray' ||
        currentTool.startsWith('draw_polygon_') ||
        currentTool === 'draw_circle'
    );

    // 2. 3D SAHNE KONTROLÜ (TEK PARMAK)
    // Sadece "Çizim Aracı DEĞİLSE" (!isDrawingTool) 3D'ye bak
    if (!isDrawingTool && window.Scene3D && window.Scene3D.isInit) {
        const is3DHit = window.Scene3D.onDown(pos.x, pos.y);
        
        // Eğer 3D nesneye dokunulduysa ve çizim yapmıyorsak, olayı burada bitir
        if (is3DHit) {
            e.preventDefault(); 
            return; 
        }
    }
    // ▲▲▲ DÜZELTME SONU ▲▲▲
    // 3. 2D İŞLEMLERİ
    e.preventDefault(); 
    const snapPos = snapTarget || pos;
    currentMousePos = pos; 

if (currentTool === 'eraser') {
        isDrawing = true;
        handleEraser(pos); // DOKUNULAN YERİ HEMEN SİL
        // e.preventDefault() zaten yukarıda var
    }

    // Fiziksel Araç Kontrolü
    const isToolElementClicked = e.target.closest('.ruler-container, .gonye-container, .aciolcer-container, #compass-container');
    if (isToolElementClicked) return; 

if (isToolElementClicked) return; 

    // --- BURAYI EKLE (CANLANDIRMA İÇİN GEREKLİ) ---
    if (currentTool === 'snapshot') {
        isDrawing = false;
        isMoving = false;
        isPinching = false;
        snapshotStart = snapPos; 
        return; 
    }

    // Taşıma Aracı
   // Taşıma Aracı (GÜÇLENDİRİLMİŞ DOKUNMATİK VERSİYON)
    if (currentTool === 'move') {
        const hit = findHit(pos);
        if (hit) {
            if (hit.is3D) return; 
            
            // 1. Bilgi Aç/Kapa (Toggle) İşlemleri (Hareket gerektirmez, dokun ve yap)
            let actionDone = false;
            
            // Çember Kenar Bilgisi
            if (hit.pointKey === 'toggle_circle_info') { 
                hit.item.showCircleInfo = !hit.item.showCircleInfo; 
                actionDone = true;
            }
            // Çokgen Kenar/Açı Bilgisi
            else if (hit.pointKey === 'toggle_edges') { 
                hit.item.showEdgeLabels = !hit.item.showEdgeLabels; 
                actionDone = true;
            }
            else if (hit.pointKey === 'toggle_angles') { 
                hit.item.showAngleLabels = !hit.item.showAngleLabels; 
                actionDone = true;
            }

            if (actionDone) {
                redrawAllStrokes();
                return; // Taşıma moduna girmeden çık
            }

            // 2. Taşıma veya Düzenleme Başlat (Move/Resize/Rotate)
            isMoving = true; 
            selectedItem = hit.item; 
            selectedPointKey = hit.pointKey; 
            dragStartPos = pos; 
            
            // Başlangıç değerlerini kaydet
            if (hit.pointKey === 'self') {
                originalStartPos = { x: hit.item.x, y: hit.item.y };
            }
            else if (hit.pointKey === 'center') {
                // Çember veya Çokgen merkezi
                if (hit.item.type === 'arc' || hit.item.type === 'circle') {
                    originalStartPos = { x: hit.item.cx, y: hit.item.cy };
                } else {
                    originalStartPos = { x: hit.item.center.x, y: hit.item.center.y };
                }
            }
            else if (hit.pointKey === 'p1') { originalStartPos = { x: hit.item.p1.x, y: hit.item.p1.y }; }
            else if (hit.pointKey === 'p2') { originalStartPos = { x: hit.item.p2.x, y: hit.item.p2.y }; }
            // Tutamaçlar (Yeşil/Pembe butonlar)
            else if (hit.pointKey === 'rotate' || hit.pointKey === 'resize' || hit.pointKey === 'image_resize') {
                originalStartPos = { 
                    radius: hit.item.radius, 
                    rotation: hit.item.rotation, 
                    width: hit.item.width, 
                    height: hit.item.height 
                };

// --- DÖNDÜRME İÇİN BAŞLANGIÇ AÇISINI KAYDET (ZIPLAMAYI ÖNLER) ---
                if (hit.pointKey === 'rotate') {
                    const center = (hit.item.type === 'arc') ? {x: hit.item.cx, y: hit.item.cy} : hit.item.center;
                    if (center) {
                        const dx = pos.x - center.x;
                        const dy = pos.y - center.y;
                        // Bu değişkeni geçici olarak window'a atıyoruz ki touchmove'da erişelim
                        window.dragStartAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                    }
                }
            }

            
            
            redrawAllStrokes(); // Seçim kutularını göster
            return; 
        }
    }

if (currentTool.startsWith('draw_polygon_') || currentTool === 'draw_circle') {
        // Tipi güvenli şekilde al (Eğer sayı alamazsa 0 yani Çember yap)
        let type = 0;
        const parts = currentTool.split('_');
        if (parts.length > 2 && !isNaN(parseInt(parts[2]))) {
            type = parseInt(parts[2]);
        }
        
        // Geçici veriyi başlat
        window.tempPolygonData = {
            type: type,
            center: snapPos, // Dokunulan yer merkez
            radius: 0,
            rotation: 0
        };
        
        // Merkez etiketini göster
        if(typeof polygonPreviewLabel !== 'undefined') {
            polygonPreviewLabel.classList.remove('hidden');
            polygonPreviewLabel.style.left = `${snapPos.x}px`;
            polygonPreviewLabel.style.top = `${snapPos.y - 40}px`;
            polygonPreviewLabel.innerText = "Merkez";
        }
        
        redrawAllStrokes(); 
        return; 
    }


    // Diğer çizim araçları (Pen, Eraser vb.)
    if (currentTool === 'pen') {
        isDrawing = true;
        drawnStrokes.push({ type: 'pen', path: [snapPos], color: currentPenColor, width: currentPenWidth });
    }
    else if (currentTool === 'eraser') {
        isDrawing = true; 
        handleEraser(pos); 
    }

    else if (currentTool === 'point') {
        try { if (window.audio_click) { window.audio_click.currentTime = 0; window.audio_click.play(); } } catch(err){}
        isDrawing = false;
        drawnStrokes.push({ type: 'point', x: snapPos.x, y: snapPos.y, label: nextPointChar });
        nextPointChar = advanceChar(nextPointChar);
        redrawAllStrokes();
    }
    
    else if (currentTool === 'straightLine') {
        try { if (window.audio_click) window.audio_click.play(); } catch(err){}
        isDrawingLine = true; lineStartPoint = snapPos;
        redrawAllStrokes(); drawDot(snapPos, currentLineColor);
    }
    else if (currentTool === 'line') {
        try { if (window.audio_click) window.audio_click.play(); } catch(err){}
        isDrawingInfinityLine = true; lineStartPoint = pos; 
        redrawAllStrokes(); drawDot(pos, currentLineColor);
    }
    else if (currentTool === 'segment') {
        try { if (window.audio_click) window.audio_click.play(); } catch(err){}
        isDrawingSegment = true; lineStartPoint = snapPos; 
        redrawAllStrokes(); drawDot(snapPos, currentLineColor);
    }
    else if (currentTool === 'ray') {
        try { if (window.audio_click) window.audio_click.play(); } catch(err){}
        isDrawingRay = true; lineStartPoint = pos; 
        redrawAllStrokes(); drawDot(pos, currentLineColor);
    }
});

// --- DOKUNMA HAREKETİ (TOUCHMOVE) - TAMİR EDİLMİŞ SÜRÜM ---
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    const pos = getEventPosition(e);

    // ---------------------------------------------------------
    // 1. PINCH ZOOM (İKİ PARMAK)
    // ---------------------------------------------------------
    if (e.touches.length === 2) {
        const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
        const currentDistance = distance(p1, p2);
        
        // A) 3D Zoom
        if (window.Scene3D && window.Scene3D.currentMesh) {
            window.Scene3D.handlePinch(currentDistance);
            return;
        }
        // B) 2D Resim Zoom
        if (typeof isPinching !== 'undefined' && isPinching && selectedItem && selectedItem.type === 'image') {
            if (typeof initialDistance !== 'undefined' && initialDistance > 0) {
                const scaleFactor = currentDistance / initialDistance;
                const newWidth = initialScale * scaleFactor;
                const newHeight = (selectedItem.height / selectedItem.width) * newWidth;
                selectedItem.width = newWidth;
                selectedItem.height = newHeight;
                redrawAllStrokes();
            }
        }
        return;
    }

    // ---------------------------------------------------------
    // 2. 3D ETKİLEŞİM KONTROLÜ (Çizim Aracı Varsa 3D'yi Yoksay)
    // ---------------------------------------------------------
    const isDrawingTool = (
        currentTool === 'pen' || 
        currentTool === 'eraser' || 
        currentTool === 'point' || 
        currentTool === 'straightLine' || 
        currentTool === 'line' || 
        currentTool === 'segment' || 
        currentTool === 'ray' ||
        currentTool.startsWith('draw_polygon_') ||
        currentTool === 'draw_circle'
    );

    // Sadece "Çizim Aracı DEĞİLSE" 3D'ye bak
    if (!isDrawingTool && window.Scene3D) {
        // Yeni Çizim
        if (window.Scene3D.activeTool !== 'none' && window.Scene3D.activeTool !== 'move') {
             window.Scene3D.onMove(pos.x, pos.y);
             return;
        }
        // Mevcut Şekil Etkileşimi
        if (window.Scene3D.currentMesh) {
            window.Scene3D.onMove(pos.x, pos.y);
            return; 
        }
    }

    // ---------------------------------------------------------
    // 3. CANLANDIRMA (SNAPSHOT) ÖNİZLEMESİ
    // ---------------------------------------------------------
    if (currentTool === 'snapshot' && typeof snapshotStart !== 'undefined' && snapshotStart) {
        redrawAllStrokes(); 
        const w = pos.x - snapshotStart.x; 
        const h = pos.y - snapshotStart.y;
        ctx.save();
        ctx.setLineDash([5, 5]); 
        ctx.strokeStyle = '#FF0000'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(snapshotStart.x, snapshotStart.y, w, h); 
        ctx.restore();
        return; 
    }

    // ---------------------------------------------------------
    // 4. ARAÇ ENGELLEYİCİLER
    // ---------------------------------------------------------
    if (currentTool === 'ruler' || currentTool === 'gonye' || currentTool === 'aciolcer' || currentTool === 'pergel') return;
    if (currentTool === 'none') return;

    // ---------------------------------------------------------
    // 5. 2D TAŞIMA VE DÜZENLEME (MOVE)
    // ---------------------------------------------------------
    if (typeof isMoving !== 'undefined' && isMoving && selectedItem) {
        const dx = pos.x - dragStartPos.x;
        const dy = pos.y - dragStartPos.y;
        
        // ... (Mevcut taşıma kodlarınızın aynısı) ...
        if (selectedPointKey === 'image_resize') {
            const distFromCenterX = Math.abs(pos.x - selectedItem.x);
            const distFromCenterY = Math.abs(pos.y - selectedItem.y);
            selectedItem.width = Math.max(20, distFromCenterX * 2);
            selectedItem.height = Math.max(20, distFromCenterY * 2);
        }
        else if (selectedPointKey === 'rotate') {
            const center = (selectedItem.type === 'arc') ? {x: selectedItem.cx, y: selectedItem.cy} : selectedItem.center;
            if(center) {
                const r_dx = pos.x - center.x;
                const r_dy = pos.y - center.y;
                const currentAngle = Math.atan2(r_dy, r_dx) * (180 / Math.PI);
                const angleDiff = currentAngle - window.dragStartAngle;
                selectedItem.rotation = originalStartPos.rotation + angleDiff;
                if(window.PolygonTool && window.PolygonTool.updateVertices) window.PolygonTool.updateVertices(selectedItem);
            }
        }
        else if (selectedPointKey === 'resize') {
            const center = (selectedItem.type === 'arc') ? {x: selectedItem.cx, y: selectedItem.cy} : selectedItem.center;
            if(center) {
                selectedItem.radius = distance(center, pos);
                if(window.PolygonTool && window.PolygonTool.updateVertices) window.PolygonTool.updateVertices(selectedItem);
            }
        }
        else if (selectedPointKey === 'center') {
            if (selectedItem.type === 'arc' || selectedItem.type === 'circle') {
                selectedItem.cx = originalStartPos.x + dx;
                selectedItem.cy = originalStartPos.y + dy;
            } else if (selectedItem.type === 'polygon') {
                selectedItem.center.x = originalStartPos.x + dx;
                selectedItem.center.y = originalStartPos.y + dy;
                if(window.PolygonTool && window.PolygonTool.updateVertices) window.PolygonTool.updateVertices(selectedItem);
            }
        }
        else if (selectedPointKey === 'self') { 
            selectedItem.x = originalStartPos.x + dx;
            selectedItem.y = originalStartPos.y + dy;
        } 
        else if (selectedPointKey === 'p1') {
            selectedItem.p1.x = originalStartPos.x + dx;
            selectedItem.p1.y = originalStartPos.y + dy;
        } else if (selectedPointKey === 'p2') {
            selectedItem.p2.x = originalStartPos.x + dx;
            selectedItem.p2.y = originalStartPos.y + dy;
        }
        
        redrawAllStrokes();
        return; 
    }

    // ---------------------------------------------------------
    // 6. DİĞER ÇİZİM ÖNİZLEMELERİ VE YAKALAMA
    // ---------------------------------------------------------
    let snapTargetLocal = null;
    const canSnap = (currentTool === 'point' || currentTool === 'straightLine' || currentTool === 'pen' || currentTool === 'segment' || currentTool.startsWith('draw_polygon_'));
    
    if (canSnap && typeof findSnapPoint !== 'undefined') {
        snapTargetLocal = findSnapPoint(pos);
        if (snapTargetLocal) { 
            if(snapIndicator) {
                snapIndicator.style.left = `${snapTargetLocal.x}px`; 
                snapIndicator.style.top = `${snapTargetLocal.y}px`; 
                snapIndicator.style.display = 'block'; 
            }
            snapTarget = snapTargetLocal;
        } else { 
            if(snapIndicator) snapIndicator.style.display = 'none'; 
            snapTarget = null;
        }
    } else {
        snapTarget = null;
        if(snapIndicator) snapIndicator.style.display = 'none';
    }

    let previewActive = false;
    const drawEndPos = snapTarget || pos; 

    // A) Düz Çizgi (Straight Line)
    if (currentTool === 'straightLine' && isDrawingLine) {
        redrawAllStrokes(); 
        ctx.save(); 
        ctx.globalAlpha = 0.6; 
        ctx.setLineDash([8, 4]); 
        
        ctx.beginPath();
        ctx.moveTo(lineStartPoint.x, lineStartPoint.y);
        ctx.lineTo(drawEndPos.x, drawEndPos.y);
        ctx.strokeStyle = window.currentLineColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        drawDot(lineStartPoint, window.currentLineColor);
        drawDot(drawEndPos, window.currentLineColor);
        
        ctx.restore();
        previewActive = true; 

        if(typeof previewLabel2D !== 'undefined') {
            const dist = distance(lineStartPoint, drawEndPos);
            const cmVal = (dist / 30).toFixed(1).replace('.', ',');
            previewLabel2D.innerText = `${cmVal} cm`;
            previewLabel2D.style.display = 'block';
            previewLabel2D.style.left = (drawEndPos.x + 15) + 'px';
            previewLabel2D.style.top = (drawEndPos.y - 50) + 'px';
        }
    }
    // B) Doğru (Line - Sonsuz)
    else if (currentTool === 'line' && isDrawingInfinityLine) {
        redrawAllStrokes();
        if (typeof drawInfinityLine === 'function') {
            ctx.save(); ctx.setLineDash([8, 4]);
            drawInfinityLine(lineStartPoint, drawEndPos, window.currentLineColor, 3, false);
            ctx.restore();
        }
        drawDot(lineStartPoint, window.currentLineColor);
        drawDot(drawEndPos, window.currentLineColor);
        previewActive = true;
        if(typeof previewLabel2D !== 'undefined') previewLabel2D.style.display = 'none';
    }
    // C) Doğru Parçası (Segment)
    else if (currentTool === 'segment' && isDrawingSegment) {
        redrawAllStrokes();
        ctx.save(); ctx.globalAlpha = 0.6; ctx.setLineDash([8, 4]);
        
        ctx.beginPath();
        ctx.moveTo(lineStartPoint.x, lineStartPoint.y);
        ctx.lineTo(drawEndPos.x, drawEndPos.y);
        ctx.strokeStyle = window.currentLineColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        drawDot(lineStartPoint, window.currentLineColor);
        drawDot(drawEndPos, window.currentLineColor);
        
        ctx.restore();
        previewActive = true;

        if(typeof previewLabel2D !== 'undefined') {
            const dist = distance(lineStartPoint, drawEndPos);
            const cmVal = (dist / 30).toFixed(1).replace('.', ',');
            previewLabel2D.innerText = `${cmVal} cm`;
            previewLabel2D.style.display = 'block';
            previewLabel2D.style.left = (drawEndPos.x + 15) + 'px';
            previewLabel2D.style.top = (drawEndPos.y - 50) + 'px';
        }
    }
    // D) Işın (Ray)
    else if (currentTool === 'ray' && isDrawingRay) {
        redrawAllStrokes();
        if (typeof drawInfinityLine === 'function') {
            ctx.save(); ctx.setLineDash([8, 4]);
            drawInfinityLine(lineStartPoint, drawEndPos, window.currentLineColor, 3, true);
            ctx.restore();
        }
        drawDot(lineStartPoint, window.currentLineColor);
        drawDot(drawEndPos, window.currentLineColor);
        previewActive = true;
    }
    // E) Çokgen / Çember Önizleme
    else if (window.tempPolygonData && window.tempPolygonData.center) {
        const center = window.tempPolygonData.center;
        const type = window.tempPolygonData.type;
        const currentRadius = distance(center, pos); 
        
        const dx = pos.x - center.x; 
        const dy = pos.y - center.y;
        const currentRotationRad = Math.atan2(dy, dx); 
        const currentRotationDeg = currentRotationRad * (180 / Math.PI); 

        window.tempPolygonData.rotation = currentRotationDeg; 
        window.tempPolygonData.radius = currentRadius; 

        redrawAllStrokes(); 
        
        ctx.save(); 
        ctx.beginPath();
        if (type === 0) {
            ctx.arc(center.x, center.y, currentRadius, 0, 2 * Math.PI);
        } else {
            if(window.PolygonTool && window.PolygonTool.calculateVertices) {
                const vertices = window.PolygonTool.calculateVertices(center, currentRadius, type, currentRotationDeg); 
                if (vertices && vertices.length > 0) {
                     ctx.moveTo(vertices[0].x, vertices[0].y);
                     for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
                     ctx.closePath();
                }
            }
        }
        ctx.globalAlpha = 0.6; 
        ctx.setLineDash([10, 5]); 
        ctx.strokeStyle = window.currentLineColor || '#00ffcc'; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        drawDot(center, window.currentLineColor);
        
        if(typeof polygonPreviewLabel !== 'undefined') {
            polygonPreviewLabel.style.left = `${pos.x}px`;
            polygonPreviewLabel.style.top = `${pos.y - 50}px`;
            polygonPreviewLabel.classList.remove('hidden');
            const pixelPerCm = (window.PolygonTool && window.PolygonTool.PIXELS_PER_CM) ? window.PolygonTool.PIXELS_PER_CM : 30;
            const cmRadius = (currentRadius / pixelPerCm).toFixed(1);
            let labelText = "";
            if (type === 0) labelText = `Yarıçap: ${cmRadius} cm`; 
            else {
                const sideLen = ((2 * currentRadius * Math.sin(Math.PI / type)) / pixelPerCm).toFixed(1);
                labelText = `Kenar: ${sideLen} cm`;
            }
            polygonPreviewLabel.innerText = labelText;
        }
        ctx.restore(); 
        previewActive = true;
    }

    if (previewActive) return; 

    // ---------------------------------------------------------
    // 7. KALEM VE SİLGİ (DÜZELTİLDİ: SİLGİ ARTIK BAĞIMSIZ)
    // ---------------------------------------------------------
    if (typeof isDrawing !== 'undefined' && isDrawing) {
        
        // A) SİLGİ: 2D çizim olmasa bile 3D silsin diye dışarı aldık
        if (currentTool === 'eraser') {
            handleEraser(pos); 
        }
        // B) KALEM: Sadece çizim varsa ekle
        else if (typeof isDrawing !== 'undefined' && isDrawing && currentTool === 'pen') {
            if (drawnStrokes.length > 0) {
                const currentStroke = drawnStrokes[drawnStrokes.length - 1];
                currentStroke.path.push(pos);
                redrawAllStrokes();
            }
        }
    }
});


// --- DOKUNMA BIRAKMA (TOUCHEND) - DÜZELTİLMİŞ VERSİYON ---
canvas.addEventListener('touchend', (e) => {
    // 1. Varsayılan davranışı durdur
    if(e.cancelable) e.preventDefault();

    // 2. 3D Çizim ve Etkileşim Bitişi (DÜZELTİLDİ)
    // BURASI ÖNEMLİ: Parmağını çektiğinde onUp() çalışmalı.
    if (window.Scene3D) {
        window.Scene3D.onUp();
// 2. CANLANDIRMA (SNAPSHOT) - BU KISMI EKLE
    if (currentTool === 'snapshot' && snapshotStart) {
        const touch = e.changedTouches[0];
        const endPos = getEventPosition({ clientX: touch.clientX, clientY: touch.clientY });
        
        const rectX = Math.min(snapshotStart.x, endPos.x);
        const rectY = Math.min(snapshotStart.y, endPos.y);
        const rectW = Math.abs(endPos.x - snapshotStart.x);
        const rectH = Math.abs(endPos.y - snapshotStart.y);

        if (rectW > 10 && rectH > 10) {
            redrawAllStrokes(); // Kırmızı çerçeveyi temizle
            
            // Ekrandan kopyala
            const imgData = ctx.getImageData(rectX, rectY, rectW, rectH);
            
            // Resme çevir
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = rectW; tempCanvas.height = rectH;
            tempCanvas.getContext('2d').putImageData(imgData, 0, 0);

            const newImg = new Image();
            newImg.src = tempCanvas.toDataURL();
            
            newImg.onload = () => {
                drawnStrokes.push({
                    type: 'image', img: newImg,
                    x: rectX, y: rectY, width: rectW, height: rectH, rotation: 0
                });
                redrawAllStrokes();
                
                // Otomatik 'Taşı' moduna geç
                currentTool = 'move';
                document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
                const moveBtn = document.getElementById('btn-move');
                if(moveBtn) moveBtn.classList.add('active');
            };
        }
        snapshotStart = null;
    }

    }

    // 3. Pinch Zoom Bitişi
    if (isPinching) {
        isPinching = false; 
        isMoving = false; 
        if (selectedItem) {
            selectedItem.originalWidth = selectedItem.width;
            selectedItem.originalHeight = selectedItem.height;
        }
        redrawAllStrokes();
        return;
    }

    // 4. Taşıma Bitişi
    if (currentTool === 'move' && isMoving) {
        isMoving = false; 
        selectedPointKey = null; 
        rotationPivot = null; 
        originalStartPos = {};
        
        // Canlandırma'dan geldiysek geri dön
        if (typeof returnToSnapshot !== 'undefined' && returnToSnapshot) {
            returnToSnapshot = false; 
            setActiveTool('snapshot'); 
            if (animateButton) { animateButton.classList.add('active'); body.classList.add('cursor-snapshot'); }
        }
        return;
    }
    
    // 5. Canlandırma (Snapshot) Bitişi - DOKUNMATİK ŞEFFAFLIK DÜZELTME
    if (currentTool === 'snapshot' && snapshotStart) {
        // Dokunmatik için bitiş pozisyonunu doğru al
        let endPos = currentMousePos;
        if(e.changedTouches && e.changedTouches.length > 0) {
             endPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        } else if (snapTarget) {
             endPos = snapTarget;
        }

        let x = Math.min(snapshotStart.x, endPos.x);
        let y = Math.min(snapshotStart.y, endPos.y);
        let w = Math.abs(endPos.x - snapshotStart.x);
        let h = Math.abs(endPos.y - snapshotStart.y);

        if (w > 10 && h > 10) {
            redrawAllStrokes(); 
            
            // Güvenlik: Kanvas dışına taşmayı önle
            if (x < 0) x = 0; if (y < 0) y = 0;
            if (x + w > canvas.width) w = canvas.width - x;
            if (y + h > canvas.height) h = canvas.height - y;

            const imageData = ctx.getImageData(x, y, w, h);
            const data = imageData.data;

            // --- ZEMİNİ ŞEFFAFLAŞTIRMA DÖNGÜSÜ (Eşik: 130) ---
            // Gri, krem ve beyaz zeminleri temizler
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (r > 130 && g > 130 && b > 130) { 
                    data[i + 3] = 0; // Tamamen şeffaf yap
                }
            }

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w; tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);

            const newImg = new Image();
            newImg.src = tempCanvas.toDataURL();
            
            newImg.onload = () => {
                const newObj = { 
                    type: 'image', 
                    img: newImg, 
                    x: x + w / 2, 
                    y: y + h / 2, 
                    width: w, 
                    height: h, 
                    rotation: 0,
                    isBackground: false 
                };
                drawnStrokes.push(newObj);
                snapshotStart = null;
                
                // Otomatik taşıma moduna geç
                currentTool = 'move';
                setActiveTool('move'); 
                
                selectedItem = newObj;
                isMoving = false; 
                returnToSnapshot = true; 
                
                redrawAllStrokes();
                if (window.audio_click) { 
                    window.audio_click.currentTime = 0; 
                    window.audio_click.play(); 
                }
            };
        }
        snapshotStart = null;
        return;
    }

    // 6. Diğer 2D Çizim Bitişleri (Çizgiler vb.)


    // --- MOBİL DÜZELTME BAŞLANGICI ---
    // Snap varsa onu kullan, yoksa parmağın kalktığı son noktayı (changedTouches) al
    let endPos = snapTarget;
    if (!endPos) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            endPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        } else {
            endPos = currentMousePos;
        }
    }
    
    if (isDrawingLine && lineStartPoint) {
        drawnStrokes.push({ type: 'straightLine', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3 });
        isDrawingLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingInfinityLine && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'line', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingInfinityLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingSegment && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'segment', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingSegment = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingRay && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'ray', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingRay = false; lineStartPoint = null; redrawAllStrokes();
    }
    // ▼▼▼ DEĞİŞECEK KISIM: Çokgen Çizim Bitişi ▼▼▼
    else if (currentTool.startsWith('draw_polygon_')) {
        if (window.tempPolygonData && window.tempPolygonData.center) {
            
            // Yanlışlıkla dokunmaları önlemek için minimum yarıçap kontrolü
            if (window.tempPolygonData.radius > 10) {
                
                const isCircle = (window.tempPolygonData.type === 0);
                
                // Kalıcı çizim listesine ekle
                window.drawnStrokes.push({
                    type: isCircle ? 'arc' : 'polygon',
                    
                    // Çember özellikleri
                    cx: isCircle ? window.tempPolygonData.center.x : undefined,
                    cy: isCircle ? window.tempPolygonData.center.y : undefined,
                    startAngle: 0,
                    endAngle: 360,
                    
                    // Çokgen özellikleri
                    center: isCircle ? undefined : window.tempPolygonData.center,
                    sideCount: window.tempPolygonData.type,
                    // Köşeleri hesapla
                    vertices: isCircle ? [] : (window.PolygonTool ? window.PolygonTool.calculateVertices(window.tempPolygonData.center, window.tempPolygonData.radius, window.tempPolygonData.type, window.tempPolygonData.rotation) : []),

                    // Ortak özellikler
                    radius: window.tempPolygonData.radius,
                    rotation: window.tempPolygonData.rotation,
                    color: window.isToolThemeBlack ? '#000000' : window.currentLineColor, // Siyah tema desteği
                    width: 3,
                    fillColor: null,
                    
                    // Etiketler kapalı başlasın
                    showEdgeLabels: false,
                    showAngleLabels: false,
                    showCircleInfo: false
                });
                
                // Ekranı güncelle
                window.redrawAllStrokes();
            }

            // Geçici veriyi sıfırla (Bir sonraki çizim için hazırla)
            window.tempPolygonData = { type: 0, center: null, radius: 0, rotation: 0 };
            
            if(typeof polygonPreviewLabel !== 'undefined') polygonPreviewLabel.classList.add('hidden');
            
            // BURADAKİ 'setActiveTool('none')' SATIRINI SİLDİK
            // Böylece araç seçili kalır ve tekrar çizim yapabilirsiniz.
        }
    }
    
    // 7. Silgi Bitişi
    if (currentTool === 'eraser') {
        isDrawing = false; setActiveTool('none'); return; 
    }

    isDrawing = false; 
    snapTarget = null; 
    if(snapIndicator) snapIndicator.style.display = 'none';
if(previewLabel2D) previewLabel2D.style.display = 'none';
});
// --- YAPIŞTIRMA (PASTE) DESTEĞİ (CTRL+V) ---
window.addEventListener('paste', (e) => {
    // Panodaki verileri al
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    // Verileri tara (Resim var mı?)
    for (let index in items) {
        const item = items[index];
        
        // Eğer bu bir dosya ise ve tipi 'image' içeriyorsa
        if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
            const blob = item.getAsFile();
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Resmi makul bir boyuta getir (Dosya yüklemedeki mantığın aynısı)
                    let startWidth = 300; 
                    let scaleFactor = startWidth / img.width;
                    let startHeight = img.height * scaleFactor;

                    // Resmi Hafızaya 'image' nesnesi olarak ekle
                    drawnStrokes.push({
                        type: 'image',
                        img: img,
                        x: canvas.width / 2, // Ekranın ortasına koy
                        y: canvas.height / 2,
                        width: startWidth,
                        height: startHeight,
                        rotation: 0
                    });

                    redrawAllStrokes(); // Ekrana çiz
                    
                    // İşlem başarılı sesi (İsteğe bağlı)
                    if (window.audio_click) { 
                        window.audio_click.currentTime = 0; 
                        window.audio_click.play(); 
                    }
                };
                img.src = event.target.result;
            };
            
            reader.readAsDataURL(blob);
            e.preventDefault(); // Sayfanın varsayılan yapıştırma davranışını engelle
        }
    }
});

// --- app.js EN ALTINA EKLEYİN (EKSİK OLAN PARÇALAR) ---

function updatePageLabel() {
    if(pageCountLabel) pageCountLabel.innerText = `Sayfa: ${currentPDFPage} / ${totalPDFPages}`;
}

// Belirli bir sayfayı render et ve ekrandaki nesneyi güncelle
async function renderPDFPage(num) {
    if (!currentPDF) return;
    
    updatePageLabel();
    
    const page = await currentPDF.getPage(num);
    // Kalite Ayarı (4.0 = Yüksek Kalite)
    const viewport = page.getViewport({ scale: 4.0 }); 

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.height = viewport.height;
    tempCanvas.width = viewport.width;

    await page.render({
        canvasContext: tempCtx,
        viewport: viewport
    }).promise;

    const img = new Image();
    img.onload = () => {
        // EĞER ekranda zaten bir PDF sayfası varsa, onun RESMİNİ değiştir (Konumunu koru)
        if (pdfImageStroke && drawnStrokes.includes(pdfImageStroke)) {
            pdfImageStroke.img = img; // Sadece resmi güncelle
            redrawAllStrokes();
        } else {
            // Ekranda yoksa (ilk kez veya silinmişse) yeni ekle
            addNewImageToCanvas(img, true);
        }
    };
    img.src = tempCanvas.toDataURL();
}

// Resmi Canvas Nesnesi Olarak Ekleyen Fonksiyon
function addNewImageToCanvas(img, isPDF = false) {
    let startWidth = 400; 
    if (img.width < 400) startWidth = img.width;
    
    let scaleFactor = startWidth / img.width;
    let startHeight = img.height * scaleFactor;

    const newStroke = {
        type: 'image',
        img: img, 
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: startWidth,
        height: startHeight,
        rotation: 0,
        isBackground: true // <--- İŞTE BU ETİKET EKSİKTİ!
    };
    
    drawnStrokes.push(newStroke);
    
    if (isPDF) {
        pdfImageStroke = newStroke;
    }
    
    redrawAllStrokes();
}


// --- ARAÇ RENGİ DEĞİŞTİRME MANTIĞI (SİYAH / NEON / TOK MAVİ) ---
const toolColorBtn = document.getElementById('btn-tool-color');
let isBlackTheme = false;
window.isToolThemeBlack = false; // Diğer dosyalar için global değişken

if (toolColorBtn) {
    toolColorBtn.addEventListener('click', () => {
        isBlackTheme = !isBlackTheme;
        window.isToolThemeBlack = isBlackTheme; // Durumu kaydet
        
        // Buton yazısını güncelle
        toolColorBtn.innerText = isBlackTheme ? "Araç Rengi: Neon" : "Araç Rengi: Siyah";
        
        // O an ekranda açık olan tüm fiziksel araçları bul ve rengini değiştir
        const elements = document.querySelectorAll('.ruler-container, .gonye-container, .aciolcer-container, #compass-container');
        
        elements.forEach(el => {
            if (isBlackTheme) {
                el.classList.add('tool-black-theme');
            } else {
                el.classList.remove('tool-black-theme');
            }
        });
    });
}

// --- ARAÇLAR AÇILDIĞINDA RENGİ HATIRLA (YAMA) ---
// Sayfa tamamen yüklendikten sonra araçların 'show' fonksiyonlarına ekleme yapıyoruz
window.addEventListener('load', () => {
    const toolsList = [
        { objName: 'RulerTool', elementProp: 'rulerElement' },
        { objName: 'GonyeTool', elementProp: 'gonyeElement' },
        { objName: 'AciolcerTool', elementProp: 'aciolcerElement' },
        { objName: 'PergelTool', elementProp: 'pergelElement' }
    ];

    toolsList.forEach(toolInfo => {
        const toolObj = window[toolInfo.objName];
        if (toolObj && toolObj.show) {
            // Orijinal show fonksiyonunu sakla
            const originalShow = toolObj.show.bind(toolObj);
            
            // Yeni show fonksiyonu tanımla
            toolObj.show = function() {
                originalShow(); // Önce normal açılma işlemini yap
                
                // Sonra tema rengini kontrol et ve uygula
                if (this[toolInfo.elementProp]) {
                    if (window.isToolThemeBlack) {
                        this[toolInfo.elementProp].classList.add('tool-black-theme');
                    } else {
                        this[toolInfo.elementProp].classList.remove('tool-black-theme');
                    }
                }
            };
        }
    });
});

// --- YARDIM VİDEOLARI SİSTEMİ ---

// 1. VİDEO LİSTESİ (Burayı kendi dosya isimlerine göre düzenle)
const tutorialVideos = [
    { baslik: "Cetvel Kullanımı", dosya: "cetvel-vid.mp4" },
    { baslik: "Gönye Kullanımı", dosya: "gonye-vid.mp4" },
    { baslik: "Açı Ölçer Kullanımı", dosya: "aciolcer-vid.mp4" },
    { baslik: "Pergel Kullanımı", dosya: "pergel-vid.mp4" },
    { baslik: "Canlandırma (Kopyalama)", dosya: "canlandir-vid.mp4" },
    { baslik: "Cizgi Menusu Kullanımı", dosya: "cizgi-vid.mp4" },
    { baslik: "Cokgenler", dosya: "cokgenler-vid.mp4" },
    { baslik: "Kalem", dosya: "kalem-vid.mp4" },
    { baslik: "Kitap v resim yukleme", dosya: "kitap-yukleme-vid.mp4" },
    { baslik: "Oyunlar", dosya: "oyunlar-vid.mp4" }
];

// Elementleri Seç
const helpBtn = document.getElementById('btn-help');
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help');
const videoListContainer = document.getElementById('video-list-container');
const videoPlayer = document.getElementById('main-video-player');
const videoTitleLabel = document.getElementById('video-title-label');

// Listeyi Oluştur
function loadVideoList() {
    videoListContainer.innerHTML = ''; 
    tutorialVideos.forEach((vid) => {
        const btn = document.createElement('button');
        btn.className = 'video-item-btn';
        btn.innerText = `▶ ${vid.baslik}`;
        btn.onclick = () => {
            // Tüm butonların rengini sıfırla, buna renk ver
            document.querySelectorAll('.video-item-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Videoyu oynat (GitHub klasör adı: videolar)
            videoPlayer.src = `videolar/${vid.dosya}`;
            videoTitleLabel.innerText = vid.baslik;
            videoPlayer.play();
        };
        videoListContainer.appendChild(btn);
    });
}

// Açma/Kapama Olayları
if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
        loadVideoList();
    });

    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
        videoPlayer.pause();
        videoPlayer.src = ""; // Videoyu durdur ve sıfırla
    });
}


// --- BAŞLANGIÇ ---
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- app.js İÇİN GÜNCELLENMİŞ VE EKSİKLERİ TAMAMLANMIŞ 3D MOTORU ---

// --- app.js İÇİN DÜZELTİLMİŞ 3D MOTORU (V20) ---

// --- app.js ---
// MEVCUT "window.Scene3D" BLOĞUNU SİLİN VE YERİNE BUNU YAPIŞTIRIN:

// --- app.js ---
// MEVCUT "window.Scene3D" BLOĞUNU KOMPLE SİLİN VE YERİNE BUNU YAPIŞTIRIN:

// --- app.js ---
// MEVCUT "window.Scene3D" BLOĞUNU KOMPLE SİLİP YERİNE BUNU YAPIŞTIRIN:

window.Scene3D = {
    container: null, scene: null, camera: null, renderer: null, labelElement: null,
    isInit: false, activeTool: 'none',
    version: "3.2 - FINAL CLEAN", // Konsolda bunu görmelisiniz

    // --- TEMEL DEĞİŞKENLER ---
    currentMesh: null,
    previewMesh: null, 
    previewLine: null,
    helperGroup: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    
    // --- TUTAMAÇLAR ---
    rotateHandleBtn: null,
    resizeHandleBtn: null,
    isRotatingHandle: false,
    isResizingHandle: false,
    handles: { center: {x:0, y:0} },
    lastMousePos: { x: 0, y: 0 },

    // --- SÜRÜKLEME ---
    dragPlane: new THREE.Plane(),
    dragOffset: new THREE.Vector3(),
    isDragging: false,
    isClickCandidate: false,
    clickStartPos: { x: 0, y: 0 },
    isRotatingShape: false,

    // --- BAŞLATMA (INIT) ---
    init: function() {
        if (this.isInit) return;
        console.log("Scene3D Başlatıldı - Versiyon:", this.version);

        this.container = document.getElementById('three-container');
        this.labelElement = document.getElementById('label-3d');
        
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, -30, 20); 
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, 1);
        
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.pointerEvents = 'none';
        
        if(this.container) this.container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, -10, 20);
        this.scene.add(dirLight);

        this.helperGroup = new THREE.Group();
        this.scene.add(this.helperGroup);

        this.previewLabel = document.createElement('div');
        this.previewLabel.className = 'preview-3d-label';
        document.body.appendChild(this.previewLabel);

        // Tutamaç Butonları
        this.rotateHandleBtn = document.createElement('div');
        this.rotateHandleBtn.className = 'handle-3d handle-3d-rotate';
        document.body.appendChild(this.rotateHandleBtn);

        this.resizeHandleBtn = document.createElement('div');
        this.resizeHandleBtn.className = 'handle-3d handle-3d-resize';
        document.body.appendChild(this.resizeHandleBtn);

        // Olay Dinleyicileri
        const startInteract = (mode, e) => {
            e.preventDefault(); e.stopPropagation();
            this[mode] = true;
            const evt = e.touches ? e.touches[0] : e;
            this.lastMousePos = { x: evt.clientX, y: evt.clientY };
            
            if (mode === 'isResizingHandle' && this.currentMesh) {
                this.startScale = this.currentMesh.scale.x;
                if(this.handles && this.handles.center) {
                     const c = this.handles.center;
                     this.startResizeDist = Math.hypot(evt.clientX - c.x, evt.clientY - c.y);
                }
            }
        };

        ['mousedown', 'touchstart'].forEach(evt => {
            this.rotateHandleBtn.addEventListener(evt, (e) => startInteract('isRotatingHandle', e), {passive: false});
            this.resizeHandleBtn.addEventListener(evt, (e) => startInteract('isResizingHandle', e), {passive: false});
        });



        window.addEventListener('touchmove', (e) => {
            if (this.isRotatingHandle || this.isResizingHandle) {
                e.preventDefault();
                const evt = e.touches[0];
                this.onMove(evt.clientX, evt.clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (this.isRotatingHandle || this.isResizingHandle) this.onUp();
        });

        this.isInit = true;
        this.animate();
    },

    animate: function() {
        requestAnimationFrame(window.Scene3D.animate);
        const self = window.Scene3D;
        if (self.scene && self.renderer && self.camera) {
            self.renderer.render(self.scene, self.camera);
            if(self.currentMesh) {
                if(self.currentMesh.userData.labelElement) self.updateLabelPosition(self.currentMesh);
                self.updateHandlePositions();
                if (self.currentMesh.userData.type === 'prism_rect' && self.currentMesh.userData.isInfoVisible && self.updateRectPrismLabels) {
                    self.updateRectPrismLabels(self.currentMesh);
                }
            }
            if (self.isDrawing && self.previewMesh && self.activeTool === 'prism_rect' && self.updateRectPrismLabels) {
                self.updateRectPrismLabels(self.previewMesh);
            }
        }
    },


// --- YARDIMCI: EKRAN KOORDİNATLARINI NORME ET ---
    getNormalizedCoords: function(clientX, clientY) {
        // Eğer renderer veya domElement yoksa hata vermesin diye kontrol
        if (!this.renderer || !this.renderer.domElement) return { x: 0, y: 0 };

        const rect = this.renderer.domElement.getBoundingClientRect();
        return {
            x: ((clientX - rect.left) / rect.width) * 2 - 1,
            y: -((clientY - rect.top) / rect.height) * 2 + 1
        };
    },

// --- ZEMİN KOORDİNATINI BUL ---
    get3DPointOnFloor: function(clientX, clientY) {
        if (!this.raycaster || !this.camera) return new THREE.Vector3(0,0,0);
        
        const coords = this.getNormalizedCoords(clientX, clientY);
        this.raycaster.setFromCamera(coords, this.camera);
        
        const intersection = new THREE.Vector3();
        // Zemin düzlemiyle (plane) kesişimi bul
        const result = this.raycaster.ray.intersectPlane(this.plane, intersection);
        
        // Eğer kesişim varsa o noktayı, yoksa null döndür
        return result ? intersection : null;
    },

    // --- ŞEKİL GEOMETRİSİ OLUŞTURUCU ---
    createGeometry: function(type, size) {
        const height = size * 2; 
        
        // Hata önleyici: Eğer THREE tanımlı değilse boş dön
        if (typeof THREE === 'undefined') return null;

        switch (type) {
            case 'pyramid_cone': return new THREE.ConeGeometry(size, height, 32);
            case 'sphere': return new THREE.SphereGeometry(size, 32, 32);
            case 'prism_cube': return new THREE.BoxGeometry(size * 2, size * 2, size * 2);
            case 'prism_cylinder': return new THREE.CylinderGeometry(size, size, height, 32);
            case 'prism_3': return new THREE.CylinderGeometry(size, size, height, 3); 
            case 'prism_4': return new THREE.BoxGeometry(size*1.5, size*1.5, height); 
            case 'prism_rect': return new THREE.BoxGeometry(size * 1.5, size, height); 
            case 'prism_5': return new THREE.CylinderGeometry(size, size, height, 5); 
            case 'prism_6': return new THREE.CylinderGeometry(size, size, height, 6); 
            case 'pyramid_3': return new THREE.ConeGeometry(size, height, 3);
            case 'pyramid_4': return new THREE.ConeGeometry(size, height, 4); 
            case 'pyramid_4_duz': return new THREE.ConeGeometry(size, size * Math.sqrt(2), 3); 
            case 'pyramid_rect': return new THREE.ConeGeometry(size, height, 4); 
            case 'pyramid_5': return new THREE.ConeGeometry(size, height, 5);
            case 'pyramid_6': return new THREE.ConeGeometry(size, height, 6);
            
            // Varsayılan olarak Küre
            default: return new THREE.SphereGeometry(size, 32, 32);
        }
    },

    // --- ANİMASYON SÜRGÜSÜ ---
    animateUnfold: function(group, value) {
        if (!group.userData.animParts) return;
        
        const parts = group.userData.animParts;
        const totalParts = parts.length;
        
        // Sürgünün 0-100 aralığını parça sayısına bölüyoruz.
        const stepSize = 100 / totalParts;

        parts.forEach((part, index) => {
            // Bu parçanın hareket etmesi gereken aralık:
            const startThreshold = index * stepSize;
            
            // Mevcut sürgü değeri bu aralığın neresinde? (0.0 ile 1.0 arası)
            let localPercent = (value - startThreshold) / stepSize;
            
            // Sınırları koru (0'ın altına inmesin, 1'in üstüne çıkmasın)
            localPercent = Math.max(0, Math.min(1, localPercent));

            // Açıyı hesapla
            const currentAngle = part.closedAngle + (part.openAngle - part.closedAngle) * localPercent;

            // Dönüşü uygula
            if (part.axis === 'x') part.mesh.rotation.x = currentAngle;
            else if (part.axis === 'y') part.mesh.rotation.y = currentAngle;
            else if (part.axis === 'z') part.mesh.rotation.z = currentAngle;
        });
    },

    // --- GÜVENLİ DÖNÜŞTÜRME FONKSİYONU (FIXED) ---
    convertToUnfoldable: function(oldMesh) {
        // 1. Güvenlik Kontrolü
        if (!oldMesh || !oldMesh.userData) return;
        
        console.log("Dönüştürme deneniyor:", oldMesh.userData.type);

        // 2. Verileri Güvenli Al (Eksikse varsayılan değer ata)
        const type = oldMesh.userData.type;
        // baseSize yoksa 1 kabul et, height yoksa size*2 kabul et
        const size = (oldMesh.userData.baseSize !== undefined) ? oldMesh.userData.baseSize : 100; 
        const height = (oldMesh.userData.height !== undefined) ? oldMesh.userData.height : (size * 2);
        
        // Pozisyon yedekleri
        const oldPos = oldMesh.position.clone();
        const oldRot = oldMesh.rotation.clone();
        const oldScale = oldMesh.scale.x || 1; 

        // 3. YENİ ŞEKLİ OLUŞTURMA DENEMESİ (Eskisini silmeden önce!)
        let newGroup = null;

        try {
            // Şekil tipine göre doğru oluşturucuyu seç
            if (type === 'sphere') {
                if(this.createUnfoldableSphere) newGroup = this.createUnfoldableSphere(size);
            } 
            else if (type === 'pyramid_cone') {
                if(this.createUnfoldablePyramid) newGroup = this.createUnfoldablePyramid(32, size, height, true);
            } 
            else if (type && type.startsWith('pyramid')) {
                // Piramit Kenar Sayısı
                let sides = 4;
                if (type === 'pyramid_3') sides = 3;
                else if (type === 'pyramid_5') sides = 5;
                else if (type === 'pyramid_6') sides = 6;
                
                if(this.createUnfoldablePyramid) newGroup = this.createUnfoldablePyramid(sides, size, height, false);
            } 
            else if (type && (type.startsWith('prism') || type === 'cube' || type === 'prism_rect')) {
                // Prizma Kenar Sayısı
                let sides = 4; // Varsayılan (Kare/Dikdörtgen)
                if (type === 'prism_3') sides = 3;
                else if (type === 'prism_5') sides = 5;
                else if (type === 'prism_6') sides = 6;
                else if (type === 'prism_cylinder') sides = 32;

                if (typeof this.createUnfoldablePrism === 'function') {
                    // Type bilgisini de gönderiyoruz ki dikdörtgeni ayırt edebilsin
                    newGroup = this.createUnfoldablePrism(sides, size, height, type);
                }
            }

            // 4. BAŞARI KONTROLÜ VE DEĞİŞİM
            if (newGroup) {
                // A) Eski şekli şimdi silebiliriz
                this.scene.remove(oldMesh);
                
                // Etiket temizliği
                if (oldMesh.userData.labelElement) {
                    oldMesh.userData.labelElement.remove();
                    oldMesh.userData.labelElement = null;
                }
                if(this.hideEdgeLabels) this.hideEdgeLabels();
                
                // Bellek temizliği (Opsiyonel ama iyi olur)
                if (oldMesh.geometry) oldMesh.geometry.dispose();

                // B) Yeni şekli yerleştir
                newGroup.position.copy(oldPos);
                // Hafif yukarı al (z-fighting önlemek için)
                if(newGroup.position.y < 0.1) newGroup.position.y += 0.05; 
                
                newGroup.rotation.copy(oldRot);
                newGroup.scale.set(oldScale, oldScale, oldScale);
                
                // Verileri aktar
                newGroup.userData = { 
                    type: type, 
                    baseSize: size, 
                    height: height, 
                    isUnfoldable: true,
                    animParts: newGroup.userData.animParts 
                };
                
                this.scene.add(newGroup);
                this.currentMesh = newGroup;
                this.updateHandlePositions();
                
                // Animasyonu başlat (Kapalı konumda)
                this.animateUnfold(newGroup, 0);
                
                console.log("Dönüştürme BAŞARILI!");
            } else {
                console.warn("Yeni şekil oluşturulamadı (Fonksiyon eksik veya null döndü). Eski şekil korundu.");
            }

        } catch (err) {
            console.error("Dönüştürme sırasında HATA:", err);
            // Hata olsa bile eski şekil silinmediği için ekranda kalmaya devam eder.
            // Kullanıcıya hissettirmeden işlemi iptal ederiz.
        }
    },






    updateLabelPosition: function(mesh) {
        if (!mesh || !mesh.userData.labelElement) return;
        const label = mesh.userData.labelElement;
        mesh.updateMatrixWorld(true); 
        const worldCenter = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
        const screenCenter = this.toScreenPosition(mesh, worldCenter);
        if (isNaN(screenCenter.x) || isNaN(screenCenter.y)) { label.style.display = 'none'; return; } 
        else { label.style.display = 'block'; }
        const scale = mesh.scale.x;
        const baseSize = mesh.userData.baseSize || 1; 
        const worldRadius = baseSize * scale;
        const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
        const worldEdge = worldCenter.clone().add(cameraRight.multiplyScalar(worldRadius));
        const screenEdge = this.toScreenPosition(mesh, worldEdge);
        const pixelRadius = Math.hypot(screenEdge.x - screenCenter.x, screenEdge.y - screenCenter.y);
        const margin = 10; 
        const labelLeft = screenCenter.x + pixelRadius + margin;
        const labelTop = screenCenter.y - pixelRadius - margin;
        label.style.left = `${labelLeft}px`;
        label.style.top = `${labelTop}px`;
    },

    createGeometry: function(type, size) {
        const height = size * 2; 
        switch (type) {
            case 'pyramid_cone': return new THREE.ConeGeometry(size, height, 32);
            case 'sphere': return new THREE.SphereGeometry(size, 32, 32);
            case 'prism_cube': return new THREE.BoxGeometry(size * 2, size * 2, size * 2);
            case 'prism_cylinder': return new THREE.CylinderGeometry(size, size, height, 32);
            case 'prism_3': return new THREE.CylinderGeometry(size, size, height, 3); 
            case 'prism_4': return new THREE.BoxGeometry(size*1.5, size*1.5, height); 
            case 'prism_rect': return new THREE.BoxGeometry(size * 1.5, size, height); 
            case 'prism_5': return new THREE.CylinderGeometry(size, size, height, 5); 
            case 'prism_6': return new THREE.CylinderGeometry(size, size, height, 6); 
            case 'pyramid_3': return new THREE.ConeGeometry(size, height, 3);
            case 'pyramid_4': return new THREE.ConeGeometry(size, height, 4); 
            case 'pyramid_4_duz': return new THREE.ConeGeometry(size, size * Math.sqrt(2), 3); 
            case 'pyramid_rect': return new THREE.ConeGeometry(size, height, 4); 
            case 'pyramid_5': return new THREE.ConeGeometry(size, height, 5);
            case 'pyramid_6': return new THREE.ConeGeometry(size, height, 6);
            default: return new THREE.SphereGeometry(size, 32, 32);
        }
    },




 onDown: function(x, y) {
        if (!this.isInit) return false;
        if (this.isRotatingHandle || this.isResizingHandle) return true;
        const coords = this.getNormalizedCoords(x, y);
        this.raycaster.setFromCamera(coords, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        let foundMesh = null;
        for (let i = 0; i < intersects.length; i++) {
            const obj = intersects[i].object;
            if (obj.type === 'Mesh' && obj !== this.helperGroup) { foundMesh = obj; break; }
            if ((obj.type === 'Line' || obj.type === 'LineSegments') && obj.parent && obj.parent.type === 'Mesh') { foundMesh = obj.parent; break; }
        }
        if (foundMesh) {
            this.currentMesh = foundMesh;
            this.clickStartPos = { x, y };
            if (window.currentTool === 'move') {
                this.isRotatingShape = false; this.isDragging = true; this.isClickCandidate = true;
                this.dragPlane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()), this.currentMesh.position);
                const intersectPoint = new THREE.Vector3();
                if(this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) { this.dragOffset.subVectors(this.currentMesh.position, intersectPoint); }
            } else {
                this.isDragging = false; this.isClickCandidate = false; this.isRotatingShape = true; this.lastMousePos = { x, y };
            }
            this.updateHandlePositions();
            return true;
        }
        if (this.activeTool && this.activeTool !== 'none' && this.activeTool !== 'move') {
            this.isDrawing = true;
            this.startPoint = this.get3DPointOnFloor(x, y);
            const geometry = new THREE.BufferGeometry().setFromPoints([this.startPoint, this.startPoint]);
            const material = new THREE.LineBasicMaterial({ color: 0x00ffcc });
            this.previewLine = new THREE.Line(geometry, material);
            this.scene.add(this.previewLine);
            const previewGeo = this.createGeometry(this.activeTool, 0.1);
            if(this.activeTool.startsWith('prism') || this.activeTool.startsWith('pyramid')) { previewGeo.rotateX(Math.PI / 2); }
            const previewMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.5 });
            this.previewMesh = new THREE.Mesh(previewGeo, previewMat);
            this.previewMesh.position.copy(this.startPoint);
            this.scene.add(this.previewMesh);
            if (this.activeTool === 'prism_rect') { if(this.previewLabel) this.previewLabel.style.display = 'none'; } 
            else { if(this.previewLabel) { this.previewLabel.style.display = 'block'; this.previewLabel.innerText = "0,0 cm"; this.previewLabel.style.left = x + 15 + 'px'; this.previewLabel.style.top = y - 25 + 'px'; } }
            return true;
        }
        if (window.currentTool === 'move') {
            this.currentMesh = null;
            this.helperGroup.clear();
            if (this.labelElement) this.labelElement.style.display = 'none';
            if(this.hideEdgeLabels) this.hideEdgeLabels();
            this.updateHandlePositions();
        }
        return false;
    },
    onMove: function(x, y) {
        if (this.isRotatingHandle && this.currentMesh) {
            const deltaX = x - this.lastMousePos.x;
            const deltaY = y - this.lastMousePos.y;
            const speed = 0.01;
            this.currentMesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaY * speed);
            this.currentMesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), deltaX * speed);
            this.lastMousePos = { x, y };
            this.updateHandlePositions();
            if (this.currentMesh.userData.type === 'prism_rect') this.updateRectPrismLabels(this.currentMesh);
            return;
        }
        if (this.isResizingHandle && this.currentMesh) {
            const center = this.handles.center;
            const currentDist = Math.hypot(x - center.x, y - center.y);
            const scaleFactor = currentDist / this.startResizeDist;
            const newScale = Math.max(0.1, this.startScale * scaleFactor);
            this.currentMesh.scale.set(newScale, newScale, newScale);
            this.updateHandlePositions();
            this.showMeasurements(this.currentMesh);
            if (this.currentMesh.userData.type === 'prism_rect') this.updateRectPrismLabels(this.currentMesh);
            return;
        }
        if (this.isDrawing && this.startPoint && this.previewMesh) {
            const currentPoint = this.get3DPointOnFloor(x, y);
            const distance = currentPoint.distanceTo(this.startPoint);
            const scale = Math.max(0.1, distance * 3.5);
            this.previewMesh.scale.set(scale, scale, scale);
            this.previewMesh.updateMatrixWorld();
            const positions = this.previewLine.geometry.attributes.position.array;
            positions[3] = currentPoint.x; positions[4] = currentPoint.y; positions[5] = currentPoint.z;
            this.previewLine.geometry.attributes.position.needsUpdate = true;
            if (this.activeTool === 'prism_rect') { this.updateRectPrismLabels(this.previewMesh); } 
            else if (this.previewLabel) {
                const vec = this.startPoint.clone(); vec.project(this.camera);
                const widthHalf = window.innerWidth / 2; const heightHalf = window.innerHeight / 2;
                const startX = (vec.x * widthHalf) + widthHalf; const startY = -(vec.y * heightHalf) + heightHalf;
                const pixelDist = Math.hypot(x - startX, y - startY); const cmVal = pixelDist / 30; 
                let labelText = "";
                if (this.activeTool === 'prism_cube') { const a = cmVal * 2; labelText = `a: ${a.toFixed(1).replace('.', ',')} cm`; } 
                else if (this.activeTool === 'sphere') { labelText = `r: ${cmVal.toFixed(1).replace('.', ',')} cm`; } 
                else { const h = cmVal * 2; const prefix = this.activeTool.includes('cylinder') ? 'r' : 'a'; labelText = `${prefix}: ${cmVal.toFixed(1).replace('.', ',')} cm\nh: ${h.toFixed(1).replace('.', ',')} cm`; }
                this.previewLabel.innerText = labelText;
                this.previewLabel.style.left = (x + 15) + 'px';
                this.previewLabel.style.top = (y - 40) + 'px';
            }
            return;
        }
        if (this.isDragging && this.currentMesh) {
            const dist = Math.abs(x - this.clickStartPos.x) + Math.abs(y - this.clickStartPos.y);
            if (dist > 5) { this.isClickCandidate = false; }
            const coords = this.getNormalizedCoords(x, y);
            this.raycaster.setFromCamera(coords, this.camera);
            const intersectPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
                this.currentMesh.position.addVectors(intersectPoint, this.dragOffset);
            }
            this.updateHandlePositions();
            if (this.currentMesh.userData.type === 'prism_rect' && this.currentMesh.userData.isInfoVisible) {
                this.updateRectPrismLabels(this.currentMesh);
            }
            return; 
        } 
        else if (this.isRotatingShape && this.currentMesh) {
            if (window.currentTool === 'move') return;
            const deltaX = x - this.lastMousePos.x;
            const deltaY = y - this.lastMousePos.y;
            const speed = 0.01;
            this.currentMesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaY * speed);
            this.currentMesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), deltaX * speed);
            this.lastMousePos = { x, y };
            this.updateHandlePositions();
            if (this.currentMesh.userData.type === 'prism_rect' && this.currentMesh.userData.isInfoVisible) {
                this.updateRectPrismLabels(this.currentMesh);
            }
        }
    },
    onUp: function() {
        const wasDragging = this.isDragging;
        const wasClickCandidate = this.isClickCandidate;
        const wasPreviewing = !!this.previewMesh;
        this.isRotatingHandle = false; this.isResizingHandle = false; this.isDragging = false; this.isClickCandidate = false; this.isRotatingShape = false; this.isDrawing = false;
        if (this.currentMesh) {
            try {
                const type = this.currentMesh.userData.type;
                const isSphere = type === 'sphere';
                if (isSphere) { this.currentMesh.material.opacity = 1.0; this.currentMesh.material.transparent = false; this.currentMesh.material.depthWrite = true; } 
                else { this.currentMesh.material.opacity = 0.4; this.currentMesh.material.transparent = true; this.currentMesh.material.depthWrite = false; }
                if (wasDragging && wasClickCandidate) { this.showMeasurements(this.currentMesh); }
            } catch (err) { console.error("onUp Mesh Hatası:", err); }
        }
        if (wasPreviewing && this.previewMesh) {
            try {
                const finalScale = this.previewMesh.scale.x || 1;
                const finalRadius = 0.1 * finalScale;
                const toolType = this.activeTool;
                this.scene.remove(this.previewMesh); this.scene.remove(this.previewLine);
                this.previewMesh.geometry.dispose(); this.previewMesh = null; this.previewLine = null;
                const geometry = this.createGeometry(toolType, finalRadius);
                if(toolType.startsWith('prism') || toolType.startsWith('pyramid')) { geometry.rotateX(Math.PI / 2); }
                const isSphere = toolType === 'sphere';
                const material = new THREE.MeshPhongMaterial({ color: 0x00ffcc, shininess: 100, specular: 0x111111, flatShading: false, transparent: !isSphere, opacity: isSphere ? 1.0 : 0.4, depthWrite: isSphere, side: THREE.DoubleSide });
                const solidShape = new THREE.Mesh(geometry, material);
                solidShape.position.copy(this.startPoint || new THREE.Vector3(0,0,0));
                let shapeHeight = finalRadius * 2;
                if (toolType === 'pyramid_4_duz') { shapeHeight = finalRadius * Math.sqrt(2); }
                solidShape.userData = { type: toolType, baseSize: finalRadius, height: shapeHeight };
                const edges = new THREE.EdgesGeometry(geometry);
                const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
                solidShape.add(new THREE.LineSegments(edges, lineMat));
                this.scene.add(solidShape);
                this.currentMesh = solidShape;
                if(window.drawnStrokes) window.drawnStrokes.push({ type: '3D_object', mesh: solidShape });
                if (this.previewLabel) this.previewLabel.style.display = 'none';
                if (this.hideEdgeLabels) this.hideEdgeLabels();
                if (toolType === 'prism_rect' && this.updateRectPrismLabels) { solidShape.userData.isInfoVisible = true; this.updateRectPrismLabels(solidShape); try { this.showMeasurements(solidShape); } catch(e) {} }
                this.updateHandlePositions();
            } catch (err) { console.error("onUp Preview Hatası:", err); }
        }
    },
    // YENİ EKLENEN ETIKET FONKSİYONLARI
    hideEdgeLabels: function() { if(this.edgeLabels) this.edgeLabels.forEach(l => l.style.display = 'none'); },
    updateRectPrismLabels: function(mesh) {
        // (Dikdörtgen Prizma Etiketleri)
    },
    showMeasurements: function(mesh) {
        // (Ölçüleri Göster)
    },
    setTool: function(toolName) {
        if (!this.isInit) this.init();
        this.activeTool = toolName;
        if (toolName !== 'none' && this.container) { this.container.classList.remove('hidden'); }
    },
    clearScene: function() {
        if(!this.scene) return;
        this.hideEdgeLabels();
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            const obj = this.scene.children[i];
            if ((obj.type === 'Mesh' || obj.type === 'Line') && obj !== this.helperGroup) {
                if (obj.userData.labelElement) obj.userData.labelElement.remove();
                this.scene.remove(obj);
                if(obj.geometry) obj.geometry.dispose();
                if(obj.material) obj.material.dispose();
            }
        }
        if(this.helperGroup) this.helperGroup.clear();
        if(this.labelElement) this.labelElement.style.display = 'none';
        this.currentMesh = null;
        this.updateHandlePositions();
    },
    deleteObjectAt: function(x, y) {
        if (!this.isInit || !this.scene) return false;
        const coords = this.getNormalizedCoords(x, y);
        this.raycaster.setFromCamera(coords, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const hit = intersects.find(h => {
            const obj = h.object;
            let isHelper = false; let parent = obj.parent;
            while(parent) { if(parent === this.helperGroup) { isHelper = true; break; } parent = parent.parent; }
            return !isHelper && (obj.type === 'Mesh' || obj.type === 'Line' || obj.type === 'LineSegments');
        });
        if (hit) {
            let targetObj = hit.object;
            while (targetObj.parent && targetObj.parent !== this.scene) { targetObj = targetObj.parent; }
            if (this.scene.children.includes(targetObj)) {
                this.hideEdgeLabels();
                if (targetObj.userData.labelElement) targetObj.userData.labelElement.remove();
                this.scene.remove(targetObj);
                if (this.currentMesh === targetObj) this.currentMesh = null;
                return true;
            }
        }
        return false;
    },
    handlePinch: function(currentDistance) {
        if (!this.currentMesh || this.initialPinchDistance <= 0) return;
        const factor = currentDistance / this.initialPinchDistance;
        const newScale = Math.max(0.1, this.initialPinchScale * factor);
        this.currentMesh.scale.set(newScale, newScale, newScale);
        if(window.currentTool === 'move' && this.labelElement.style.display !== 'none') { this.showMeasurements(this.currentMesh); }
        this.updateHandlePositions();
    },
    startPinch: function(distance) {
        if (!this.currentMesh) return;
        this.initialPinchDistance = distance;
        this.initialPinchScale = this.currentMesh.scale.x; 
    },
 

    
    // --- 4. GÜNCELLENMİŞ PİRAMİT OLUŞTURUCU (NUMARALI) ---
    createUnfoldablePyramid: function(sides, radius, height, isCone) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        let faceCounter = 1;

        // TABAN (NUMARA 1)
        const baseGeo = new THREE.CircleGeometry(radius, sides);
        baseGeo.rotateX(-Math.PI / 2);
        if (!isCone) baseGeo.rotateY(Math.PI / sides + Math.PI/2); 
        const baseMesh = new THREE.Mesh(baseGeo, mat);
        baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), lineMat));
        
        const label1 = this.createLabelMesh(faceCounter++);
        label1.rotation.x = -Math.PI/2;
        label1.position.y = 0.02;
        baseMesh.add(label1);
        group.add(baseMesh);

        const angleStep = (Math.PI * 2) / sides;
        const sideLen = 2 * radius * Math.sin(Math.PI / sides);
        const apothem = radius * Math.cos(Math.PI / sides);
        const tiltAngle = Math.atan2(height, apothem); 
        
        const animParts = [];

        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep;
            const hinge = new THREE.Group();
            hinge.position.set(Math.cos(angle) * apothem, 0, Math.sin(angle) * apothem);
            hinge.rotation.y = -angle + Math.PI/2;
            baseMesh.add(hinge);

            const triShape = new THREE.Shape();
            triShape.moveTo(-sideLen/2, 0);
            triShape.lineTo(sideLen/2, 0);
            const slantHeight = Math.sqrt(height*height + apothem*apothem);
            triShape.lineTo(0, slantHeight); 
            triShape.lineTo(-sideLen/2, 0);
            
            const triGeo = new THREE.ShapeGeometry(triShape);
            const triMesh = new THREE.Mesh(triGeo, mat);
            if (!isCone) triMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(triGeo), lineMat));
            hinge.add(triMesh);

            // Yan Yüz Etiketi
            const label = this.createLabelMesh(faceCounter++);
            label.position.set(0, slantHeight/3, 0.02);
            triMesh.add(label);
            
            animParts.push({ 
                mesh: triMesh, 
                axis: 'x', 
                closedAngle: tiltAngle - Math.PI/2, 
                openAngle: -Math.PI/2 
            });
        }
        group.userData.animParts = animParts;
        return group;
    },

    
    

    
    // --- YENİLENMİŞ PİRAMİT OLUŞTURUCU (ÇİÇEK AÇILIMI) ---
    createUnfoldablePyramid: function(sides, radius, height, isCone) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 
        });
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        
        // 1. TABAN (Zemine Yapışık)
        const baseGeo = new THREE.CircleGeometry(radius, sides);
        baseGeo.rotateX(-Math.PI / 2); // Yere yatır
        // Düzgün durması için hizalama
        if (!isCone && (sides === 3 || sides === 4)) baseGeo.rotateY(Math.PI / sides);

        const baseMesh = new THREE.Mesh(baseGeo, mat);
        baseMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), lineMat));
        group.add(baseMesh);

        // 2. YAN YÜZLER (Menteşeli)
        const angleStep = (Math.PI * 2) / sides;
        const apothem = radius * Math.cos(Math.PI / sides);
        const sideLen = 2 * radius * Math.sin(Math.PI / sides);
        const slantHeight = Math.sqrt(height * height + apothem * apothem);
        
        // Eğim açısı (Tabanla yan yüz arasındaki açı)
        const tiltAngle = Math.atan2(height, apothem); 
        
        const animParts = [];

        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep;

            // Menteşe Noktası (Taban kenarı)
            const hinge = new THREE.Group();
            hinge.position.set(Math.cos(angle) * apothem, 0, Math.sin(angle) * apothem);
            hinge.rotation.y = -angle - Math.PI / 2; // Kenara hizala
            baseMesh.add(hinge);

            // Yan Yüz Geometrisi
            const triShape = new THREE.Shape();
            triShape.moveTo(-sideLen / 2, 0);
            triShape.lineTo(sideLen / 2, 0);
            triShape.lineTo(0, slantHeight); // Tepe noktası
            triShape.lineTo(-sideLen / 2, 0);

            const triGeo = new THREE.ShapeGeometry(triShape);
            const triMesh = new THREE.Mesh(triGeo, mat);
            if (!isCone) triMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(triGeo), lineMat));
            hinge.add(triMesh);

            // ANİMASYON MANTIĞI:
            // ShapeGeometry varsayılan olarak X-Y düzlemindedir (Dikey durur, Z=0).
            // Hinge Y ekseninde döndü. Şimdi X ekseninde yatıracağız.
            
            // closedAngle: Piramidin kapalı hali. 
            // Dikeyden (PI/2) -> 'tiltAngle' kadar geriye yatmalı.
            // Formül: (Math.PI / 2) - tiltAngle değil, direkt olarak (Math.PI/2 - tiltAngle) * -1
            // Yani: -Math.PI/2 + tiltAngle
            
            // openAngle: Tamamen yere yatmış hali.
            // Dikeyden (PI/2) -> Yere (PI). Fark: -PI/2
            
            animParts.push({ 
                mesh: hinge, // Grubu değil hinge'i değil, içindeki mesh'i de döndürebiliriz ama hinge daha temiz.
                // HATA DÜZELTME: ShapeGeometry X-Y düzleminde. X ekseninde döndüreceğiz.
                axis: 'x', 
                closedAngle: -Math.PI/2 + tiltAngle, // Tepeye kalk
                openAngle: -Math.PI/2 // Yere tam yat
            });
        }

        group.userData.animParts = animParts;
        return group;
    },

    // --- KÜRE AÇILIM OLUŞTURUCU (Portakal Dilimi Yöntemi) ---
    createUnfoldableSphere: function(radius) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 
        });
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const animParts = [];

        // Dilim Sayısı (Ne kadar çok olursa o kadar pürüzsüz ama yavaş olur)
        // 12 veya 16 idealdir.
        const segments = 16; 
        
        // Her bir dilimin açı genişliği
        const segmentAngle = (Math.PI * 2) / segments;

        for (let i = 0; i < segments; i++) {
            // Menteşe (Hinge) Grubu
            // Bu grup kürenin en altında (0,0,0) duracak ve dışarı doğru dönecek.
            const hinge = new THREE.Group();
            
            // Menteşeyi kendi açısına göre döndür (Y ekseni etrafında diz)
            const angle = i * segmentAngle;
            hinge.rotation.y = angle;
            
            group.add(hinge);

            // Dilim Geometrisi
            // SphereGeometry parametreleri: radius, widthSeg, heightSeg, phiStart, phiLength...
            // phiLength = segmentAngle yaparak sadece bir dilim alıyoruz.
            const geo = new THREE.SphereGeometry(
                radius, 
                8,  // Dilim içi detay (yatay)
                16, // Dilim içi detay (dikey)
                0,             // phiStart (0'dan başla)
                segmentAngle,  // phiLength (Dilim genişliği kadar)
                0,             // thetaStart
                Math.PI        // thetaLength (Tam yarım daire - Kutuptan kutuba)
            );

            // PİVOT AYARLAMALARI:
            // 1. Geometri normalde merkezdedir (0,0,0). 
            //    Bizim menteşemiz kürenin en altında (Güney Kutbu).
            //    Kürenin merkezi, menteşenin 'radius' kadar yukarısında olmalı.
            geo.translate(0, radius, 0);

            // 2. Geometri phiStart=0'dan başlar yani kenarı merkezdedir.
            //    Dilimi menteşenin ortasına hizalamak için yarısı kadar geri döndür.
            geo.rotateY(-segmentAngle / 2);

            const mesh = new THREE.Mesh(geo, mat);
            
            // Kenar çizgileri (Wireframe)
            const edges = new THREE.EdgesGeometry(geo);
            // Küre çizgileri çok yoğun olmasın diye sadece dış hatları çizmek zor,
            // bu yüzden standart edges kullanıyoruz ama çok yoğunsa iptal edilebilir.
            mesh.add(new THREE.LineSegments(edges, lineMat));

            hinge.add(mesh);

            // Animasyon Verisi
            // Menteşe Y ekseninde döndü. Dışarı açılmak için X ekseninde dönmeli.
            // Kapalıyken 0 derece (Dik).
            // Açıkken -Math.PI/2 (veya duruma göre +) (Yere yat).
            // Y ekseni rotasyonuna göre X ekseni teğet kalır.
            
            animParts.push({ 
                mesh: hinge, 
                axis: 'x', 
                closedAngle: 0, 
                openAngle: -Math.PI / 2 // Dışarı tam açıl
            });
        }

        group.userData.animParts = animParts;
        return group;
    },

   // --- 1. YARDIMCI: NUMARA ETİKETİ OLUŞTURUCU ---
    createLabelMesh: function(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white'; 
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 64, 64);

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: false });
        const geometry = new THREE.PlaneGeometry(0.3, 0.3);
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = 0.02; 
        return mesh;
    },

    // --- 2. GÜNCELLEŞTİRİLMİŞ ANİMASYON MANTIĞI (SIRALI AÇILMA) ---
    // Bu fonksiyon sürgüden gelen 0-100 arası değeri alır ve parçaları sırayla açar.
    // --- app.js içindeki Scene3D nesnesine bu mantığı uygulayın ---

// --- GÜNCELLENMİŞ ANİMASYON (EŞ ZAMANLI VE DOĞRUSAL) ---
    animateUnfold: function(group, value) {
        if (!group || !group.userData.animParts) return;

        const parts = group.userData.animParts;
        
        // Yüzdeyi hesapla (0.0 - 1.0 arası)
        const percent = value / 100;

        parts.forEach(part => {
            // Tüm parçalar aynı anda, sürgü oranında hareket eder
            const currentAngle = part.closedAngle + (part.openAngle - part.closedAngle) * percent;
            
            if (part.axis === 'x') part.mesh.rotation.x = currentAngle;
            else if (part.axis === 'y') part.mesh.rotation.y = currentAngle;
            else if (part.axis === 'z') part.mesh.rotation.z = currentAngle;
        });
    },
    // --- 2. FONKSİYON: NOKTA KONTROLÜ ---
    isPointInPolygon: function(p, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) &&
                (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }, 



    // --- 3. FONKSİYON: SİLGİ MANTIĞI (DÜZELTİLMİŞ HALİ) ---
    handleEraser: function(pos) {
        let needsRedraw = false;

        // --- 1. ADIM: 3D NESNELERİ SİLME KONTROLÜ ---
        // Eğer 3D motoru aktifse ve silme fonksiyonu varsa önce oraya bak
        if (this.deleteObjectAt && this.deleteObjectAt(pos.x, pos.y)) {
            needsRedraw = true;
            
            // Eğer 3D sahneden bir şey silindiyse, bunu ana çizim listesinden (drawnStrokes) de düşmeliyiz
            if (window.drawnStrokes) {
                window.drawnStrokes = window.drawnStrokes.filter(s => {
                    if (s.type === '3D_object') {
                        // Nesne hala sahnede var mı? (deleteObjectAt sildiyse yok olmalı)
                        // Mesh ID'sine göre kontrol ediyoruz.
                        const stillExists = this.scene.getObjectById(s.mesh.id);
                        return !!stillExists; 
                    }
                    return true;
                });
            }
        }

        // --- 2. ADIM: 2D NESNELERİ SİLME KONTROLÜ ---
        // (Bu kod bloğu daha önce fonksiyonun dışında kaldığı için hata veriyordu)
        
        let strokesToKeep = [];
        let is2DDeleted = false;
        
        // window.drawnStrokes global olduğu için buradan erişebiliriz
        const strokes = window.drawnStrokes || [];

        for (const stroke of strokes) {
            let touched = false;
            
            // 3D Nesneleri (Listede varsa) atla, zaten yukarıda hallettik
            if (stroke.type === '3D_object') {
                strokesToKeep.push(stroke);
                continue;
            }

            // 1. KALEM
            if (stroke.type === 'pen') {
                if (stroke.path) {
                    for (const point of stroke.path) { if (distance(point, pos) < 10) { touched = true; break; } }
                }
            } 
            // 2. NOKTA
            else if (stroke.type === 'point') {
                if (distance(stroke, pos) < 10) { touched = true; }
            } 
            // 3. ÇİZGİLER (Doğru, Işın, Parça)
            else if (stroke.type === 'straightLine' || stroke.type === 'line' || stroke.type === 'segment' || stroke.type === 'ray') {
                if (distanceToSegment(pos, stroke.p1, stroke.p2) < 10) { touched = true; }
                else {
                   // Yedek hassas kontrol
                   const p1 = stroke.p1; const p2 = stroke.p2;
                   const steps = Math.max(1, Math.floor(distance(p1, p2) / 5)); 
                   for (let i = 0; i <= steps; i++) {
                       const t = i / steps;
                       const sampleX = p1.x + (p2.x - p1.x) * t;
                       const sampleY = p1.y + (p2.y - p1.y) * t;
                       if (distance({x: sampleX, y: sampleY}, pos) < 10) { touched = true; break; }
                   }
                }
            }
            // 4. ÇEMBER / YAY
            else if (stroke.type === 'arc') {
                const centerPos = { x: stroke.cx, y: stroke.cy };
                if (distance(centerPos, pos) < 10) { touched = true; } // Merkeze tıklandıysa
                else {
                    const dist = distance(pos, centerPos);
                    if (Math.abs(dist - stroke.radius) < 10) { touched = true; } // Yaya tıklandıysa
                }
            }
            // 5. ÇOKGENLER
            else if (stroke.type === 'polygon') {
                if (stroke.center && distance(stroke.center, pos) < 10) { touched = true; } 
                else if (stroke.vertices) {
                    for (const v of stroke.vertices) { if (distance(v, pos) < 10) { touched = true; break; } }
                    if (!touched) {
                        for (let j = 0; j < stroke.vertices.length; j++) {
                            const v1 = stroke.vertices[j];
                            const v2 = stroke.vertices[(j + 1) % stroke.vertices.length];
                            if (distanceToSegment(pos, v1, v2) < 10) { touched = true; break; }
                        }
                    }
                }
            } 
            // 6. RESİMLER
            else if (stroke.type === 'image') {
                if (!stroke.isBackground) { 
                    const dx = pos.x - stroke.x;
                    const dy = pos.y - stroke.y;
                    const angleRad = -stroke.rotation * (Math.PI / 180);
                    const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
                    const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
                    const halfW = stroke.width / 2;
                    const halfH = stroke.height / 2;
                    if (localX > -halfW && localX < halfW && localY > -halfH && localY < halfH) { touched = true; }
                }
            }

            if (touched) { 
                is2DDeleted = true; 
                needsRedraw = true;
            } else { 
                strokesToKeep.push(stroke); 
            }
        }

        // Eğer 2D bir şeyler silindiyse listeyi güncelle ve ekranı yenile
        if (is2DDeleted) {
            window.drawnStrokes = strokesToKeep;
            if (typeof redrawAllStrokes === 'function') {
                redrawAllStrokes(); 
            }
        }

        return needsRedraw;
    }

};

// --- FARE BIRAKMA (MOUSEUP) - GÜÇLENDİRİLMİŞ ---
window.addEventListener('mouseup', (e) => { // DÜZELTME: 'canvas' yerine 'window' yapıldı

    // 1. 3D İşlemlerini Güvenli Bitir (Hata olsa bile devam et)
    try {
        if (window.Scene3D) {
            // Eğer aktif bir 3D işlemi varsa bitir
            if (typeof window.Scene3D.onUp === 'function') {
                window.Scene3D.onUp();
            }
        }
    } catch (err) {
        console.error("3D MouseUp Hatası:", err);
    }

    // 2. Taşıma İşlemini Bitir
    if (currentTool === 'move' && isMoving) {
        // (Buradaki ses durdurma kodu silindi)
        
        // Değişkenleri Sıfırla
        isMoving = false; 
        selectedPointKey = null; 
        rotationPivot = null; 
        originalStartPos = {};
        
        if (typeof returnToSnapshot !== 'undefined' && returnToSnapshot) {
            returnToSnapshot = false; 
            setActiveTool('snapshot'); 
            const animBtn = document.getElementById('btn-animate');
            if (animBtn) animBtn.classList.add('active');
            document.body.classList.add('cursor-snapshot'); 
        }
        
        redrawAllStrokes(); 
        return;
    }

    // 3. Snapshot (Canlandırma) Bitişi
    if (currentTool === 'snapshot' && snapshotStart) {
        // Eğer e (event) yoksa veya koordinat alınamıyorsa mevcut mouse pozisyonunu kullan
        let clientX = e ? e.clientX : currentMousePos.x;
        let clientY = e ? e.clientY : currentMousePos.y;
        
        // Eğer mouse pencere dışındaysa son bilinen konumu al
        const endPos = snapTarget || { x: clientX, y: clientY };
        
        let x = Math.min(snapshotStart.x, endPos.x);
        let y = Math.min(snapshotStart.y, endPos.y);
        let w = Math.abs(endPos.x - snapshotStart.x);
        let h = Math.abs(endPos.y - snapshotStart.y);

        if (w > 10 && h > 10) {
            redrawAllStrokes(); 
            // Kanvas sınırlarını kontrol et
            if (x >= 0 && y >= 0 && x + w <= canvas.width && y + h <= canvas.height) {
                const imageData = ctx.getImageData(x, y, w, h);
                const data = imageData.data;
                // Beyaz ve Açık Gri Temizleme (Daha güçlü temizlik için 180 yapıldı)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    // Eğer piksel yeterince açık renkse (beyaz/gri), onu şeffaf yap
                    if (r > 180 && g > 180 && b > 180) { 
                        data[i + 3] = 0; // Alpha kanalını sıfırla (Görünmez yap)
                    }
                }
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = w; tempCanvas.height = h;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);
                const newImg = new Image();
                newImg.src = tempCanvas.toDataURL();
                newImg.onload = () => {
                    const newObj = { 
                        type: 'image', 
                        img: newImg, 
                        x: x + w / 2, 
                        y: y + h / 2, 
                        width: w, 
                        height: h, 
                        rotation: 0,
                        isBackground: false // Hareket edebilir
                    };
                    drawnStrokes.push(newObj);
                    snapshotStart = null;
                    
                    // Otomatik taşıma
                    currentTool = 'move';
                    setActiveTool('move'); // Butonları güncelle
                    
                    selectedItem = newObj;
                    isMoving = false; // Hemen yapışmasın, tıklayınca taşınsın
                    returnToSnapshot = true; 
                    
                    redrawAllStrokes();
                    if (window.audio_click) { 
                        window.audio_click.currentTime = 0; 
                        window.audio_click.play(); 
                    }
                };
            }
        }
        snapshotStart = null;
        return;
    }

    // 4. Diğer 2D Çizim Bitişleri
    const endPos = snapTarget || currentMousePos;

    if (isDrawingLine && lineStartPoint) {
        drawnStrokes.push({ type: 'straightLine', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3 });
        isDrawingLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingInfinityLine && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'line', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingInfinityLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingSegment && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'segment', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingSegment = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingRay && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'ray', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingRay = false; lineStartPoint = null; redrawAllStrokes();
    }
    // --- app.js (mouseup içinde) ---
    
    else if (currentTool.startsWith('draw_polygon_')) {
        if (window.tempPolygonData && window.tempPolygonData.center) {
            const finalRadius = window.tempPolygonData.radius || 0;
            const finalRotation = window.tempPolygonData.rotation || 0;
            
            if (window.tempPolygonData.type === 0) {
                window.PolygonTool.finalizeCircle(finalRadius);
            } else {
                window.PolygonTool.finalizeDraw(finalRadius, finalRotation);
            }
            
            if (typeof polygonPreviewLabel !== 'undefined') {
                polygonPreviewLabel.classList.add('hidden');
            }
            
            // ▼▼▼ BU SATIRI SİLİN VEYA YORUMA ALIN ▼▼▼
            // setActiveTool('none'); 
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        }
    }

    // 5. Silgi Bitişi
    if (currentTool === 'eraser') {
        isDrawing = false; 
        setActiveTool('none'); 
        return; 
    }

    // Genel Bitiş
    isDrawing = false;
    clearTimeout(snapHoverTimer);
    snapHoverTimer = null;
if(previewLabel2D) previewLabel2D.style.display = 'none';
});


// --- DOKUNMA BIRAKMA (TOUCHEND) ---
canvas.addEventListener('touchend', (e) => {

    // 1. 3D Çizim ve Etkileşim Bitişi (DÜZELTME BURADA)
    // HATA: Burada daha önce 'onDown' yazıyordu, bu yüzden şekil oluşmuyordu.
    // DOĞRUSU: 'onUp' olmalı ki parmağı çekince şekil tamamlansın.
    if (window.Scene3D) {
        window.Scene3D.onUp();
    }

    // 2. Pinch Zoom Bitişi
    if (isPinching) {
        isPinching = false; 
        isMoving = false; 
        if (selectedItem) {
            selectedItem.originalWidth = selectedItem.width;
            selectedItem.originalHeight = selectedItem.height;
        }
        redrawAllStrokes();
        return;
    }

    // 3. Taşıma Bitişi
    if (currentTool === 'move' && isMoving) {
        isMoving = false; 
        selectedPointKey = null; 
        rotationPivot = null; 
        originalStartPos = {};
        
        if (returnToSnapshot) {
            returnToSnapshot = false; 
            setActiveTool('snapshot'); 
            if (animateButton) { animateButton.classList.add('active'); body.classList.add('cursor-snapshot'); }
        }
        return;
    }
    
    // 4. Canlandırma Bitişi (Dokunmatik için kısa yol)
    if (currentTool === 'snapshot' && snapshotStart) {
        // Mouseup'taki mantığı tetiklemek için manuel olay gönderiyoruz
        const mouseUpEvent = new Event('mouseup');
        canvas.dispatchEvent(mouseUpEvent);
        return;
    }

if (currentTool.startsWith('draw_polygon_') && window.tempPolygonData && window.tempPolygonData.center) {
        
        // Eğer yarıçap çok küçükse (yanlışlıkla dokunma) çizme
        if (window.tempPolygonData.radius > 10) {
            
            const isCircle = (window.tempPolygonData.type === 0);
            
            // Kalıcı çizim listesine ekle
            drawnStrokes.push({
                type: isCircle ? 'arc' : 'polygon',
                
                // Çember için özellikler
                cx: isCircle ? window.tempPolygonData.center.x : undefined,
                cy: isCircle ? window.tempPolygonData.center.y : undefined,
                startAngle: 0,
                endAngle: 360,
                
                // Çokgen için özellikler
                center: isCircle ? undefined : window.tempPolygonData.center,
                sideCount: window.tempPolygonData.type,
                // Köşeleri hesapla ve kaydet (Sürükleme yaparken bozulmaması için)
                vertices: isCircle ? [] : (window.PolygonTool ? window.PolygonTool.calculateVertices(window.tempPolygonData.center, window.tempPolygonData.radius, window.tempPolygonData.type, window.tempPolygonData.rotation) : []),

                // Ortak özellikler
                radius: window.tempPolygonData.radius,
                rotation: window.tempPolygonData.rotation,
                color: currentLineColor,
                width: 3,
                fillColor: null, // İçi boş olsun
                
                // Etiketler kapalı başlasın
                showEdgeLabels: false,
                showAngleLabels: false,
                showCircleInfo: false
            });
        }

        // Geçici veriyi temizle
        window.tempPolygonData = { type: 0, center: null, radius: 0, rotation: 0 };
        if(typeof polygonPreviewLabel !== 'undefined') polygonPreviewLabel.classList.add('hidden');
        
        redrawAllStrokes();
    }

    // 5. Diğer Çizim Bitişleri
    const endPos = snapTarget || currentMousePos;
    
    if (isDrawingLine && lineStartPoint) {
        drawnStrokes.push({ type: 'straightLine', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3 });
        isDrawingLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingInfinityLine && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'line', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingInfinityLine = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingSegment && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'segment', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingSegment = false; lineStartPoint = null; redrawAllStrokes();
    }
    else if (isDrawingRay && lineStartPoint) {
        const label1 = nextPointChar; const label2 = advanceChar(label1); nextPointChar = advanceChar(label2);
        drawnStrokes.push({ type: 'ray', p1: lineStartPoint, p2: endPos, color: currentLineColor, width: 3, label1: label1, label2: label2 });
        isDrawingRay = false; lineStartPoint = null; redrawAllStrokes();
    }
    // --- app.js (touchend içinde) ---

    else if (currentTool.startsWith('draw_polygon_')) {
        if (window.tempPolygonData && window.tempPolygonData.center) {
            const finalRadius = window.tempPolygonData.radius || 0;
            const finalRotation = window.tempPolygonData.rotation || 0;
            
            if (window.tempPolygonData.type === 0) window.PolygonTool.finalizeCircle(finalRadius);
            else window.PolygonTool.finalizeDraw(finalRadius, finalRotation);
            
            polygonPreviewLabel.classList.add('hidden');
            
            // ▼▼▼ BU SATIRI SİLİN VEYA YORUMA ALIN ▼▼▼
            // setActiveTool('none'); 
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        }
    }

    // 6. Silgi Bitişi
    if (currentTool === 'eraser') {
        isDrawing = false; setActiveTool('none'); return; 
    }

    isDrawing = false; 
    snapTarget = null; 
    snapIndicator.style.display = 'none';
});

// --- 1. ÖNCE YARDIMCI FONKSİYONU TANIMLA ---
// Bu fonksiyon, şeklin en altındaki yüzeyi bulur ve onu sabitler.
function markBaseFace(mesh) {
    if (!mesh || !mesh.children || mesh.children.length === 0) return;

    mesh.children.forEach(face => {
        face.userData.isBase = false;
        face.userData.targetAngle = Math.PI / 2; // Varsayılan 90 derece açılma
    });

    let lowestY = Infinity;
    let baseFace = null;

    mesh.children.forEach(face => {
        // Yüzeyin dünya koordinatlarındaki pozisyonunu al
        const worldPos = new THREE.Vector3();
        face.getWorldPosition(worldPos);
        
        if (worldPos.y < lowestY) {
            lowestY = worldPos.y;
            baseFace = face;
        }
    });

    if (baseFace) {
        baseFace.userData.isBase = true;
        baseFace.userData.targetAngle = 0; // Taban açılmaz, sabit kalır
    }
}



// --- PDF KAPATMA MANTIĞI ---
const closePdfBtn = document.getElementById('btn-close-pdf');

if (closePdfBtn) {
    closePdfBtn.addEventListener('click', () => {
        // 1. PDF Değişkenlerini Sıfırla
        currentPDF = null;
        currentPDFPage = 1;
        totalPDFPages = 0;
        pdfImageStroke = null;

        // 2. Hafızadan (drawnStrokes) Arkaplan Resmini Sil
        // Sadece 'image' türünde ve 'isBackground' olanları listeden çıkar
        drawnStrokes = drawnStrokes.filter(stroke => !stroke.isBackground);
        window.drawnStrokes = drawnStrokes;

        // 3. Arayüzü Gizle
        if(pdfControls) pdfControls.classList.add('hidden'); // İleri/Geri butonları
        closePdfBtn.classList.add('hidden'); // Kendini gizle
        
        // 4. Ekranı Temizle
        redrawAllStrokes();
    });
}

// --- PDF YÜKLENDİĞİNDE BUTONU GÖSTERMEK İÇİN EKLEME ---
// Mevcut 'renderPDFPage' fonksiyonunun içine, en alta şu satırı eklemelisin,
// ama dosyanı bozmamak için bunu dışarıdan "yama" olarak ekliyorum:

const originalRenderPDFPage = renderPDFPage;
renderPDFPage = async function(num) {
    await originalRenderPDFPage(num); // Orijinal işi yap
    
    // Sonra butonu göster
    if (closePdfBtn) {
        closePdfBtn.classList.remove('hidden');
        closePdfBtn.style.display = 'block';
    }
};

// --- app.js İÇİNE EKLE ---

// PolygonTool yoksa oluştur veya genişlet
if (!window.PolygonTool) window.PolygonTool = {};

// Döndürme Tutamacının (Yeşil Buton) Pozisyonunu Hesapla
window.PolygonTool.getRotateHandlePosition = function(stroke) {
    const center = (stroke.type === 'arc') ? {x: stroke.cx, y: stroke.cy} : stroke.center;
    const radius = stroke.radius;
    const rotation = stroke.rotation || 0;
    
    // Şeklin 50px yukarısında (döndürülmüş koordinatta)
    const handleDist = radius + 50; 
    const angleRad = (rotation - 90) * (Math.PI / 180); // -90 çünkü 0 derece saat 3 yönüdür, biz tepe istiyoruz
    
    return {
        x: center.x + Math.cos(angleRad) * handleDist,
        y: center.y + Math.sin(angleRad) * handleDist
    };
};

// Poligon Köşelerini Güncelle (Taşıma sırasında şekil bozulmasın diye)
window.PolygonTool.updateVertices = function(stroke) {
    if (stroke.type !== 'polygon') return;
    
    // calculateVertices fonksiyonunun cokgen.js'de tanımlı olduğunu varsayıyoruz.
    // Eğer yoksa basitçe merkez taşıma yeterli olur ama köşeler eski yerinde kalır.
    if (window.PolygonTool.calculateVertices) {
        stroke.vertices = window.PolygonTool.calculateVertices(
            stroke.center, 
            stroke.radius, 
            stroke.sideCount, 
            stroke.rotation
        );
    }
};

function undoLastStroke() {
    if (drawnStrokes.length > 0) {
        // Ses Efekti
        if (window.audio_undo) { 
            try { window.audio_undo.currentTime = 0; window.audio_undo.play(); } catch(e) {}
        }

        // Son işlemi al
        const lastStroke = drawnStrokes[drawnStrokes.length - 1];

        // --- 3D NESNE KONTROLÜ ---
        if (lastStroke.type === '3D_object') {
            if (window.Scene3D && window.Scene3D.scene) {
                const mesh = lastStroke.mesh;
                
                // Varsa etiketini sil
                if (mesh.userData.labelElement) mesh.userData.labelElement.remove();
                
                // Dikdörtgen Prizma ise kenar etiketlerini gizle
                if (mesh.userData.type === 'prism_rect' && window.Scene3D.hideEdgeLabels) {
                    window.Scene3D.hideEdgeLabels();
                }

                // Sahneden kaldır
                window.Scene3D.scene.remove(mesh);
                
                // Bellek temizliği
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
                if (mesh.children) {
                    mesh.children.forEach(c => {
                        if(c.geometry) c.geometry.dispose();
                        if(c.material) c.material.dispose();
                    });
                }
                
                // Eğer bu nesne şu an seçiliyse, seçimi de sıfırla
                if (window.Scene3D.currentMesh === mesh) {
                    window.Scene3D.currentMesh = null;
                    if(window.Scene3D.helperGroup) window.Scene3D.helperGroup.clear();
                    if(window.Scene3D.updateHandlePositions) window.Scene3D.updateHandlePositions();
                }
            }
        }        drawnStrokes.pop(); 
        redrawAllStrokes(); 
    }
}

function clearAllStrokes() {
    // 1. Ses Efekti (Varsa)
    if (drawnStrokes.length > 0 || (window.Scene3D && window.Scene3D.scene && window.Scene3D.scene.children.length > 2)) {
        if (window.audio_clear) {
             try { window.audio_clear.play(); } catch(e) {}
        }
    }

    // 2. 2D Çizimleri Temizle (Arkaplan resimleri hariç)
    drawnStrokes = drawnStrokes.filter(stroke => stroke.isBackground === true);
    window.drawnStrokes = drawnStrokes; 
    
    if(window.nextPointChar) window.nextPointChar = 'A';
    redrawAllStrokes(); 

    // 3. 3D Şekilleri Temizle (YENİ EKLENEN KISIM)
    if (window.Scene3D && window.Scene3D.clearScene) {
        window.Scene3D.clearScene();
    }
}
// --- EKSİK OLAN findHit VE YARDIMCISI (EN ALTA EKLEYİN) ---

function findHit(pos) {
    const SNAP_THRESHOLD = 20; 

    // 1. 3D Tutamaç Kontrolü
    if (window.Scene3D && window.Scene3D.currentMesh && currentTool === 'move') {
        const handles = window.Scene3D.handles;
        if (handles.center && distance(pos, handles.center) < 50) return { is3D: true, action: 'manipulate' };
    }
    
    // 2. 2D Nesne Kontrolleri
    for (let i = drawnStrokes.length - 1; i >= 0; i--) {
        const stroke = drawnStrokes[i];

        // A) Resim
        if (stroke.type === 'image') {
            const halfW = stroke.width / 2;
            const halfH = stroke.height / 2;
            const cornerX = stroke.x + halfW;
            const cornerY = stroke.y + halfH;
            if (distance(pos, {x: cornerX, y: cornerY}) < 30) return { item: stroke, pointKey: 'image_resize' };
            if (pos.x > stroke.x - halfW && pos.x < stroke.x + halfW && pos.y > stroke.y - halfH && pos.y < stroke.y + halfH) return { item: stroke, pointKey: 'self' };
        }

        // B) Çember / Yay (ARC) - SORUNUN ÇÖZÜLDÜĞÜ YER
        if (stroke.type === 'arc') {
            const center = { x: stroke.cx, y: stroke.cy };
            const dist = distance(pos, center);

            // 1. Kenara Tıklama (Bilgi Göster/Gizle) - Kenar kalınlığı toleransı 10px
            if (Math.abs(dist - stroke.radius) < 10) {
                return { item: stroke, pointKey: 'toggle_circle_info' };
            }
            
            // 2. Yeniden Boyutlandırma Tutamacı (Varsa)
            const resizePos = { x: stroke.cx + stroke.radius, y: stroke.cy };
            if (distance(pos, resizePos) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'resize' };

            // 3. Merkezden Taşıma (Yarıçapın yarısı kadar bir alana tıklanırsa)
            if (dist < stroke.radius / 2 || dist < 20) {
                return { item: stroke, pointKey: 'center' };
            }
        }

        // C) Çokgen (POLYGON)
        if (stroke.type === 'polygon') {
            if (currentTool === 'move' || currentTool === 'none') {
                // Döndürme
                if (window.PolygonTool && window.PolygonTool.getRotateHandlePosition) {
                    const rotPos = window.PolygonTool.getRotateHandlePosition(stroke);
                    if (distance(pos, rotPos) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'rotate' };
                }
                // Boyutlandırma (İlk köşe)
                if (stroke.vertices && stroke.vertices.length > 0 && distance(pos, stroke.vertices[0]) < SNAP_THRESHOLD) {
                    return { item: stroke, pointKey: 'resize' };
                }
                // Taşıma (Merkez)
                if (distance(pos, stroke.center) < stroke.radius / 2) return { item: stroke, pointKey: 'center' };

                // Kenar/Köşe Etiketleri
                if (stroke.vertices) {
                    for (let v = 0; v < stroke.vertices.length; v++) {
                        if (distance(pos, stroke.vertices[v]) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'toggle_angles' };
                    }
                    for (let j = 0; j < stroke.vertices.length; j++) {
                        const v1 = stroke.vertices[j];
                        const v2 = stroke.vertices[(j + 1) % stroke.vertices.length];
                        if (distanceToSegment(pos, v1, v2) < 10) return { item: stroke, pointKey: 'toggle_edges' };
                    }
                }
            }
        }

        // D) Diğer (Nokta, Çizgi vb.)
        if (stroke.type === 'point' && distance(pos, stroke) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'self' };
        if (stroke.p1 && distance(pos, stroke.p1) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'p1' };
        if (stroke.p2 && distance(pos, stroke.p2) < SNAP_THRESHOLD) return { item: stroke, pointKey: 'p2' };
    }
    return null; 
}

// --- KALEM KALINLIK AYARI ---
const penWidthSlider = document.getElementById('pen-width-slider');
const penWidthValueLabel = document.getElementById('pen-width-value');

if (penWidthSlider && penWidthValueLabel) {
    penWidthSlider.addEventListener('input', (e) => {
        // 1. Değeri al
        const newWidth = parseInt(e.target.value);
        
        // 2. Global değişkeni güncelle
        currentPenWidth = newWidth;
        
        // 3. Etiketi güncelle
        penWidthValueLabel.innerText = newWidth;
        
        // İsteğe bağlı: Çizgi, Çokgen vb. kalınlığını da buna bağlamak isterseniz:
        // window.currentLineColor kullanıldığı gibi bir window.currentLineWidth da yapabilirsiniz.
        // Şimdilik sadece kalemi etkiliyor.
    });
}

// --- app.js --- (En alta ekleyin)

// 1. Açınım Sürgüsünü (Slider) Seç
const unfoldSlider = document.getElementById('unfold-slider');

if (unfoldSlider) {
    // Sürgü hareket ettiğinde (input olayı) çalışır
    unfoldSlider.addEventListener('input', (e) => {
        // 0 ile 100 arasındaki değer
        const val = parseInt(e.target.value);

        // 3D Sahne ve Seçili Obje var mı kontrol et
        if (window.Scene3D && window.Scene3D.currentMesh) {
            
            // Şu anki aktif şekli al
            let mesh = window.Scene3D.currentMesh;

            // KONTROL: Şekil henüz "açılabilir" (unfoldable) modda değilse dönüştür
            // Normalde şekiller çizildiğinde tek parça (solid) olur. 
            // Sürgüye dokunulduğunda parçalara ayrılması gerekir.
            if (!mesh.userData.isUnfoldable) {
                // Bu fonksiyon, mevcut katı şekli siler ve yerine animasyonlu (menteşeli) versiyonunu koyar
                if (typeof window.Scene3D.convertToUnfoldable === 'function') {
                    window.Scene3D.convertToUnfoldable(mesh);
                    
                    // Dönüştürme işleminden sonra currentMesh değiştiği için yenisini alıyoruz
                    mesh = window.Scene3D.currentMesh;
                }
            }

            // Eğer şekil açılabilir moddaysa ve animasyon fonksiyonu varsa çalıştır
            if (mesh && mesh.userData.isUnfoldable && typeof window.Scene3D.animateUnfold === 'function') {
                window.Scene3D.animateUnfold(mesh, val);
            }
        }
    });
}

// 2. Yeni bir araç seçildiğinde veya yeni çizim yapıldığında Slider'ı Sıfırla
// (Bu fonksiyonu mevcut kodlarınızın içine entegre etmek yerine, 
// setActiveTool veya onUp fonksiyonlarına ek yama olarak buraya koyuyorum)

// Mevcut setActiveTool fonksiyonunu "dinleyerek" slider'ı sıfırlama mantığı:
const originalSetActiveTool = window.setActiveTool; // Varsa eski fonksiyonu sakla (Global tanımlıysa)
/* Not: app.js içinde setActiveTool 'const' veya 'let' ile değil, 
   'function setActiveTool' ile tanımlandıysa window.setActiveTool olarak erişilebilir. */

if (typeof window.setActiveTool === 'function') {
    // Fonksiyonu override ediyoruz (üzerine yazıyoruz) ama eskisini de çağırıyoruz
    window.setActiveTool = function(tool) {
        // Orijinal işlemi yap
        if (originalSetActiveTool) originalSetActiveTool(tool);

        // Sürgüyü sıfırla
        if (unfoldSlider) {
            unfoldSlider.value = 0;
        }
        
        // Eğer 3D çizim aracı değilse ve 'move' değilse, sahnedeki seçimi kaldırabiliriz (İsteğe bağlı)
        // Ancak sizin mevcut mantığınızda 3D şekiller ekranda kalıyor, bu yüzden dokunmuyoruz.
    };
}

// =================================================================
// V23 - FİNAL: KAPAK YÖNLERİ TAM TERSİNE ÇEVRİLDİ (180 DERECE FLIP)
// (Bunu dosyanın en altına yapıştırın)
// =================================================================

if (window.Scene3D) {
    console.log("%c V23 - YÖNLER TERSİNE DÖNDÜ ", "background: red; color: white; font-size: 20px");

    // 1. EKRAN POZİSYONU
    window.Scene3D.toScreenPosition = function(obj, vector) {
        if (!this.camera || !this.renderer) return { x: -100, y: -100 };
        const widthHalf = 0.5 * this.renderer.getContext().canvas.width;
        const heightHalf = 0.5 * this.renderer.getContext().canvas.height;
        const p = vector.clone();
        p.project(this.camera);
        return {
            x: (p.x * widthHalf) + widthHalf,
            y: -(p.y * heightHalf) + heightHalf
        };
    };

    // 2. YARDIMCI: NUMARA ETİKETİ
    window.createNumberSprite = function(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 128, 128);
        ctx.font = 'bold 80px Arial'; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(number, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.position.y = 0.05; sprite.scale.set(1.5, 1.5, 1); 
        return sprite;
    };

    // 3. DÖNÜŞTÜRME FONKSİYONU
    window.Scene3D.convertToUnfoldable = function(oldMesh) {
        if (!oldMesh || !oldMesh.userData) return;
        
        const type = oldMesh.userData.type;
        const size = oldMesh.userData.baseSize || 100; 
        const height = oldMesh.userData.height || (size * 2);
        const oldPos = oldMesh.position.clone();
        const oldRot = oldMesh.rotation.clone();
        const oldScale = oldMesh.scale.x || 1; 

        let sides = 4;
        if (type === 'prism_3') sides = 3;
        else if (type === 'prism_4' || type === 'prism_rect' || type === 'prism_cube' || type === 'cube') sides = 4;
        else if (type === 'prism_5') sides = 5;
        else if (type === 'prism_6') sides = 6;
        else if (type === 'prism_cylinder') sides = 32;

        let newGroup = null;
        if (this.createUnfoldablePrism) {
            newGroup = this.createUnfoldablePrism(sides, size, height, type);
        }

        if (newGroup) {
            this.scene.remove(oldMesh);
            if (oldMesh.geometry) oldMesh.geometry.dispose();

            newGroup.position.copy(oldPos);
            newGroup.rotation.copy(oldRot);
            newGroup.scale.set(oldScale, oldScale, oldScale);
            
            newGroup.userData = { 
                type: type, baseSize: size, height: height, 
                isUnfoldable: true, animParts: newGroup.userData.animParts 
            };
            
            this.scene.add(newGroup);
            this.currentMesh = newGroup;
            this.updateHandlePositions();
        }
    };

    // 4. EVRENSEL PRİZMA OLUŞTURUCU (KAPAKLAR TERS ÇEVRİLDİ)
    window.Scene3D.createUnfoldablePrism = function(sides, size, height, type) {
        const group = new THREE.Group();
        group.userData.isUnfoldable = true; 
        group.userData.type = 'unfoldable_prism';

        const mat = new THREE.MeshPhongMaterial({ 
            color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.8 
        });
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const animParts = [];

        let dimX = size, dimZ = size; 
        const isCylinder = (sides > 10); 
        let isPolygon = (!type.startsWith('prism_rect') && !type.startsWith('prism_cube') && type !== 'cube' && !isCylinder);

        if (type === 'prism_rect') { dimX = size * 1.5; dimZ = size; }
        else if (type === 'prism_cube' || type === 'cube') { dimX = size * 2; dimZ = size * 2; height = size * 2; }

        // --- A) KÜP VE DİKDÖRTGEN ---
        if (!isPolygon && !isCylinder) {
            // ARKA (1)
            const backGeo = new THREE.PlaneGeometry(dimX, height); backGeo.rotateX(-Math.PI / 2);
            const backMesh = new THREE.Mesh(backGeo, mat);
            backMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(backGeo), lineMat));
            backMesh.add(window.createNumberSprite("1"));
            group.add(backMesh); 

            // SAĞ (2)
            const rightHinge = new THREE.Group(); rightHinge.position.set(dimX/2, 0, 0); backMesh.add(rightHinge);
            const rightGeo = new THREE.PlaneGeometry(dimZ, height); rightGeo.rotateX(-Math.PI / 2); 
            const rightMesh = new THREE.Mesh(rightGeo, mat); rightMesh.position.set(dimZ/2, 0, 0); 
            rightMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rightGeo), lineMat));
            rightMesh.add(window.createNumberSprite("2"));
            rightHinge.add(rightMesh);
            animParts.push({ mesh: rightHinge, axis: 'z', closedAngle: -Math.PI / 2, openAngle: 0 });

            // ÖN (3)
            const frontHinge = new THREE.Group(); rightMesh.add(frontHinge); frontHinge.position.set(dimZ/2, 0, 0); 
            const frontGeo = new THREE.PlaneGeometry(dimX, height); frontGeo.rotateX(-Math.PI / 2); 
            const frontMesh = new THREE.Mesh(frontGeo, mat); frontMesh.position.set(dimX/2, 0, 0); 
            frontMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(frontGeo), lineMat));
            frontMesh.add(window.createNumberSprite("3"));
            frontHinge.add(frontMesh);
            animParts.push({ mesh: frontHinge, axis: 'z', closedAngle: -Math.PI / 2, openAngle: 0 });

            // SOL (4)
            const leftHinge = new THREE.Group(); frontMesh.add(leftHinge); leftHinge.position.set(dimX/2, 0, 0); 
            const leftGeo = new THREE.PlaneGeometry(dimZ, height); leftGeo.rotateX(-Math.PI / 2); 
            const leftMesh = new THREE.Mesh(leftGeo, mat); leftMesh.position.set(dimZ/2, 0, 0);
            leftMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(leftGeo), lineMat));
            leftMesh.add(window.createNumberSprite("4"));
            leftHinge.add(leftMesh);
            animParts.push({ mesh: leftHinge, axis: 'z', closedAngle: -Math.PI / 2, openAngle: 0 });

            // KAPAKLAR
            const topHinge = new THREE.Group(); topHinge.position.set(0, 0, -height/2); backMesh.add(topHinge);
            const topGeo = new THREE.PlaneGeometry(dimX, dimZ); topGeo.rotateX(-Math.PI / 2); 
            const topMesh = new THREE.Mesh(topGeo, mat); topMesh.position.set(0, 0, -dimZ/2); 
            topMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), lineMat));
            topMesh.add(window.createNumberSprite("Alt"));
            topHinge.add(topMesh);
            animParts.push({ mesh: topHinge, axis: 'x', closedAngle: -Math.PI / 2, openAngle: 0 });

            const bottomHinge = new THREE.Group(); bottomHinge.position.set(0, 0, height/2); backMesh.add(bottomHinge);
            const bottomGeo = new THREE.PlaneGeometry(dimX, dimZ); bottomGeo.rotateX(-Math.PI / 2); 
            const bottomMesh = new THREE.Mesh(bottomGeo, mat); bottomMesh.position.set(0, 0, dimZ/2);
            bottomMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(bottomGeo), lineMat));
            bottomMesh.add(window.createNumberSprite("Üst"));
            bottomHinge.add(bottomMesh);
            animParts.push({ mesh: bottomHinge, axis: 'x', closedAngle: Math.PI / 2, openAngle: 0 });

            group.position.y += 0.05;
        } 
        // --- B) DÜZGÜN ÇOKGENLER VE SİLİNDİR ---
        else {
            const radius = size;
            const s = 2 * radius * Math.sin(Math.PI / sides);
            const apothem = radius * Math.cos(Math.PI / sides);
            let sideLens = [];
            for(let k=0; k<sides; k++) sideLens.push(s);

            const topGeo = new THREE.CircleGeometry(radius, sides);
            const bottomGeo = new THREE.CircleGeometry(radius, sides);
            
            // --- HİZALAMA VE "TAM TERSİ" DÜZELTMESİ (V23) ---
            if (sides === 3) { 
                topGeo.rotateZ(-Math.PI / 2); 
                bottomGeo.rotateZ(-Math.PI / 2);
                
                // V23: HEM ÜST HEM ALT KAPAĞA 180 DERECE EKLE (TAM TERSİ OLSUN)
                topGeo.rotateZ(Math.PI);    // Üstü çevir
                // bottomGeo.rotateZ(Math.PI); // Alttaki çevirmeyi İPTAL etmiyoruz, V22'de vardı, şimdi tam tersi için durum ne gerektiriyorsa.
                // V22: Alt zaten 180 dönmüştü. Kullanıcı "Şimdi ikisi de ters" dedi.
                // Demek ki V22'nin tam zıttı lazım.
                // V22 Üst: 0 derece ek. -> V23 Üst: 180 ekle.
                // V22 Alt: 180 derece ek. -> V23 Alt: 0 ekle (yani 180'i kaldır).
                
                // DÜZELTİLMİŞ MANTIK:
                // Üst Kapak: 180 çevir.
                // Alt Kapak: Çevirme yapma (V22'de yapmıştık, siliyoruz).
            } 
            else if (sides === 4) { 
                topGeo.rotateZ(Math.PI / 4); 
                bottomGeo.rotateZ(Math.PI / 4); 
            } 
            else if (sides === 5) {
                // Beşgen
                const ang = Math.PI / 2 + Math.PI / sides;
                topGeo.rotateZ(ang);
                bottomGeo.rotateZ(ang);
                
                // V23 DÜZELTME:
                // Üst Kapak: 180 çevir.
                // Alt Kapak: Çevirme yapma.
                topGeo.rotateZ(Math.PI);
            }
            else { 
                topGeo.rotateZ(Math.PI / 2 + Math.PI / sides); 
                bottomGeo.rotateZ(Math.PI / 2 + Math.PI / sides); 
            }

            const topOffset = -apothem;
            const bottomOffset = apothem;
            const turnAngle = (Math.PI * 2) / sides;

            let previousMesh = null;
            let previousWidth = 0;
            let faces = []; 

            for (let i = 0; i < sides; i++) {
                const currentWidth = sideLens[i];
                const geo = new THREE.PlaneGeometry(currentWidth, height);
                geo.rotateX(-Math.PI / 2); 
                
                const mesh = new THREE.Mesh(geo, mat);
                if (!isCylinder) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat));
                if(window.createNumberSprite && !isCylinder) {
                    mesh.add(window.createNumberSprite((i + 1).toString())); 
                }

                if (i === 0) {
                    group.add(mesh);
                    previousMesh = mesh;
                } else {
                    const hinge = new THREE.Group();
                    hinge.position.set(previousWidth / 2, 0, 0);
                    previousMesh.add(hinge);

                    mesh.position.set(currentWidth / 2, 0, 0);
                    hinge.add(mesh);

                    animParts.push({ 
                        mesh: hinge, 
                        axis: 'z', 
                        closedAngle: -turnAngle, 
                        openAngle: 0 
                    });

                    previousMesh = mesh;
                }
                faces.push(mesh); 
                previousWidth = currentWidth;
            }

            // KAPAKLARI YERLEŞTİRME
            let attachmentFace = faces[0]; 
            if (isCylinder) {
                const midIndex = Math.floor(sides / 2);
                attachmentFace = faces[midIndex];
            }

            // 1. KAPAK (Alt Etiketi)
            const topHinge = new THREE.Group();
            topHinge.position.set(0, 0, -height / 2); 
            attachmentFace.add(topHinge);

            topGeo.rotateX(-Math.PI / 2); 
            const topMesh = new THREE.Mesh(topGeo, mat);
            topMesh.position.set(0, 0, topOffset); 
            
            if(!isCylinder) topMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), lineMat));
            if(window.createNumberSprite && !isCylinder) topMesh.add(window.createNumberSprite("Alt"));
            
            topHinge.add(topMesh);
            animParts.push({ mesh: topHinge, axis: 'x', closedAngle: -Math.PI / 2, openAngle: 0 });

            // 2. KAPAK (Üst Etiketi)
            const bottomHinge = new THREE.Group();
            bottomHinge.position.set(0, 0, height / 2); 
            attachmentFace.add(bottomHinge);

            bottomGeo.rotateX(-Math.PI / 2);
            const bottomMesh = new THREE.Mesh(bottomGeo, mat);
            bottomMesh.position.set(0, 0, bottomOffset);

            if(!isCylinder) bottomMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(bottomGeo), lineMat));
            if(window.createNumberSprite && !isCylinder) bottomMesh.add(window.createNumberSprite("Üst"));
            
            bottomHinge.add(bottomMesh);
            animParts.push({ mesh: bottomHinge, axis: 'x', closedAngle: Math.PI / 2, openAngle: 0 });

            group.position.y += 0.05;
        }
        
        group.userData.animParts = animParts;
        return group;
    };

    // 5. TUTAMAÇLARI GÜNCELLE
    window.Scene3D.updateHandlePositions = function() {
        if (!this.currentMesh || window.currentTool !== 'move') {
            if (this.rotateHandleBtn) this.rotateHandleBtn.style.display = 'none';
            if (this.resizeHandleBtn) this.resizeHandleBtn.style.display = 'none';
            if (this.helperGroup) this.helperGroup.visible = false;
            return;
        }

        this.helperGroup.visible = true; 
        const box = new THREE.Box3().setFromObject(this.currentMesh);
        const center = new THREE.Vector3(); box.getCenter(center);
        this.helperGroup.position.copy(center);

        const topPoint = new THREE.Vector3(box.max.x, center.y, box.min.z); 
        const screenPosRotate = this.toScreenPosition(this.currentMesh, topPoint);
        if (this.rotateHandleBtn) {
            this.rotateHandleBtn.style.display = 'block';
            this.rotateHandleBtn.style.left = (screenPosRotate.x + 20) + 'px';
            this.rotateHandleBtn.style.top = (screenPosRotate.y - 20) + 'px';
        }

        const bottomPoint = new THREE.Vector3(box.max.x, center.y, box.max.z);
        const screenPosResize = this.toScreenPosition(this.currentMesh, bottomPoint);
        if (this.resizeHandleBtn) {
            this.resizeHandleBtn.style.display = 'block';
            this.resizeHandleBtn.style.left = (screenPosResize.x + 20) + 'px';
            this.resizeHandleBtn.style.top = (screenPosResize.y + 20) + 'px';
        }
        
        const screenCenter = this.toScreenPosition(this.currentMesh, center);
        this.handles = { center: screenCenter };
    };

    // 6. ANİMASYON FONKSİYONU
    window.Scene3D.animateUnfold = function(group, value) {
        if (!group || !group.userData.animParts) return;
        const percent = value / 100;
        group.userData.animParts.forEach(part => {
            const axis = part.axis || 'x';
            const openAng = (part.openAngle !== undefined) ? part.openAngle : 0;
            const closedAng = (part.closedAngle !== undefined) ? part.closedAngle : 0;
            const currentAngle = closedAng + (openAng - closedAng) * percent;
            if (part.mesh) part.mesh.rotation[axis] = currentAngle;
        });
        if (this.currentMesh === group) {
            this.updateHandlePositions();
        }
    };

    // 7. SEÇİM VE ÇİZİM MANTIĞI
    window.Scene3D.onDown = function(x, y) {
        if (!this.isInit) return false;
        if (this.isRotatingHandle || this.isResizingHandle) return true;

        const coords = this.getNormalizedCoords(x, y);
        this.raycaster.setFromCamera(coords, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const validHits = intersects.filter(hit => {
            if (!hit.object.visible) return false;
            if (hit.object.type === 'GridHelper' || hit.object.type === 'AxesHelper') return false;
            if (hit.object === this.plane) return false;
            return true;
        });

        if (validHits.length > 0) {
            let targetObj = validHits[0].object;
            while(targetObj.parent && targetObj.parent.type !== 'Scene') {
                if (targetObj.userData && targetObj.userData.isUnfoldable) { break; }
                targetObj = targetObj.parent;
            }
            if (!targetObj.userData.isUnfoldable && targetObj.parent && targetObj.parent.userData.isUnfoldable) {
                targetObj = targetObj.parent;
            }
            this.currentMesh = targetObj;
            if (window.currentTool === 'move') {
                this.isRotatingShape = false; this.isDragging = true; this.isClickCandidate = true;
                this.clickStartPos = { x, y };
                this.dragPlane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()), this.currentMesh.position);
                const intersectPoint = new THREE.Vector3();
                if(this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) { this.dragOffset.subVectors(this.currentMesh.position, intersectPoint); }
            } else {
                this.isDragging = false; this.isClickCandidate = false; this.isRotatingShape = true; this.lastMousePos = { x, y };
            }
            this.updateHandlePositions();
            return true;
        }

        if (this.activeTool && this.activeTool !== 'none' && this.activeTool !== 'move') {
            this.isDrawing = true;
            this.startPoint = this.get3DPointOnFloor(x, y);
            const geometry = new THREE.BufferGeometry().setFromPoints([this.startPoint, this.startPoint]);
            const material = new THREE.LineBasicMaterial({ color: 0x00ffcc });
            this.previewLine = new THREE.Line(geometry, material);
            this.scene.add(this.previewLine);
            const previewGeo = this.createGeometry(this.activeTool, 0.1);
            if(this.activeTool.startsWith('prism') || this.activeTool.startsWith('pyramid')) { previewGeo.rotateX(Math.PI / 2); }
            const previewMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.5 });
            this.previewMesh = new THREE.Mesh(previewGeo, previewMat);
            this.previewMesh.position.copy(this.startPoint);
            this.scene.add(this.previewMesh);
            return true;
        }

        if (window.currentTool === 'move') {
            this.currentMesh = null;
            this.updateHandlePositions();
        }
        return false;
    };
}