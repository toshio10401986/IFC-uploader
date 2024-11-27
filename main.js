import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

// グローバルスコープで model を宣言
let model = null;

(async () => {
  const container = document.getElementById("container");
  const uploadArea = document.getElementById("upload-area");
  const boundingBoxMenu = document.querySelector(".bounding-box-menu");

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

  // BoundingBoxerのセットアップ
  const boundingBoxer = components.get(OBC.BoundingBoxer);

  // IFCファイル読み込み関数
  async function loadIfc(file) {
    uploadArea.textContent = "Uploading...";
    uploadArea.style.pointerEvents = "none"; // 操作を無効化

    const reader = new FileReader();

    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);

      // IFCモデルをロード
      model = await fragmentIfcLoader.load(uint8Array); // グローバル変数に設定
      if (!model) {
        alert("Failed to load IFC model.");
        return;
      }
      model.name = "IFC Model";
      world.scene.three.add(model);

      // モデルをBoundingBoxerに追加
      boundingBoxer.add(model);

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

  // Bounding Box ボタンクリック処理
  boundingBoxMenu.addEventListener("click", () => {
    if (model) {
      // まずBoundingBoxerをリセットしてから処理を開始
      boundingBoxer.reset();

      // モデルをBoundingBoxerに再度追加
      boundingBoxer.add(model);

      // Bounding BoxのMeshを取得
      const bboxMesh = boundingBoxer.getMesh();
      const bbox = new THREE.Box3().setFromObject(bboxMesh);

      // Bounding Boxの中心とサイズを計算
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3()).length();
      const distance = size * 1.5;

      // カメラをBounding Boxに合わせて移動
      world.camera.controls.setLookAt(
        distance,
        distance,
        distance,
        center.x,
        center.y,
        center.z,
        true
      );

      // 最後にBoundingBoxerをリセットして終了
      boundingBoxer.reset();
    } else {
      console.error("No model loaded. Please upload an IFC file first.");
    }
  });

  console.log("IFC Viewer is ready!");
})();
