import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

(async () => {
  const container = document.getElementById("container");
  const uploadArea = document.getElementById("upload-area");

  // アップロード画面が消えないようにするためのスタイル調整
  uploadArea.style.display = "block";

  const components = new OBC.Components();

  // ワールドのセットアップ
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create();
  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBCF.PostproductionRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  components.init();
  world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);
  world.scene.setup();

  // グリッドの追加
  const grids = components.get(OBC.Grids);
  grids.create(world);

  // WASMセットアップ
  const fragmentIfcLoader = components.get(OBC.IfcLoader);
  await fragmentIfcLoader.setup({
    wasm: {
      path: "https://unpkg.com/web-ifc@0.0.57/",
      absolute: true,
    },
  });

  // IFCファイル読み込み関数
  async function loadIfc(file) {
    uploadArea.textContent = "Uploading...";
    uploadArea.style.pointerEvents = "none"; // 操作を無効化

    const reader = new FileReader();

    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);

      // IFCモデルをロード
      const model = await fragmentIfcLoader.load(uint8Array);
      if (!model) {
        alert("Failed to load IFC model.");
        return;
      }
      model.name = "IFC Model";
      world.scene.three.add(model);

      // モデルにカメラを合わせる
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const distance = size * 1.5;
      world.camera.controls.setLookAt(
        distance,
        distance,
        distance,
        center.x,
        center.y,
        center.z
      );

      // アップロード画面のリセット
      uploadArea.textContent = "Drag & Drop IFC File Here or Click to Upload";
      uploadArea.style.pointerEvents = "auto"; // 操作を有効化
    };

    reader.readAsArrayBuffer(file);
  }

  // ドラッグアンドドロップのイベントリスナー
  uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = "#00ff00";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "#007bff";
  });

  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = "#007bff";
    const file = event.dataTransfer.files[0];
    if (file) {
      loadIfc(file);
    }
  });

  // クリックでファイル選択
  uploadArea.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ifc";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        loadIfc(file);
      }
    };
    input.click();
  });

  console.log("IFC Viewer is ready!");
})();
