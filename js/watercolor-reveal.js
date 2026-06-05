const IMAGE_SRC = 'assets/img/IMG_BACKGROUND.JPG';
const BG_COLOR = [0.047, 0.047, 0.047];

const CONFIG = {
    maskScale: 0.5,
    brushSizeBase: 0.0001, // Pratiquement 0 au repos pour éviter les grosses taches
    brushSizeMax: 0.9,     // Très large en mouvement
    softness: 1.0,
    persistence: 0.991,
    displacementBase: 0.0001, // Idem pour la distorsion
    displacementMax: 0.18  // Distorsion très forte
};

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p){
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}
float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        v += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return v;
}`;

const FRAG_MASK = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uPrevMouse;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uBrush;
uniform float uSoftness;
uniform float uPersistence;
uniform float uTime;
uniform float uActive;
${NOISE}

float sdSegment(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    float prev = max(texture2D(uPrev, vUv).r * uPersistence - 0.004, 0.0);

    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    vec2 a = vec2(uPrevMouse.x * uAspect, uPrevMouse.y);
    vec2 b = vec2(uMouse.x * uAspect, uMouse.y);

    float dist = sdSegment(p, a, b);

    float edge = fbm(vUv * 6.0 + uTime * 0.15) * 0.06;
    float inner = max(uBrush * (1.0 - uSoftness), 0.0);
    float brush = smoothstep(uBrush, inner, dist + edge);

    float grain = 0.75 + 0.25 * fbm(vUv * 14.0 + uTime * 0.3);
    brush *= grain * uActive;

    float v = max(prev, brush);
    gl_FragColor = vec4(v, 0.0, 0.0, 1.0);
}`;

const FRAG_RENDER = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uCover;
uniform vec3 uBg;
uniform float uDisplacement;
uniform float uTime;
uniform vec2 uResolution;
${NOISE}

float paper(vec2 uv) {
    float coarse = fbm(uv * 38.0);
    float fibers = fbm(uv * vec2(170.0, 48.0));
    fibers = mix(fibers, fbm(uv * vec2(48.0, 170.0)), 0.5);
    float grain = fbm(uv * 115.0);
    float p = mix(mix(coarse, fibers, 0.6), grain, 0.45);
    return clamp((p - 0.5) * 1.5 + 0.5, 0.0, 1.0);
}

void main() {
    float mask = texture2D(uMask, vUv).r;

    vec2 pUv = vUv * vec2(uResolution.x / uResolution.y, 1.0);
    float pap = paper(pUv);

    vec2 flow = vec2(
        fbm(vUv * 4.0 + uTime * 0.1),
        fbm(vUv * 4.0 - uTime * 0.1 + 5.2)
    ) - 0.5;
    vec2 uv = (vUv - 0.5) * uCover + 0.5 + flow * uDisplacement * mask;

    vec3 img = texture2D(uImage, uv).rgb;

    float reveal = smoothstep(0.02, 0.55, mask - pap * 0.5 * (1.0 - mask * 0.4));
    reveal = clamp(reveal, 0.0, 1.0);

    float tint = 0.72 + 0.5 * pap;
    
    // Filtre d'assombrissement global pour l'image révélée (0.45 = 55% plus sombre)
    img *= tint * 0.45;

    float rim = smoothstep(0.0, 0.25, mask) * (1.0 - smoothstep(0.25, 0.7, mask));
    vec3 col = mix(uBg, img, reveal);
    col += rim * 0.04;

    gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(sh));
    }
    return sh;
}

function program(gl, vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(p));
    }
    return p;
}

function createTarget(gl, w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
}

