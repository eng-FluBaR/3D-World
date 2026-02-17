import { onReady } from "../utils/dom.js";
import { createSupabaseClient } from "../services/supabase.js";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

function extractTags(project) {
  const category = String(project?.category || "Общи");
  return category
    .split(/[;,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

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

function renderEmpty(host) {
  host.innerHTML = `
    <div class="col-12">
      <div class="alert alert-secondary mb-0">Все още няма публикувани завършени проекти.</div>
    </div>
  `;
}

function renderNoFilterMatch(host) {
  host.innerHTML = `
    <div class="col-12">
      <div class="alert alert-secondary mb-0">Няма проекти за избрания таг.</div>
    </div>
  `;
}

function renderError(host, message) {
  host.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger mb-0">${message}</div>
    </div>
  `;
}

function renderProjectCard(project) {
  const category = project.category || "Общи";
  const description = project.short_description || "Няма добавено описание.";
  const fileName = project.file_name || "Завършен проект";
  const modelType = getModelType(project);

  let previewBlock = '<div class="border rounded-3 bg-light d-flex align-items-center justify-content-center text-muted" style="height:220px;">Няма preview</div>';

  if (modelType === "svg" && project.file_url) {
    previewBlock = `<div class="border rounded-3 overflow-hidden" style="height:220px;"><img src="${project.file_url}" alt="${fileName}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  }

  if ((modelType === "stl" || modelType === "obj") && project.file_url) {
    previewBlock = `<div class="border rounded-3 bg-light model-preview" data-model-url="${project.file_url}" data-model-type="${modelType}" style="height:220px;"></div>`;
  }

  const detailsLink = project.file_url
    ? `<a class="btn btn-sm btn-outline-primary mt-3" href="${project.file_url}" target="_blank" rel="noopener noreferrer">Преглед на файл</a>`
    : "";

  return `
    <div class="col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="mb-3">
            ${previewBlock}
          </div>
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0 text-break">${fileName}</h6>
            <span class="badge bg-primary ms-2">${category}</span>
          </div>
          <p class="text-muted mb-0">${description}</p>
          ${detailsLink}
        </div>
      </div>
    </div>
  `;
}

async function initModelPreview(container) {
  const url = container.getAttribute("data-model-url");
  const type = container.getAttribute("data-model-type");
  if (!url || !type) return;

  try {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(30, 40, 60);
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
      return;
    }

    const box = new THREE.Box3().setFromObject(object3D);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 70 / maxDim;
    object3D.scale.setScalar(scale);

    const animate = () => {
      object3D.rotation.y += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();
  } catch (err) {
    container.innerHTML = '<div class="d-flex align-items-center justify-content-center text-muted h-100">Preview unavailable</div>';
  }
}

onReady(async () => {
  const host = document.getElementById("gallery-projects");
  const tagFilter = document.getElementById("gallery-tag-filter");
  if (!host) return;

  const client = createSupabaseClient();

  const { data, error } = await client
    .from("gallery_projects")
    .select("id, file_name, file_url, category, short_description, model_type, is_visible, created_at")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    renderError(host, "Неуспешно зареждане на галерията.");
    return;
  }

  if (!data || data.length === 0) {
    renderEmpty(host);
    return;
  }

  const allProjects = data.map((project) => ({
    ...project,
    tags: extractTags(project)
  }));

  const renderProjects = async (projects) => {
    if (!projects || projects.length === 0) {
      renderNoFilterMatch(host);
      return;
    }

    host.innerHTML = projects.map(renderProjectCard).join("");
    const modelPreviewNodes = Array.from(host.querySelectorAll(".model-preview"));
    await Promise.all(modelPreviewNodes.map((node) => initModelPreview(node)));
  };

  const uniqueTags = Array.from(
    new Set(
      allProjects.flatMap((project) => project.tags)
    )
  ).sort((a, b) => a.localeCompare(b, "bg"));

  if (tagFilter) {
    const options = ['<option value="">Всички</option>']
      .concat(uniqueTags.map((tag) => `<option value="${tag}">${tag}</option>`));

    tagFilter.innerHTML = options.join("");
    tagFilter.addEventListener("change", async () => {
      const selectedTag = tagFilter.value;
      const filteredProjects = selectedTag
        ? allProjects.filter((project) => project.tags.includes(selectedTag))
        : allProjects;

      await renderProjects(filteredProjects);
    });
  }

  await renderProjects(allProjects);
});
