import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//====================
// Scene
//====================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151515);

//====================
// Camera
//====================

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0,1.7,3.8);

//====================
// Renderer
//====================

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

const canvasContainer = document.getElementById("canvas-container");

renderer.setSize(
    canvasContainer.clientWidth,
    canvasContainer.clientHeight
);
renderer.setPixelRatio(window.devicePixelRatio);

document
.getElementById("canvas-container")
.appendChild(renderer.domElement);

//====================
// Controls
//====================

const controls = new OrbitControls(camera,renderer.domElement);

controls.enableDamping=true;
controls.target.set(0,1.3,0);
controls.saveState();

// Resets only the user's camera orbit/pan/zoom; sensor values remain untouched.
document.getElementById("resetViewButton").addEventListener("click", () => {
    controls.reset();
    controls.update();
});

// Demo-only emergency control. It changes the dashboard state, not sensor data.
const sosButton = document.getElementById("sosButton");
const safetyCard = document.getElementById("safetyCard");
const safeText = document.getElementById("safeText");
const safeDesc = document.getElementById("safeDesc");

window.setSosAlert = function (isActive, sendToDevice = false) {
    safetyCard.classList.toggle("sos-active", isActive);
    sosButton.classList.toggle("is-active", isActive);
    sosButton.setAttribute("aria-pressed", String(isActive));
    sosButton.textContent = isActive ? "Clear SOS" : "SOS Alert";
    safeText.textContent = isActive ? "SOS ALERT" : "SAFE";
    safeDesc.textContent = isActive ? "Emergency assistance requested" : "System Ready";
    
    if (sendToDevice && window.helmetSocket?.readyState === WebSocket.OPEN) {
        window.helmetSocket.send(isActive ? "SOS,ON" : "SOS,OFF");
    }
};

sosButton.addEventListener("click", () => {
    const isActive = !safetyCard.classList.contains("sos-active");
    window.setSosAlert(isActive, true);
});

//====================
// Lights
//====================

scene.add(new THREE.AmbientLight(0xffffff,2));

const light1=new THREE.DirectionalLight(0xffffff,4);
light1.position.set(5,10,5);
scene.add(light1);

const light2=new THREE.DirectionalLight(0xffffff,2);
light2.position.set(-5,5,-5);
scene.add(light2);

//====================
// Grid
//====================

const grid = new THREE.GridHelper(10, 20, 0x8a7138, 0x39311f);
grid.position.y = 0.8;   // jitna upar chahiye
scene.add(grid);

//====================
// Helmet
//====================

let helmet;

const loader=new GLTFLoader();



loader.load(

"./safety_helmet.glb",

(gltf)=>{

helmet=gltf.scene;

// Bounding Box
const bbox=new THREE.Box3().setFromObject(helmet);

const size=bbox.getSize(new THREE.Vector3());

const center=bbox.getCenter(new THREE.Vector3());

// Center model
helmet.position.sub(center);

// Scale
const max=Math.max(size.x,size.y,size.z);

helmet.scale.multiplyScalar(3/max);

// Position
// Center
helmet.position.sub(center);

// Ground pe lao
const newBox = new THREE.Box3().setFromObject(helmet);
const minY = newBox.min.y;

// Grid pe bithao
helmet.position.y -= minY;
helmet.position.y += 1.0;

// Initial Rotation
helmet.rotation.set(
    -Math.PI/2,
    Math.PI/2,
    0
);
scene.add(helmet);

console.log("Helmet Loaded");

},

(xhr)=>{

if(xhr.total)
console.log((xhr.loaded/xhr.total*100).toFixed(1)+" %");

},

(err)=>{

console.error(err);

}

);

//====================
// Motion Variables
//====================

let roll=0;
let pitch=0;
let yaw=0;

// Calibrated upright pose: outer shell and front brim face the viewer.
const baseRotation = {
    x: THREE.MathUtils.degToRad(146.5),
    y: Math.PI,
    z: THREE.MathUtils.degToRad(175.3)
};
//====================
// Animation
//====================

function animate(){

    requestAnimationFrame(animate);

    controls.update();

    if(helmet){

        // Start upright; incoming IMU values rotate relative to this pose.
        helmet.rotation.set(
            baseRotation.x + THREE.MathUtils.degToRad(pitch),
            baseRotation.y + THREE.MathUtils.degToRad(yaw),
            baseRotation.z - THREE.MathUtils.degToRad(roll)
        );

    }

    renderer.render(scene,camera);

}

animate();

//====================
// Resize
//====================
window.addEventListener("resize",()=>{

    const canvasContainer = document.getElementById("canvas-container");

    camera.aspect =
        canvasContainer.clientWidth /
        canvasContainer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        canvasContainer.clientWidth,
        canvasContainer.clientHeight
    );

});

//====================
// Test Values
//====================

// Browser Console me test kar sakte ho:
// roll = 20;
// pitch = -15;
// yaw = 30;

//====================
// Future ESP32 Function
//====================

window.updateOrientation = function(r,p,y){

    roll = r;
    pitch = p;
    yaw = y;

    document.getElementById("roll").innerText = r.toFixed(1);
    document.getElementById("pitch").innerText = p.toFixed(1);
    document.getElementById("yaw").innerText = y.toFixed(1);

}

