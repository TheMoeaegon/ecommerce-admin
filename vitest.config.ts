import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          include: ['src/**/*.test.ts'],
          env: { APP_STAGE: 'test' },
          sequence: { groupOrder: 1 },
        },
      },
      {
        test: {
          name: 'integration',
          globals: true,
          include: ['tests/**/*.test.ts'],
          globalSetup: ['./tests/setup/globalSetup.ts'],
          clearMocks: true,
          restoreMocks: true,
          pool: 'threads',
          fileParallelism: false,
          sequence: {
            concurrent: false,
            groupOrder: 2,
          },
          isolate: false,
        },
      },
    ],
  },
  plugins: [],
});
