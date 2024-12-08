import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as CUI from "@thatopen/ui";
import * as BUI from "@thatopen/ui";

(async () => {
  const container = document.getElementById("container");
  const uploadArea = document.getElementById("upload-area");

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

  // FragmentsManagerのセットアップ
  const fragmentsManager = components.get(OBC.FragmentsManager);
  fragmentsManager.onFragmentsLoaded.add((model) => {
    if (world.scene) world.scene.three.add(model);
  });

  // BoundingBoxerのセットアップ
  const boundingBoxer = components.get(OBC.BoundingBoxer);

  // モデル管理リストのセットアップ
  try {
    const [modelsList] = CUI.tables.modelsList({
      components,
      tags: { schema: true, viewDefinition: false },
      actions: { download: false },
    });

    if (!modelsList) {
      console.error("Failed to initialize models list.");
      return;
    }

    const panel = BUI.Component.create(() => {
      const [loadIfcBtn] = CUI.buttons.loadIfc({ components });

      return BUI.html`
        <bim-panel label="IFC Models">
          <bim-panel-section label="Importing">
            ${loadIfcBtn}
          </bim-panel-section>
          <bim-panel-section icon="mage:box-3d-fill" label="Loaded Models">
            ${modelsList}
          </bim-panel-section>
        </bim-panel>
      `;
    });

    const app = document.createElement("bim-grid");
    app.layouts = {
      main: {
        template: `
          "panel viewport"
          / 23rem 1fr
        `,
        elements: { panel, viewport: container },
      },
    };

    app.layout = "main";
    document.body.append(app);
  } catch (error) {
    console.error("Error setting up models list or panel:", error);
  }

  // IFCファイル読み込み関数
  async function loadIfc(file) {
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

      // モデルをBoundingBoxerに追加
      boundingBoxer.add(model);
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

  console.log("IFC Viewer with Model Management is ready!");
})();
