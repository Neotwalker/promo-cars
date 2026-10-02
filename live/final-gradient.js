(() => {
  const section = document.querySelector('[data-final-gradient-section], #final-calculation');
  const canvas = section?.querySelector('[data-final-gradient]');
  const wrap = section?.querySelector('[data-final-gradient-wrap]');
  if (!section || !canvas || !wrap) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl',{
    alpha:false,
    antialias:true,
    depth:false,
    stencil:false,
    powerPreference:'low-power'
  });

  if (!gl) return;

  const vertexSource = `
    precision highp float;

    attribute float a_positionX;
    attribute vec2 a_uvNorm;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_amplitude;
    uniform vec3 u_baseColor;
    uniform vec3 u_layerColor1;
    uniform vec3 u_layerColor2;
    uniform vec3 u_layerColor3;
    uniform vec3 u_layerColor4;

    varying vec3 v_color;

    // 3D simplex noise by Ian McEwan / Ashima Arts (MIT).
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x * 34.0) + 1.0) * x);
    }

    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0,1.0 / 3.0);
      const vec4 D = vec4(0.0,0.5,1.0,2.0);

      vec3 i = floor(v + dot(v,C.yyy));
      vec3 x0 = v - i + dot(i,C.xxx);

      vec3 g = step(x0.yzx,x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz,l.zxy);
      vec3 i2 = max(g.xyz,l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0,i1.z,i2.z,1.0))
        + i.y + vec4(0.0,i1.y,i2.y,1.0))
        + i.x + vec4(0.0,i1.x,i2.x,1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy,y.xy);
      vec4 b1 = vec4(x.zw,y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h,vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(
        dot(p0,p0),
        dot(p1,p1),
        dot(p2,p2),
        dot(p3,p3)
      ));

      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(
        0.6 - vec4(
          dot(x0,x0),
          dot(x1,x1),
          dot(x2,x2),
          dot(x3,x3)
        ),
        0.0
      );

      m *= m;

      return 42.0 * dot(
        m * m,
        vec4(
          dot(p0,x0),
          dot(p1,x1),
          dot(p2,x2),
          dot(p3,x3)
        )
      );
    }

    float waveLayer(
      vec2 noiseCoord,
      float time,
      vec2 frequency,
      float flow,
      float speed,
      float seed,
      float floorValue,
      float ceilValue
    ) {
      float value = snoise(vec3(
        noiseCoord.x * frequency.x + time * flow,
        noiseCoord.y * frequency.y,
        time * speed + seed
      )) * 0.5 + 0.5;

      return pow(smoothstep(floorValue,ceilValue,value),4.0);
    }

    void main() {
      float time = u_time * 0.000005;
      vec2 noiseCoord = u_resolution * a_uvNorm * vec2(0.00011,0.00023);

      float displacement = snoise(vec3(
        noiseCoord.x * 3.0 + time * 3.0,
        noiseCoord.y * 4.0,
        time * 10.0 + 7.0
      )) * u_amplitude;

      displacement *= 1.0 - pow(abs(a_uvNorm.y),2.0);
      displacement = max(0.0,displacement);

      float baseY = u_resolution.y * 0.5 * a_uvNorm.y;
      vec2 pixelPosition = vec2(a_positionX,baseY + displacement);
      vec2 clipPosition = pixelPosition / (u_resolution * 0.5);

      float layer1 = waveLayer(
        noiseCoord,time,
        vec2(2.25,3.25),
        6.8,11.3,17.0,
        0.12,0.70
      );

      float layer2 = waveLayer(
        noiseCoord,time,
        vec2(2.50,3.50),
        7.1,11.6,27.0,
        0.10,0.77
      );

      float layer3 = waveLayer(
        noiseCoord,time,
        vec2(2.75,3.75),
        7.4,11.9,37.0,
        0.10,0.84
      );

      float layer4 = waveLayer(
        noiseCoord,time,
        vec2(2.40,3.10),
        6.2,10.8,47.0,
        0.18,0.82
      );

      float ridgeNoise = snoise(vec3(
        noiseCoord.x * 1.20 + time * 2.1,
        noiseCoord.y * 1.60,
        time * 4.8 + 61.0
      )) * 0.5 + 0.5;

      float ridgeCenter =
        -0.14
        + sin(time * 5.4) * 0.22
        + (ridgeNoise - 0.5) * 0.18;

      float ridgeDistance = abs(
        (a_uvNorm.y + a_uvNorm.x * 0.20) - ridgeCenter
      );

      float ridge = 1.0 - smoothstep(0.08,0.34,ridgeDistance);
      float ridgeFocus = 1.0 - smoothstep(
        0.34,
        1.24,
        abs(a_uvNorm.x + 0.12)
      );

      ridge *= ridgeFocus;

      vec3 warmSteel = mix(u_layerColor2,u_layerColor4,0.11);

      vec3 color = u_baseColor;
      color = mix(color,u_layerColor1,layer1);
      color = mix(color,u_layerColor2,layer2);
      color = mix(color,u_layerColor3,layer3);

      // The brand orange only warms the steel field; it never becomes an orange blob.
      color = mix(color,warmSteel,layer4 * 0.08);

      // One broad moving fold gives the background a recognisable light gesture.
      color = mix(color,warmSteel,ridge * 0.30);

      v_color = color;
      gl_Position = vec4(clipPosition,0.0,1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec2 u_resolution;
    varying vec3 v_color;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec3 color = v_color;

      float topShade = smoothstep(.58,1.0,uv.y) * .06;
      float sideShade = pow(abs(uv.x - .5) * 2.0,2.0) * .025;

      color *= 1.0 - topShade - sideShade;
      gl_FragColor = vec4(color,1.0);
    }
  `;

  const compileShader = (type,source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      console.warn('Final gradient shader failed:',gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER,vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER,fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program,vertexShader);
  gl.attachShader(program,fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
    console.warn('Final gradient program failed:',gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const locations = {
    positionX:gl.getAttribLocation(program,'a_positionX'),
    uvNorm:gl.getAttribLocation(program,'a_uvNorm'),
    resolution:gl.getUniformLocation(program,'u_resolution'),
    time:gl.getUniformLocation(program,'u_time'),
    amplitude:gl.getUniformLocation(program,'u_amplitude'),
    baseColor:gl.getUniformLocation(program,'u_baseColor'),
    layerColor1:gl.getUniformLocation(program,'u_layerColor1'),
    layerColor2:gl.getUniformLocation(program,'u_layerColor2'),
    layerColor3:gl.getUniformLocation(program,'u_layerColor3'),
    layerColor4:gl.getUniformLocation(program,'u_layerColor4')
  };

  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  const palette = {
    base:[16 / 255,18 / 255,22 / 255],
    night:[11 / 255,21 / 255,29 / 255],
    steel:[125 / 255,135 / 255,145 / 255],
    softSteel:[54 / 255,62 / 255,69 / 255],
    signal:[255 / 255,91 / 255,53 / 255]
  };

  gl.uniform3fv(locations.baseColor,palette.base);
  gl.uniform3fv(locations.layerColor1,palette.night);
  gl.uniform3fv(locations.layerColor2,palette.steel);
  gl.uniform3fv(locations.layerColor3,palette.softSteel);
  gl.uniform3fv(locations.layerColor4,palette.signal);

  let width = 1;
  let height = 1;
  let indexCount = 0;
  let frame = 0;
  let visible = false;
  let scrolling = false;
  let scrollTimer = 0;
  let lastTimestamp = 0;
  let lastPaint = 0;
  let timeValue = 1253106;
  let loaded = false;

  const buildMesh = () => {
    const xSegments = Math.min(112,Math.max(30,Math.ceil(width * .052)));
    const ySegments = Math.min(120,Math.max(26,Math.ceil(height * .125)));
    const vertexCount = (xSegments + 1) * (ySegments + 1);

    const positions = new Float32Array(vertexCount);
    const uvNorm = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(xSegments * ySegments * 6);

    let vertex = 0;

    for (let y = 0; y <= ySegments; y += 1) {
      for (let x = 0; x <= xSegments; x += 1) {
        positions[vertex] = -width * .5 + width * (x / xSegments);
        uvNorm[vertex * 2] = x / xSegments * 2 - 1;
        uvNorm[vertex * 2 + 1] = 1 - y / ySegments * 2;
        vertex += 1;
      }
    }

    let index = 0;

    for (let y = 0; y < ySegments; y += 1) {
      for (let x = 0; x < xSegments; x += 1) {
        const i = y * (xSegments + 1) + x;

        indices[index++] = i;
        indices[index++] = i + xSegments + 1;
        indices[index++] = i + 1;

        indices[index++] = i + 1;
        indices[index++] = i + xSegments + 1;
        indices[index++] = i + xSegments + 2;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.positionX);
    gl.vertexAttribPointer(locations.positionX,1,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,uvNorm,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.uvNorm);
    gl.vertexAttribPointer(locations.uvNorm,2,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);

    indexCount = indices.length;
  };

  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    const scale = rect.width < 768 ? .58 : .72;

    width = Math.max(1,Math.round(rect.width * scale));
    height = Math.max(1,Math.round(rect.height * scale));

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0,0,width,height);
    gl.uniform2f(locations.resolution,width,height);
    gl.uniform1f(locations.amplitude,Math.min(245,height * .34));
    buildMesh();
  };

  const render = () => {
    gl.clearColor(
      palette.base[0],
      palette.base[1],
      palette.base[2],
      1
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(locations.time,timeValue);
    gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);

    if (!loaded) {
      loaded = true;
      requestAnimationFrame(() => wrap.classList.add('is-loaded'));
    }
  };

  const canAnimate = () => (
    visible &&
    !scrolling &&
    !document.hidden &&
    !reduceMotion.matches
  );

  const tick = (timestamp) => {
    frame = 0;

    const delta = lastTimestamp
      ? Math.min(timestamp - lastTimestamp,1000 / 15)
      : 0;

    lastTimestamp = timestamp;

    if (timestamp - lastPaint >= 32) {
      timeValue += delta;
      lastPaint = timestamp;
      render();
    }

    if (canAnimate()) frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (!canAnimate() || frame) return;
    lastTimestamp = 0;
    frame = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
    lastTimestamp = 0;
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (canAnimate()) start();
    else stop();
  },{rootMargin:'10% 0px',threshold:.02});

  observer.observe(section);

  const resizeObserver = new ResizeObserver(() => {
    resize();
    render();
  });

  resizeObserver.observe(section);

  window.addEventListener('scroll',() => {
    scrolling = true;
    stop();
    clearTimeout(scrollTimer);

    scrollTimer = window.setTimeout(() => {
      scrolling = false;
      if (canAnimate()) start();
    },180);
  },{passive:true});

  document.addEventListener('visibilitychange',() => {
    if (canAnimate()) start();
    else stop();
  });

  reduceMotion.addEventListener?.('change',() => {
    if (reduceMotion.matches) {
      stop();
      timeValue = 1253106;
      render();
    } else if (canAnimate()) {
      start();
    }
  });

  window.addEventListener('pagehide',() => {
    stop();
    observer.disconnect();
    resizeObserver.disconnect();
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(uvBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  },{once:true});

  resize();
  render();
})();
