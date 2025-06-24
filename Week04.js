// Week04.js - Maxim E-hailing Backend (Customer, Driver, Admin)

const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

const uri = "mongodb+srv://b122310574:Frzamnddn09@cluster0.7crxdqp.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

/* ================================
   👤 CUSTOMER ROUTES
=================================*/

// Register Customer
app.post("/customers/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: "Missing fields" });

    const customer = { name, email, password, role: "customer" };

    try {
        const result = await db.collection("customers").insertOne(customer);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

// View Customer Profile
app.get("/customers/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

    const customer = await db.collection("customers").findOne({ _id: new ObjectId(id), role: "customer" });
    if (customer) res.json(customer);
    else res.status(404).json({ error: "Customer not found" });
});


/* ================================
   🚖 DRIVER ROUTES
=================================*/

// Register Driver
app.post("/drivers/register", async (req, res) => {
    const { name, email, password, licensePlate } = req.body;
    if (!name || !email || !password || !licensePlate)
        return res.status(400).json({ error: "Missing fields" });

    const driver = {
        name,
        email,
        password,
        licensePlate,
        role: "driver",
        status: "unavailable",
        earnings: 0
    };

    try {
        const result = await db.collection("drivers").insertOne(driver);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Driver registration failed", details: err.message });
    }
});

// Update Driver Status
app.patch("/drivers/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

    const result = await db.collection("drivers").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    if (result.matchedCount === 0)
        return res.status(404).json({ error: "Driver not found" });

    res.json({ updated: result.modifiedCount });
});

// View Driver Earnings
app.get("/drivers/:id/earnings", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

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

    const admin = { name, email, password, role: "admin" };

    try {
        const result = await db.collection("admins").insertOne(admin);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: "Admin registration failed", details: err.message });
    }
});

// Admin blocks (deletes) a customer
app.delete("/admin/customers/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

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
app.get("/admin/analytics", async (req, res) => {
    try {
        const totalCustomers = await db.collection("customers").countDocuments();
        const totalDrivers = await db.collection("drivers").countDocuments();
        const totalRides = await db.collection("rides").countDocuments();

        const rideStatusAgg = await db.collection("rides").aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();

        const rideStatusCounts = {};
        rideStatusAgg.forEach(item => {
            rideStatusCounts[item._id] = item.count;
        });

        res.status(200).json({
            totalCustomers,
            totalDrivers,
            totalRides,
            rideStatusCounts
        });
    } catch (error) {
        console.error("❌ Failed to fetch analytics:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});


/* ================================
   🔐 AUTH ROUTE (Unified Login)
=================================*/

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Missing credentials" });

    const customer = await db.collection("customers").findOne({ email, password });
    const driver = await db.collection("drivers").findOne({ email, password });
    const admin = await db.collection("admins").findOne({ email, password });

    if (customer) {
        res.status(200).json({ message: "Customer login successful", role: "customer", customer });
    } else if (driver) {
        res.status(200).json({ message: "Driver login successful", role: "driver", driver });
    } else if (admin) {
        res.status(200).json({ message: "Admin login successful", role: "admin", admin });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});


/* ================================
   🚕 RIDE ROUTES
=================================*/

// Create Ride
app.post("/rides", async (req, res) => {
    const { pickup, destination, driver, vehicle, passenger, status } = req.body;
    if (!pickup || !destination || !driver || !vehicle || !passenger || !status)
        return res.status(400).json({ error: "Missing ride fields." });

    const newRide = { pickup, destination, driver, vehicle, passenger, status };

    try {
        const result = await db.collection("rides").insertOne(newRide);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Failed to create ride" });
    }
});

// Get All Rides
app.get("/rides", async (req, res) => {
    try {
        const rides = await db.collection("rides").find().toArray();
        res.status(200).json(rides);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

// Update Ride Status
app.patch("/rides/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ride ID" });

    const result = await db.collection("rides").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
    );

    if (result.matchedCount === 0)
        return res.status(404).json({ error: "Ride not found" });

    res.status(200).json({ updated: result.modifiedCount });
});

// Delete Ride
app.delete("/rides/:id", async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ride ID" });

    const result = await db.collection("rides").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
        return res.status(404).json({ error: "Ride not found" });

    res.status(200).json({ deleted: true });
});


/* ================================
   🚀 SERVER SETUP
=================================*/

app.get("/", (req, res) => {
    res.send("✅ Maxim Ride-Hailing API is running.");
});

async function connectDB() {
    try {
        await client.connect();
        db = client.db("testDB");
        console.log("✅ Connected to MongoDB");

        app.listen(port, () => {
            console.log(`🚀 Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
    }
}

connectDB();
