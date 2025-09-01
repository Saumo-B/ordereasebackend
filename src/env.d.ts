declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    MERCHANT_ID: string;
    SALT_KEY: string;
    SALT_INDEX: string;
    NODE_ENV?: "development" | "production" | "test";
  }
}