import { Request, Response } from "express";
import Visitor from "../models/Visitor";

export const createVisitor = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = (req as any).user;

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin kullanıcısı ziyaretçi kaydı oluşturamaz",
      });
    }

    const visitor = await Visitor.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      tcNo: req.body.tcNo,
      phone: req.body.phone,
      plateNumber: req.body.plateNumber || "",
      visitTo: req.body.visitTo,
      campus: user.role,
      status: "İÇERİDE",
      createdBy: user.id,
    });

    return res.status(201).json(visitor);
  } catch (error) {
    return res.status(500).json({
      message: "Ziyaretçi kaydedilirken hata oluştu",
      error,
    });
  }
};

export const getVisitors = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = (req as any).user;

    const filter = user.role === "admin" ? {} : { campus: user.role };

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });

    return res.json(visitors);
  } catch (error) {
    return res.status(500).json({
      message: "Ziyaretçiler listelenirken hata oluştu",
      error,
    });
  }
};

export const getVisitorByTc = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = (req as any).user;
    const { tcNo } = req.params;

    const filter =
      user.role === "admin"
        ? { tcNo }
        : { tcNo, campus: user.role };

    const visitor = await Visitor.findOne(filter).sort({ createdAt: -1 });

    if (!visitor) {
      return res.status(404).json({
        message: "Bu TC kimlik numarasına ait eski kayıt bulunamadı",
      });
    }

    return res.json(visitor);
  } catch (error) {
    return res.status(500).json({
      message: "TC ile ziyaretçi aranırken hata oluştu",
      error,
    });
  }
};

export const exitVisitor = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin kullanıcısı çıkış işlemi yapamaz",
      });
    }

    const visitor = await Visitor.findOne({
      _id: id,
      campus: user.role,
    });

    if (!visitor) {
      return res.status(404).json({
        message: "Ziyaretçi kaydı bulunamadı",
      });
    }

    visitor.exitTime = new Date();
    visitor.status = "ÇIKIŞ YAPTI";

    await visitor.save();

    return res.json(visitor);
  } catch (error) {
    return res.status(500).json({
      message: "Çıkış işlemi yapılırken hata oluştu",
      error,
    });
  }
};