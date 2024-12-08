import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        include: ['three', 'three-mesh-bvh'], // 配列形式で複数の依存関係を指定
    },
});
