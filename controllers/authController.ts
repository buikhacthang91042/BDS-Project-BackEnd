import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import passport from "passport";

export const register = async (req: Request, res: Response) => {
  console.log("Received request to /api/auth/register:", req.body);
  const { firstName, lastName, phone, password } = req.body;
  const name = `${firstName} ${lastName}`.trim();

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone]
    );
    if (existingUser.rows.length > 0) {
      console.log("User already exists with phone:", phone);
      return res.status(400).json({ message: "Người dùng đã tồn tại !" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, phone, password) VALUES ($1,$2,$3)",
      [name, phone, hashedPassword]
    );
    console.log("User registered successfully:", phone);
    return res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    console.error("Lỗi khi đăng ký người dùng:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [
      phone,
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Mật khẩu không đúng" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token hết hạn" });
    const decode = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const result = await pool.query(
      "SELECT name, phone, email FROM users WHERE id = $1",
      [decode.id]
    );
    const user = result.rows[0];
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.status(200).json({
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "http://localhost:3000/authen?error=google_failed",
  session: false,
});

export const googleCallbackHandler = (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) {
    console.error("User not found in googleCallbackHandler");
    return res.redirect("http://localhost:3000/authen?error=google_failed");
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  res.redirect(
    `http://localhost:3000/authen?token=${token}&name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email || "")}`
  );
};

export const facebookAuth = passport.authenticate("facebook", {
  scope: ["public_profile", "email"],
});

export const facebookAuthCallback = passport.authenticate("facebook", {
  failureRedirect: "http://localhost:3000/authen?error=facebook_failed",
  session: false,
});

export const facebookCallbackHandler = (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) {
    console.error("User not found in facebookCallbackHandler");
    return res.redirect("http://localhost:3000/authen?error=facebook_failed");
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  res.redirect(
    `http://localhost:3000/authen?token=${token}&name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email || "")}`
  );
};

export default {
  register,
  login,
  getMe,
  googleAuth,
  googleAuthCallback,
  googleCallbackHandler,
  facebookAuth,
  facebookAuthCallback,
  facebookCallbackHandler,
};
