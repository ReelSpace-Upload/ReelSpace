import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'grid-pattern': "url('/grid.svg')",
      }
    }
  }
}