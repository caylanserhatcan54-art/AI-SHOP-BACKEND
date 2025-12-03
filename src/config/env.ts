export interface EnvConfig {
  port: number;
  firestoreProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  openAiApiKey?: string;
  ollamaBaseUrl?: string;
  stripeSecretKey?: string;
  jwtSecret: string;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 4000,
  firestoreProjectId: process.env.FIRESTORE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  openAiApiKey: process.env.OPENAI_API_KEY,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET || 'change-me'
};