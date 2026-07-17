import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project is served from https://<user>.github.io/8bitPlanningPoker/
export default defineConfig({
  base: '/8bitPlanningPoker/',
  plugins: [react()],
})
