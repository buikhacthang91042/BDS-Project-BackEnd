import { success } from "zod";
import Listing from "../models/Listing";
import { Response, Request } from "express";
export const getHotSpot = async (req: Request, res: Response) => {
  try {
    const { province } = req.query;
    let matchStage: any = {};
    if (province) {
      matchStage = { province: province };
    }
    const hotspot = await Listing.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: province ? "$district" : "$province",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: hotspot });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceTrends = async (req: Request, res: Response) => {
  try {
    const { province } = req.query;

    let matchStage: any = {};
    if (province) {
      matchStage = { province: province };
    }

    const trends = await Listing.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$dateScraped" },
            month: { $month: "$dateScraped" },
            location: province ? "$district" : "$province",
          },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getHotSpot, getPriceTrends };
