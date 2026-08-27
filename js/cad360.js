/**
 * SAI INDIRABALA FURNITURE - ULTRA-OPTIMIZED THREE.JS 3D ROOM VIEWER
 * Real PBR materials, soft directional shadows, multi-mesh architectural furniture.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. On-Demand Rendering: ONLY renders when in viewport and when camera/controls are active.
 * 2. Static Shadow Map Caching: Shadows are baked/updated on-demand instead of every frame.
 * 3. IntersectionObserver: Automatically sleeps WebGL loop when scrolled off-screen.
 * 4. Zero CPU/GPU usage when stationary.
 * 5. STRICT MANDATE: NO AUTO-ROTATION.
 */

import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

export function initCad360() {
    const container = document.getElementById('cad-360-container');
    if (!container) return;

    const canvasWrap = container.querySelector('.cad-canvas-wrap');
    if (!canvasWrap) return;

    // Clean up any previous canvas
    canvasWrap.innerHTML = '';

    // UI Controls & Badges
    const modeBtn = container.querySelector('#cad-mode-btn');
    const resetBtn = container.querySelector('#cad-reset-btn');
    const infoPanel = container.querySelector('#cad-info-panel');
    const statusText = container.querySelector('#cad-status-text');

    // ── 01. Three.js Core Setup ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181410);

    const width = canvasWrap.clientWidth || 800;
    const height = canvasWrap.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    const initialCamPos = new THREE.Vector3(5.6, 3.9, 6.4);
    const initialTarget = new THREE.Vector3(0.2, 1.05, -0.3);
    camera.position.copy(initialCamPos);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // BAKE SHADOWS FOR MAXIMUM PERFORMANCE
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasWrap.appendChild(renderer.domElement);

    // ── 02. OrbitControls (STRICTLY NO AUTO-ROTATE) ──────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 3.0;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.copy(initialTarget);
    controls.autoRotate = false; // MANDATORY: Completely stationary by default

    // ── 03. Procedural Optimized Textures ────────────────────────────────
    function createWoodTexture(baseHex, lineHex) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');
        ctx.fillStyle = baseHex;
        ctx.fillRect(0, 0, 256, 256);

        ctx.fillStyle = lineHex;
        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 256; i += 6) {
            ctx.fillRect(0, i, 256, 3);
        }

        ctx.fillStyle = '#100a06';
        ctx.globalAlpha = 0.25;
        for (let x = 0; x < 256; x += 64) {
            ctx.fillRect(x, 0, 2, 256);
        }
        for (let y = 0; y < 256; y += 32) {
            ctx.fillRect(0, y, 256, 1.5);
        }

        const texture = new THREE.CanvasTexture(c);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    const floorWoodTex = createWoodTexture('#6b4226', '#4a2c16');
    floorWoodTex.repeat.set(6, 6);

    const furnitureTeakTex = createWoodTexture('#5c361e', '#3a2010');
    furnitureTeakTex.repeat.set(2, 2);

    const walnutTex = createWoodTexture('#442717', '#2b170c');
    walnutTex.repeat.set(2, 2);

    // ── 04. PBR Materials ────────────────────────────────────────────────
    const materials = {
        floor: new THREE.MeshStandardMaterial({
            map: floorWoodTex,
            roughness: 0.38,
            metalness: 0.05
        }),
        wall: new THREE.MeshStandardMaterial({
            color: 0xede8df,
            roughness: 0.95,
            metalness: 0.0
        }),
        accentWallSlat: new THREE.MeshStandardMaterial({
            color: 0x54321d,
            roughness: 0.5,
            metalness: 0.05
        }),
        baseboard: new THREE.MeshStandardMaterial({
            color: 0xd6cdc0,
            roughness: 0.8
        }),
        windowFrame: new THREE.MeshStandardMaterial({
            color: 0x221a14,
            roughness: 0.4,
            metalness: 0.2
        }),
        glass: new THREE.MeshStandardMaterial({
            color: 0xe6f2ff,
            transparent: true,
            opacity: 0.5,
            roughness: 0.1,
            metalness: 0.2
        }),
        teak: new THREE.MeshStandardMaterial({
            map: furnitureTeakTex,
            roughness: 0.42,
            metalness: 0.05
        }),
        walnut: new THREE.MeshStandardMaterial({
            map: walnutTex,
            roughness: 0.45,
            metalness: 0.05
        }),
        fabricSofa: new THREE.MeshStandardMaterial({
            color: 0xf3eee6,
            roughness: 0.92,
            metalness: 0.0
        }),
        fabricPillow: new THREE.MeshStandardMaterial({
            color: 0xc49a5b,
            roughness: 0.85
        }),
        fabricPillowDark: new THREE.MeshStandardMaterial({
            color: 0x3d3028,
            roughness: 0.88
        }),
        fabricChair: new THREE.MeshStandardMaterial({
            color: 0xded6c8,
            roughness: 0.9
        }),
        metalBlack: new THREE.MeshStandardMaterial({
            color: 0x1c1c1c,
            roughness: 0.3,
            metalness: 0.85
        }),
        brass: new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.25,
            metalness: 0.85
        }),
        rug: new THREE.MeshStandardMaterial({
            color: 0xd8cebf,
            roughness: 0.98,
            metalness: 0.0
        }),
        plantPot: new THREE.MeshStandardMaterial({
            color: 0xf5f2eb,
            roughness: 0.6
        }),
        plantLeaf: new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.45
        }),
        lampGlow: new THREE.MeshStandardMaterial({
            color: 0xffeed1,
            emissive: 0xffc870,
            emissiveIntensity: 0.8,
            roughness: 0.2
        })
    };

    // ── 05. Room Architecture (8m x 7m x 3.3m) ───────────────────────────
    const roomGroup = new THREE.Group();

    // A. Floor
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.1, 7.2), materials.floor);
    floorMesh.position.set(0, -0.05, 0);
    floorMesh.receiveShadow = true;
    roomGroup.add(floorMesh);

    // B. Back Wall (Z = -3.6m)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.3, 0.15), materials.wall);
    backWall.position.set(0, 1.65, -3.6);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // C. Left Wall (X = -4.0m)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.3, 7.2), materials.wall);
    leftWall.position.set(-4.0, 1.65, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // D. Decorative Wooden Slat Wall
    const slatGroup = new THREE.Group();
    for (let i = -3.8; i < -1.4; i += 0.12) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.2, 0.02), materials.accentWallSlat);
        slat.position.set(i, 1.65, -3.51);
        slatGroup.add(slat);
    }
    roomGroup.add(slatGroup);

    // E. Baseboards
    const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.12, 0.02), materials.baseboard);
    baseboardBack.position.set(0, 0.06, -3.51);
    roomGroup.add(baseboardBack);

    const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 7.2), materials.baseboard);
    baseboardLeft.position.set(-3.91, 0.06, 0);
    roomGroup.add(baseboardLeft);

    // F. Window
    const windowGroup = new THREE.Group();
    windowGroup.position.set(1.8, 1.85, -3.52);

    const winOuter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 0.06), materials.windowFrame);
    windowGroup.add(winOuter);

    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.8), materials.glass);
    winGlass.position.z = 0.01;
    windowGroup.add(winGlass);

    const winHoriz = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.07), materials.windowFrame);
    windowGroup.add(winHoriz);

    const winVert1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.07), materials.windowFrame);
    winVert1.position.x = -0.45;
    windowGroup.add(winVert1);

    const winVert2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.07), materials.windowFrame);
    winVert2.position.x = 0.45;
    windowGroup.add(winVert2);

    const winBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.0), new THREE.MeshBasicMaterial({ color: 0xd8e8f2 }));
    winBackdrop.position.set(1.8, 1.8, -4.2);
    roomGroup.add(winBackdrop);

    roomGroup.add(windowGroup);
    scene.add(roomGroup);

    // ── 06. Interactive Furniture Objects ────────────────────────────────
    const interactiveFurniture = [];

    function registerFurnitureGroup(group, info) {
        group.userData.furnitureInfo = info;
        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.parentFurniture = group;
            }
        });
        interactiveFurniture.push(group);
        scene.add(group);
    }

    // A. WARDROBE (1.8m W × 0.6m D × 2.2m H)
    const wardrobeGroup = new THREE.Group();
    wardrobeGroup.position.set(-2.6, 0, -2.85);

    const wPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.58), materials.walnut);
    wPlinth.position.set(0, 0.04, 0);
    wardrobeGroup.add(wPlinth);

    const wCarcass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.12, 0.6), materials.teak);
    wCarcass.position.set(0, 1.14, 0);
    wardrobeGroup.add(wCarcass);

    const doorWidth = 0.58;
    for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * (doorWidth + 0.015);
        const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 2.06, 0.025), materials.teak);
        door.position.set(dx, 1.13, 0.31);
        wardrobeGroup.add(door);

        for (let s = -doorWidth / 2 + 0.04; s < doorWidth / 2 - 0.03; s += 0.05) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.0, 0.008), materials.walnut);
            slat.position.set(dx + s, 1.13, 0.325);
            wardrobeGroup.add(slat);
        }

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.38, 8), materials.brass);
        handle.position.set(dx + (i === 1 ? 0.22 : -0.22), 1.1, 0.34);
        wardrobeGroup.add(handle);
    }

    const wCornice = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.04, 0.63), materials.walnut);
    wCornice.position.set(0, 2.22, 0);
    wardrobeGroup.add(wCornice);

    registerFurnitureGroup(wardrobeGroup, {
        id: 'wardrobe',
        name: 'Modular Wardrobe Closet',
        dimensions: '1800 W × 600 D × 2200 H mm',
        materials: 'Seasoned Teak • Fluted Tambour Doors • Brass Hardware',
        details: 'Custom three-bay wardrobe with soft-close tambour panels, internal LED channels, and solid wood joinery.'
    });

    // B. LUXURY CUSTOM SOFA (2.1m W × 0.95m D × 0.85m H)
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(0.6, 0, 0.35);

    const sofaPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.95), materials.teak);
    sofaPlinth.position.set(0, 0.06, 0);
    sofaGroup.add(sofaPlinth);

    const legPositions = [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]];
    legPositions.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.06, 8), materials.walnut);
        leg.position.set(lx, 0.03, lz);
        sofaGroup.add(leg);
    });

    const seatDeck = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.18, 0.92), materials.fabricSofa);
    seatDeck.position.set(0, 0.21, 0);
    sofaGroup.add(seatDeck);

    const cWidth = 0.62;
    for (let i = 0; i < 3; i++) {
        const cx = (i - 1) * (cWidth + 0.02);
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(cWidth, 0.14, 0.72), materials.fabricSofa);
        cushion.position.set(cx, 0.36, 0.06);
        sofaGroup.add(cushion);

        const backCushion = new THREE.Mesh(new THREE.BoxGeometry(cWidth, 0.38, 0.14), materials.fabricSofa);
        backCushion.position.set(cx, 0.62, -0.28);
        backCushion.rotation.x = -0.12;
        sofaGroup.add(backCushion);
    }

    const sofaBackFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 0.18), materials.fabricSofa);
    sofaBackFrame.position.set(0, 0.55, -0.38);
    sofaGroup.add(sofaBackFrame);

    const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.94), materials.fabricSofa);
    armLeft.position.set(-1.02, 0.44, 0);
    sofaGroup.add(armLeft);

    const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.94), materials.fabricSofa);
    armRight.position.set(1.02, 0.44, 0);
    sofaGroup.add(armRight);

    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.1), materials.fabricPillow);
    pillow1.position.set(-0.75, 0.5, -0.16);
    pillow1.rotation.y = 0.25;
    sofaGroup.add(pillow1);

    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.09), materials.fabricPillowDark);
    pillow2.position.set(0.75, 0.5, -0.16);
    pillow2.rotation.y = -0.2;
    sofaGroup.add(pillow2);

    registerFurnitureGroup(sofaGroup, {
        id: 'sofa',
        name: 'Luxury Custom Sectional Sofa',
        dimensions: '2100 W × 950 D × 850 H mm',
        materials: 'Textured Bouclé Fabric • Solid Teak Plinth • High-Resilience Foam',
        details: 'Deep ergonomic seating with three individual beveled cushions, solid timber base plinth, and premium woven fabric.'
    });

    // C. ACCENT CHAIR (0.72m W × 0.76m D × 0.78m H)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(-1.35, 0, 1.05);
    chairGroup.rotation.y = 0.65;

    const cLegFL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.38, 8), materials.walnut);
    cLegFL.position.set(-0.28, 0.19, 0.28);
    cLegFL.rotation.z = 0.08;
    chairGroup.add(cLegFL);

    const cLegFR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.38, 8), materials.walnut);
    cLegFR.position.set(0.28, 0.19, 0.28);
    cLegFR.rotation.z = -0.08;
    chairGroup.add(cLegFR);

    const cLegBL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.42, 8), materials.walnut);
    cLegBL.position.set(-0.28, 0.21, -0.28);
    cLegBL.rotation.x = -0.12;
    chairGroup.add(cLegBL);

    const cLegBR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.42, 8), materials.walnut);
    cLegBR.position.set(0.28, 0.21, -0.28);
    cLegBR.rotation.x = -0.12;
    chairGroup.add(cLegBR);

    const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.58), materials.fabricChair);
    cSeat.position.set(0, 0.38, 0);
    chairGroup.add(cSeat);

    const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.09), materials.fabricChair);
    cBack.position.set(0, 0.62, -0.24);
    cBack.rotation.x = -0.18;
    chairGroup.add(cBack);

    const cArmL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.52), materials.walnut);
    cArmL.position.set(-0.32, 0.52, 0);
    chairGroup.add(cArmL);

    const cArmR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.52), materials.walnut);
    cArmR.position.set(0.32, 0.52, 0);
    chairGroup.add(cArmR);

    registerFurnitureGroup(chairGroup, {
        id: 'chair',
        name: 'Sculpted Accent Armchair',
        dimensions: '720 W × 760 D × 780 H mm',
        materials: 'Solid Walnut Frame • Bouclé Upholstery • Artisan Mortise Joinery',
        details: 'Handcrafted Scandinavian-inspired lounge armchair with sculptural solid timber armrests and contoured backrest.'
    });

    // D. COFFEE TABLE (1.1m W × 0.65m D × 0.42m H)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0.6, 0, 1.55);

    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.045, 0.65), materials.teak);
    tabletop.position.set(0, 0.4, 0);
    tableGroup.add(tabletop);

    const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.02, 0.48), materials.walnut);
    lowerShelf.position.set(0, 0.16, 0);
    tableGroup.add(lowerShelf);

    const tableLegCoords = [[-0.48, -0.26], [0.48, -0.26], [-0.48, 0.26], [0.48, 0.26]];
    tableLegCoords.forEach(([tx, tz]) => {
        const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.38, 8), materials.teak);
        tLeg.position.set(tx, 0.2, tz);
        tableGroup.add(tLeg);

        const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.015, 0.05, 8), materials.brass);
        ferrule.position.set(tx, 0.025, tz);
        tableGroup.add(ferrule);
    });

    const decBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.04, 12), materials.plantPot);
    decBowl.position.set(-0.25, 0.44, 0.05);
    tableGroup.add(decBowl);

    const decBook1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.14), materials.fabricPillowDark);
    decBook1.position.set(0.2, 0.435, -0.05);
    tableGroup.add(decBook1);

    registerFurnitureGroup(tableGroup, {
        id: 'table',
        name: 'Natural Teak Coffee Table',
        dimensions: '1100 W × 650 D × 420 H mm',
        materials: 'Solid Seasoned Teak • Brushed Brass Ferrules • Slatted Lower Tier',
        details: 'Hand-planed solid teak center table with beveled edge contouring and dual magazine storage tier.'
    });

    // E. EXECUTIVE WORK DESK (1.6m W × 0.8m D × 0.75m H)
    const deskGroup = new THREE.Group();
    deskGroup.position.set(2.4, 0, -2.2);

    const desktop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), materials.walnut);
    desktop.position.set(0, 0.725, 0);
    deskGroup.add(desktop);

    const leftPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.74), materials.walnut);
    leftPedestal.position.set(-0.54, 0.35, 0);
    deskGroup.add(leftPedestal);

    for (let d = 0; d < 3; d++) {
        const dy = 0.15 + d * 0.2;
        const dFront = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.015), materials.teak);
        dFront.position.set(-0.54, dy, 0.38);
        deskGroup.add(dFront);

        const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.02), materials.metalBlack);
        dHandle.position.set(-0.54, dy, 0.4);
        deskGroup.add(dHandle);
    }

    const legR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), materials.metalBlack);
    legR1.position.set(0.68, 0.35, -0.32);
    deskGroup.add(legR1);

    const legR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), materials.metalBlack);
    legR2.position.set(0.68, 0.35, 0.32);
    deskGroup.add(legR2);

    const legRBottom = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.72), materials.metalBlack);
    legRBottom.position.set(0.68, 0.015, 0);
    deskGroup.add(legRBottom);

    const modestyPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.32, 0.02), materials.walnut);
    modestyPanel.position.set(0.2, 0.52, -0.32);
    deskGroup.add(modestyPanel);

    // Executive Chair behind Desk
    const deskChair = new THREE.Group();
    deskChair.position.set(2.4, 0, -2.75);

    const dSeat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.5), materials.fabricPillowDark);
    dSeat.position.set(0, 0.46, 0);
    deskChair.add(dSeat);

    const dBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.06), materials.fabricPillowDark);
    dBack.position.set(0, 0.72, -0.22);
    deskChair.add(dBack);

    const dBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), materials.metalBlack);
    dBase.position.set(0, 0.21, 0);
    deskChair.add(dBase);
    scene.add(deskChair);

    registerFurnitureGroup(deskGroup, {
        id: 'desk',
        name: 'Executive Workstation Desk',
        dimensions: '1600 W × 800 D × 750 H mm',
        materials: 'Seasoned Walnut • 3-Drawer Pedestal • Powder-Coated Steel',
        details: 'Architectural executive desk with integrated cable ducting, heavy-duty soft-close drawers, and walnut modesty baffle.'
    });

    // F. Rug & Accents
    const rugMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.012, 2.8), materials.rug);
    rugMesh.position.set(0.4, 0.006, 0.8);
    rugMesh.receiveShadow = true;
    scene.add(rugMesh);

    // Floor Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.4, 0, -1.8);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12), materials.metalBlack);
    lampBase.position.y = 0.015;
    lampGroup.add(lampBase);

    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.55, 8), materials.brass);
    lampPole.position.y = 0.78;
    lampGroup.add(lampPole);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 12, 1, true), materials.lampGlow);
    lampShade.position.y = 1.48;
    lampShade.rotation.x = Math.PI;
    lampGroup.add(lampShade);
    scene.add(lampGroup);

    // Indoor Potted Plant
    const plantGroup = new THREE.Group();
    plantGroup.position.set(3.4, 0, -3.2);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.42, 12), materials.plantPot);
    pot.position.y = 0.21;
    pot.castShadow = true;
    plantGroup.add(pot);

    for (let l = 0; l < 4; l++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), materials.plantLeaf);
        leaf.scale.set(1.4, 0.1, 0.9);
        const angle = (l / 4) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.16, 0.48 + l * 0.08, Math.sin(angle) * 0.16);
        leaf.rotation.z = Math.cos(angle) * 0.35;
        leaf.castShadow = true;
        plantGroup.add(leaf);
    }
    scene.add(plantGroup);

    // Wall Art
    const artGroup = new THREE.Group();
    artGroup.position.set(-3.91, 1.8, 0.6);
    artGroup.rotation.y = Math.PI / 2;

    const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.04), materials.walnut);
    artGroup.add(artFrame);

    const artCanvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xf5f0ea, roughness: 0.9 })
    );
    artCanvas.position.z = 0.025;
    artGroup.add(artCanvas);
    scene.add(artGroup);

    // ── 07. Interior Lighting & Baked Shadow Map ────────────────────────
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedb, 2.2);
    sunLight.position.set(4.5, 6.0, -4.8);
    sunLight.target.position.set(0, 0.5, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 18;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const ceilingLight = new THREE.PointLight(0xffe6cb, 0.8, 10);
    ceilingLight.position.set(0, 3.1, 0);
    scene.add(ceilingLight);

    // ── 08. ON-DEMAND RENDERING & INTERSECTION OBSERVER ─────────────────
    let isVisibleInViewport = false;
    let needsRender = true;
    let isWireframe = false;
    let selectedGroup = null;

    function renderScene() {
        // Update shadow map once or when needed
        if (needsRender) {
            renderer.shadowMap.needsUpdate = true;
        }
        renderer.render(scene, camera);
        needsRender = false;
    }

    // Trigger render only when controls move
    controls.addEventListener('change', () => {
        needsRender = true;
    });

    // ── 09. Raycaster on Tap / Click ─────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerDownTime = Date.now();
        pointerDownPos = { x: e.clientX, y: e.clientY };
    }, { passive: true });

    renderer.domElement.addEventListener('pointerup', (e) => {
        const deltaX = Math.abs(e.clientX - pointerDownPos.x);
        const deltaY = Math.abs(e.clientY - pointerDownPos.y);
        const elapsed = Date.now() - pointerDownTime;

        // Only register click if it wasn't an orbit drag
        if (deltaX < 6 && deltaY < 6 && elapsed < 350) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const meshes = [];
            interactiveFurniture.forEach(grp => {
                grp.traverse(child => {
                    if (child.isMesh) meshes.push(child);
                });
            });

            const intersects = raycaster.intersectObjects(meshes, false);

            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const parentGroup = hitMesh.userData.parentFurniture;
                if (parentGroup) {
                    selectFurniture(parentGroup);
                    return;
                }
            }
            clearSelection();
        }
    }, { passive: true });

    function selectFurniture(group) {
        if (selectedGroup === group) return;
        clearSelection();

        selectedGroup = group;
        const info = group.userData.furnitureInfo;

        group.traverse(child => {
            if (child.isMesh && child.material) {
                child.userData.origColor = child.material.color ? child.material.color.clone() : null;
                if (child.material.emissive) {
                    child.material.emissive.setHex(0x4a2e12);
                }
            }
        });

        if (infoPanel) {
            infoPanel.innerHTML = `
                <div class="cad-info-header">
                    <div class="cad-info-badge">Selected Custom Piece</div>
                    <button type="button" class="cad-info-close" id="cad-close-panel" aria-label="Close details">✕</button>
                </div>
                <h4 class="cad-info-title">${info.name}</h4>
                <div class="cad-info-spec">${info.materials}</div>
                <div class="cad-info-dim">📐 Dimensions: ${info.dimensions}</div>
                <p class="cad-info-desc">${info.details}</p>
                <div class="cad-info-action">
                    <a href="#contact" class="btn btn-primary btn-sm btn-full">Inquire for 3D Custom Build →</a>
                </div>
            `;
            infoPanel.classList.add('visible');

            const closeBtn = infoPanel.querySelector('#cad-close-panel');
            if (closeBtn) closeBtn.addEventListener('click', clearSelection);
        }

        if (statusText) {
            statusText.textContent = `Inspecting: ${info.name}`;
        }

        needsRender = true;
    }

    function clearSelection() {
        if (selectedGroup) {
            selectedGroup.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x000000);
                }
            });
            selectedGroup = null;
        }

        if (infoPanel) {
            infoPanel.classList.remove('visible');
        }

        if (statusText) {
            statusText.textContent = '3D Interactive Room • Drag to orbit • Click furniture to inspect';
        }

        needsRender = true;
    }

    // ── 10. Real CAD Wireframe Mode ──────────────────────────────────────
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            isWireframe = !isWireframe;

            scene.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = isWireframe;
                }
            });

            if (isWireframe) {
                scene.background.setHex(0x0c0a08);
                modeBtn.innerHTML = '<span>🎨 Shaded Mode</span>';
                modeBtn.classList.add('active');
            } else {
                scene.background.setHex(0x181410);
                modeBtn.innerHTML = '<span>📐 CAD Wireframe</span>';
                modeBtn.classList.remove('active');
            }

            needsRender = true;
        });
    }

    // ── 11. Reset View Button ────────────────────────────────────────────
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearSelection();
            camera.position.copy(initialCamPos);
            controls.target.copy(initialTarget);
            controls.update();
            needsRender = true;
        });
    }

    // ── 12. Responsive Resize Observer ──────────────────────────────────
    function onResize() {
        const w = canvasWrap.clientWidth;
        const h = canvasWrap.clientHeight || 480;
        if (w === 0 || h === 0) return;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        needsRender = true;
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvasWrap);

    // ── 13. Viewport Intersection Observer (Zero CPU when off-screen) ────
    const viewportObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisibleInViewport = entry.isIntersecting;
            if (isVisibleInViewport) {
                needsRender = true;
            }
        });
    }, { threshold: 0.1 });

    viewportObserver.observe(container);

    // ── 14. Efficient On-Demand Animation Loop (NO AUTO-ROTATE) ──────────
    let animationFrameId;
    function loop() {
        animationFrameId = requestAnimationFrame(loop);

        if (isVisibleInViewport) {
            // controls.update() returns true if damping is active (camera is decelerating)
            const controlsChanged = controls.update();
            if (controlsChanged || needsRender) {
                renderScene();
            }
        }
    }

    // Initial render
    needsRender = true;
    renderScene();
    loop();

    // ── 15. Cleanup on Destruction ───────────────────────────────────────
    return function destroy() {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        viewportObserver.disconnect();
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    };
}
