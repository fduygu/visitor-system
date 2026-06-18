import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const login = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username,
      password,
    });

    if (!user) {
      return res.status(401).json({
        message: "Kullanıcı adı veya şifre hatalı",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Sunucu hatası",
      error,
    });
  }
};