import { Request, Response } from "express";
import Visitor from "../models/Visitor";

const isValidTcNo = (tcNo: string) => {
  if (!/^[1-9][0-9]{10}$/.test(tcNo)) {
    return false;
  }

  const digits = tcNo.split("").map(Number);

  const d1 = digits[0]!;
  const d2 = digits[1]!;
  const d3 = digits[2]!;
  const d4 = digits[3]!;
  const d5 = digits[4]!;
  const d6 = digits[5]!;
  const d7 = digits[6]!;
  const d8 = digits[7]!;
  const d9 = digits[8]!;
  const d10 = digits[9]!;
  const d11 = digits[10]!;

  const oddSum = d1 + d3 + d5 + d7 + d9;
  const evenSum = d2 + d4 + d6 + d8;

  const check10 = (oddSum * 7 - evenSum) % 10;
  const check11 =
    (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10) % 10;

  return d10 === check10 && d11 === check11;
};

const toUpperTR = (value: string) => {
  return String(value || "").trim().toLocaleUpperCase("tr-TR");
};

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

    const cleanTc = String(req.body.tcNo || "").trim();

    if (!isValidTcNo(cleanTc)) {
      return res.status(400).json({
        message: "Geçerli bir TC Kimlik No giriniz",
      });
    }

    const cardGiven = req.body.cardGiven === true;
    const cardNumber = String(req.body.cardNumber || "").trim();

    if (cardGiven && !cardNumber) {
      return res.status(400).json({
        message: "Ziyaretçi kartı verildiyse kart numarası girilmelidir",
      });
    }

    const activeVisitor = await Visitor.findOne({
      tcNo: cleanTc,
      campus: user.role,
      status: "İÇERİDE",
    });

    if (activeVisitor) {
      return res.status(400).json({
        message:
          "Bu ziyaretçi hâlen içeride görünüyor. Yeni giriş kaydı oluşturulamaz.",
      });
    }

    const visitor = await Visitor.create({
      firstName: toUpperTR(req.body.firstName),
      lastName: toUpperTR(req.body.lastName),
      tcNo: cleanTc,
      phone: req.body.phone || "",
      plateNumber: toUpperTR(req.body.plateNumber || ""),
      visitTo: toUpperTR(req.body.visitTo),
      description: req.body.description || "",
      cardGiven,
      cardNumber: cardGiven ? cardNumber : "",
      campus: user.role,
      status: "İÇERİDE",
      createdBy: user.id,
    });

    return res.status(201).json(visitor);
} catch (error) {
  console.error("Ziyaretçi kayıt hatası:", error);

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

    const cleanTc = String(tcNo || "").trim();

    const filter =
      user.role === "admin"
        ? { tcNo: cleanTc }
        : { tcNo: cleanTc, campus: user.role };

    const visitor = await Visitor.findOne(filter).sort({ createdAt: -1 });

    if (!visitor) {
      return res.status(404).json({
        message: "Bu TC kimlik numarasına ait eski kayıt bulunamadı",
      });
    }

    const activeVisitor = await Visitor.findOne({
      ...filter,
      status: "İÇERİDE",
    });

    return res.json({
      ...visitor.toObject(),
      isInside: !!activeVisitor,
    });
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

    if (visitor.status === "ÇIKIŞ YAPTI") {
      return res.status(400).json({
        message: "Bu ziyaretçinin çıkışı zaten yapılmış",
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