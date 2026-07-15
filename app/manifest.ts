import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Overload - Progressive Workout Tracker',
    short_name: 'Overload',
    description: 'Train. Track. Progress.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    categories: ['fitness', 'health', 'productivity'],
    shortcuts: [
      {
        name: 'Start Workout',
        short_name: 'Start',
        description: 'Choose a workout template',
        url: '/workouts',
      },
      {
        name: 'Progress',
        short_name: 'Progress',
        description: 'View progressive overload charts',
        url: '/progress',
      },
    ],
  }
}