export function initWatercolorReveal() {
    if (window.__watercolorReady) return;

    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'watercolor-canvas';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-2;pointer-events:none;';
    document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    if (!gl) {
        canvas.remove();
        return;
    }
    window.__watercolorReady = true;

    const maskProg = program(gl, VERT, FRAG_MASK);
    const renderProg = program(gl, VERT, FRAG_RENDER);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const mU = {
        uPrev: gl.getUniformLocation(maskProg, 'uPrev'),
        uPrevMouse: gl.getUniformLocation(maskProg, 'uPrevMouse'),
        uMouse: gl.getUniformLocation(maskProg, 'uMouse'),
        uAspect: gl.getUniformLocation(maskProg, 'uAspect'),
        uBrush: gl.getUniformLocation(maskProg, 'uBrush'),
        uSoftness: gl.getUniformLocation(maskProg, 'uSoftness'),
        uPersistence: gl.getUniformLocation(maskProg, 'uPersistence'),
        uTime: gl.getUniformLocation(maskProg, 'uTime'),
        uActive: gl.getUniformLocation(maskProg, 'uActive')
    };
    const rU = {
        uImage: gl.getUniformLocation(renderProg, 'uImage'),
        uMask: gl.getUniformLocation(renderProg, 'uMask'),
        uCover: gl.getUniformLocation(renderProg, 'uCover'),
        uBg: gl.getUniformLocation(renderProg, 'uBg'),
        uDisplacement: gl.getUniformLocation(renderProg, 'uDisplacement'),
        uTime: gl.getUniformLocation(renderProg, 'uTime'),
        uResolution: gl.getUniformLocation(renderProg, 'uResolution')
    };

    const imgTex = gl.createTexture();
    let imgAspect = 1;
    let imageLoaded = false;
    const image = new Image();
    image.onload = () => {
        imgAspect = image.naturalWidth / image.naturalHeight;
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        imageLoaded = true;
    };
    image.src = IMAGE_SRC;

    let targets = [];
    let dpr = 1;

    function cover() {
        const screenAspect = canvas.width / canvas.height;
        if (screenAspect > imgAspect) {
            return [1, imgAspect / screenAspect];
        }
        return [screenAspect / imgAspect, 1];
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);

        const mw = Math.max(2, Math.floor(canvas.width * CONFIG.maskScale));
        const mh = Math.max(2, Math.floor(canvas.height * CONFIG.maskScale));
        targets.forEach((t) => {
            gl.deleteTexture(t.tex);
            gl.deleteFramebuffer(t.fbo);
        });
        targets = [createTarget(gl, mw, mh), createTarget(gl, mw, mh)];
    }
    resize();
    window.addEventListener('resize', resize);

    const targetMouse = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    const prevMouse = { x: 0.5, y: 0.5 };
    let activeTarget = 0.0;
    let moved = false;

    window.addEventListener('pointermove', (e) => {
        targetMouse.x = e.clientX / window.innerWidth;
        targetMouse.y = 1.0 - e.clientY / window.innerHeight;
        if (!moved) {
            mouse.x = targetMouse.x;
            mouse.y = targetMouse.y;
            prevMouse.x = mouse.x;
            prevMouse.y = mouse.y;
            moved = true;
        }
        activeTarget = 1.0;
    });
    window.addEventListener('pointerleave', () => { activeTarget = 0.0; });

    let read = 0;
    let write = 1;
    const start = performance.now();
    let currentVelocity = 0.0; // Poursuit la vélocité avec un lissage

    function frame() {
        const time = (performance.now() - start) * 0.001;
        const gate = window.preloaderFinished ? 1.0 : 0.0;
        const active = activeTarget * gate;

        // Interpolation douce de la position de la souris (Lerp)
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;
        mouse.x += (targetMouse.x - mouse.x) * 0.12; 
        mouse.y += (targetMouse.y - mouse.y) * 0.12;

        // Calcul de la vélocité lissée
        const dx = mouse.x - prevMouse.x;
        const dy = mouse.y - prevMouse.y;
        const targetVel = Math.min(Math.sqrt(dx * dx + dy * dy) * 45.0, 1.0);
        currentVelocity += (targetVel - currentVelocity) * 0.1;
        
        const dynamicBrush = CONFIG.brushSizeBase + currentVelocity * (CONFIG.brushSizeMax - CONFIG.brushSizeBase);
        const dynamicDisplacement = CONFIG.displacementBase + currentVelocity * (CONFIG.displacementMax - CONFIG.displacementBase);

        const src = targets[read];
        const dst = targets[write];
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.viewport(0, 0, dst.w, dst.h);
        gl.useProgram(maskProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(mU.uPrev, 0);
        gl.uniform2f(mU.uPrevMouse, prevMouse.x, prevMouse.y);
        gl.uniform2f(mU.uMouse, mouse.x, mouse.y);
        gl.uniform1f(mU.uAspect, canvas.width / canvas.height);
        gl.uniform1f(mU.uBrush, dynamicBrush);
        gl.uniform1f(mU.uSoftness, CONFIG.softness);
        gl.uniform1f(mU.uPersistence, CONFIG.persistence);
        gl.uniform1f(mU.uTime, time);
        gl.uniform1f(mU.uActive, active);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        activeTarget *= 0.9;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(renderProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageLoaded ? imgTex : dst.tex);
        gl.uniform1i(rU.uImage, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dst.tex);
        gl.uniform1i(rU.uMask, 1);
        const c = cover();
        gl.uniform2f(rU.uCover, c[0], c[1]);
        gl.uniform3f(rU.uBg, BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);
        gl.uniform1f(rU.uDisplacement, imageLoaded ? dynamicDisplacement : 0.0);
        gl.uniform1f(rU.uTime, time);
        gl.uniform2f(rU.uResolution, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        read = write;
        write = 1 - write;

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}
