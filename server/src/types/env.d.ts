declare namespace NodeJS {
    interface ProcessEnv {
      DB_TYPE: string;
      MONGODB_URI: string;
      MONGODB_DB: string;
      PORT?: string;
    }
  }
  