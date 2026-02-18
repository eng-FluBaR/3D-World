import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

function getModelType(project) {
  if (project?.model_type) {
    return String(project.model_type).toLowerCase();
  }

  const candidate = `${project?.file_name || ""} ${project?.file_url || ""}`.toLowerCase();
  if (candidate.includes(".stl")) return "stl";
  if (candidate.includes(".obj")) return "obj";
  if (candidate.includes(".svg")) return "svg";
  return "other";
}

async function initModelPreview(container, url, type) {
  const width = container.clientWidth || 720;
  const height = container.clientHeight || 340;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f9fa);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
  camera.position.set(0, 0, 130);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(40, 50, 80);
  scene.add(directional);

  let object3D = null;
  if (type === "stl") {
    const loader = new STLLoader();
    const geometry = await loader.loadAsync(url);
    geometry.computeVertexNormals();
    geometry.center();

    const material = new THREE.MeshStandardMaterial({ color: 0x667eea, metalness: 0.1, roughness: 0.6 });
    object3D = new THREE.Mesh(geometry, material);
    scene.add(object3D);
  }

  if (type === "obj") {
    const loader = new OBJLoader();
    object3D = await loader.loadAsync(url);
    object3D.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x764ba2, metalness: 0.1, roughness: 0.65 });
      }
    });

    const box = new THREE.Box3().setFromObject(object3D);
    const center = box.getCenter(new THREE.Vector3());
    object3D.position.sub(center);
    scene.add(object3D);
  }

  if (!object3D) {
    throw new Error("Unsupported model type");
  }

  const box = new THREE.Box3().setFromObject(object3D);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 78 / maxDim;
  object3D.scale.setScalar(scale);

  let isDisposed = false;
  let frameId = 0;

  const animate = () => {
    if (isDisposed) return;
    object3D.rotation.y += 0.01;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    isDisposed = true;
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    renderer.dispose();
    container.innerHTML = "";
  };
}

onReady(async () => {
  const slotElements = [
    document.getElementById("index-gallery-slot-1"),
    document.getElementById("index-gallery-slot-2"),
    document.getElementById("index-gallery-slot-3")
  ].filter(Boolean);

  if (slotElements.length === 0) return;

  const client = createSupabaseClient();
  const { data, error } = await client
    .from("gallery_projects")
    .select("id, file_name, file_url, category, short_description, model_type, is_visible, created_at")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    slotElements.forEach((slot) => {
      slot.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">🖼️</div>';
    });
    return;
  }

  const projects = data;
  const slotState = slotElements.map(() => ({
    cleanup: null,
    currentIndex: -1
  }));

  const renderProjectInSlot = async (slot, state, project) => {
    if (state.cleanup) {
      state.cleanup();
      state.cleanup = null;
    }

    const modelType = getModelType(project);
    if (!project.file_url) {
      slot.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">🧩</div>';
      return;
    }

    if (modelType === "svg") {
      slot.innerHTML = `
        <img src="${project.file_url}" alt="${project.file_name || "Project preview"}" style="width:100%;height:100%;object-fit:cover;border-radius:0.75rem;" />
      `;
      return;
    }

    if (modelType === "stl" || modelType === "obj") {
      try {
        state.cleanup = await initModelPreview(slot, project.file_url, modelType);
      } catch {
        slot.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">⚠️</div>';
      }
      return;
    }

    slot.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">📦</div>';
  };

  const pickUniqueIndices = (count, previousIndices) => {
    const target = Math.min(count, projects.length);
    const allIndices = projects.map((_, idx) => idx);

    const primaryPool = allIndices.filter((idx) => !previousIndices.has(idx));
    const fallbackPool = allIndices.filter((idx) => previousIndices.has(idx));
    const result = [];

    while (result.length < target && primaryPool.length > 0) {
      const randomPos = Math.floor(Math.random() * primaryPool.length);
      result.push(primaryPool.splice(randomPos, 1)[0]);
    }

    while (result.length < target && fallbackPool.length > 0) {
      const randomPos = Math.floor(Math.random() * fallbackPool.length);
      result.push(fallbackPool.splice(randomPos, 1)[0]);
    }

    return result;
  };

  const renderAllSlots = async () => {
    const previousIndices = new Set(slotState.map((slot) => slot.currentIndex).filter((idx) => idx >= 0));
    const nextIndices = pickUniqueIndices(slotElements.length, previousIndices);

    await Promise.all(slotElements.map(async (slot, idx) => {
      const projectIndex = nextIndices[idx] ?? nextIndices[0] ?? 0;
      const project = projects[projectIndex];
      slotState[idx].currentIndex = projectIndex;
      await renderProjectInSlot(slot, slotState[idx], project);
    }));
  };

  await renderAllSlots();
  window.setInterval(renderAllSlots, 9200);
});
