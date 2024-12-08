import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

let scene, camera, renderer, controls, culvert;

// Parameters for the box culvert
const parameters = {
    H: 6,        // 内空高
    HH2: 1,      // 頂版側ハンチ高さ
    hH2: 1,      // 底版側ハンチ高さ
    h1: 0.5,     // 頂版厚
    h2: 0.5,     // 底版厚
    t1: 0.5,     // 左側壁厚
    t2: 0.5,     // 右側壁厚
    W: 8,        // 内空幅
    WH1: 1,      // 頂版側ハンチ幅
    WH2: 1,      // 底版側ハンチ幅
    length: 10   // 延長
};

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 15, 15);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-container').appendChild(renderer.domElement);

    // Set background color
    const rootStyles = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyles.getPropertyValue('--bg-color').trim();
    renderer.setClearColor(backgroundColor, 1);

    // OrbitControls for interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Initial Box Culvert
    culvert = createBoxCulvert(parameters);
    scene.add(culvert);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Add GUI controls
    setupGUI();

    // Render loop
    animate();
}

function createBoxCulvert(params) {
    const group = new THREE.Group();

    // Outer shape
    const outerShape = new THREE.Shape();
    const halfWidth = params.W / 2 + params.t1 + params.t2;
    const halfHeight = params.H / 2 + params.h1 + params.h2;

    outerShape.moveTo(-halfWidth, -halfHeight);
    outerShape.lineTo(-halfWidth + params.WH2, -halfHeight); // Bottom-left haunch
    outerShape.lineTo(-halfWidth + params.WH2, -halfHeight + params.hH2);
    outerShape.lineTo(-halfWidth, -halfHeight + params.hH2);

    outerShape.lineTo(-halfWidth, halfHeight - params.HH2); // Left wall
    outerShape.lineTo(-halfWidth + params.WH1, halfHeight - params.HH2);
    outerShape.lineTo(-halfWidth + params.WH1, halfHeight);
    outerShape.lineTo(-halfWidth, halfHeight);

    outerShape.lineTo(halfWidth, halfHeight); // Top wall
    outerShape.lineTo(halfWidth - params.WH1, halfHeight);
    outerShape.lineTo(halfWidth - params.WH1, halfHeight - params.HH2);
    outerShape.lineTo(halfWidth, halfHeight - params.HH2);

    outerShape.lineTo(halfWidth, -halfHeight + params.hH2); // Right wall
    outerShape.lineTo(halfWidth - params.WH2, -halfHeight + params.hH2);
    outerShape.lineTo(halfWidth - params.WH2, -halfHeight);
    outerShape.lineTo(halfWidth, -halfHeight);

    outerShape.closePath();

    const extrudeSettings = {
        depth: params.length,
        bevelEnabled: false
    };

    const outerGeometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    const outerMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outerMesh);

    // Inner shape (void space with haunches)
    const innerShape = new THREE.Shape();
    const innerHalfWidth = params.W / 2;
    const innerHalfHeight = params.H / 2;

    innerShape.moveTo(-innerHalfWidth, -innerHalfHeight);
    innerShape.lineTo(-innerHalfWidth + params.WH2, -innerHalfHeight); // Bottom-left haunch
    innerShape.lineTo(-innerHalfWidth + params.WH2, -innerHalfHeight + params.hH2);
    innerShape.lineTo(-innerHalfWidth, -innerHalfHeight + params.hH2);

    innerShape.lineTo(-innerHalfWidth, innerHalfHeight - params.HH2); // Left wall
    innerShape.lineTo(-innerHalfWidth + params.WH1, innerHalfHeight - params.HH2);
    innerShape.lineTo(-innerHalfWidth + params.WH1, innerHalfHeight);
    innerShape.lineTo(-innerHalfWidth, innerHalfHeight);

    innerShape.lineTo(innerHalfWidth, innerHalfHeight); // Top wall
    innerShape.lineTo(innerHalfWidth - params.WH1, innerHalfHeight);
    innerShape.lineTo(innerHalfWidth - params.WH1, innerHalfHeight - params.HH2);
    innerShape.lineTo(innerHalfWidth, innerHalfHeight - params.HH2);

    innerShape.lineTo(innerHalfWidth, -innerHalfHeight + params.hH2); // Right wall
    innerShape.lineTo(innerHalfWidth - params.WH2, -innerHalfHeight + params.hH2);
    innerShape.lineTo(innerHalfWidth - params.WH2, -innerHalfHeight);
    innerShape.lineTo(innerHalfWidth, -innerHalfHeight);

    innerShape.closePath();

    const innerGeometry = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
    const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);

    return group;
}

function updateCulvert() {
    // Remove the old culvert
    scene.remove(culvert);

    // Create and add the new culvert
    culvert = createBoxCulvert(parameters);
    scene.add(culvert);
}

function setupGUI() {
    const gui = new dat.GUI();
    gui.add(parameters, 'H', 2, 15, 0.1).name('内空高 H').onChange(updateCulvert);
    gui.add(parameters, 'HH2', 0, 5, 0.1).name('頂版側ハンチ高さ HH2').onChange(updateCulvert);
    gui.add(parameters, 'hH2', 0, 5, 0.1).name('底版側ハンチ高さ hH2').onChange(updateCulvert);
    gui.add(parameters, 'h1', 0.1, 2, 0.1).name('頂版厚 h1').onChange(updateCulvert);
    gui.add(parameters, 'h2', 0.1, 2, 0.1).name('底版厚 h2').onChange(updateCulvert);
    gui.add(parameters, 't1', 0.1, 2, 0.1).name('左側壁厚 t1').onChange(updateCulvert);
    gui.add(parameters, 't2', 0.1, 2, 0.1).name('右側壁厚 t2').onChange(updateCulvert);
    gui.add(parameters, 'W', 2, 15, 0.1).name('内空幅 W').onChange(updateCulvert);
    gui.add(parameters, 'WH1', 0, 5, 0.1).name('頂版側ハンチ幅 WH1').onChange(updateCulvert);
    gui.add(parameters, 'WH2', 0, 5, 0.1).name('底版側ハンチ幅 WH2').onChange(updateCulvert);
    gui.add(parameters, 'length', 1, 100, 1).name('延長 Length').onChange(updateCulvert);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Initialize the scene
init();
