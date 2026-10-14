const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

let db;
// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin login is not configured on the server."
      });
    }

    if (
      typeof password !== "string" ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin password."
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Admin login successful.",
      token
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to log in."
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Momentsia Backend is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    api: "healthy",
    database: db ? "connected" : "disconnected"
  });
});

// Save a booking request to MongoDB
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      name, email, eventType, venue, theme, menu,
      date, guests, package: packageName, notes
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !eventType ||
      !venue ||
      !theme ||
      !menu ||
      !date ||
      !packageName ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details."
      });
    }

    if (date < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({
        success: false,
        message: "Please select today or a future date."
      });
    }

    const prices = { Basic: 1500, Premium: 3000, Luxury: 5000 };

    if (!prices[packageName]) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid package."
      });
    }

    const booking = {
      id: `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email.trim(),
      eventType,
      venue,
      theme,
      menu,
      date,
      guests: Number(guests),
      package: packageName,
      estimatedCost: Number(guests) * prices[packageName],
      notes: typeof notes === "string" ? notes.trim() : "",
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    await db.collection("bookings").insertOne(booking);

    res.status(201).json({
      success: true,
      message: "Booking request saved successfully!",
      booking
    });
  } catch (error) {
    console.error("Booking error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to save booking. Please try again."
    });
  }
});

// Save a contact message to MongoDB
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all contact fields."
      });
    }

    const contactMessage = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("messages").insertOne(contactMessage);

    res.status(201).json({
      success: true,
      message: "Your message has been saved successfully.",
      id: result.insertedId
    });
  } catch (error) {
    console.error("Contact error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to save your message. Please try again."
    });
  }
});


// Admin API: list bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await db.collection("bookings")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 }).toArray();
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("List bookings error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load bookings." });
  }
});

// Admin API: list contact messages
app.get("/api/contact", async (req, res) => {
  try {
    const messages = await db.collection("messages")
      .find({}).sort({ createdAt: -1 }).toArray();
    res.json({
      success: true,
      messages: messages.map(({ _id, ...message }) => ({
        ...message, id: String(_id)
      }))
    });
  } catch (error) {
    console.error("List messages error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load messages." });
  }
});

// Admin API: update booking status
app.patch("/api/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status." });
    }
    const result = await db.collection("bookings").updateOne(
      { id: req.params.id }, { $set: { status } }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    res.json({ success: true, message: "Booking status updated." });
  } catch (error) {
    console.error("Update status error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update status." });
  }
});

// Admin API: delete booking
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const result = await db.collection("bookings").deleteOne({ id: req.params.id });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    res.json({ success: true, message: "Booking deleted." });
  } catch (error) {
    console.error("Delete booking error:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete booking." });
  }
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  db = client.db("momentsia");
  await db.command({ ping: 1 });

  console.log("MongoDB connected successfully!");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Momentsia backend running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
