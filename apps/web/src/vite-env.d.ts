/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*/VERSION.json' {
  interface VersionData {
    version: string;
    releaseDate: string;
    codename: string;
    description: string;
    breaking: boolean;
    changelog: Array<{
      type: string;
      category: string;
      description: string;
      impact: string;
    }>;
    previousVersion: string;
  }
  const value: VersionData;
  export default value;
}
