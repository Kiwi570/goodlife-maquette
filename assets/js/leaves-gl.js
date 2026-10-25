/* Rideau de feuilles WebGL (OGL) : trois couches de palmes qui s'écartent au défilement
   pour révéler la salle, avec vent, ombres portées et translucidité dorée. */
import { Renderer, Program, Mesh, Texture, Triangle } from './vendor/ogl.min.mjs';

const vertex = /* glsl */ `
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tImg; uniform sampler2D tL; uniform sampler2D tR; uniform sampler2D tT;
uniform float uTime; uniform float uP; uniform float uIntro; uniform float uDay;
uniform vec2 uRes; uniform vec2 uImgRes; uniform vec2 uMouse;
varying vec2 vUv;
vec2 cover(vec2 uv) { vec2 s = uRes / uImgRes; float sc = max(s.x, s.y); vec2 sz = uImgRes * sc; vec2 off = (sz - uRes) * .5; return (uv * uRes + off) / sz; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec4 leaf(sampler2D t, vec2 uv) { if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return vec4(0.); return texture2D(t, uv); }
void main() {
  vec2 uv = vUv;
  float o = smoothstep(0., 1., clamp(uP, 0., 1.));
  float closed = 1. - uIntro;
  vec2 iuv = cover(uv);
  float z = mix(1.16, 1.0, o) + closed * .06;
  iuv = (iuv - vec2(.5, .45)) / z + vec2(.5, .45);
  iuv += vec2(sin(uv.y * 9. + uTime * .7), cos(uv.x * 7. + uTime * .6)) * .0014 * (1. - o);
  vec3 col = texture2D(tImg, iuv).rgb;
  col = pow(col, vec3(.97, 1., 1.06)) * vec3(1.05, 1.0, .92);
  float w1 = sin(uTime * .8 + uv.y * 2.5) * .008 + sin(uTime * 1.9 + uv.y * 6.) * .003;
  float w2 = sin(uTime * .7 + uv.x * 2.2) * .008 + sin(uTime * 1.6 + uv.x * 5.) * .002;
  vec2 m = uMouse * .014;
  float s = mix(1., 1.5, o);
  vec2 lu = (uv - vec2(0., .5)) / s + vec2(0., .5); lu.x += o * .64 - closed * .2 + w1 + m.x; lu.y += w1 * .5 + m.y;
  vec2 ru = (uv - vec2(1., .5)) / s + vec2(1., .5); ru.x -= o * .64 - closed * .2 - w1 - m.x; ru.y -= w1 * .5 - m.y;
  vec2 tu = (uv - vec2(.5, 1.)) / s + vec2(.5, 1.); tu.y -= o * .62 - closed * .14 + w2 * .5; tu.x += w2 + m.x;
  vec2 so = vec2(-.018, .026);
  float sh = leaf(tL, lu + so).a + leaf(tR, ru + so).a + leaf(tT, tu + so).a;
  col *= 1. - clamp(sh, 0., 1.) * .5;
  vec3 glow = vec3(1., .74, .4) * (.18 + .3 * uDay);
  vec4 T = leaf(tT, tu); col = mix(col, T.rgb + glow * T.a * (.5 + .5 * sin(uTime + uv.x * 4.)), T.a);
  vec4 L = leaf(tL, lu); col = mix(col, L.rgb + glow * L.a * .6, L.a);
  vec4 R = leaf(tR, ru); col = mix(col, R.rgb + glow * R.a * .8, R.a);
  vec2 q = uv - .5; col *= 1. - dot(q, q) * .6;
  col += (hash(uv * uRes + fract(uTime) * 100.) - .5) * .035;
  gl_FragColor = vec4(col, 1.);
}`;

function start() {
  const GL = window.GL, html = document.documentElement;
  if (!GL || GL.calm || html.classList.contains('no-gl')) return;
  const canvas = document.querySelector('[data-hero-gl]'), img = document.querySelector('[data-hero-img]');
  const leaves = GL.heroLeaves;
  if (!canvas || !img) return;
  if (!leaves) { GL.events.addEventListener('hero-leaves', start, { once: true }); return; }
  const fail = () => { html.classList.add('no-gl'); GL.events.dispatchEvent(new Event('no-gl')); };
  let renderer, gl;
  try { renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.5), antialias: false, depth: false }); gl = renderer.gl; } catch (e) { fail(); return; }
  if (!gl) { fail(); return; }
  const tex = c => new Texture(gl, { image: c, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
  const tImg = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
  const tL = tex(leaves.L), tR = tex(leaves.R), tT = tex(leaves.T);
  const uniforms = {
    tImg: { value: tImg }, tL: { value: tL }, tR: { value: tR }, tT: { value: tT },
    uTime: { value: 0 }, uP: { value: 0 }, uIntro: { value: 0 }, uDay: { value: 1 },
    uRes: { value: [1, 1] }, uImgRes: { value: [16, 9] }, uMouse: { value: [0, 0] }
  };
  let program;
  try { program = new Program(gl, { vertex, fragment, uniforms }); } catch (e) { fail(); return; }
  if (!program.program || !gl.getProgramParameter(program.program, gl.LINK_STATUS)) { fail(); return; }
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const setImg = () => { if (!img.naturalWidth) return; tImg.image = img; uniforms.uImgRes.value = [img.naturalWidth, img.naturalHeight]; };
  if (img.complete) setImg(); img.addEventListener('load', setImg);
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height); uniforms.uRes.value = [r.width, r.height]; };
  resize(); window.addEventListener('resize', resize);
  GL.events.addEventListener('leaves-redrawn', () => { tL.needsUpdate = tR.needsUpdate = tT.needsUpdate = true; });
  const sun = () => { const t = GL.now().dec; uniforms.uDay.value = t >= 6 && t <= 18.6 ? (t >= 15.5 ? 1 : .7) : .15; };
  sun(); setInterval(sun, 60000);
  const mouse = [0, 0], mt = [0, 0];
  canvas.parentElement.parentElement.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mt[0] = (e.clientX - r.left) / r.width - .5; mt[1] = -((e.clientY - r.top) / r.height - .5); }, { passive: true });
  let visible = true, raf = 0, t0 = performance.now();
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) loop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) loop(); });
  function loop() {
    if (!visible || document.hidden) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    mouse[0] += (mt[0] - mouse[0]) * .05; mouse[1] += (mt[1] - mouse[1]) * .05;
    uniforms.uTime.value = (performance.now() - t0) / 1000;
    uniforms.uP.value = GL.heroProgress;
    uniforms.uIntro.value = GL.heroIntro ? GL.heroIntro.v : 1;
    uniforms.uMouse.value = mouse;
    renderer.render({ scene: mesh });
  }
  html.classList.add('has-gl');
  loop();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
