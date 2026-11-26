/*
 * Rooms seed: 11 rooms (single, double, deluxe, suite), har ek ki tasveer Cloudinary par.
 *
 *   npm run seed:rooms            -> rooms banata hai
 *   npm run seed:rooms -- --dry   -> sirf dikhata hai ke kya banega, kuch nahi likhta
 *
 * Dobara chalana safe hai: jo room number pehle se database mein hai use chhor deta hai.
 * Tasveeren admin panel wale folder (luxurystay/rooms) mein jati hain, is liye room ko
 * portal se edit/delete karna bilkul waise hi kaam karta hai jaise haath se banaye room ka.
 * Photos: Unsplash (commercial use free, credit zaroori nahi).
 */
import "dotenv/config";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Room from "../models/Room.js";

const DRY_RUN = process.argv.includes("--dry");
const FOLDER = "luxurystay/rooms";

const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fm=jpg&fit=crop&w=1600&h=1067&q=80`;

const AMENITIES = {
  single: ["WiFi", "AC", "TV", "Safe"],
  double: ["WiFi", "AC", "TV", "Mini Bar", "Safe"],
  deluxe: ["WiFi", "AC", "TV", "Mini Bar", "Balcony", "Safe", "Room Service"],
  suite: ["WiFi", "AC", "TV", "Mini Bar", "Balcony", "Safe", "Room Service", "Parking"],
};

const ROOMS = [
  // ---- Floor 1: Single ----
  {
    roomNumber: "101",
    type: "single",
    floor: 1,
    capacity: 1,
    pricePerNight: 9500,
    description:
      "A quiet single room with a full-size bed, a work desk and blackout curtains. A practical choice for business trips and short stays.",
    photos: ["1631049307264-da0ec9d70304"],
  },
  {
    roomNumber: "102",
    type: "single",
    floor: 1,
    capacity: 1,
    pricePerNight: 10000,
    description:
      "A calm, modern single room with soft lighting, fresh linen and a reading lamp by the bed. Everything you need for a restful night.",
    photos: ["1586105251261-72a756497a11"],
  },
  {
    roomNumber: "103",
    type: "single",
    floor: 1,
    capacity: 1,
    pricePerNight: 10500,
    description:
      "Our largest single room, with a queen-size bed and extra space to unpack. Good for solo travellers staying a few nights.",
    photos: ["1522771739844-6a9f6d5f14af"],
  },

  // ---- Floor 2: Double ----
  {
    roomNumber: "201",
    type: "double",
    floor: 2,
    capacity: 2,
    pricePerNight: 15000,
    description:
      "A bright double room with a king-size bed, an upholstered headboard and garden-facing windows. Comfortable for couples and short getaways.",
    photos: ["1505693416388-ac5ce068fe85"],
  },
  {
    roomNumber: "202",
    type: "double",
    floor: 2,
    capacity: 2,
    pricePerNight: 16500,
    description:
      "A spacious double room with a king-size bed, bedside lamps on both sides and a large window. Plenty of room for two to settle in.",
    photos: ["1540518614846-7eded433c457"],
  },
  {
    roomNumber: "203",
    type: "double",
    floor: 2,
    capacity: 2,
    pricePerNight: 15500,
    description:
      "A twin room with two separate beds, a seating corner and a work desk. Ideal for friends, colleagues or a parent travelling with a child.",
    photos: ["1595576508898-0ad5c879a061"],
  },

  // ---- Floor 3: Deluxe ----
  {
    roomNumber: "301",
    type: "deluxe",
    floor: 3,
    capacity: 3,
    pricePerNight: 24000,
    description:
      "A deluxe room with a king-size bed, a lounge chair and a writing desk. Extra space and thoughtful touches for a longer, more relaxed stay.",
    photos: ["1591088398332-8a7791972843", "1566665797739-1674de7a421a"],
  },
  {
    roomNumber: "302",
    type: "deluxe",
    floor: 3,
    capacity: 3,
    pricePerNight: 26000,
    description:
      "A corner deluxe room with floor-to-ceiling windows and city views. A king-size bed, a private balcony and room for an extra guest.",
    photos: ["1616594039964-ae9021a400a0", "1609766857041-ed402ea8069a"],
  },
  {
    roomNumber: "303",
    type: "deluxe",
    floor: 3,
    capacity: 3,
    pricePerNight: 25000,
    description:
      "A warm, generously sized deluxe room with a seating area by the windows. Comfortable for families or guests who like space to unwind.",
    photos: ["1592229505726-ca121723b8ef", "1611892440504-42a792e24d32"],
  },

  // ---- Floor 4: Suite ----
  {
    roomNumber: "401",
    type: "suite",
    floor: 4,
    capacity: 4,
    pricePerNight: 42000,
    description:
      "A one-bedroom suite with a separate living room, a sofa and large windows. Space to work, relax and host, with the bedroom kept quiet.",
    photos: ["1631049552057-403cdb8f0658", "1598928506311-c55ded91a20c"],
  },
  {
    roomNumber: "402",
    type: "suite",
    floor: 4,
    capacity: 4,
    pricePerNight: 48000,
    description:
      "Our largest suite, with an open living and dining area, a king-size bed and wide windows. Made for families and longer stays.",
    photos: ["1578683010236-d716f9a3f461", "1560185007-cde436f6a4d0"],
  },
];

const uploadPhotos = async (room) => {
  const uploaded = [];
  try {
    for (const [index, id] of room.photos.entries()) {
      const result = await cloudinary.uploader.upload(photo(id), {
        folder: FOLDER,
        public_id: `seed-room-${room.roomNumber}-${index + 1}`,
        overwrite: true,
        resource_type: "image",
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
    return uploaded;
  } catch (error) {
    await removePhotos(uploaded);
    throw error;
  }
};

const removePhotos = (images) =>
  Promise.allSettled(images.map((image) => cloudinary.uploader.destroy(image.publicId)));

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing in .env");
  if (!DRY_RUN && !process.env.CLOUDINARY_CLOUD_NAME) throw new Error("Cloudinary keys are missing in .env");

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = new Set(
    (await Room.find({ roomNumber: { $in: ROOMS.map((room) => room.roomNumber) } }).select("roomNumber").lean()).map(
      (room) => room.roomNumber
    )
  );

  let created = 0;
  let failed = 0;
  for (const { photos, ...room } of ROOMS) {
    const label = `${room.roomNumber} (${room.type}, PKR ${room.pricePerNight.toLocaleString()})`;
    if (existing.has(room.roomNumber)) {
      console.log(`skip    ${label}: already exists`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`create  ${label}: ${photos.length} photo(s)`);
      continue;
    }

    let images = [];
    try {
      images = await uploadPhotos({ ...room, photos });
      await Room.create({ ...room, status: "available", amenities: AMENITIES[room.type], images });
      created += 1;
      console.log(`created ${label}`);
    } catch (error) {
      await removePhotos(images);
      failed += 1;
      console.error(`failed  ${label}: ${error.message}`);
    }
  }

  console.log(DRY_RUN ? "\nDry run: nothing was written." : `\nDone: ${created} created, ${failed} failed.`);
  return failed;
};

run()
  .then(async (failed) => {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  })
  .catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
