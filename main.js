import * as THREE from "https://unpkg.com/three@0.181.1/build/three.module.js";

import { OrbitControls } from "https://unpkg.com/three@0.181.1/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "https://unpkg.com/three@0.181.1/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let hoveredObject = null;
// Character
let character = {
  instance: null,
  moveDistance: 9,
  jumpHeight: 1,
  isMoving: false,
  moveDuration: 0.2,
};

let lastHoverTime = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
// renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 2;

// sound
const sounds = {
  click: new Howl({
    src: ["./sound/click.ogg"],
    volume: 0.5,
    preload: true,
  }),
  pop: new Howl({
    src: ["./sound/pop.ogg"],
    volume: 0.15,
    preload: true,
  }),
  jump: new Howl({
    src: ["./sound/jump.ogg"],
    volume: 0.1,
    preload: true,
  }),
  music: new Howl({
    src: ["./sound/background.ogg"],
    loop: true,
    volume: 0.25,
    preload: true,
  }),
};

// sound helper
// let isMuted = false;
let isMuted = false;

const soundBtn = document.getElementById("soundBtn");
const soundIcon = document.getElementById("soundIcon");

function updateSoundIcon() {
  soundIcon.innerHTML = isMuted
    ? `
      <path d="M6 18L18 6M6 6l12 12"
        stroke="white" stroke-width="2" stroke-linecap="round"/>
    `
    : `
      <path d="M11 5L6 9H2v6h4l5 4V5z"
        stroke="white" stroke-width="2" stroke-linejoin="round"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"
        stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M18.07 5.93a9 9 0 010 12.73"
        stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
}

soundBtn.addEventListener("click", () => {
  isMuted = !isMuted;

  Howler.mute(isMuted); // 🔥 THIS is the key (global mute)

  updateSoundIcon();
});

sounds.music.once("load", () => {
  sounds.music.play();
});

function playSound(name) {
  if (!isMuted && sounds[name]) {
    sounds[name].play();
  }
}

function stopSound(name) {
  if (sounds[name]) {
    sounds[name].stop();
  }
}
const modalContent = {
  Poject1: {
    title: "Project One",
    content: "this is project one. hello orld",
    link: "https://fitsync-p2ox.vercel.app/",
  },
  Project2: {
    title: "Project Two",
    content: "this is project one. hello orld",
    link: "https://soup-kitchen-21zf.vercel.app/",
  },
  Project3: {
    title: "Project Three",
    content: "hello world 3",
    link: "https://party-gules.vercel.app/",
  },
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(
  ".modal-project-description",
);
const modalExitBtn = document.querySelector(".modal-exit-button");
const modalProjectVisitbtn = document.querySelector(".modal-project-visit-btn");

function showModal(id) {
  const content = modalContent[id];
  if (!content) return;

  if (content) {
    modalTitle.textContent = content.title;
    modalProjectDescription.textContent = content.content;
    // modalProjectLink.textContent = content.link;
  }

  if (modalProjectVisitbtn) {
    if (content.link) {
      modalProjectVisitbtn.href = content.link;
      modalProjectVisitbtn.classList.remove("hidden");
    } else {
      modalProjectVisitbtn.classList.add("hidden");
    }
  }

  if (modal) modal.classList.remove("hidden");
}

function hideModal() {
  modal.classList.remove("hidden");
  modal.classList.add("hidden");
}

function getInteractiveObject(object) {
  while (object) {
    if (object.userData.interactive) {
      return object;
    }

    object = object.parent;
  }

  return null;
}
let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = ["Poject1", "Project2", "Project3", "Character"];

// LOADER

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, loaded, total) => {};

loadingManager.onLoad = () => {};

const loader = new GLTFLoader(loadingManager);

loader.load(
  "./portPractice.glb",

  (glb) => {
    glb.scene.traverse((child) => {
      if (intersectObjectsNames.includes(child.name)) {
        child.userData.interactive = true;
        intersectObjects.push(child);
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material.name === "Skirt") {
          child.material.color = new THREE.Color().setRGB(0, 0, 0);
        }
      }

      //   character
      if (child.name === "Character") {
        character.instance = child;
      }
    });
    const model = glb.scene;

    model.scale.set(1, 1, 1);

    scene.add(model);
  },

  (error) => {},
);

// LIGHT
// directional
const sun = new THREE.DirectionalLight(0xffffff);
sun.castShadow = true;
sun.position.set(90, 100, 0);
sun.target.position.set(75, 0, 0);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -300;
sun.shadow.camera.right = 150;
sun.shadow.camera.top = 250;
sun.shadow.camera.bottom = -150;
sun.shadow.normalBias = 0.2;

sun.shadow.camera.updateProjectionMatrix();

scene.add(sun);

// ambient
const light = new THREE.AmbientLight(0x404040, 3); // soft white light
scene.add(light);
scene.background = new THREE.Color(0x145a1d);

// ORTHGRAPHIC
const aspect = sizes.width / sizes.height;
const zoom = 200;
const camera = new THREE.OrthographicCamera(
  -aspect * 200,
  aspect * 200,
  200,
  -200,
  1,
  1000,
);
scene.add(camera);

// const zoom = 200;

// const camera = new THREE.OrthographicCamera(
//   -aspect * zoom,
//   aspect * zoom,
//   zoom,
//   -zoom,
//   1,
//   1000,
// );

// CAMERA POSITION
camera.position.x = -152.0203645225681;
camera.position.y = 75.03806455884491;
camera.position.z = -67.40628620084108;

// CONTROLS

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;

function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function handleClick() {
  if (intersectObject !== "") {
    playSound("click");

    showModal(intersectObject);
  }
}

function handlePointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function moveCharacter(targetPosition, targetRotation) {
  character.isMoving = true;
  playSound("jump");

  let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;

  let finalRotation = character.instance.rotation.y + rotationDiff;

  const t1 = gsap.timeline({
    onComplete: () => {
      character.isMoving = false;
    },
  });

  t1.to(
    character.instance.rotation,
    {
      y: finalRotation,
      //   duration: character.moveDuration,
      duration: 0.18,
      ease: "power2.out",
    },
    0,
  );

  const startY = character.instance.position.y;

  t1.to(
    character.instance.position,
    {
      y: startY + character.jumpHeight,
      duration: character.moveDuration / 2,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
    0,
  );

  t1.to(character.instance.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: character.moveDuration,
    // duration: 0.2,
    ease: "power2.inOut",
  });

  t1.to(
    character.instance.rotation,
    {
      z: 0.08,
      duration: 0.1,
    },
    0,
  );
  t1.to(
    character.instance.rotation,
    {
      z: 0,
      duration: 0.1,
    },
    ">",
  );
}

function handleKeyDown(event) {
  if (character.isMoving) return;
  const targetPosition = new THREE.Vector3().copy(character.instance.position);

  let targetRotation = 0;

  const ROTATION_OFFSET = Math.PI;

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      targetPosition.z += character.moveDistance;
      targetRotation = 0 + ROTATION_OFFSET;
      break;
    case "s":
    case "arrowdown":
      targetPosition.z -= character.moveDistance;
      targetRotation = Math.PI + ROTATION_OFFSET;
      break;
    case "a":
    case "arrowleft":
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI / 2 + ROTATION_OFFSET;
      break;
    case "d":
    case "arrowright":
      targetPosition.x -= character.moveDistance;
      targetRotation = -Math.PI / 2 + ROTATION_OFFSET;
      break;
    default:
      return;
  }
  moveCharacter(targetPosition, targetRotation);
}

modalExitBtn.addEventListener("click", hideModal);
window.addEventListener("resize", handleResize);
window.addEventListener("click", handleClick);
window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("keydown", handleKeyDown);

const cameraOffset = new THREE.Vector3(-300, 150, -200);

function updateCamera() {
  if (!character.instance) return;

  const worldPos = new THREE.Vector3();
  character.instance.getWorldPosition(worldPos);

  const desired = worldPos.clone().add(cameraOffset);

  camera.position.lerp(desired, 0.05);
  camera.lookAt(worldPos);
}

function animate(time) {
  updateCamera();

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(intersectObjects, true);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";

    const interactiveObject = getInteractiveObject(intersects[0].object);

    if (interactiveObject) {
      intersectObject = interactiveObject.name;

      if (hoveredObject !== interactiveObject) {
        // play hover sound once
        if (interactiveObject.name !== "Character") {
          playSound("pop");
        }

        // Reset previous hover
        if (hoveredObject && hoveredObject.name !== "Character") {
          gsap.to(hoveredObject.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.2,
          });

          if (interactiveObject.name !== "Character") {
            playSound("hover");
          }
        }

        hoveredObject = interactiveObject;

        if (interactiveObject.name !== "Character") {
          gsap.to(interactiveObject.scale, {
            x: 1.08,
            y: 1.08,
            z: 1.08,
            duration: 0.2,
            ease: "back.out(1.7)",
          });
        }
      }
    }
  } else {
    document.body.style.cursor = "default";
    intersectObject = "";

    if (hoveredObject && hoveredObject.name !== "Character") {
      gsap.to(hoveredObject.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.2,
      });
    }

    hoveredObject = null;
  }

  for (let i = 0; i < intersects.length; i++) {
    intersectObject = intersects[0].object.parent.name;
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
