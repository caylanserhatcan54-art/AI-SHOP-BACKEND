import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase-admin";

export class AuthService {
  async register(email: string, password: string) {
    const userRef = db.collection("users").doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return { ok: false, error: "email_exists" };
    }

    const hashed = await bcrypt.hash(password, 10);

    await userRef.set({
      email,
      password: hashed,
      createdAt: Date.now()
    });

    return { ok: true };
  }

  async login(email: string, password: string) {
    const userRef = db.collection("users").doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { ok: false, error: "invalid_credentials" };
    }

    const user = userDoc.data() as any;

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { ok: false, error: "invalid_credentials" };
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "mystery-key",
      { expiresIn: "7d" }
    );

    return { ok: true, token };
  }
}

export const authService = new AuthService();
