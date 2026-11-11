// Escritorio 3D interactivo (estilo vóxel) para el Hero.
// Se carga en diferido desde Desk3D.astro, solo en cliente.
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const AVATAR_URL = "/models/avatar-voxel.glb"

const PALETTE = {
  wood: 0xb98a5a, woodDark: 0x8f6540, woodLight: 0xd0a374,
  metal: 0x3a3d45, metalLight: 0x6b7080, black: 0x15161a,
  screen: 0x12203a, white: 0xf3f1ea, paper: 0xe9e4d6,
  leather: 0x6e4526, leatherDark: 0x4d2f19, brass: 0xd9b25a,
  red: 0xc4513f, blue: 0x2f55a8, green: 0x4f8a57, greenDark: 0x356b41,
  teal: 0x3c8f8a, yellow: 0xe0b344, coffee: 0x3b2416, pot: 0xc9744c,
  lamp: 0xe4bd77, glow: 0xffd89a,
}

/** @param {HTMLElement} root */
export async function mountDesk(root) {
  const canvas = root.querySelector("canvas")
  const tip = root.querySelector("[data-desk-tip]")
  const items = JSON.parse(root.dataset.items ?? "{}")
  if (!canvas) throw new Error("desk3d: canvas missing")

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
  const target = new THREE.Vector3(0, -0.17, -0.2)

  // ---------- luces ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.3)
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(1.6, 2.6, 2.2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -1.4; key.shadow.camera.right = 1.4
  key.shadow.camera.top = 1.4; key.shadow.camera.bottom = -1.4
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 8
  key.shadow.bias = -0.0015
  const lampLight = new THREE.PointLight(PALETTE.glow, 0.3, 2.2, 2)
  scene.add(hemi, key, lampLight)

  // ---------- utilidades de construcción ----------
  const mats = new Map()
  const mat = (color, extra) => {
    const id = color + JSON.stringify(extra ?? {})
    if (!mats.has(id)) mats.set(id, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }))
    return mats.get(id)
  }
  const geos = []
  const box = (parent, w, h, d, color, x, y, z, extra) => {
    const g = new THREE.BoxGeometry(w, h, d); geos.push(g)
    const m = new THREE.Mesh(g, mat(color, extra))
    m.position.set(x, y + h / 2, z)
    m.castShadow = true; m.receiveShadow = true
    parent.add(m)
    return m
  }
  const interactive = []
  const makeItem = (key, x, z, rotY = 0) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z); g.rotation.y = rotY
    g.userData = { key, baseY: 0, hover: 0, tipY: 0.2 }
    scene.add(g)
    if (items[key]) interactive.push(g)
    return g
  }

  // ---------- base + mesa + silla ----------
  const base = box(scene, 1.72, 0.03, 1.3, 0xe9e2d3, 0, -0.69, -0.2)
  base.castShadow = false
  const rug = box(scene, 1.3, 0.012, 0.8, 0xcfd8cf, 0, -0.66, -0.05)
  rug.castShadow = false
  box(scene, 1.5, 0.05, 0.72, PALETTE.wood, 0, -0.05, 0)
  box(scene, 1.5, 0.02, 0.02, PALETTE.woodLight, 0, -0.02, 0.35)
  box(scene, 1.42, 0.3, 0.03, PALETTE.woodDark, 0, -0.36, -0.3)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(scene, 0.06, 0.61, 0.06, PALETTE.woodDark, sx * 0.69, -0.66, sz * 0.3)
  // cajonera
  box(scene, 0.34, 0.42, 0.5, PALETTE.woodDark, 0.5, -0.47, 0.02)
  for (const y of [-0.2, -0.34]) box(scene, 0.1, 0.02, 0.02, PALETTE.brass, 0.5, y, 0.28)
  // silla
  box(scene, 0.6, 0.6, 0.07, PALETTE.metal, 0, -0.24, -0.82)
  box(scene, 0.5, 0.06, 0.4, PALETTE.metal, 0, -0.3, -0.6)
  box(scene, 0.07, 0.36, 0.07, PALETTE.black, 0, -0.66, -0.6)

  // ---------- portátil -> proyectos ----------
  const laptop = makeItem("projects", 0.42, 0.04, -0.5)
  laptop.userData.tipY = 0.3
  box(laptop, 0.34, 0.016, 0.22, PALETTE.metalLight, 0, 0, 0.02)
  box(laptop, 0.3, 0.004, 0.12, PALETTE.black, 0, 0.016, -0.01)
  const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.09); lid.rotation.x = -0.22; laptop.add(lid)
  box(lid, 0.34, 0.22, 0.014, PALETTE.metalLight, 0, 0, 0)
  box(lid, 0.31, 0.19, 0.004, PALETTE.screen, 0, 0.015, 0.008, { emissive: 0x1b3a6e, emissiveIntensity: 0.9 })
  const code = [[0.14, 0xe4bd77], [0.2, 0x7fd1b9], [0.1, 0xf08a7a], [0.22, 0x9db7ff], [0.16, 0x7fd1b9], [0.08, 0xe4bd77]]
  code.forEach(([w, c], i) => box(lid, w, 0.012, 0.003, c, -0.14 + w / 2 + (i % 3) * 0.015, 0.17 - i * 0.026, 0.011, { emissive: c, emissiveIntensity: 0.7 }))

  // ---------- maletín -> experiencia ----------
  const briefcase = makeItem("experience", -0.5, -0.12, 0.35)
  briefcase.userData.tipY = 0.3
  box(briefcase, 0.3, 0.19, 0.09, PALETTE.leather, 0, 0, 0)
  box(briefcase, 0.31, 0.03, 0.095, PALETTE.leatherDark, 0, 0.11, 0)
  box(briefcase, 0.05, 0.04, 0.1, PALETTE.brass, 0, 0.1, 0)
  box(briefcase, 0.1, 0.02, 0.025, PALETTE.leatherDark, 0, 0.215, 0)
  for (const s of [-1, 1]) box(briefcase, 0.02, 0.03, 0.025, PALETTE.leatherDark, s * 0.05, 0.19, 0)

  // ---------- libros -> habilidades ----------
  const books = makeItem("skills", -0.44, 0.2, -0.25)
  books.userData.tipY = 0.22
  box(books, 0.22, 0.04, 0.16, PALETTE.blue, 0, 0, 0)
  box(books, 0.2, 0.035, 0.15, PALETTE.red, 0.01, 0.04, 0.005).rotation.y = 0.12
  box(books, 0.18, 0.03, 0.14, PALETTE.teal, -0.005, 0.075, 0).rotation.y = -0.1
  box(books, 0.19, 0.03, 0.02, PALETTE.paper, 0.01, 0.043, 0.076).rotation.y = 0.12
  box(books, 0.06, 0.032, 0.142, PALETTE.yellow, 0.03, 0.075, 0).rotation.y = -0.1

  // ---------- taza -> sobre mí ----------
  const mug = makeItem("aboutMe", 0.02, 0.22, 0.3)
  mug.userData.tipY = 0.2
  box(mug, 0.075, 0.085, 0.075, PALETTE.white, 0, 0, 0)
  box(mug, 0.055, 0.006, 0.055, PALETTE.coffee, 0, 0.083, 0)
  box(mug, 0.02, 0.05, 0.02, PALETTE.white, 0.055, 0.018, 0)
  box(mug, 0.02, 0.015, 0.02, PALETTE.white, 0.045, 0.058, 0)
  box(mug, 0.02, 0.015, 0.02, PALETTE.white, 0.045, 0.012, 0)
  const steam = []
  for (let i = 0; i < 3; i++) {
    const s = box(mug, 0.018, 0.018, 0.018, 0xffffff, 0, 0.1, 0, { transparent: true, opacity: 0.5, depthWrite: false })
    s.material = s.material.clone(); s.castShadow = false; steam.push(s)
  }

  // ---------- sobre -> contacto ----------
  const mail = makeItem("contact", -0.2, 0.22, 0.2)
  mail.userData.tipY = 0.14
  box(mail, 0.19, 0.012, 0.13, PALETTE.white, 0, 0, 0)
  box(mail, 0.19, 0.004, 0.012, PALETTE.paper, 0, 0.012, -0.02)
  box(mail, 0.1, 0.005, 0.05, PALETTE.paper, 0, 0.012, -0.035)
  box(mail, 0.03, 0.008, 0.03, PALETTE.red, 0, 0.014, -0.012)

  // ---------- lámpara + planta (decoración) ----------
  const lamp = new THREE.Group(); lamp.position.set(0.63, 0, -0.24); scene.add(lamp)
  box(lamp, 0.12, 0.02, 0.12, PALETTE.black, 0, 0, 0)
  box(lamp, 0.025, 0.3, 0.025, PALETTE.black, 0, 0.02, 0)
  const arm = box(lamp, 0.2, 0.025, 0.025, PALETTE.black, -0.07, 0.31, 0.02); arm.rotation.z = -0.25
  box(lamp, 0.12, 0.06, 0.1, PALETTE.lamp, -0.17, 0.3, 0.03)
  const bulb = box(lamp, 0.08, 0.015, 0.06, PALETTE.glow, -0.17, 0.288, 0.03, { emissive: PALETTE.glow, emissiveIntensity: 1.6 })
  bulb.castShadow = false
  lampLight.position.set(0.46, 0.26, -0.2)

  const plant = new THREE.Group(); plant.position.set(-0.64, 0, -0.24); scene.add(plant)
  box(plant, 0.11, 0.09, 0.11, PALETTE.pot, 0, 0, 0)
  box(plant, 0.13, 0.02, 0.13, PALETTE.pot, 0, 0.085, 0)
  const leaves = [[0, 0.1, 0, 0.09], [0.04, 0.17, 0.02, 0.08], [-0.04, 0.2, -0.02, 0.08], [0.01, 0.26, 0, 0.07], [-0.03, 0.31, 0.02, 0.05], [0.05, 0.25, -0.04, 0.05]]
  leaves.forEach(([x, y, z, s], i) => box(plant, s, s, s, i % 2 ? PALETTE.green : PALETTE.greenDark, x, y, z))

  // ---------- avatar ----------
  const avatar = new THREE.Group()
  avatar.position.set(0, -0.2, -0.56)
  avatar.userData = { key: "avatar", tipY: 0.82, hover: 0 }
  scene.add(avatar)
  const gltf = await new GLTFLoader().loadAsync(AVATAR_URL)
  gltf.scene.scale.setScalar(1.7)
  gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.material.transparent !== true; o.receiveShadow = false } })
  avatar.add(gltf.scene)
  interactive.push(avatar)

  // ---------- tema claro/oscuro ----------
  const applyTheme = () => {
    const dark = document.documentElement.classList.contains("dark")
    hemi.intensity = dark ? 0.55 : 1.3
    key.intensity = dark ? 0.9 : 2.2
    lampLight.intensity = dark ? 1.1 : 0.3
    base.material.color.set(dark ? 0x232823 : 0xe9e2d3)
    rug.material.color.set(dark ? 0x30382e : 0xd8ddd2)
  }
  applyTheme()
  const themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

  // ---------- cámara / órbita ----------
  const orbit = { az: 0.42, pol: 1.17, tAz: 0.42, tPol: 1.17, r: 3.95 }
  const placeCamera = () => {
    const s = Math.sin(orbit.pol)
    camera.position.set(
      target.x + orbit.r * s * Math.sin(orbit.az),
      target.y + orbit.r * Math.cos(orbit.pol),
      target.z + orbit.r * s * Math.cos(orbit.az),
    )
    camera.lookAt(target)
  }
  const resize = () => {
    const w = root.clientWidth, h = root.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    orbit.r = camera.aspect < 1.15 ? 3.95 : 3.7
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)
  resize()

  // ---------- interacción ----------
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const look = { x: 0, y: 0 }
  let hovered = null
  let drag = null
  let greetUntil = 0

  const pick = (ev) => {
    const r = canvas.getBoundingClientRect()
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(interactive, true)[0]
    if (!hit) return null
    let o = hit.object
    while (o && !interactive.includes(o)) o = o.parent
    return o ?? null
  }
  const v = new THREE.Vector3()
  const showTip = (obj) => {
    if (!tip) return
    const label = obj ? (obj.userData.key === "avatar" ? root.dataset.hello : items[obj.userData.key]?.label) : ""
    if (!obj || !label) { tip.hidden = true; return }
    v.set(0, obj.userData.tipY, 0); obj.localToWorld(v); v.project(camera)
    tip.textContent = label
    tip.style.left = `${((v.x + 1) / 2) * root.clientWidth}px`
    tip.style.top = `${((1 - v.y) / 2) * root.clientHeight}px`
    tip.hidden = false
  }
  const setHover = (obj) => {
    if (hovered === obj) return
    hovered = obj
    canvas.style.cursor = obj ? "pointer" : (coarse ? "" : "grab")
  }
  const activate = (obj) => {
    if (obj.userData.key === "avatar") { greetUntil = performance.now() + 900; return }
    const href = items[obj.userData.key]?.href
    if (!href) return
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
      history.replaceState(null, "", href)
    } else {
      window.location.href = href
    }
  }

  const onMove = (ev) => {
    const r = canvas.getBoundingClientRect()
    look.x = THREE.MathUtils.clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1.6, 1.6)
    look.y = THREE.MathUtils.clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1.6, 1.6)
    if (drag) {
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true
      if (drag.moved && !coarse) {
        orbit.tAz = THREE.MathUtils.clamp(drag.az - dx * 0.006, -0.75, 0.95)
        orbit.tPol = THREE.MathUtils.clamp(drag.pol - dy * 0.004, 0.85, 1.38)
        canvas.style.cursor = "grabbing"
      }
      return
    }
    if (ev.target === canvas) setHover(pick(ev))
    else setHover(null)
  }
  const onDown = (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, az: orbit.tAz, pol: orbit.tPol, moved: false }
  }
  const onUp = (ev) => {
    if (!drag) return
    const wasDrag = drag.moved
    drag = null
    canvas.style.cursor = coarse ? "" : "grab"
    if (wasDrag || ev.target !== canvas) return
    const obj = pick(ev)
    if (obj) activate(obj)
  }
  const onLeave = () => { if (!drag) setHover(null) }
  window.addEventListener("pointermove", onMove, { passive: true })
  canvas.addEventListener("pointerdown", onDown)
  window.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointerleave", onLeave)
  canvas.style.cursor = coarse ? "" : "grab"

  // ---------- bucle ----------
  let raf = 0, visible = true, last = performance.now(), time = 0
  const frame = (now) => {
    raf = 0
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    if (!reduceMotion) time += dt
    const k = 1 - Math.pow(0.001, dt)

    if (coarse && !reduceMotion) orbit.tAz = 0.3 + Math.sin(time * 0.35) * 0.28
    orbit.az += (orbit.tAz - orbit.az) * k
    orbit.pol += (orbit.tPol - orbit.pol) * k
    placeCamera()

    // avatar: respiración, mirada al cursor y saludo
    const greet = Math.max(0, (greetUntil - now) / 900)
    const hop = greet > 0 && !reduceMotion ? Math.sin((1 - greet) * Math.PI) : 0
    avatar.position.y = -0.2 + Math.sin(time * 1.6) * 0.006 + hop * 0.09
    const yawBase = orbit.az * 0.55
    const yaw = yawBase + (coarse ? 0 : look.x * 0.32) + (hop > 0 ? (1 - greet) * Math.PI * 2 : 0)
    avatar.rotation.y += (yaw - avatar.rotation.y) * (hop > 0 ? 1 : k)
    avatar.rotation.x += ((coarse ? 0 : look.y * 0.1) - avatar.rotation.x) * k
    avatar.rotation.z = Math.sin(time * 0.8) * 0.012

    for (const o of interactive) {
      if (o === avatar) continue
      const goal = o === hovered ? 1 : 0
      o.userData.hover += (goal - o.userData.hover) * k
      o.position.y = o.userData.hover * 0.035
      o.scale.setScalar(1 + o.userData.hover * 0.08)
    }
    steam.forEach((s, i) => {
      const p = (time * 0.45 + i / 3) % 1
      s.position.set(Math.sin((p + i) * 6) * 0.012, 0.1 + p * 0.11, 0)
      s.material.opacity = reduceMotion ? 0 : 0.5 * (1 - p)
    })

    renderer.render(scene, camera)
    showTip(hovered)
    if (visible) raf = requestAnimationFrame(frame)
  }
  const start = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame) } }
  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && document.visibilityState !== "hidden"
    if (visible) start()
  })
  visibility.observe(root)
  const onVisibility = () => {
    visible = document.visibilityState !== "hidden"
    if (visible) start()
  }
  document.addEventListener("visibilitychange", onVisibility)
  start()
  root.classList.add("is-ready")

  // ---------- limpieza (ViewTransitions) ----------
  const dispose = () => {
    cancelAnimationFrame(raf); visible = false
    themeObserver.disconnect(); resizeObserver.disconnect(); visibility.disconnect()
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    canvas.removeEventListener("pointerdown", onDown)
    canvas.removeEventListener("pointerleave", onLeave)
    document.removeEventListener("visibilitychange", onVisibility)
    geos.forEach((g) => g.dispose())
    mats.forEach((m) => m.dispose())
    renderer.dispose()
  }
  document.addEventListener("astro:before-swap", dispose, { once: true })
}
