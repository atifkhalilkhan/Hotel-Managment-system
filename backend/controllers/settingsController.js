import HotelSettings from "../models/HotelSettings.js";

const ROOM_TYPES = ["single", "double", "deluxe", "suite"];
const DEFAULT_POLICIES = {
  checkInTime: "14:00",
  checkOutTime: "11:00",
  cancellation: "Contact the hotel as early as possible to change or cancel a reservation.",
  smoking: "Smoking is not permitted in guest rooms.",
  children: "Children are welcome. Contact the hotel for cot availability.",
};
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toSettingsResponse(settings) {
  const envTaxRate = Number(process.env.TAX_RATE);
  return {
    taxRate: settings?.taxRate ?? (Number.isFinite(envTaxRate) && envTaxRate >= 0 ? envTaxRate : 0),
    roomRates: Object.fromEntries(ROOM_TYPES.map((type) => [type, settings?.roomRates?.[type] ?? null])),
    policies: { ...DEFAULT_POLICIES, ...settings?.policies },
    updatedAt: settings?.updatedAt || null,
  };
}

function parseRate(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error(`${field} must be a non-negative number or left blank`);
  }
  return rate;
}

export const getSettings = async (req, res, next) => {
  try {
    const settings = await HotelSettings.findOne({ key: "default" }).lean();
    return res.json(toSettingsResponse(settings));
  } catch (error) {
    return next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const taxRate = Number(body.taxRate);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ message: "Tax rate must be between 0 and 100" });
    }

    if (!body.roomRates || typeof body.roomRates !== "object" || Array.isArray(body.roomRates)) {
      return res.status(400).json({ message: "Room-type rates are required" });
    }
    const roomRates = {};
    for (const type of ROOM_TYPES) {
      try {
        roomRates[type] = parseRate(body.roomRates[type], `${type} room rate`);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const policies = body.policies || {};
    const checkInTime = String(policies.checkInTime || "");
    const checkOutTime = String(policies.checkOutTime || "");
    if (!TIME_PATTERN.test(checkInTime) || !TIME_PATTERN.test(checkOutTime)) {
      return res.status(400).json({ message: "Check-in and check-out times must use 24-hour HH:MM format" });
    }

    const textPolicies = {};
    for (const [field, maxLength] of [["cancellation", 1000], ["smoking", 500], ["children", 500]]) {
      const value = typeof policies[field] === "string" ? policies[field].trim() : "";
      if (!value || value.length > maxLength) {
        return res.status(400).json({ message: `${field} policy is required and must be at most ${maxLength} characters` });
      }
      textPolicies[field] = value;
    }

    const settings = await HotelSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          taxRate,
          roomRates,
          policies: { checkInTime, checkOutTime, ...textPolicies },
          updatedBy: req.user._id,
        },
        $setOnInsert: { key: "default" },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(toSettingsResponse(settings));
  } catch (error) {
    return next(error);
  }
};
