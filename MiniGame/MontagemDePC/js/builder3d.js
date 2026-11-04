/* =============================================================================
 *  CYBERQUIZ · MONTAGEM DE PC 3D (Three.js)
 *  ---------------------------------------------------------------------------
 *  Cena 3D com gabinete, espaçadores, placa-mãe e slots. As peças são
 *  arrastadas do painel lateral (ou tocadas e depois tocadas no slot, no
 *  celular) e só entram quando a ORDEM REAL de montagem permite.
 * ============================================================================= */

const PCMBuilder = (() => {
    const CFG = BUILDER_CONFIG;
    const T = window.THREE;

    /* materiais compartilhados (criados no init) */
    let MAT = {};

    const state = {
        installed: new Set(),
        dragging: null,      // id da peça sendo arrastada
        selected: null,      // id da peça selecionada por toque/clique
        hover: null,         // slot destacado
        startedAt: 0,
        elapsed: 0,
        timerId: null,
        running: false,
        finished: false,
        powered: false,      // o PC já foi ligado (botão LIGAR)
        moves: 0,            // tentativas de encaixe
        zoom: 1,             // zoom da câmera (roda do mouse)
    };

    let scene, camera, renderer, world, raycaster, ndc, container, canvasEl;
    let caseGroup = null;      // grupo do gabinete (diagnóstico)
    let markers = new Map();   // id -> { mesh, lines, size }
    let meshes = new Map();    // id -> THREE.Group da peça
    let holder = new Map();    // id -> THREE.Group (ancorado na cena, pai da peça)
    let anchors = new Map();   // id -> THREE.Vector3 (centro da peça, em coordenadas locais)
    let dragPlane, dragPoint, tmpVec;
    let tweens = [];
    let yawTarget = 0;
    let orbit = null;           // arrasto de rotação no canvas
    let suppressClickUntil = 0;  // o click que vem depois de um giro não instala
    let ready = false;
    let bootToken = 0;         // invalida o "boot" se o jogador recomeçar no meio dele
    const spinners = [];       // ventoinhas que giram ({ obj, axis, speed })

    /* ------------------------------------------------------------ helpers */

    function mat(color, opts) {
        return new T.MeshStandardMaterial(Object.assign({
            color, metalness: 0.55, roughness: 0.45,
        }, opts || {}));
    }

    /** box/cyl aceitam uma cor OU um material já pronto (MAT.*). */
    function box(w, h, d, color, opts) {
        const m = (color && color.isMaterial) ? color : mat(color, opts);
        return new T.Mesh(new T.BoxGeometry(w, h, d), m);
    }

    function cyl(r, h, color, opts) {
        const m = (color && color.isMaterial) ? color : mat(color, opts);
        return new T.Mesh(new T.CylinderGeometry(r, r, h, 24), m);
    }

    function place(obj, x, y, z) {
        obj.position.set(x, y, z);
        return obj;
    }

    /** Marca a malha para projetar sombra. */
    function cast(obj) {
        obj.traverse((child) => { if (child.isMesh) child.castShadow = true; });
        return obj;
    }

    /** Registra um rotor para girar sozinho na animação. */
    function spin(obj, axis, speed) {
        spinners.push({ obj: obj, axis: axis || 'z', speed: speed === undefined ? 0.14 : speed });
        return obj;
    }

    /* ---------------------------------------------------------- iluminação */

    // Tudo que tem material emissivo (RGB da RAM, LED do cooler, neon da GPU,
    // luz do gabinete...) entra na lista de "glow": começa APAGADO e só
    // acende quando o jogador aperta LIGAR.
    const glowList = [];

    function collectGlow(root) {
        if (!root) return;
        root.traverse((m) => {
            if (!m.isMesh || !m.material || !m.material.emissive) return;
            if (m.material.emissive.getHex() === 0) return;
            const on = m.material.emissiveIntensity || 0;
            if (on <= 0) return;
            m.material.emissiveIntensity = 0;      // começa apagado
            glowList.push({ mat: m.material, on: on });
        });
    }

    /** Liga/desliga as luzes do PC (usado pelo botão LIGAR). */
    function setPowered(on) {
        glowList.forEach((g) => {
            g.mat.emissiveIntensity = on ? g.on : 0;
        });
        const host = document.getElementById('build-canvas');
        if (host) host.classList.toggle('powered', !!on);
    }

    /* --------------------------------------------------------- texturas */

    /** textura procedural desenhada no canvas (nada de baixar arquivo) */
    function canvasTexture(w, h, draw, repeat) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        draw(g, w, h);
        const tex = new T.CanvasTexture(c);
        if (repeat) {
            tex.wrapS = tex.wrapT = T.RepeatWrapping;
            tex.repeat.set(repeat[0], repeat[1]);
        }
        tex.anisotropy = 4;
        return tex;
    }

    /** placa de circuito: verde com trilhas douradas, pads e serigrafia */
    function pcbTexture() {
        return canvasTexture(512, 512, (g, w, h) => {
            g.fillStyle = '#0b4a35';
            g.fillRect(0, 0, w, h);
            for (let i = 0; i < 2400; i++) {
                g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.035).toFixed(3) + ')';
                g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
            g.lineCap = 'round';
            for (let i = 0; i < 110; i++) {
                g.strokeStyle = 'rgba(214,178,74,' + (0.22 + Math.random() * 0.5).toFixed(2) + ')';
                g.lineWidth = 1 + Math.random() * 2.2;
                let x = Math.random() * w, y = Math.random() * h;
                g.beginPath(); g.moveTo(x, y);
                const steps = 2 + Math.floor(Math.random() * 3);
                for (let s = 0; s < steps; s++) {
                    if (Math.random() > 0.5) x += (Math.random() - 0.5) * 190; else y += (Math.random() - 0.5) * 190;
                    g.lineTo(x, y);
                }
                g.stroke();
            }
            for (let i = 0; i < 150; i++) {
                g.fillStyle = 'rgba(226,196,110,0.85)';
                g.beginPath();
                g.arc(Math.random() * w, Math.random() * h, 1.6 + Math.random() * 2.4, 0, 6.283);
                g.fill();
            }
            g.fillStyle = 'rgba(236,242,248,0.5)';
            g.font = '11px monospace';
            for (let i = 0; i < 30; i++) {
                g.fillText('C' + (10 + i * 7) + ' R' + (5 + i * 3), Math.random() * (w - 70), Math.random() * h);
            }
        }, [3, 4]);
    }

    /** tela perfurada (usada como alphaMap do painel de frente) */
    function meshAlpha() {
        return canvasTexture(128, 128, (g, w, h) => {
            g.fillStyle = '#000';
            g.fillRect(0, 0, w, h);
            g.fillStyle = '#fff';
            const step = 16;
            for (let y = step / 2; y < h; y += step) {
                for (let x = step / 2; x < w; x += step) {
                    g.beginPath();
                    g.arc(x, y, 6.4, 0, 6.283);
                    g.fill();
                }
            }
        }, [12, 9]);
    }

    /** metal escovado (varia só a rugosidade) */
    function brushedTexture() {
        return canvasTexture(256, 256, (g, w, h) => {
            g.fillStyle = '#7a7a7a';
            g.fillRect(0, 0, w, h);
            for (let i = 0; i < 800; i++) {
                const y = Math.random() * h;
                g.strokeStyle = 'rgba(255,255,255,' + (Math.random() * 0.12).toFixed(3) + ')';
                g.beginPath();
                g.moveTo(0, y);
                g.lineTo(w, y + (Math.random() - 0.5) * 2);
                g.stroke();
            }
        }, [3, 3]);
    }

    /** piso: brilho radial suave sob o gabinete */
    function floorTexture() {
        return canvasTexture(256, 256, (g, w, h) => {
            const grd = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
            grd.addColorStop(0, '#1a2333');
            grd.addColorStop(0.55, '#0d131d');
            grd.addColorStop(1, '#05070a');
            g.fillStyle = grd;
            g.fillRect(0, 0, w, h);
        });
    }

    /** painel perfurado com recortes (formato + furos, extrudado) */
    function panelWithHoles(w, h, holes, thickness, material) {
        const shape = new T.Shape();
        shape.moveTo(-w / 2, -h / 2);
        shape.lineTo(w / 2, -h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(-w / 2, h / 2);
        shape.closePath();
        holes.forEach((hole) => {
            const p = new T.Path();
            p.moveTo(hole.x - hole.w / 2, hole.y - hole.h / 2);
            p.lineTo(hole.x + hole.w / 2, hole.y - hole.h / 2);
            p.lineTo(hole.x + hole.w / 2, hole.y + hole.h / 2);
            p.lineTo(hole.x - hole.w / 2, hole.y + hole.h / 2);
            p.closePath();
            shape.holes.push(p);
        });
        const geo = new T.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
        geo.computeVertexNormals();
        return new T.Mesh(geo, material);
    }

    /** ventoinha com rotor que gira (eixo local = Z) */
    function buildFan(radius, opts) {
        const o = opts || {};
        const g = new T.Group();
        const frame = new T.Mesh(
            new T.RingGeometry(radius * 0.95, radius, 30),
            new T.MeshStandardMaterial({
                color: o.frameColor || 0x161b23,
                metalness: 0.4, roughness: 0.65, side: T.DoubleSide,
            })
        );
        g.add(frame);

        const rotor = new T.Group();
        const hub = cyl(radius * 0.22, 0.05, 0x1d232c, { metalness: 0.5, roughness: 0.5 });
        hub.rotation.x = Math.PI / 2;
        rotor.add(hub);
        const blades = o.blades || 7;
        for (let i = 0; i < blades; i++) {
            const a = (i / blades) * Math.PI * 2;
            const blade = box(radius * 0.74, radius * 0.32, 0.012, 0x252c36, { metalness: 0.35, roughness: 0.6 });
            blade.rotation.set(0.55, 0, a);           // passo da pá
            blade.position.set(Math.cos(a) * radius * 0.52, Math.sin(a) * radius * 0.52, 0);
            rotor.add(blade);
        }
        g.add(rotor);
        spin(rotor, 'z', o.speed === undefined ? 0.16 : o.speed);
        g.userData.rotor = rotor;
        return g;
    }

    /** retângulo com cantos arredondados, centrado na origem (Shape em XY). */
    function roundedRectShape(w, h, r) {
        const s = new T.Shape();
        const x = -w / 2, y = -h / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + w - r, y);
        s.quadraticCurveTo(x + w, y, x + w, y + r);
        s.lineTo(x + w, y + h - r);
        s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        s.lineTo(x + r, y + h);
        s.quadraticCurveTo(x, y + h, x, y + h - r);
        s.lineTo(x, y + r);
        s.quadraticCurveTo(x, y, x + r, y);
        s.closePath();
        return s;
    }

    /** retângulo com os 4 cantos chanfrados (aletas e tampas do cooler). */
    function chamferRectShape(w, h, c) {
        const s = new T.Shape();
        const x = -w / 2, y = -h / 2;
        s.moveTo(x + c, y);
        s.lineTo(x + w - c, y);
        s.lineTo(x + w, y + c);
        s.lineTo(x + w, y + h - c);
        s.lineTo(x + w - c, y + h);
        s.lineTo(x + c, y + h);
        s.lineTo(x, y + h - c);
        s.lineTo(x, y + c);
        s.closePath();
        return s;
    }

    /*
     *  VENTOINHA 120 mm do cooler (bem mais detalhada que a buildFan):
     *  moldura quadrada com cantos arredondados e furo circular, aro
     *  interno, parafusos + pads de vibração, cubo com anel LED e 9 pás
     *  curvas com passo. Eixo de giro local = Z (como as outras).
     */
    function buildCoolerFan(size, opts) {
        const o = opts || {};
        const t = o.thick || 0.21;
        const g = new T.Group();
        const R = size / 2;
        const holeR = R * 0.945;

        const frameShape = roundedRectShape(size, size, 0.10);
        const hole = new T.Path();
        hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
        frameShape.holes.push(hole);
        const frameGeo = new T.ExtrudeGeometry(frameShape, {
            depth: t, bevelEnabled: false, curveSegments: 22,
        });
        frameGeo.translate(0, 0, -t / 2);
        const frame = new T.Mesh(frameGeo, MAT.plastic);
        frame.name = 'cool-fan-frame';
        g.add(frame);

        // aro interno (dá profundidade à moldura)
        const lip = new T.Mesh(new T.TorusGeometry(holeR, 0.012, 6, 36), MAT.plasticLight);
        lip.position.z = t / 2 - 0.004;
        g.add(lip);

        // parafusos + pads de vibração nos 4 cantos
        const c = R - 0.072;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
            const screw = cyl(0.030, t + 0.012, MAT.darkMetal);
            screw.rotation.x = Math.PI / 2;
            place(screw, sx * c, sy * c, 0);
            g.add(screw);
            const pad = box(0.085, 0.085, 0.014, MAT.rubber);
            place(pad, sx * c, sy * c, t / 2 + 0.006);
            g.add(pad);
        });

        // rotor: cubo + anel LED + pás curvas
        const rotor = new T.Group();
        const hub = cyl(R * 0.30, t * 0.52, MAT.darkMetal);
        hub.name = 'cool-fan-hub';
        hub.rotation.x = Math.PI / 2;
        rotor.add(hub);
        const cap = cyl(R * 0.23, 0.012, MAT.plasticLight);
        cap.rotation.x = Math.PI / 2;
        place(cap, 0, 0, t * 0.26 + 0.006);
        rotor.add(cap);
        const ledMat = new T.MeshStandardMaterial({
            color: 0x9be7ff, emissive: 0x35c8ff, emissiveIntensity: 1.15,
            metalness: 0.3, roughness: 0.4,
        });
        const led = new T.Mesh(new T.TorusGeometry(R * 0.205, 0.009, 6, 30), ledMat);
        led.name = 'cool-fan-led';
        led.position.z = t * 0.26 + 0.012;
        rotor.add(led);

        // pá curva (raiz no cubo, ponta antes do aro) — geometria compartilhada
        const bladeShape = new T.Shape();
        bladeShape.moveTo(0.16, 0.070);
        bladeShape.quadraticCurveTo(0.36, 0.120, 0.552, 0.034);
        bladeShape.quadraticCurveTo(0.39, -0.056, 0.16, -0.060);
        bladeShape.lineTo(0.16, 0.070);
        const bladeGeo = new T.ExtrudeGeometry(bladeShape, {
            depth: 0.008, bevelEnabled: false, curveSegments: 10,
        });
        bladeGeo.translate(0, 0, -0.004);
        const bladeMat = new T.MeshStandardMaterial({
            color: 0x252c36, metalness: 0.35, roughness: 0.58,
        });
        const blades = o.blades || 9;
        for (let i = 0; i < blades; i++) {
            const arm = new T.Group();
            arm.rotation.z = (i / blades) * Math.PI * 2;
            const blade = new T.Mesh(bladeGeo, bladeMat);
            blade.name = 'cool-blade';
            blade.rotation.x = -0.17;             // passo (cabe na espessura)
            arm.add(blade);
            rotor.add(arm);
        }
        g.add(rotor);
        spin(rotor, 'z', o.speed === undefined ? 0.5 : o.speed);
        g.userData.rotor = rotor;
        return g;
    }

    /* ---------------------------------------------------------- materiais */

    function buildMaterials() {
        MAT = {
            pcb: new T.MeshStandardMaterial({ map: pcbTexture(), metalness: 0.28, roughness: 0.7 }),
            metal: new T.MeshStandardMaterial({
                color: 0x2b323b, metalness: 0.88, roughness: 0.38, roughnessMap: brushedTexture(),
            }),
            darkMetal: new T.MeshStandardMaterial({ color: 0x161b23, metalness: 0.8, roughness: 0.48 }),
            steel: new T.MeshStandardMaterial({ color: 0xaeb6c0, metalness: 0.92, roughness: 0.28 }),
            plastic: new T.MeshStandardMaterial({ color: 0x1b2029, metalness: 0.18, roughness: 0.7 }),
            plasticLight: new T.MeshStandardMaterial({ color: 0x333b46, metalness: 0.22, roughness: 0.55 }),
            rubber: new T.MeshStandardMaterial({ color: 0x0c0f14, metalness: 0.08, roughness: 0.95 }),
            copper: new T.MeshStandardMaterial({ color: 0xb87333, metalness: 0.95, roughness: 0.26 }),
            alu: new T.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.32 }),
            gold: new T.MeshStandardMaterial({ color: 0xe8b53a, metalness: 0.95, roughness: 0.26 }),
            silver: new T.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.95, roughness: 0.18 }),
            white: new T.MeshStandardMaterial({ color: 0xdde3ea, metalness: 0.1, roughness: 0.5 }),
            mesh: new T.MeshStandardMaterial({
                color: 0x232a33, metalness: 0.75, roughness: 0.5,
                alphaMap: meshAlpha(), transparent: true, side: T.DoubleSide,
            }),
            glass: new T.MeshPhysicalMaterial({
                color: 0x9fdcff, metalness: 0, roughness: 0.05,
                transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false,
            }),
        };
    }

    /* -------------------------------------------------------------- cenário */

    function buildLights() {
        scene.add(new T.AmbientLight(0x8fa4c4, 0.75));

        const key = new T.DirectionalLight(0xfff2df, 2.2);
        key.position.set(6.5, 9.5, 7.5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 1;
        key.shadow.camera.far = 32;
        key.shadow.camera.left = -7;
        key.shadow.camera.right = 7;
        key.shadow.camera.top = 9;
        key.shadow.camera.bottom = -3;
        key.shadow.bias = -0.0012;
        key.shadow.normalBias = 0.025;
        scene.add(key);

        const fill = new T.DirectionalLight(0x8ea6ff, 0.5);
        fill.position.set(-7, 4, -6);
        scene.add(fill);

        const rim = new T.PointLight(0x00f0ff, 1.5, 26);
        rim.position.set(-4.2, 5.4, 5);
        scene.add(rim);

        const warm = new T.PointLight(0xffb46a, 1.0, 22);
        warm.position.set(5.4, 3.0, 4.2);
        scene.add(warm);

        const under = new T.PointLight(0x2a6cff, 0.8, 18);
        under.position.set(0, 1.1, 2.4);
        scene.add(under);
    }

    /** piso que recebe a sombra do gabinete */
    function buildFloor() {
        const floor = new T.Mesh(
            new T.PlaneGeometry(44, 44),
            new T.MeshStandardMaterial({
                map: floorTexture(), color: 0xffffff, metalness: 0.35, roughness: 0.72,
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.14;
        floor.receiveShadow = true;
        world.add(floor);
        return floor;
    }

    /*
     *  GABINETE
     *  1 unidade da cena = 100 mm. Gabinete: 440 x 500 x 320 mm.
     *  A placa-mãe fica no fundo (como numa vitrine), presa por espaçadores.
     */
    function buildCase() {
        const { w, h, d } = CFG.case;
        const g = new T.Group();
        const t = 0.07;                   // espessura das chapas

        /* ------------------------------------------------- fundo (traseira) */
        // painel com os recortes reais: I/O, slots de expansão, fonte e exaustão
        // (as coordenadas são locais do painel: y do mundo = y + h/2)
        const holes = [
            { x: -1.00, y: 1.50, w: 0.52, h: 0.76 },                 // I/O
            { x: 0.20, y: -2.00, w: 1.56, h: 0.90 },                 // fonte
            { x: 1.00, y: 1.95, w: 1.10, h: 0.90 },                  // exaustão
        ];
        for (let i = 0; i < 4; i++) {                                // slots PCIe
            holes.push({ x: -0.58, y: 0.12 - i * 0.18, w: 1.15, h: 0.05 });
        }
        const back = panelWithHoles(w - 0.04, h - 0.10, holes, t, MAT.metal);
        place(back, 0, h / 2, -d / 2);
        back.castShadow = true;
        g.add(back);

        // tampas superior: só a moldura + tela (o gabinete fica ABERTO,
        // então o interior precisa ser visível por cima)
        const topY = h - t / 2;
        const rail = 0.10;
        const tFront = box(w - 0.04, t, rail, MAT.metal); place(tFront, 0, topY, d / 2 - rail / 2);
        const tBack = box(w - 0.04, t, rail, MAT.metal); place(tBack, 0, topY, -d / 2 + rail / 2);
        const tLeft = box(rail, t, d - 0.04 - rail * 2, MAT.metal); place(tLeft, -w / 2 + rail / 2, topY, 0);
        const tRight = box(rail, t, d - 0.04 - rail * 2, MAT.metal); place(tRight, w / 2 - rail / 2, topY, 0);
        g.add(tFront, tBack, tLeft, tRight);

        // base ABERTA: moldura + tela perfurada (assim a fonte e a ventoinha
        // dela ficam visíveis por baixo)
        const bRail = 0.13;
        const bFront = box(w - 0.04, t, bRail, MAT.metal); place(bFront, 0, t / 2, d / 2 - bRail / 2 - 0.02);
        const bBack = box(w - 0.04, t, bRail, MAT.metal); place(bBack, 0, t / 2, -d / 2 + bRail / 2 + 0.02);
        const bLeft = box(bRail, t, d - 0.04 - bRail * 2, MAT.metal); place(bLeft, -w / 2 + bRail / 2 + 0.02, t / 2, 0);
        const bRight = box(bRail, t, d - 0.04 - bRail * 2, MAT.metal); place(bRight, w / 2 - bRail / 2 - 0.02, t / 2, 0);
        g.add(bFront, bBack, bLeft, bRight);

        const baseScreen = new T.Mesh(new T.PlaneGeometry(w - 0.30, d - 0.30), MAT.mesh);
        baseScreen.rotation.x = Math.PI / 2;
        place(baseScreen, 0, t / 2, 0);
        baseScreen.receiveShadow = true;
        g.add(baseScreen);

        // pés de borracha
        [[-1.75, -1.15], [1.75, -1.15], [-1.75, 1.15], [1.75, 1.15]].forEach(([x, z]) => {
            const foot = cyl(0.13, 0.14, MAT.rubber);
            place(foot, x, -0.07, z);
            g.add(foot);
        });

        // grade de ventilação no teto (tela — deixa ver o interior)
        const topVent = new T.Mesh(new T.PlaneGeometry(w - 0.28, d - 0.30), MAT.mesh);
        topVent.rotation.x = -Math.PI / 2;
        place(topVent, 0, h - t + 0.02, 0);
        g.add(topVent);

        /* ------------------------------------------ frente (tela + moldura) */
        const frontZ = d / 2 - t / 2;
        const frameH = 0.16;
        // moldura da frente
        const fTop = box(w, frameH, t, MAT.metal); place(fTop, 0, h - frameH / 2, frontZ);
        const fBottom = box(w, frameH, t, MAT.metal); place(fBottom, 0, frameH / 2, frontZ);
        const fLeft = box(frameH, h - frameH * 2, t, MAT.metal); place(fLeft, -w / 2 + frameH / 2, h / 2, frontZ);
        const fRight = box(frameH, h - frameH * 2, t, MAT.metal); place(fRight, w / 2 - frameH / 2, h / 2, frontZ);
        g.add(fTop, fBottom, fLeft, fRight);

        // tela perfurada
        const grille = new T.Mesh(new T.PlaneGeometry(w - frameH * 2, h - frameH * 2.4), MAT.mesh);
        place(grille, 0, h / 2 + 0.04, frontZ - 0.01);
        g.add(grille);

        // (sem ventoinhas no gabinete: a refrigeração fica por conta do cooler)

        // botão depower e portas frontais
        const power = cyl(0.075, 0.05, MAT.plasticLight);
        power.rotation.x = Math.PI / 2;
        place(power, w / 2 - 0.42, h - 0.08, frontZ + 0.05);
        g.add(power);
        const powerLed = new T.Mesh(
            new T.SphereGeometry(0.035, 10, 8),
            new T.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.4 })
        );
        place(powerLed, w / 2 - 0.42, h - 0.16, frontZ + 0.06);
        g.add(powerLed);
        for (let i = 0; i < 2; i++) {
            const usb = box(0.16, 0.07, 0.04, MAT.plastic);
            place(usb, -w / 2 + 0.55 + i * 0.24, h - 0.08, frontZ + 0.05);
            g.add(usb);
        }

        /* ------------------------------------------------------- laterais
           O gabinete fica ABERTO no lado da câmera (sem chapa e sem
           vidro): sobram só as travessas, para as peças aparecerem. */
        // lateral esquerda (oposta à câmera): chapa opaca
        const side = box(t, h - 0.12, d - 0.12, MAT.metal);
        place(side, -w / 2 + t / 2, h / 2, 0);
        side.castShadow = true;
        g.add(side);

        // travessas da lateral aberta (estrutura, sem chapa)
        [-d / 2 + 0.18, d / 2 - 0.18].forEach((z) => {
            const beam = box(0.11, h - 0.12, 0.11, MAT.metal);
            place(beam, w / 2 - 0.055, h / 2, z);
            g.add(beam);
        });
        [h - 0.07, 0.07].forEach((y) => {
            const beam = box(0.11, 0.10, d - 0.12, MAT.metal);
            place(beam, w / 2 - 0.055, y, 0);
            g.add(beam);
        });

        /* ------------------------------------------ interior: placa-mãe, PSU */
        // espaçadores (standoffs) — a placa apoia neles
        [[-1.05, 4.15], [1.05, 4.15], [-1.05, 2.95], [1.05, 2.95], [-1.05, 1.60], [1.05, 1.60]]
            .forEach(([x, y]) => {
                const s = cyl(0.06, 0.13, MAT.steel);
                s.rotation.x = Math.PI / 2;
                place(s, x, y, -d / 2 + 0.13);
                g.add(s);
            });

        // grommets (passagem de cabos)
        [[1.38, 3.40], [1.38, 2.55]].forEach(([x, y]) => {
            const ring = new T.Mesh(new T.TorusGeometry(0.11, 0.035, 8, 18), MAT.rubber);
            place(ring, x, y, -d / 2 + 0.14);
            g.add(ring);
        });

        // tampa do compartimento da fonte: só a moldura + tela perfurada,
        // para a FONTE continuar visível de cima
        const shroudW = w - 0.18, shroudD = d - 0.30;
        const sFront = box(shroudW, 0.05, 0.12, MAT.darkMetal); place(sFront, 0, 1.00, -0.05 + shroudD / 2);
        const sBack = box(shroudW, 0.05, 0.12, MAT.darkMetal); place(sBack, 0, 1.00, -0.05 - shroudD / 2);
        const sLeft = box(0.12, 0.05, shroudD, MAT.darkMetal); place(sLeft, -shroudW / 2 + 0.06, 1.00, -0.05);
        const sRight = box(0.12, 0.05, shroudD, MAT.darkMetal); place(sRight, shroudW / 2 - 0.06, 1.00, -0.05);
        g.add(sFront, sBack, sLeft, sRight);

        // a tela da tampa tem um RECORTE (passa-cabo) logo acima da fonte:
        // os cabos 24 pinos, EPS e PCIe sobem por esse furo, em vez de
        // atravessarem a tampa.
        const cableHole = { x: 0.68, z: 0.535, w: 1.00, d: 0.58 };
        const topW = shroudW - 0.24, topD = shroudD - 0.24;
        const topShape = new T.Shape();
        topShape.moveTo(-topW / 2, -topD / 2);
        topShape.lineTo(topW / 2, -topD / 2);
        topShape.lineTo(topW / 2, topD / 2);
        topShape.lineTo(-topW / 2, topD / 2);
        topShape.closePath();
        // no shape, o eixo Y vira -Z depois da rotação de -90° em X
        const holePath = new T.Path();
        const hx0 = cableHole.x - cableHole.w / 2, hx1 = cableHole.x + cableHole.w / 2;
        const hy0 = -cableHole.z - 0.05 + cableHole.d / 2;
        const hy1 = -cableHole.z - 0.05 - cableHole.d / 2;
        holePath.moveTo(hx0, hy0);
        holePath.lineTo(hx1, hy0);
        holePath.lineTo(hx1, hy1);
        holePath.lineTo(hx0, hy1);
        holePath.closePath();
        topShape.holes.push(holePath);
        const topGeo = new T.ExtrudeGeometry(topShape, { depth: 0.03, bevelEnabled: false });
        // UVs 0..1 para a textura de tela não ficar comprimida
        const uvAttr = topGeo.attributes.uv, posAttr = topGeo.attributes.position;
        for (let i = 0; i < uvAttr.count; i++) {
            uvAttr.setXY(i,
                (posAttr.getX(i) + topW / 2) / topW,
                (posAttr.getY(i) + topD / 2) / topD);
        }
        const shroudScreen = new T.Mesh(topGeo, MAT.mesh);
        shroudScreen.rotation.x = -Math.PI / 2;
        place(shroudScreen, 0, 1.00, -0.05);
        g.add(shroudScreen);

        // acabamento de borracha em volta do furo (passa-cabo)
        const rimOuter = roundedRectShape(cableHole.w + 0.10, cableHole.d + 0.10, 0.09);
        const rimInner = roundedRectShape(cableHole.w, cableHole.d, 0.05);
        rimOuter.holes.push(rimInner);
        const rimGeo = new T.ExtrudeGeometry(rimOuter, { depth: 0.022, bevelEnabled: false });
        const rim = new T.Mesh(rimGeo, MAT.rubber);
        rim.rotation.x = -Math.PI / 2;
        place(rim, cableHole.x, 1.031, cableHole.z);
        g.add(rim);

        const shroudFront = box(w - 0.18, 0.92, 0.06, MAT.darkMetal);
        place(shroudFront, 0, 0.52, d / 2 - 0.22);
        g.add(shroudFront);

        // luz de ambiente interna (barramento no teto)
        const strip = box(w - 0.7, 0.035, 0.035,
            new T.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 }));
        place(strip, 0, h - 0.12, d / 2 - 0.5);
        g.add(strip);

        world.add(g);
        caseGroup = g;
        collectGlow(g);          // a luz do gabinete só acende no "LIGAR"
        return g;
    }

    /* ------------------------------------------------------------- peças 3D */

    /*
     *  PLACA-MÃE (padrão ATX: 244 x 305 mm), montada na VERTICAL.
     *  Origem local no centro da placa; a face (lado dos componentes)
     *  olha para +Z. Todo o layout abaixo é o de uma placa ATX real.
     */
    function buildMobo() {
        const g = new T.Group();
        const W = 2.44, H = 3.05, D = 0.05;      // ATX 244 x 305 mm
        const fz = D / 2;                          // face da placa

        const board = box(W, H, D, MAT.pcb);
        board.receiveShadow = true;
        g.add(board);

        /* ---- soquete da CPU (LGA) ------------------------------------- */
        const sx = -0.62, sy = 0.50;
        const socket = box(0.50, 0.50, 0.025, MAT.plastic);
        place(socket, sx, sy, fz + 0.012);
        g.add(socket);
        // placa de contatos dentro do soquete
        const contacts = box(0.42, 0.42, 0.008, MAT.darkMetal);
        place(contacts, sx, sy, fz + 0.028);
        g.add(contacts);
        const socketFrame = box(0.56, 0.56, 0.012, MAT.steel);
        place(socketFrame, sx, sy, fz + 0.006);
        g.add(socketFrame);
        // alavanca de trava + botão
        const lever = box(0.05, 0.34, 0.03, MAT.steel);
        place(lever, sx + 0.30, sy, fz + 0.02);
        g.add(lever);
        const leverKnob = box(0.08, 0.08, 0.05, MAT.steel);
        place(leverKnob, sx + 0.30, sy + 0.19, fz + 0.025);
        g.add(leverKnob);
        // 4 furos de fixação do cooler
        [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(([dx, dy]) => {
            const hole = cyl(0.026, 0.012, MAT.darkMetal);
            hole.rotation.x = Math.PI / 2;
            place(hole, sx + dx, sy + dy, fz + 0.004);
            g.add(hole);
        });

        /* ---- dissipadores de VRM (com aletas) -------------------------- */
        function vrmHeatsink(w, h, x, y) {
            const hs = box(w, h, 0.08, MAT.alu);
            place(hs, x, y, fz + 0.04);
            g.add(hs);
            const fins = Math.max(3, Math.round(w / 0.06));
            for (let i = 0; i < fins; i++) {
                const fin = box(w * 0.9, 0.016, 0.03, MAT.alu);
                place(fin, x, y - h / 2 + 0.02 + i * (h / fins), fz + 0.08);
                g.add(fin);
            }
            // faixa escura (logotipo) na frente do dissipador
            const logo = box(w * 0.55, 0.035, 0.006, MAT.darkMetal);
            place(logo, x, y, fz + 0.083);
            g.add(logo);
        }
        vrmHeatsink(0.67, 0.20, -0.285, 1.00);    // VRM do topo (acima do soquete)
        vrmHeatsink(0.17, 0.65, -1.065, 0.52);    // VRM da esquerda

        // indutores (chokes) e capacitores ao redor do soquete
        for (let i = 0; i < 6; i++) {
            const choke = box(0.085, 0.085, 0.06, MAT.plastic);
            place(choke, -1.02 + i * 0.11, 0.86, fz + 0.03);
            g.add(choke);
        }
        for (let i = 0; i < 5; i++) {
            const cap = cyl(0.035, 0.09, MAT.alu);
            cap.rotation.x = Math.PI / 2;
            place(cap, -0.30 + i * 0.09, 0.82, fz + 0.045);
            g.add(cap);
        }
        // segunda fileira de indutores e capacitores no topo (VRM do topo)
        for (let i = 0; i < 7; i++) {
            const choke = box(0.075, 0.075, 0.055, MAT.plastic);
            place(choke, -0.92 + i * 0.10, 1.26, fz + 0.028);
            g.add(choke);
        }
        for (let i = 0; i < 5; i++) {
            const cap = cyl(0.030, 0.08, MAT.alu);
            cap.rotation.x = Math.PI / 2;
            place(cap, -0.34 + i * 0.085, 1.17, fz + 0.04);
            g.add(cap);
        }

        /* ---- slots DIMM (4) ------------------------------------------- */
        [0.12, 0.27, 0.42, 0.57].forEach((x, i) => {
            const slot = box(0.055, 1.30, 0.04, MAT.plastic);
            place(slot, x, 0.75, fz + 0.02);
            g.add(slot);
            // comb interno do slot (as divisórias que seguram o módulo)
            const comb = box(0.018, 1.24, 0.016, MAT.darkMetal);
            place(comb, x, 0.75, fz + 0.043);
            g.add(comb);
            [0.12, 1.38].forEach((y) => {          // travas nas pontas
                const latch = box(0.05, 0.06, 0.05, MAT.plasticLight);
                place(latch, x, y, fz + 0.03);
                g.add(latch);
            });
            // chanfro colorido (só nas duas primeiras posições)
            if (i < 2) {
                const key = box(0.058, 0.05, 0.045, MAT.plasticLight);
                place(key, x, 0.14, fz + 0.025);
                g.add(key);
            }
        });

        /* ---- slots PCIe ------------------------------------------------ */
        const pcie = box(0.89, 0.055, 0.06, MAT.plastic);
        pcie.name = 'slot-pcie';
        place(pcie, -0.605, -0.15, fz + 0.03);
        g.add(pcie);
        const pcieShield = box(0.91, 0.085, 0.015, MAT.steel);
        place(pcieShield, -0.605, -0.15, fz + 0.065);
        g.add(pcieShield);
        // trava do PCIe x16 (na ponta esquerda)
        const pcieLatch = box(0.05, 0.10, 0.05, MAT.plasticLight);
        place(pcieLatch, -1.07, -0.15, fz + 0.035);
        g.add(pcieLatch);
        // slots PCIe x1 (parte de baixo, à direita do M.2)
        [ -0.72, -1.02 ].forEach((y) => {
            const s = box(0.33, 0.045, 0.05, MAT.plastic);
            place(s, 0.20, y, fz + 0.025);
            g.add(s);
            const l = box(0.04, 0.05, 0.05, MAT.plasticLight);   // trava
            place(l, 0.375, y, fz + 0.03);
            g.add(l);
        });

        /* ---- slot M.2 (à direita, ABAIXO da placa de vídeo) -------------- */
        const m2 = box(0.80, 0.045, 0.045, MAT.plastic);
        place(m2, 0.55, -0.58, fz + 0.022);
        g.add(m2);
        // conector do slot (o SSD entra por aqui)
        const m2Conn = box(0.08, 0.05, 0.05, MAT.plasticLight);
        place(m2Conn, 0.185, -0.58, fz + 0.03);
        g.add(m2Conn);
        // fixadores do M.2 na placa
        const m2Screw = cyl(0.022, 0.02, MAT.steel);
        m2Screw.rotation.x = Math.PI / 2;
        place(m2Screw, 0.93, -0.58, fz + 0.045);
        g.add(m2Screw);

        /* ---- chipset ---------------------------------------------------- */
        const chipset = box(0.50, 0.50, 0.07, MAT.alu);
        place(chipset, 0.72, -0.95, fz + 0.035);
        g.add(chipset);
        const chipGroove = box(0.52, 0.03, 0.02, MAT.darkMetal);
        place(chipGroove, 0.72, -0.95, fz + 0.072);
        g.add(chipGroove);
        // aletas do dissipador do chipset
        for (let i = 0; i < 6; i++) {
            const fin = box(0.46, 0.012, 0.02, MAT.alu);
            place(fin, 0.72, -1.14 + i * 0.075, fz + 0.075);
            g.add(fin);
        }

        /* ---- conectores de força e SATA ---------------------------------- */
        const atx = box(0.14, 0.45, 0.13, MAT.plastic);
        place(atx, 1.09, 0.375, fz + 0.065);
        g.add(atx);
        // trava do conector 24 pinos
        const atxClip = box(0.10, 0.06, 0.05, MAT.plasticLight);
        place(atxClip, 1.09, 0.615, fz + 0.115);
        g.add(atxClip);
        const eps = box(0.30, 0.20, 0.12, MAT.plastic);
        place(eps, 0.99, 1.38, fz + 0.06);
        g.add(eps);
        // 4 portas SATA (empilhadas)
        [-0.35, -0.50, -0.65, -0.80].forEach((y) => {
            const sata = box(0.15, 0.11, 0.10, MAT.plasticLight);
            place(sata, 1.12, y, fz + 0.05);
            g.add(sata);
            const mouth = box(0.11, 0.05, 0.04, MAT.darkMetal);
            place(mouth, 1.12, y, fz + 0.085);
            g.add(mouth);
        });
        // cabeçalhos (front panel / USB)
        const header = box(0.16, 0.09, 0.05, MAT.white);
        place(header, -1.05, -1.32, fz + 0.025);
        g.add(header);
        // USB 3.0 e USB 2.0 do painel frontal
        const usb3 = box(0.20, 0.07, 0.05, MAT.plasticLight);
        place(usb3, 1.05, -1.32, fz + 0.025);
        g.add(usb3);
        const usb2 = box(0.24, 0.07, 0.05, MAT.white);
        place(usb2, 0.74, -1.32, fz + 0.025);
        g.add(usb2);
        // cabeçalhos de ventoinha (CPU_FAN / SYS_FAN)
        [[0.85, 1.20], [0.85, 1.05], [1.10, -1.10]].forEach(([x, y]) => {
            const h = box(0.11, 0.05, 0.04, MAT.plastic);
            place(h, x, y, fz + 0.02);
            g.add(h);
        });
        // bateria CMOS (pilha)
        const battery = cyl(0.11, 0.035, MAT.silver);
        battery.rotation.x = Math.PI / 2;
        place(battery, -1.05, -0.45, fz + 0.018);
        g.add(battery);
        const batteryClip = box(0.26, 0.05, 0.03, MAT.plasticLight);
        place(batteryClip, -1.05, -0.45, fz + 0.012);
        g.add(batteryClip);
        // botões power/reset e LEDs de debug
        [-1.16, -1.02].forEach((x) => {
            const btn = cyl(0.035, 0.03, MAT.plasticLight);
            btn.rotation.x = Math.PI / 2;
            place(btn, x, -1.05, fz + 0.015);
            g.add(btn);
        });
        for (let i = 0; i < 4; i++) {
            const led = box(0.045, 0.022, 0.012, new T.MeshStandardMaterial({
                color: i === 0 ? 0x00ff66 : 0x1a2029,
                emissive: i === 0 ? 0x00ff66 : 0x000000,
                emissiveIntensity: i === 0 ? 1.2 : 0,
            }));
            place(led, -1.16 + i * 0.07, -0.90, fz + 0.008);
            g.add(led);
        }

        /* ---- painel de I/O traseiro -------------------------------------- */
        const io = box(0.44, 0.745, 0.26, MAT.steel);
        place(io, -1.00, 1.15, -0.12);
        g.add(io);
        // shroud plástico em volta do painel de I/O
        const ioShroud = box(0.48, 0.80, 0.05, MAT.plastic);
        place(ioShroud, -1.00, 1.15, 0.02);
        g.add(ioShroud);
        // portas visíveis no painel
        const ports = [
            [-1.14, 1.40, 0.10, 0.05, MAT.plasticLight],   // USB
            [-1.14, 1.29, 0.10, 0.05, MAT.plasticLight],
            [-1.13, 1.10, 0.13, 0.13, MAT.plastic],        // RJ45
            [-1.13, 0.93, 0.12, 0.09, MAT.plastic],        // HDMI
            [-0.86, 0.90, 0.10, 0.22, MAT.plasticLight],   // USB duplo
        ];
        ports.forEach(([x, y, w, h, m]) => {
            const p = box(w, h, 0.04, m);
            place(p, x, y, -0.25);
            g.add(p);
        });
        // jacks de áudio (3) e botão de reset
        for (let i = 0; i < 3; i++) {
            const jack = cyl(0.035, 0.04, MAT.plastic);
            jack.rotation.x = Math.PI / 2;
            place(jack, -1.14 + i * 0.09, 0.80, -0.25);
            g.add(jack);
        }
        const reset = cyl(0.028, 0.04, MAT.plasticLight);
        reset.rotation.x = Math.PI / 2;
        place(reset, -0.90, 1.43, -0.25);
        g.add(reset);

        return g;
    }

    /*
     *  CPU — IHS de 40 x 40 mm sobre o substrato verde.
     *  Origem local no centro da face superior da IHS.
     */
    function buildCpu() {
        const g = new T.Group();
        // substrato (PCB verde) logo abaixo da IHS
        const substrate = box(0.45, 0.45, 0.02, MAT.pcb);
        place(substrate, 0, 0, -0.055);
        g.add(substrate);
        // IHS (tampa de metal)
        const ihs = box(0.40, 0.40, 0.045, MAT.silver);
        place(ihs, 0, 0, -0.0225);
        g.add(ihs);
        // chanfro dourado (referência de alinhamento)
        const notch = box(0.07, 0.07, 0.012, MAT.gold);
        place(notch, -0.155, 0.155, 0.006);
        g.add(notch);
        // seta de orientação (triângulo simplificado)
        const arrow = box(0.06, 0.05, 0.010, MAT.gold);
        place(arrow, 0.14, 0.16, 0.005);
        g.add(arrow);
        return g;
    }

    /*
     *  COOLER (TORRE DUPLA) — sistema de refrigeração do processador.
     *  Dissipador de 134 x 160 mm com DUAS torres de aletas de alumínio
     *  (cantos chanfrados), 6 heatpipes de cobre que saem da base e sobem
     *  por dentro das torres, base niquelada, molas de fixação e DUAS
     *  ventoinhas de 120 mm (frontal + central) com moldura quadrada e pás
     *  curvas. Origem local: a face do IHS (a CPU já está no soquete).
     */
    function buildCooler() {
        const g = new T.Group();

        const W = 1.34;                  // largura da torre (134 mm)
        const D = 0.42;                  // profundidade da torre (42 mm)
        const TZ = [0.22, 0.78];         // eixo Z do centro das duas torres (sobre a CPU)
        const FIN_Y0 = 0.30;
        const FIN_PITCH = 0.036;
        const FIN_N = 33;
        const finTop = FIN_Y0 + (FIN_N - 1) * FIN_PITCH;   // 1.452
        const TOP_Y = 1.47;              // base da tampa superior

        /* ---------------- base: contato de cobre + bloco niquelado -------- */
        const cold = box(0.46, 0.46, 0.014, MAT.copper);
        cold.name = 'cool-base';
        place(cold, 0, 0, 0.007);
        g.add(cold);

        const block = box(0.52, 0.52, 0.10, MAT.silver);
        block.name = 'cool-block';
        place(block, 0, 0, 0.064);
        g.add(block);

        const baseTop = box(0.56, 0.56, 0.012, MAT.alu);
        place(baseTop, 0, 0, 0.12);
        g.add(baseTop);

        /* ---------------- fixação: 4 parafusos com mola + travessas ------- */
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
            const x = sx * 0.27, y = sy * 0.27;
            const post = cyl(0.034, 0.19, MAT.steel);
            place(post, x, y, 0.095);
            g.add(post);
            for (let i = 0; i < 3; i++) {
                const coil = new T.Mesh(new T.TorusGeometry(0.030, 0.006, 5, 14), MAT.steel);
                coil.rotation.x = Math.PI / 2;
                place(coil, x, y, 0.168 + i * 0.013);
                g.add(coil);
            }
            const nut = cyl(0.048, 0.030, MAT.darkMetal);
            place(nut, x, y, 0.218);
            g.add(nut);
        });
        const barX = box(0.80, 0.072, 0.030, MAT.steel);
        place(barX, 0, 0, 0.150);
        g.add(barX);
        const barZ = box(0.072, 0.80, 0.030, MAT.steel);
        place(barZ, 0, 0, 0.150);
        g.add(barZ);

        /* ---------------- 6 heatpipes (3 em cada torre) -------------------- */
        const PIPE_X = [-0.19, 0, 0.19];
        const pipeRows = [
            { pts: (x) => [                         // torre da frente
                new T.Vector3(x, -0.095, 0.115),
                new T.Vector3(x, -0.020, 0.170),
                new T.Vector3(x, 0.095, 0.215),
                new T.Vector3(x, 0.215, 0.275),
                new T.Vector3(x, 0.300, 0.345),
                new T.Vector3(x, TOP_Y, TZ[0]),
            ] },
            { pts: (x) => [                         // torre de trás (passa
                new T.Vector3(x, 0.095, 0.115),    // por baixo da ventoinha
                new T.Vector3(x, 0.150, 0.180),    // central)
                new T.Vector3(x, 0.205, 0.500),
                new T.Vector3(x, 0.238, 0.760),
                new T.Vector3(x, 0.300, 0.840),
                new T.Vector3(x, 0.380, 0.910),
                new T.Vector3(x, TOP_Y, TZ[1]),
            ] },
        ];
        pipeRows.forEach((row) => {
            PIPE_X.forEach((x) => {
                const pipe = new T.Mesh(
                    new T.TubeGeometry(new T.CatmullRomCurve3(row.pts(x)), 34, 0.030, 8, false),
                    MAT.copper
                );
                pipe.name = 'cool-heatpipe';
                g.add(pipe);
            });
        });

        /* ---------------- torres: aletas + saias laterais + tampa ---------- */
        const finShape = chamferRectShape(W, D, 0.055);
        const finGeo = new T.ExtrudeGeometry(finShape, { depth: 0.006, bevelEnabled: false });
        finGeo.translate(0, 0, -0.003);
        const capGeo = new T.ExtrudeGeometry(finShape, { depth: 0.020, bevelEnabled: false });
        capGeo.translate(0, 0, -0.010);

        TZ.forEach((z) => {
            for (let i = 0; i < FIN_N; i++) {
                const fin = new T.Mesh(finGeo, MAT.alu);
                fin.name = 'cool-fin';
                fin.rotation.x = -Math.PI / 2;
                fin.position.set(0, FIN_Y0 + i * FIN_PITCH, z);
                g.add(fin);
            }
            // bordas dobradas (as laterais da pilha de aletas)
            [-1, 1].forEach((sx) => {
                const skirt = box(0.010, finTop - FIN_Y0 + 0.018, D, MAT.alu);
                place(skirt, sx * (W / 2 + 0.002), (FIN_Y0 + finTop) / 2, z);
                g.add(skirt);
            });
            // tampa superior com a mesma borda chanfrada
            const plate = new T.Mesh(capGeo, MAT.alu);
            plate.name = 'cool-top';
            plate.rotation.x = -Math.PI / 2;
            plate.position.set(0, TOP_Y, z);
            g.add(plate);
        });

        // pontas dos heatpipes aparecendo por cima da tampa
        PIPE_X.forEach((x) => {
            TZ.forEach((z) => {
                const tip = cyl(0.031, 0.010, MAT.silver);
                place(tip, x, TOP_Y + 0.015, z);
                g.add(tip);
            });
        });

        // emblema escuro + faixa LED na torre da frente
        const badge = box(0.60, 0.012, 0.12, MAT.darkMetal);
        place(badge, 0, 1.486, 1.06);
        g.add(badge);
        const badgeLed = box(0.42, 0.008, 0.024, new T.MeshStandardMaterial({
            color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5, roughness: 0.35,
        }));
        place(badgeLed, 0, 1.496, 1.06);
        g.add(badgeLed);

        /* ---------------- ventoinhas (frontal 120 + central 120) ---------- */
        const fanFront = buildCoolerFan(1.20, { thick: 0.22, speed: 0.55 });
        fanFront.name = 'cool-fan-front';
        place(fanFront, 0, 0.888, 1.06);
        g.add(fanFront);

        const fanMid = buildCoolerFan(1.20, { thick: 0.20, speed: 0.52 });
        fanMid.name = 'cool-fan-mid';
        place(fanMid, 0, 0.888, 0.50);
        g.add(fanMid);

        // clipes de arame prendendo as ventoinhas nas torres: ficam na
        // frente da moldura, junto às bordas (não atravessam as pás)
        [[1.06, 0.220], [0.50, 0.200]].forEach(([fz, ft]) => {
            [-1, 1].forEach((sx) => {
                const clip = box(0.016, 0.66, 0.016, MAT.steel);
                place(clip, sx * 0.585, 0.888, fz + ft / 2 + 0.010);
                g.add(clip);
                // dobras do clipe para dentro da moldura (topo e base)
                [0.568, 1.208].forEach((hy) => {
                    const hook = box(0.045, 0.016, 0.016, MAT.steel);
                    place(hook, sx * 0.605, hy, fz + ft / 2 + 0.010);
                    g.add(hook);
                });
            });
        });

        /* ---------------- cabo PWM: ventoinhas → CPU_FAN ---------------- */
        function fanWire(points, radius, material) {
            const curve = new T.CatmullRomCurve3(points);
            const m = new T.Mesh(
                new T.TubeGeometry(curve, 22, radius, 6, false),
                material
            );
            m.userData.noMarker = true;      // o cabo não infla o marcador
            m.userData.curve = curve;        // testes medem o cabo pelo centro
            g.add(m);
            return m;
        }

        fanWire([
            new T.Vector3(0.34, 0.30, 1.08),
            new T.Vector3(0.52, 0.32, 0.95),
            new T.Vector3(0.64, 0.36, 0.945),
            new T.Vector3(0.72, 0.50, 0.90),
            new T.Vector3(0.73, 0.62, 0.76),
            new T.Vector3(0.73, 0.70, 0.60),
        ], 0.012, MAT.rubber);
        fanWire([
            new T.Vector3(0.30, 0.28, 0.46),
            new T.Vector3(0.50, 0.30, 0.34),
            new T.Vector3(0.65, 0.36, 0.34),
            new T.Vector3(0.72, 0.50, 0.40),
            new T.Vector3(0.73, 0.60, 0.52),
            new T.Vector3(0.73, 0.70, 0.60),
        ], 0.012, MAT.rubber);

        // divisor (Y) das duas ventoinhas
        const splitter = box(0.075, 0.045, 0.12, MAT.plastic);
        splitter.userData.noMarker = true;
        place(splitter, 0.73, 0.70, 0.60);
        g.add(splitter);

        // cabo principal encapado: sai do divisor, sobe por fora da torre,
        // passa POR CIMA dos pentes de RAM e desce até o CPU_FAN
        fanWire([
            new T.Vector3(0.73, 0.70, 0.60),
            new T.Vector3(0.76, 0.82, 0.46),
            new T.Vector3(0.80, 0.94, 0.32),
            new T.Vector3(0.86, 0.990, 0.20),
            new T.Vector3(0.94, 0.990, 0.06),
            new T.Vector3(1.12, 0.990, 0.02),
            new T.Vector3(1.30, 0.990, 0.02),
            new T.Vector3(1.40, 0.990, 0.01),
            new T.Vector3(1.42, 0.900, 0.005),
            new T.Vector3(1.42, 0.800, 0.0),
            new T.Vector3(1.43, 0.720, -0.004),
            new T.Vector3(1.47, 0.705, -0.008),
        ], 0.020, MAT.plastic);

        const plug = box(0.11, 0.055, 0.08, MAT.darkMetal);
        plug.userData.noMarker = true;
        place(plug, 1.455, 0.70, -0.008);   // encaixa no CPU_FAN da placa
        g.add(plug);

        g.rotation.y = 0;

        return g;
    }

    /*
     *  MEMÓRIA RAM — par de pentes de 133 mm (DDR4) com dissipador e LED.
     *  Os pentes ficam EM PÉ nos slots DIMM (como num PC real):
     *   - comprimento de 133 mm na VERTICAL (eixo Y);
     *   - altura de ~31 mm SAINDO da placa (eixo Z, para +Z);
     *   - espessura fina no eixo X (cada pente no seu slot).
     *  Origem local no centro da base dos dedos de ouro (no slot).
     */
    function buildRam() {
        const g = new T.Group();
        const L = 1.30;                       // 133 mm (comprimento, eixo Y)
        const H = 0.31;                       // ~31 mm (altura fora da placa, eixo Z)
        const TH = 0.016;                     // espessura do PCB (eixo X)
        const yC = L / 2;                     // centro do comprimento

        [-0.075, 0.075].forEach((x) => {      // dois pentes, um em cada slot
            // dedos dourados: entram no slot DIMM, na base do pente
            const fingers = box(TH + 0.004, L - 0.055, 0.095, MAT.gold);
            fingers.name = 'ram-fingers';
            place(fingers, x, yC, 0.018);
            g.add(fingers);

            // PCB do pente (em pé, saindo da placa)
            const pcb = box(TH, L, H, MAT.pcb);
            pcb.name = 'ram-pcb';
            place(pcb, x, yC, H / 2 + 0.006);
            g.add(pcb);

            // dissipador de alumínio cobrindo o PCB (as duas faces largas)
            const spreader = box(0.046, L - 0.045, H - 0.030, MAT.alu);
            spreader.name = 'ram-spreader';
            place(spreader, x, yC, H / 2 + 0.020);
            g.add(spreader);

            // ranhuras do dissipador na face que olha para a câmera (+X)
            for (let i = 0; i < 7; i++) {
                const fin = box(0.006, 0.020, H - 0.085, MAT.darkMetal);
                place(fin, x + 0.025, 0.16 + i * 0.145, H / 2 + 0.020);
                g.add(fin);
            }

            // difusor RGB na borda de CIMA do pente (a ponta que sai da placa)
            const rgb = box(0.030, L - 0.090, 0.026, new T.MeshStandardMaterial({
                color: 0x9be7ff, emissive: 0x35c8ff, emissiveIntensity: 1.6, roughness: 0.35,
            }));
            rgb.name = 'ram-rgb';
            place(rgb, x, yC, H + 0.008);
            g.add(rgb);

            // etiqueta escura na face do dissipador
            const label = box(0.004, 0.34, 0.060, MAT.darkMetal);
            place(label, x + 0.026, yC + 0.22, H / 2 - 0.010);
            g.add(label);
        });
        return g;
    }

    /*
     *  PLACA DE VÍDEO — 240 x 111 mm, montada NO SLOT PCIe x16.
     *  A placa fica DEITADA (o plano da placa é paralelo ao piso, como num
     *  PC real): o dissipador e as 3 ventoinhas olham PARA BAIXO (para o
     *  fundo do gabinete) e a BACKPLATE fica PARA CIMA — é o lado que se
     *  vê pelo vidro lateral.
     *
     *  O COMPRIMENTO (240 mm) corre PARALELO ao painel traseiro do gabinete
     *  (eixo X, a mesma direção do slot PCIe da placa-mãe — é por isso que
     *  os dedos de ouro, que são longos, entram no slot) e a LARGURA
     *  (111 mm) avança do rosto da placa-mãe para a frente do gabinete.
     *  É a posição de uma placa de verdade: atravessada, deitada, com o
     *  bracket na ponta de trás.
     *
     *  Origem local: o conector PCIe (dedos de ouro), no eixo do slot.
     */
    function buildGpu() {
        const g = new T.Group();
        const W = 1.11, L = 2.40;            // 111 (largura) x 240 (comprimento)
        const PLANE = -0.29;                 // plano da placa = altura do slot
        const X0 = -0.735;                   // borda de trás (ponta do bracket)
        const Z0 = -0.9725;                  // borda de trás (encostada no slot)
        const CX = X0 + L / 2;               // centro do comprimento
        const CZ = Z0 + W / 2;               // centro da largura

        // PCB (na altura do slot PCIe), com a borda de trás dentro do conector
        const pcb = box(L, 0.022, W, MAT.pcb);
        pcb.name = 'pcb';
        place(pcb, CX, PLANE, CZ);
        g.add(pcb);
        // BACKPLATE (em cima da PCB — o lado visível pelo vidro)
        const backplate = box(L - 0.06, 0.016, W + 0.03, MAT.steel);
        backplate.name = 'backplate';
        place(backplate, CX, PLANE + 0.020, CZ);
        g.add(backplate);
        // recortes de ventilação do backplate
        for (let i = 0; i < 3; i++) {
            const cut = box(0.16, 0.014, W * 0.55, MAT.darkMetal);
            place(cut, CX - 0.90 + i * 0.90, PLANE + 0.029, CZ);
            g.add(cut);
        }
        // detalhe neon na borda da frente da backplate
        const accent = box(L - 0.4, 0.045, 0.028, new T.MeshStandardMaterial({
            color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.3,
        }));
        place(accent, CX, PLANE + 0.030, Z0 + W + 0.014);
        g.add(accent);
        // carcaça/dissipador (EMBAIXO da PCB — o lado que empurra o ar)
        const shroud = box(2.30, 0.30, W, MAT.plastic);
        shroud.name = 'shroud';
        place(shroud, CX, PLANE - 0.16, CZ);
        g.add(shroud);
        // aletas do dissipador visíveis na lateral
        for (let i = 0; i < 12; i++) {
            const fin = box(0.012, 0.20, W + 0.04, MAT.alu);
            place(fin, X0 + 0.175 + i * 0.18, PLANE - 0.16, CZ);
            g.add(fin);
        }
        // 3 ventoinhas na face de BAIXO (sopram para o fundo do gabinete)
        [CX - 0.78, CX, CX + 0.78].forEach((x) => {
            const fan = buildFan(0.34, { speed: 0.45, frameColor: 0x1c222b });
            fan.rotation.x = Math.PI / 2;          // eixo do fã passa a ser Y
            fan.traverse((c) => { if (c.isMesh) c.name = 'fan'; });
            place(fan, x, PLANE - 0.325, CZ);
            g.add(fan);
        });
        // bracket (painel de saídas de vídeo) — na PONTA DE TRÁS da placa,
        // do mesmo lado dos dedos de ouro (como numa placa real). Fica na
        // lateral esquerda do gabinete: o painel traseiro do gabinete fica
        // ATRÁS da placa-mãe, então o bracket não pode atravessá-la.
        const bracket = box(0.035, 0.64, W + 0.04, MAT.steel);
        bracket.name = 'bracket';
        place(bracket, X0, PLANE - 0.16, CZ);
        g.add(bracket);
        for (let i = 0; i < 3; i++) {
            const port = box(0.03, 0.10, 0.16, MAT.plastic);
            place(port, X0 - 0.025, PLANE - 0.18, CZ - 0.36 + i * 0.36);
            g.add(port);
        }
        // dedos de ouro entrando no slot PCIe (nivelados com a PCB)
        const fingers = box(0.87, 0.022, 0.0575, MAT.gold);
        fingers.name = 'fingers';
        place(fingers, 0, PLANE, Z0 - 0.02875);
        g.add(fingers);
        // conector de energia 8 pinos (em cima da placa, perto da frente)
        const power = box(0.24, 0.10, 0.20, MAT.plastic);
        place(power, X0 + L - 0.365, PLANE + 0.078, CZ + 0.3675);
        g.add(power);
        return g;
    }

    /*
     *  SSD M.2 NVMe — 80 x 22 x 4 mm (2280).
     *  Origem local na PONTA DO CONECTOR (a que entra no slot M.2).
     */
    function buildSsd() {
        const g = new T.Group();
        // PCB do módulo (80 x 22 mm)
        const pcb = box(0.80, 0.22, 0.02, MAT.pcb);
        place(pcb, 0.40, 0, 0);
        g.add(pcb);
        // conector (a ponta que encaixa no slot)
        const connector = box(0.07, 0.20, 0.022, MAT.plastic);
        place(connector, 0.035, 0, 0);
        g.add(connector);
        // notch do conector
        const notch = box(0.02, 0.04, 0.03, MAT.white);
        place(notch, 0.05, -0.07, 0);
        g.add(notch);
        // controlador
        const controller = box(0.15, 0.15, 0.025, MAT.plastic);
        place(controller, 0.16, 0, 0.012);
        g.add(controller);
        // chips de memória
        [0.30, 0.42].forEach((x) => {
            const dram = box(0.11, 0.13, 0.022, MAT.plastic);
            place(dram, x, 0, 0.011);
            g.add(dram);
        });
        // etiqueta
        const label = box(0.22, 0.13, 0.012, MAT.white);
        place(label, 0.63, 0, 0.014);
        g.add(label);
        // dissipador do próprio módulo (cobre controlador e chips)
        const sink = box(0.44, 0.21, 0.035, MAT.darkMetal);
        place(sink, 0.30, 0, 0.028);
        g.add(sink);
        for (let i = 0; i < 5; i++) {                 // aletas do dissipador
            const fin = box(0.40, 0.012, 0.02, MAT.alu);
            place(fin, 0.30, -0.08 + i * 0.04, 0.052);
            g.add(fin);
        }
        // parafuso de fixação
        const screw = cyl(0.035, 0.03, MAT.steel);
        screw.rotation.x = Math.PI / 2;
        place(screw, 0.775, 0, 0.015);
        g.add(screw);
        return g;
    }

    /*
     *  FONTE (PSU) — 150 x 86 x 140 mm (ATX).
     *  Origem local no CENTRO do corpo. Ventoinha de 140 mm para baixo,
     *  painel modular na frente, etiqueta e conector IEC atrás.
     */
    function buildPsu() {
        const g = new T.Group();
        const W = 1.50, H = 0.86, D = 1.40;

        // corpo de aço
        const body = box(W, H, D, MAT.darkMetal);
        g.add(body);
        // Grade de arame na face de baixo (ventoinha)
        // Tudo fica RECOLHIDO dentro da caixa: as pás da ventoinha são
        // inclinadas e passariam de fora se ficassem rentes à face.
        const grill = new T.Mesh(new T.TorusGeometry(0.60, 0.010, 6, 28), MAT.steel);
        grill.rotation.x = Math.PI / 2;
        place(grill, 0, -H / 2 + 0.012, 0);
        g.add(grill);
        for (let i = 0; i < 5; i++) {
            const ring = new T.Mesh(new T.TorusGeometry(0.12 + i * 0.12, 0.008, 6, 24), MAT.steel);
            ring.rotation.x = Math.PI / 2;
            place(ring, 0, -H / 2 + 0.012, 0);
            g.add(ring);
        }
        // ventoinha (sopra para baixo), recolhida dentro da caixa
        const fan = buildFan(0.62, { speed: 0.22, frameColor: 0x14181e });
        fan.rotation.x = -Math.PI / 2;
        place(fan, 0, -H / 2 + 0.12, 0);
        g.add(fan);
        // etiqueta na face superior
        const sticker = box(0.95, 0.012, 0.55, MAT.white);
        place(sticker, -0.10, H / 2 + 0.006, 0.15);
        g.add(sticker);
        const sticker2 = box(0.55, 0.012, 0.30, new T.MeshStandardMaterial({
            color: 0x1b2029, emissive: 0x00f0ff, emissiveIntensity: 0.25,
        }));
        place(sticker2, 0.35, H / 2 + 0.006, -0.25);
        g.add(sticker2);
        // painel modular (frente)
        const modular = box(0.80, 0.44, 0.04, MAT.steel);
        place(modular, 0.32, 0, D / 2 + 0.01);
        g.add(modular);
        [0, 1, 2].forEach((i) => {
            const socket = box(0.18, 0.13, 0.03, MAT.plastic);
            place(socket, 0.02 + i * 0.30, -0.10, D / 2 + 0.03);
            g.add(socket);
        });
        // conector IEC + chave (atrás)
        const iec = box(0.28, 0.20, 0.06, MAT.plastic);
        place(iec, -0.45, -0.12, -D / 2 - 0.02);
        g.add(iec);
        const sw = box(0.10, 0.14, 0.05, MAT.plasticLight);
        place(sw, -0.10, -0.12, -D / 2 - 0.02);
        g.add(sw);
        return g;
    }

    /*
     *  CABOS DE FORÇA — 24 pinos, 8 pinos (EPS) e PCIe.
     *  O grupo tem origem no ponto de convergência (o slot dos cabos).
     */
    function buildCables() {
        const g = new T.Group();
        const anchor = CFG.pieces.find((p) => p.id === 'cables').slot;

        function cable(points, color, radius, emissive) {
            const curve = new T.CatmullRomCurve3(points.map((p) =>
                new T.Vector3(p[0] - anchor.x, p[1] - anchor.y, p[2] - anchor.z)));
            const mesh = new T.Mesh(
                new T.TubeGeometry(curve, 44, radius, 8, false),
                mat(color, {
                    metalness: 0.15, roughness: 0.85,
                    emissive: emissive || 0x000000, emissiveIntensity: 0.35,
                })
            );
            mesh.userData.curve = curve;      // usado no teste de sobreposição
            g.add(mesh);
            return mesh;
        }

        // 24 pinos: modular da fonte (frente) → sobe pela lateral direita →
        // conector ATX da placa-mãe
        cable([
            [0.82, 0.40, -0.05], [0.90, 0.56, 0.30], [1.10, 1.30, 0.55],
            [1.40, 2.30, 0.30], [1.48, 3.20, -0.45], [1.32, 3.36, -1.00],
            [1.09, 3.225, -1.12],
        ], 0x14181e, 0.055, 0x00f0ff);

        // 8 pinos EPS: modular da fonte (frente) → sobe pela direita →
        // conector de 8 pinos no topo da placa-mãe
        cable([
            [0.52, 0.40, -0.05], [0.58, 0.60, 0.28], [0.72, 1.50, 0.45],
            [0.90, 2.80, 0.20], [1.10, 4.00, -0.55], [1.12, 4.32, -1.02],
            [0.99, 4.23, -1.12],
        ], 0x14181e, 0.042, 0x00ff66);

        // PCIe: modular da fonte (frente) → sobe pelo passa-cabo do shroud →
        // passa por cima da borda da placa → conector 8 pinos no TOPO da GPU
        cable([
            [0.22, 0.40, -0.05], [0.25, 0.56, 0.35], [0.52, 1.10, 0.55],
            [0.60, 1.90, 0.85], [0.70, 2.60, 0.90], [0.78, 3.05, 0.35],
            [0.72, 3.02, -0.18], [0.695, 2.876, -0.295],
        ], 0x14181e, 0.048, 0xff007f);

        return g;
    }

    const BUILDERS = {
        mobo: buildMobo,
        cpu: buildCpu,
        cooler: buildCooler,
        ram: buildRam,
        gpu: buildGpu,
        ssd: buildSsd,
        psu: buildPsu,
        cables: buildCables,
    };

    function createPiece(id) {
        const fn = BUILDERS[id];
        const group = fn ? fn() : box(0.4, 0.4, 0.4, 0x888888);
        group.userData.pieceId = id;
        group.traverse((child) => { child.userData.pieceId = id; });
        collectGlow(group);       // RGB/LEDs ficam apagados até ligar o PC
        return group;
    }

    function pieceConf(id) {
        return CFG.pieces.find((p) => p.id === id);
    }

    /* ------------------------------------------------------------- markers */

    function createMarkers() {
        markers.forEach((m) => { world.remove(m.mesh); world.remove(m.lines); });
        markers.clear();
        anchors.clear();

        CFG.pieces.forEach((conf) => {
            const group = meshes.get(conf.id);
            // caixa real da peça (o grupo já está posicionado no slot).
            // Malhas marcadas com userData.noMarker (cabos longos) ficam de
            // fora: senão o marcador viraria uma caixa gigante.
            group.updateMatrixWorld(true);
            const bbox = new T.Box3();
            group.traverse((m) => {
                if (!m.isMesh || !m.geometry || m.userData.noMarker) return;
                if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
                bbox.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
            });
            if (bbox.isEmpty()) bbox.setFromObject(group);
            const size = bbox.getSize(new T.Vector3());
            // centro da peça em espaço LOCAL (sem o deslocamento do slot)
            const localCenter = bbox.getCenter(new T.Vector3()).sub(group.position);

            // os cabos se espalham pelo gabinete inteiro: o marcador deles
            // fica no ponto de convergência, com uma caixa pequena
            const spread = conf.id === 'cables';
            const offset = spread ? new T.Vector3(0, 0, 0) : localCenter;
            anchors.set(conf.id, offset);

            const pad = 0.10;
            // tamanho mínimo: peças finas (SSD, cabos) viravam caixas quase
            // invisíveis — assim o local fica visível e tocável no celular
            const mx = spread ? 0.42 : Math.max(size.x + pad, 0.30);
            const my = spread ? 0.42 : Math.max(size.y + pad, 0.30);
            const mz = spread ? 0.42 : Math.max(size.z + pad, 0.30);
            const geo = new T.BoxGeometry(mx, my, mz);

            const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({
                color: 0x00f0ff, transparent: true, opacity: 0.07,
                depthWrite: false, side: T.DoubleSide,
            }));
            mesh.position.set(
                conf.slot.x + offset.x,
                conf.slot.y + offset.y,
                conf.slot.z + offset.z
            );

            const lines = new T.LineSegments(
                new T.EdgesGeometry(geo),
                new T.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45 })
            );
            lines.position.copy(mesh.position);

            markers.set(conf.id, { mesh, lines, size });
            world.add(mesh);
            world.add(lines);
        });
    }

    /** Centro real da peça (o marcador aponta para cá). */
    function pieceAnchor(id) {
        const conf = pieceConf(id);
        const off = anchors.get(id) || new T.Vector3();
        return new T.Vector3(conf.slot.x + off.x, conf.slot.y + off.y, conf.slot.z + off.z);
    }

    /**
     * Cor do marcador. Todos os locais livres usam a MESMA cor (ciano):
     * nada de destacar em verde o lugar exato de uma peça — quem mostra
     * o encaixe é a própria peça, que se acomoda no lugar.
     */
    function setMarker(id) {
        const m = markers.get(id);
        if (!m) return;
        m.mesh.material.color.setHex(0x00f0ff);
        m.lines.material.color.setHex(0x00f0ff);
        m.mesh.material.opacity = 0.06;
        m.lines.material.opacity = 0.34;
    }

    function refreshMarkers() {
        CFG.pieces.forEach((conf) => {
            const m = markers.get(conf.id);
            if (!m) return;
            // já instalada -> o local some
            if (state.installed.has(conf.id)) {
                m.mesh.visible = false;
                m.lines.visible = false;
                return;
            }
            // mostra TODO lugar livre (a ordem só é conferida no encaixe)
            m.mesh.visible = true;
            m.lines.visible = true;
            setMarker(conf.id);
        });
    }

    /* --------------------------------------------------------------- regras */

    function canInstall(id) {
        const conf = pieceConf(id);
        if (!conf) return { ok: false, reason: 'Peça desconhecida.' };
        if (state.installed.has(id)) return { ok: false, reason: 'Essa peça já está instalada.' };
        const missing = conf.requires.filter((r) => !state.installed.has(r));
        if (missing.length) {
            // mensagem específica do primeiro requisito que falta (quando existe)
            const porReq = (CFG.blockedBy || {})[id];
            let reason = null;
            if (porReq) {
                for (const r of missing) {
                    if (porReq[r]) { reason = porReq[r]; break; }
                }
            }
            return { ok: false, reason: reason || CFG.blocked[id] || 'Siga a ordem de montagem.', missing };
        }
        return { ok: true };
    }

    /* -------------------------------------------------------------- HUD */

    let listEl, progressEl, messageEl, winEl, timerEl;

    /**
     * A LISTA de peças aparece embaralhada (ordem aleatória a cada partida),
     * mas a ORDEM DE INSTALAÇÃO continua sendo a real — ela é garantida pelo
     * campo `requires` de cada peça (ver config.js), que bloqueia sequência
     * impossível (SSD antes da placa-mãe, GPU sem fonte, etc.).
     */
    function shuffledPieces() {
        const arr = CFG.pieces.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function buildHudList() {
        if (!listEl) return;
        listEl.innerHTML = '';
        shuffledPieces().forEach((conf, i) => {
            const li = document.createElement('li');
            li.className = 'build-item';
            li.dataset.piece = conf.id;
            li.innerHTML =
                '<span class="build-step" title="Etapa ' + conf.order + ' da montagem real">' + conf.order + '</span>' +
                (conf.image
                    ? '<img class="build-thumb" src="' + BUILDER_CONFIG.paths.images + conf.image + '" alt="" draggable="false">'
                    : '<span class="build-thumb build-thumb-icon"><i class="fa-solid ' + conf.icon + '" aria-hidden="true"></i></span>') +
                '<span class="build-info">' +
                    '<strong>' + conf.name + '</strong>' +
                    '<small>' + conf.where + '</small>' +
                '</span>' +
                '<i class="fa-solid ' + conf.icon + ' build-glyph" aria-hidden="true"></i>';

            li.tabIndex = 0;
            li.setAttribute('role', 'button');
            li.setAttribute('aria-label', 'Instalar ' + conf.name + ' em ' + conf.where);
            li.appendChild(makeDragHandle(conf));
            listEl.appendChild(li);
            listEl.style.setProperty('--rows', String(i + 1));
        });
        listEl.classList.add('ready');
    }

    // Botão "arrastar" (pointer events) — arrastar no desktop, tocar no mobile.
    // É um <span> decorativo: quem realmente ativa a peça é o <li role="button">
    // (um <button> aqui viraria controle interativo aninhado e inválido).
    function makeDragHandle(conf) {
        const handle = document.createElement('span');
        handle.className = 'build-grab';
        handle.dataset.grab = conf.id;
        handle.setAttribute('aria-hidden', 'true');
        handle.innerHTML = '<i class="fa-solid fa-up-down-left-right"></i>';
        return handle;
    }

    function updateHud() {
        const total = CFG.pieces.length;
        const done = state.installed.size;

        if (progressEl) {
            progressEl.style.width = Math.round((done / total) * 100) + '%';
            progressEl.parentElement.setAttribute('aria-valuenow', String(done));
        }
        const countEl = document.querySelector('[data-build-count]');
        if (countEl) countEl.textContent = done + ' / ' + total;

        document.querySelectorAll('.build-item').forEach((li) => {
            const id = li.dataset.piece;
            const done = state.installed.has(id);
            li.classList.toggle('done', done);
            li.classList.toggle('active', id === state.selected || id === state.dragging);
            li.setAttribute('aria-disabled', String(done));
        });
    }

    function say(text, kind) {
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.dataset.kind = kind || 'info';
    }

    /* ------------------------------------------------------------- timer */

    /** Tempo decorrido agora, sem depender do intervalo de 250 ms. */
    function currentElapsed() {
        if (!state.running) return state.elapsed;
        return performance.now() - state.startedAt;
    }

    function startTimer() {
        if (state.running || state.finished) return;
        state.running = true;
        state.startedAt = performance.now();
        state.timerId = setInterval(() => {
            state.elapsed = performance.now() - state.startedAt;
            if (timerEl) timerEl.textContent = Sound.formatTime(state.elapsed);
        }, 250);
    }

    function stopTimer() {
        if (state.running) state.elapsed = performance.now() - state.startedAt;
        state.running = false;
        if (state.timerId) clearInterval(state.timerId);
        state.timerId = null;
    }

    /* ------------------------------------------------------------- instalar */

    function animateTo(obj, target, dur) {
        tweens.push({
            obj,
            from: obj.position.clone(),
            to: new T.Vector3(target.x, target.y, target.z),
            t: 0,
            dur: dur || 260,
        });
    }

    function install(id) {
        state.moves++;                 // toda tentativa de instalar conta (uma vez)
        const check = canInstall(id);
        if (!check.ok) {
            Sound.play('error');
            say(check.reason, 'warn');
            const li = document.querySelector('.build-item[data-piece="' + id + '"]');
            if (li) {
                li.classList.add('shake');
                setTimeout(() => li.classList.remove('shake'), 400);
            }
            // devolve a peça para a lista: nada fica flutuando no slot
            hidePiece(id);
            if (state.dragging === id) state.dragging = null;
            if (state.selected === id) state.selected = null;
            updateHud();
            return false;
        }

        const conf = pieceConf(id);
        const group = holder.get(id);
        if (!group) return false;

        if (!group.parent) world.add(group);
        group.visible = true;

        // posiciona a peça (vinda do arrasto) no slot, com animação
        animateTo(group, conf.slot, 240);

        state.installed.add(id);
        state.dragging = null;
        state.selected = null;
        if (!state.running) startTimer();

        Sound.play('place');
        say(conf.name + ' instalada em ' + conf.where + '. ' + conf.because, 'ok');

        refreshMarkers();
        updateHud();

        if (state.installed.size === CFG.pieces.length) {
            // espera a última peça assentar no lugar (e o cabo terminar de
            // entrar) antes de convidar a ligar: o botão LIGAR só aparece
            // quando TUDO estiver pronto de verdade.
            setTimeout(function () {
                if (state.installed.size === CFG.pieces.length) finish();
            }, 320);
        }
        return true;
    }

    function finish() {
        state.finished = true;
        stopTimer();
        const elapsed = currentElapsed();     // tempo medido agora
        state.elapsed = elapsed;
        say('PC montado! Agora aperte LIGAR para ligar o computador.', 'ok');
        showPowerBtn(true);
    }

    /* ------------------------------------------------------------- ligar */

    /** O botão LIGAR só aparece quando o PC está completo. */
    function showPowerBtn(show) {
        const btn = document.getElementById('build-power');
        if (!btn) return;
        btn.hidden = !show;
        // a classe `hidden` é o que o CSS aplica de verdade (display:none)
        btn.classList.toggle('hidden', !show);
        btn.disabled = false;
        btn.classList.toggle('booting', false);
        const label = btn.querySelector('span');
        if (label) label.textContent = 'LIGAR O PC';
    }

    /**
     * Liga o PC: acende as luzes, faz as ventoinhas girarem e — depois do
     * "boot" — mostra o resumo da montagem.
     */
    function powerOn() {
        if (state.powered) return false;
        if (state.installed.size < CFG.pieces.length) {
            Sound.play('error');
            say('Faltam peças: monte o PC inteiro antes de ligar.', 'warn');
            return false;
        }

        state.powered = true;
        setPowered(true);
        Sound.play('power');
        say('Ligando o PC…', 'ok');

        const btn = document.getElementById('build-power');
        if (btn) {
            btn.disabled = true;
            btn.classList.add('booting');
            const label = btn.querySelector('span');
            if (label) label.textContent = 'LIGANDO…';
        }

        // o boot leva um instante — dá para ver as luzes acendendo
        const token = ++bootToken;
        setTimeout(() => {
            // recomeçou a partida durante o boot? então não mostra resumo nem
            // grava recorde de uma partida que não existe mais
            if (token !== bootToken) return;
            saveRecord();
            Sound.play('win');
            if (winEl) {
                winEl.querySelector('[data-build-time]').textContent = Sound.formatTime(state.elapsed);
                winEl.querySelector('[data-build-attempts]').textContent = String(state.moves);
                winEl.classList.remove('hidden');
                // acessibilidade: foco para dentro do diálogo
                const again = winEl.querySelector('[data-build-again]');
                if (again) again.focus();
            }
            say('PC ligado! Montagem concluída, na ordem certa.', 'ok');
        }, 2600);

        return true;
    }

    /** Recorde só vale se tiver os campos numéricos que o jogo usa. */
    function validRecord(rec) {
        if (!rec || typeof rec !== 'object') return null;
        const attempts = Number(rec.attempts);
        const time = Number(rec.time);
        if (!isFinite(attempts) || attempts < 0) return null;
        if (!isFinite(time) || time < 0) return null;
        return { attempts: attempts, time: time };
    }

    function readRecord() {
        try {
            const all = JSON.parse(localStorage.getItem(CFG.storageKey) || '{}') || {};
            return validRecord(all.best);
        } catch (_) { return null; }
    }

    /** Grava o recorde — só chamar quando a partida realmente terminou. */
    function saveRecord() {
        const prev = readRecord();
        const elapsed = currentElapsed();
        const better = !prev ||
            state.moves < prev.attempts ||
            (state.moves === prev.attempts && elapsed < prev.time);
        if (better) {
            try {
                const all = JSON.parse(localStorage.getItem(CFG.storageKey) || '{}') || {};
                all.best = { attempts: state.moves, time: Math.round(elapsed) };
                localStorage.setItem(CFG.storageKey, JSON.stringify(all));
            } catch (_) {}
        }
        paintBest();
    }

    /** Só LEITURA do recorde — nunca grava (evita salvar um 0/0 falso no load). */
    function paintBest() {
        const rec = readRecord();
        const recEl = document.querySelector('[data-build-best]');
        if (recEl) {
            recEl.textContent = rec
                ? Sound.formatTime(rec.time) + ' · ' + rec.attempts + ' tent.'
                : '—';
        }
    }

    /* ------------------------------------------------------------ arrastar */

    // Profundidade (z local) em que a peça é carregada enquanto é arrastada.
    // Fica à frente do gabinete (frente em z = case.d/2 = 1.6) para a peça
    // nunca ficar escondida por dentro do gabinete.
    const DRAG_Z = 1.95;

    /** Recalcula o plano de carga (acompanha a rotação do gabinete). */
    function updateDragPlane() {
        if (!world) return;
        world.updateMatrixWorld();
        const n = new T.Vector3(0, 0, 1).applyQuaternion(world.quaternion);
        const p = new T.Vector3(0, 0, DRAG_Z).applyMatrix4(world.matrixWorld);
        dragPlane.setFromNormalAndCoplanarPoint(n, p);
    }

    function beginDrag(id, clientX, clientY) {
        if (state.installed.has(id)) return;
        const group = holder.get(id);
        if (!group) return;
        if (!group.parent) world.add(group);
        group.visible = true;
        state.dragging = id;
        state.selected = null;
        refreshMarkers();
        updateHud();
        // já coloca a peça exatamente sob o cursor (evita o "salto" do slot)
        if (typeof clientX === 'number') moveDrag(clientX, clientY);
    }

    function moveDrag(clientX, clientY) {
        if (!state.dragging) return;
        const group = holder.get(state.dragging);
        if (!group) return;

        const rect = canvasEl.getBoundingClientRect();
        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        updateDragPlane();
        raycaster.setFromCamera(ndc, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
        world.worldToLocal(dragPoint);
        // a peça fica sobre o raio da câmera -> aparece exatamente sob o cursor
        group.position.set(dragPoint.x, dragPoint.y, DRAG_Z);

        // ímã: perto do local correto a peça se acomoda (encaixa) de vez,
        // sem precisar mostrar nada em destaque.
        const conf = pieceConf(state.dragging);
        const target = slotScreenPos(state.dragging);
        if (conf && target) {
            const dist = Math.hypot(clientX - target.x, clientY - target.y);
            if (dist <= dropLimitPx(state.dragging)) {
                group.position.set(conf.slot.x, conf.slot.y, conf.slot.z);
            }
        }
    }

    /** Posição do marcador (slot) na tela, em pixels do viewport. */
    function slotScreenPos(id) {
        const conf = pieceConf(id);
        if (!conf || !canvasEl) return null;
        const rect = canvasEl.getBoundingClientRect();
        world.updateMatrixWorld();
        // o marcador fica no CENTRO da peça (âncora), não na origem do grupo
        const v = pieceAnchor(id);
        world.localToWorld(v);
        v.project(camera);
        return {
            x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
            y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
        };
    }

    /**
     * Tolerância de soltar, em pixels de tela. É medida na TELA (e não em 3D)
     * porque a peça é arrastada num plano à frente do gabinete: em 3D a
     * paralaxe faria o drop errar em ~1,5 unidade mesmo com o cursor em cima
     * do marcador. No mínimo 44 px para o toque no celular ser fácil.
     */
    function dropLimitPx(id) {
        return Math.max(44, markerRadiusPx(id) * 1.6);
    }

    /** Tolerância do toque no marcador (celular): menor que a do arrasto. */
    function tapLimitPx(id) {
        return Math.max(26, markerRadiusPx(id) * 1.2);
    }

    /** Raio na tela (px) do marcador da peça. */
    function markerRadiusPx(id) {
        const conf = pieceConf(id);
        const m = markers.get(id);
        if (!conf || !m || !canvasEl) return 30;
        const rect = canvasEl.getBoundingClientRect();
        world.updateMatrixWorld();
        const anchor = pieceAnchor(id);
        const a = anchor.clone();
        world.localToWorld(a);
        a.project(camera);
        const half = (m.size.x + 0.1) / 2;
        const b = anchor.clone();
        b.x += half;
        world.localToWorld(b);
        b.project(camera);
        return Math.abs(b.x - a.x) * 0.5 * rect.width;
    }

    function endDrag(clientX, clientY) {
        const id = state.dragging;
        if (!id) return;
        const conf = pieceConf(id);
        const group = holder.get(id);
        const rect = canvasEl.getBoundingClientRect();
        const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;

        const target = slotScreenPos(id);
        const distPx = target ? Math.hypot(clientX - target.x, clientY - target.y) : Infinity;

        if (inside && distPx <= dropLimitPx(id)) {
            const placed = install(id);   // install() já conta a tentativa
            // instalação recusada (fora de ordem): a peça volta para a lista
            if (!placed) hidePiece(id);
        } else {
            state.moves++;              // drop no lugar errado também é tentativa
            Sound.play('error');
            say('Solte a peça sobre o local indicado para ' + conf.name + '.', 'warn');
            hidePiece(id);
        }
        state.dragging = null;
        refreshMarkers();
        updateHud();
    }

    function hidePiece(id) {
        const group = holder.get(id);
        if (!group || state.installed.has(id)) return;
        if (group.parent) world.remove(group);
        group.visible = false;
    }

    function selectPiece(id) {
        if (state.installed.has(id)) return;
        const conf = pieceConf(id);
        if (!conf) return;
        state.selected = state.selected === id ? null : id;
        Sound.play('click');
        refreshMarkers();
        updateHud();
        if (state.selected) {
            // mensagem neutra: a ordem só é conferida quando a peça é encaixada
            say('Peça selecionada. Ao encaixar, o jogo confere a ordem de montagem.', 'info');
        } else {
            say('Seleção cancelada. A peça continua disponível na lista.', 'info');
        }
    }

    /* --------------------------------------------------------------- eventos */

    function bindEvents() {
        let dragStart = null;

        // 1) Arrastar a partir do botão "grab" do item (funciona com mouse e toque)
        if (listEl) {
            listEl.addEventListener('pointerdown', (ev) => {
                const grab = ev.target.closest('[data-grab]');
                if (!grab) return;
                const id = grab.dataset.grab;
                if (state.installed.has(id)) return;
                dragStart = { id, x: ev.clientX, y: ev.clientY, moved: false };
                grab.setPointerCapture && grab.setPointerCapture(ev.pointerId);
                ev.preventDefault();
            });

            window.addEventListener('pointermove', (ev) => {
                if (!dragStart) return;
                const dist = Math.hypot(ev.clientX - dragStart.x, ev.clientY - dragStart.y);
                if (!dragStart.moved && dist > 6) {
                    dragStart.moved = true;
                    beginDrag(dragStart.id, ev.clientX, ev.clientY);
                }
                if (dragStart.moved) moveDrag(ev.clientX, ev.clientY);
            }, { passive: true });

            window.addEventListener('pointerup', (ev) => {
                if (!dragStart) return;
                const info = dragStart;
                dragStart = null;
                if (info.moved && state.dragging) endDrag(ev.clientX, ev.clientY);
                else if (!info.moved) selectPiece(info.id);
            });
            window.addEventListener('pointercancel', () => {
                if (dragStart && dragStart.moved) endDrag(-1, -1);
                dragStart = null;
            });
        }

        // 2) Clique no item da lista = selecionar / instalar direto se já selecionado
        if (listEl) {
            listEl.addEventListener('click', (ev) => {
                const li = ev.target.closest('.build-item');
                if (!li || ev.target.closest('[data-grab]')) return;
                selectPiece(li.dataset.piece);
            });
            listEl.addEventListener('keydown', (ev) => {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                const li = ev.target.closest('.build-item');
                if (!li) return;
                ev.preventDefault();
                selectPiece(li.dataset.piece);
            });
        }

        // 3) Clique/toque no canvas: instalar a peça selecionada no slot destacado
        if (canvasEl) {
            // 3a) ARRASTAR no canvas = girar o gabinete em 360° (mouse e toque)
            canvasEl.addEventListener('pointerdown', (ev) => {
                if (ev.button !== undefined && ev.button !== 0) return;
                orbit = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, moved: false };
                suppressClickUntil = 0;
                if (canvasEl.setPointerCapture) {
                    try { canvasEl.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
                }
            });

            window.addEventListener('pointermove', (ev) => {
                if (!orbit || ev.pointerId !== orbit.id) return;
                const dx = ev.clientX - orbit.x;
                const dy = ev.clientY - orbit.y;
                if (!orbit.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
                orbit.moved = true;
                orbit.x = ev.clientX;
                orbit.y = ev.clientY;
                // gira livremente (360°) — a altura da câmera acompanha o arrasto
                yawTarget -= dx * 0.012;
                updateDragPlane();
            }, { passive: true });

            window.addEventListener('pointerup', (ev) => {
                if (!orbit || ev.pointerId !== orbit.id) return;
                // se foi arrasto (giro), o click gerado por ESSE gesto não instala
                // (a marca expira sozinha, para não engolir um toque futuro)
                if (orbit.moved) suppressClickUntil = performance.now() + 400;
                orbit = null;
            });
            window.addEventListener('pointercancel', () => { orbit = null; });

            // 3b) roda do mouse = zoom
            canvasEl.addEventListener('wheel', (ev) => {
                ev.preventDefault();
                state.zoom = Math.min(1.7, Math.max(0.55, state.zoom * (1 + ev.deltaY * 0.001)));
                resize();
            }, { passive: false });

            canvasEl.addEventListener('click', (ev) => {
                if (performance.now() < suppressClickUntil) { suppressClickUntil = 0; return; }
                if (!state.selected) return;
                const id = state.selected;
                const conf = pieceConf(id);
                const marker = markers.get(id);
                if (!marker) return;

                // (a) acerto exato na caixa 3D do marcador
                const rect = canvasEl.getBoundingClientRect();
                ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
                ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(ndc, camera);
                const hitByMesh = raycaster.intersectObject(marker.mesh, false).length > 0;

                // (b) tolerância em tela: no celular as peças finas (SSD, cabos)
                //     viram caixas quase invisíveis — tocar perto do centro vale
                const target = slotScreenPos(id);
                const near = target
                    ? Math.hypot(ev.clientX - target.x, ev.clientY - target.y) <= tapLimitPx(id)
                    : false;

                if (hitByMesh || near) {
                    install(id);
                } else {
                    Sound.play('error');
                    say('Toque no local disponível (contorno ciano) para instalar a ' + conf.name + '.', 'warn');
                }
            });
        }

        // 4) Redimensionamento
        window.addEventListener('resize', resize);
        if (window.ResizeObserver && container) {
            new ResizeObserver(() => resize()).observe(container);
        }
    }

    /* -------------------------------------------------------------- cena */

    function buildScene() {
        const rect = container.getBoundingClientRect();
        scene = new T.Scene();

        camera = new T.PerspectiveCamera(CFG.camera.fov, rect.width / Math.max(1, rect.height), 0.1, 200);
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(rect.width, rect.height, false);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        // sombras + mapeamento de tom (realismo de iluminação)
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;
        if (T.ACESFilmicToneMapping) {
            renderer.toneMapping = T.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;
        }
        if ('outputColorSpace' in renderer && T.SRGBColorSpace) {
            renderer.outputColorSpace = T.SRGBColorSpace;
        } else if ('outputEncoding' in renderer && T.sRGBEncoding) {
            renderer.outputEncoding = T.sRGBEncoding;
        }
        container.appendChild(renderer.domElement);
        canvasEl = renderer.domElement;

        world = new T.Group();
        scene.add(world);

        raycaster = new T.Raycaster();
        ndc = new T.Vector2();
        dragPoint = new T.Vector3();
        tmpVec = new T.Vector3();
        // plano de carga: paralelo à placa-mãe, um pouco à frente dela (em espaço local)
        dragPlane = new T.Plane(new T.Vector3(0, 0, 1), -1.15);

        buildMaterials();
        buildLights();
        buildCase();
        buildFloor();

        // cria todas as peças (escondidas) e seus marcadores
        CFG.pieces.forEach((conf) => {
            const group = createPiece(conf.id);
            group.position.set(conf.slot.x, conf.slot.y, conf.slot.z);
            group.visible = false;
            // a peça NÃO pode ter pai aqui: beginDrag()/install() a colocam em
            // `world` quando precisam. Com um grupo intermediário órfão a peça
            // ficava invisível na cena (nunca era renderizada).
            holder.set(conf.id, group);
            meshes.set(conf.id, group);
        });

        createMarkers();
        refreshMarkers();
        resize();
        animate();
    }

    function resize() {
        if (!renderer || !container) return;
        const rect = container.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        // se o painel está oculto, não há o que redimensionar ainda
        if (rect.width < 2 || rect.height < 2) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;

        const aspect = w / h;
        const zoom = aspect < 1 ? 1.0 + (1 - aspect) * 0.85 : 1;
        const cfg = CFG.camera;
        const dir = new T.Vector3(cfg.dir[0], cfg.dir[1], cfg.dir[2]).normalize();
        const dist = cfg.distance * zoom * (state.zoom || 1);
        camera.position.copy(dir.multiplyScalar(dist));
        camera.lookAt(0, cfg.targetY, 0);
        camera.updateProjectionMatrix();

        // atualiza o plano de arrasto conforme a rotação atual
        updateDragPlane();
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!renderer) return;

        // rotação suave do gabinete
        world.rotation.y += (yawTarget - world.rotation.y) * 0.08;
        // ventoinhas: só giram depois que o PC é LIGADO
        if (state.powered) {
            for (let i = 0; i < spinners.length; i++) {
                const s = spinners[i];
                if (s.obj) s.obj.rotation[s.axis] += s.speed * 2.6;
            }
        }

        // tweens
        for (let i = tweens.length - 1; i >= 0; i--) {
            const tw = tweens[i];
            tw.t += 16;
            const k = Math.min(1, tw.t / tw.dur);
            const e = 1 - Math.pow(1 - k, 3);
            tw.obj.position.lerpVectors(tw.from, tw.to, e);
            if (k >= 1) tweens.splice(i, 1);
        }

        // o plano de arrasto acompanha o giro do gabinete
        updateDragPlane();

        renderer.render(scene, camera);
    }

    /* --------------------------------------------------------------- API */

    function reset() {
        const veioDoOverlay = !!(winEl && !winEl.classList.contains('hidden'));
        tweens.length = 0;
        bootToken++;              // cancela um boot em andamento (resumo/recorde)
        state.installed.clear();
        state.dragging = null;
        state.selected = null;
        state.moves = 0;
        state.finished = false;
        state.powered = false;
        state.elapsed = 0;
        setPowered(false);         // apaga as luzes e para as ventoinhas
        showPowerBtn(false);
        buildHudList();          // nova partida = nova ordem aleatória na lista
        stopTimer();
        if (timerEl) timerEl.textContent = '00:00';
        if (winEl) winEl.classList.add('hidden');

        holder.forEach((group, id) => {
            if (group.parent) world.remove(group);
            const conf = pieceConf(id);
            group.position.set(conf.slot.x, conf.slot.y, conf.slot.z);
            group.visible = false;
        });
        refreshMarkers();
        updateHud();
        say('Arraste (ou toque) uma peça da lista para o local livre. A lista está embaralhada, mas a montagem segue a ordem real.', 'info');

        // acessibilidade: quem reiniciou a partir do diálogo volta a ter foco
        // útil em vez de um elemento que acabou de ficar invisível
        if (veioDoOverlay && listEl) {
            const primeira = listEl.querySelector('.build-item[aria-disabled="false"]');
            if (primeira) primeira.focus();
        }
    }

    function rotate() {
        // gira 45° por vez (o giro livre em 360° é pelo arrasto no canvas)
        yawTarget -= Math.PI / 4;
        // após girar, o plano de arrasto é recalculado no próximo frame
        setTimeout(resize, 30);
    }

    function init() {
        container = document.getElementById('build-canvas');
        listEl = document.getElementById('build-list');
        progressEl = document.getElementById('build-progress');
        messageEl = document.getElementById('build-message');
        winEl = document.getElementById('build-win');
        timerEl = document.querySelector('[data-build-time]');

        const practices = document.getElementById('build-practices');
        if (practices) {
            practices.innerHTML = CFG.bestPractices.map((p) => '<li>' + p + '</li>').join('');
        }

        if (!window.THREE) {
            const fb = document.getElementById('build-fallback');
            if (fb) fb.classList.remove('hidden');
            if (container) container.classList.add('hidden');
            buildHudList();
            updateHud();
            say('Não foi possível carregar a engine 3D. Verifique sua conexão e recarregue a página.', 'warn');
            return false;
        }

        try {
            buildScene();
        } catch (err) {
            const fb = document.getElementById('build-fallback');
            if (fb) { fb.classList.remove('hidden'); fb.querySelector('p').textContent = 'Erro ao iniciar o 3D: ' + err.message; }
            return false;
        }

        // marcadores MAT (apenas para referência de debug)
        MAT = {};

        bindEvents();
        reset();                 // reset() monta a lista (já embaralhada)
        paintBest();
        ready = true;
        return true;
    }

    // API exposta para testes e integrações
    window.PCMBuilder = {
        init, reset, install, rotate, powerOn,
        selectPiece,
        // posição do marcador na tela (px) — usado pelos testes de arrasto
        getSlotScreenPos: (id) => slotScreenPos(id),
        getSlotDropLimit: (id) => dropLimitPx(id),
        getState: () => ({
            ready,
            installed: Array.from(state.installed),
            total: CFG.pieces.length,
            selected: state.selected,
            dragging: state.dragging,
            finished: state.finished,
            powered: state.powered,
            elapsed: currentElapsed(),
            moves: state.moves,
        }),
        // diagnóstico: caixa delimitadora de uma peça (local e mundo)
        getPieceBox: (id) => {
            const g = holder.get(id);
            if (!g) return null;
            g.updateMatrixWorld(true);
            const wb = new T.Box3().setFromObject(g);
            const inv = new T.Matrix4().copy(g.matrixWorld).invert();
            const lb = wb.clone().applyMatrix4(inv);
            const r3 = (v) => Math.round(v * 1000) / 1000;
            return {
                pos: g.position.toArray().map(r3),
                localMin: lb.min.toArray().map(r3),
                localMax: lb.max.toArray().map(r3),
                worldMin: wb.min.toArray().map(r3),
                worldMax: wb.max.toArray().map(r3),
            };
        },
        // diagnóstico: as ventoinhas estão girando? (só depois do LIGAR)
        getSpinInfo: () => spinners.map((s) => ({
            eixo: s.axis,
            rot: s.obj ? +s.obj.rotation[s.axis].toFixed(4) : 0,
        })),
        // diagnóstico: as luzes do PC estão acesas?
        getGlowInfo: () => ({
            powered: state.powered,
            acesas: glowList.filter((g) => g.mat.emissiveIntensity > 0).length,
            total: glowList.length,
        }),
        // diagnóstico: cor e visibilidade de cada marcador de local
        getMarkerColors: () => {
            const out = {};
            markers.forEach((m, id) => {
                out[id] = {
                    cor: m.mesh.material.color.getHexString(),
                    visivel: m.mesh.visible,
                    opacity: m.mesh.material.opacity,
                };
            });
            return out;
        },
        // diagnóstico: cada malha da peça, com a caixa no mundo
        getPieceMeshes: (id) => {
            const g = holder.get(id);
            if (!g) return null;
            g.updateMatrixWorld(true);
            const out = [];
            const r3 = (v) => Math.round(v * 1000) / 1000;
            g.traverse((m) => {
                if (!m.isMesh) return;
                const b = new T.Box3().setFromObject(m);
                out.push({
                    nome: m.name || '',
                    min: b.min.toArray().map(r3),
                    max: b.max.toArray().map(r3),
                    // fios finos (tubos) são medidos pela curva, não pela caixa
                    fio: !!(m.userData && m.userData.curve),
                });
                // cabos: expõe os pontos da curva (o bbox do tubo é enorme
                // e não serve para testar sobreposição)
                if (m.userData && m.userData.curve) {
                    const pts = m.userData.curve.getPoints(24).map((p) => {
                        const w = g.localToWorld(p.clone());
                        return w.toArray().map(r3);
                    });
                    out.push({ curve: true, min: null, max: null, pontos: pts });
                }
            });
            return out;
        },
        // diagnóstico: quantos objetos a cena tem e se o gabinete está no mundo
        getSceneInfo: () => {
            if (!world) return null;
            let objects = 0;
            world.traverse(() => { objects++; });
            const visiblePieces = CFG.pieces.filter((p) => {
                const g = holder.get(p.id);
                return g && g.parent === world && g.visible;
            }).map((p) => p.id);
            return {
                objects,
                children: world.children.length,
                visiblePieces,
                markers: markers.size,
                visibleMarkers: Array.from(markers.entries()).filter(([, m]) => m.mesh.visible).map(([k]) => k),
                canvas: canvasEl ? { w: canvasEl.width, h: canvasEl.height } : null,
            };
        },
        // diagnóstico: o gabinete está aberto no lado da câmera?
        // (não pode existir chapa/vidro fechando a lateral de +X)
        getCaseInfo: () => {
            if (!caseGroup || !world) return null;
            const panels = [];
            caseGroup.children.forEach((c) => {
                const b = new T.Box3().setFromObject(c);
                const s = b.getSize(new T.Vector3());
                const r3 = (v) => Math.round(v * 100) / 100;
                // chapa grande: cobre altura e profundidade do gabinete
                if (s.y > 2.5 && s.z > 1.6) {
                    panels.push({
                        min: [r3(b.min.x), r3(b.min.y), r3(b.min.z)],
                        size: [r3(s.x), r3(s.y), r3(s.z)],
                    });
                }
            });
            return { panels, yaw: Math.round(world.rotation.y * 1000) / 1000 };
        },
    };

    return window.PCMBuilder;
})();
