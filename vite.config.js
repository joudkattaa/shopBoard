import { defineConfig } from 'vite'
import { productsMiddleware } from './server/products-api.js'

export default defineConfig({
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  plugins: [
    {
      name: 'roseveil-products-api',
      configureServer(server) {
        server.middlewares.use(productsMiddleware(true))
      },
      configurePreviewServer(server) {
        server.middlewares.use(productsMiddleware(false))
      },
    },
  ],
})
