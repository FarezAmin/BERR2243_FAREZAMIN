// Week04.js - Maxim E-hailing Backend (Customer, Driver, Admin + JWT + Hashing)

require('dotenv').config();
console.log("🔐 JWT_SECRET loaded in backend:", process.env.JWT_SECRET);

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;
const uri = "mongodb+srv://b122310574:Frzamnddn09@cluster0.7crxdqp.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

// Middleware: Authentication and Role Authorization
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
};

/* ================================
   👤 CUSTOMER ROUTES
=================================*/

// Register Customer
app.post("/customers/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: "Missing fields" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = { name, email, password: hashedPassword, role: "customer" };

    try {
        const result = await db.collection("customers").insertOne(customer);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

// View Customer Profile
    app.get("/customers/:id", authenticate, authorize(["customer"]), async (req, res) => {
    const { id } = req.params;

    // 🔍 Add debugging logs here
    console.log("==== GET /customers/:id ====");
    console.log("Param ID:", id);                         // ID from URL
    console.log("Token userId:", req.user.userId);        // ID from JWT payload
    console.log("Token role:", req.user.role);            // Role from JWT

    // 🛡️ Optional access check (recommended)
    if (req.user.role !== "admin" && req.user.userId !== id) {
        console.log("⚠️ Blocked: user tried accessing another customer's data");
        return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    // ✅ Check valid ObjectId format
    if (!ObjectId.isValid(id)) {
        console.log("❌ Invalid MongoDB ID format");
        return res.status(400).json({ error: "Invalid ID" });
    }

    // 🔍 Attempt to find customer in DB
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(id) });

    if (customer) {
        console.log("✅ Customer found:", customer.email);
        res.json(customer);
    } else {
        console.log("❌ Customer not found");
        res.status(404).json({ error: "Customer not found" });
    }
});


/* ================================
   🚖 DRIVER ROUTES
=================================*/

// Register Driver
app.post("/drivers/register", async (req, res) => {
    const { name, email, password, vehicle, licensePlate } = req.body;
    if (!name || !email || !password || !vehicle || !licensePlate)
        return res.status(400).json({ error: "Missing fields" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const driver = {
        name, email, password: hashedPassword, vehicle, licensePlate,
        role: "driver", status: "unavailable", earnings: 0
    };

    try {
        const result = await db.collection("drivers").insertOne(driver);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Driver registration failed", details: err.message });
    }
});

// Update Driver Status
app.patch("/drivers/:id/status", authenticate, authorize(["driver"]), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const result = await db.collection("drivers").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    if (result.matchedCount === 0)
        return res.status(404).json({ error: "Driver not found" });

    res.json({ updated: result.modifiedCount });
});

// View Driver Earnings
app.get("/drivers/:id/earnings", authenticate, authorize(["driver"]), async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const driver = await db.collection("drivers").findOne({ _id: new ObjectId(id) });
    if (driver) res.json({ earnings: driver.earnings });
    else res.status(404).json({ error: "Driver not found" });
});

/* ================================
   🛡️ ADMIN ROUTES
=================================*/

// Register Admin
app.post("/admins/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: "Missing fields" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = { name, email, password: hashedPassword, role: "admin" };

    try {
        const result = await db.collection("admins").insertOne(admin);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Admin registration failed", details: err.message });
    }
});

// Admin blocks (deletes) a customer
app.delete("/admin/customers/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    try {
        const result = await db.collection("customers").deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0)
            return res.status(404).json({ error: "Customer not found" });

        res.status(200).json({ message: "Customer blocked (deleted)" });
    } catch (err) {
        res.status(500).json({ error: "Failed to block customer", details: err.message });
    }
});

// Admin views system analytics
app.get("/admin/analytics", authenticate, authorize(["admin"]), async (req, res) => {
    try {
        const totalCustomers = await db.collection("customers").countDocuments();
        const totalDrivers = await db.collection("drivers").countDocuments();
        const totalRides = await db.collection("rides").countDocuments();

        const rideStatusAgg = await db.collection("rides").aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();

        const rideStatusCounts = {};
        rideStatusAgg.forEach(item => { rideStatusCounts[item._id] = item.count; });

        res.status(200).json({ totalCustomers, totalDrivers, totalRides, rideStatusCounts });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

/* ================================
   🔐 AUTH ROUTE
=================================*/

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("🔥 Login attempt:", email);
    if (!email || !password)
        return res.status(400).json({ error: "Missing credentials" });

    // Search user in all roles
    const collections = ["customers", "drivers", "admins"];
    let user = null, role = null;

    for (const col of collections) {
        const found = await db.collection(col).findOne({ email });
        if (found) {
            user = found;
            role = found.role; // Already stored as "customer", "driver", or "admin"
            break;
        }
    }

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { userId: user._id.toString(), role },  // ← dynamic role
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    console.log("✅ Token generated for", role, ":", token);
    res.status(200).json({ token });
});



/* ================================
   🚕 RIDE ROUTES
=================================*/

app.post("/rides", authenticate, authorize(["customer"]), async (req, res) => {
    // 🧪 Add this log to inspect incoming request body
    console.log("📦 Incoming /rides request body:", req.body);

    const { pickup, destination, driver, passenger, status } = req.body;

    // 🔒 Still validate after logging
    if (!pickup || !destination || !driver || !passenger || !status) {
        console.log("❌ Missing field in ride creation request");
        return res.status(400).json({ error: "Missing ride fields." });
    }

    const newRide = { pickup, destination, driver, passenger, status };

    try {
        const result = await db.collection("rides").insertOne(newRide);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        console.error("❗ Error inserting ride:", error);
        res.status(500).json({ error: "Failed to create ride" });
    }
});


app.get("/rides", authenticate, authorize(["admin", "driver", "customer"]), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === "customer") {
            // Only return rides where the user is the passenger
            query = { passenger: req.user.userId };
        }

        // Fetch rides
        const rides = await db.collection("rides").find(query).toArray();

        // Add vehicle info to each ride by fetching the driver's data
        const enrichedRides = await Promise.all(rides.map(async (ride) => {
        try {
        const driverObj = await db.collection("drivers").findOne({ _id: new ObjectId(ride.driver) });
        if (driverObj) {
            ride.driverName = driverObj.name;
            ride.driverVehicle = driverObj.vehicle; // ✅ This line
            ride.driverPlate = driverObj.licensePlate;
        } else {
            ride.driverVehicle = "Unknown";
        }
        } catch (err) {
            ride.driverVehicle = "Error fetching vehicle";
        }
        return ride;
    }));


        res.status(200).json(enrichedRides);
    } catch (error) {
        console.error("Failed to fetch rides:", error);
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

app.patch("/rides/:id", authenticate, authorize(["driver"]), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ride ID" });

    const result = await db.collection("rides").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Ride not found" });
    res.status(200).json({ updated: result.modifiedCount });
});

app.delete("/rides/:id", authenticate, authorize(["admin"]), async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ride ID" });

    const result = await db.collection("rides").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Ride not found" });

    res.status(200).json({ deleted: true });
});

/* ================================
   🚀 SERVER SETUP
=================================*/

app.get("/", (req, res) => {
    res.send("\u2705 Maxim Ride-Hailing API is running.");
});

async function connectDB() {
    try {
        await client.connect();
        db = client.db("testDB");
        console.log("\u2705 Connected to MongoDB");
        app.listen(port, () => console.log(`\ud83d\ude80 Server running at http://localhost:${port}`));
    } catch (error) {
        console.error("\u274c MongoDB connection failed:", error);
    }
}

connectDB();
