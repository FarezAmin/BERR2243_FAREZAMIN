const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors()); 
app.use(express.json());

const port = 3000;

// Middleware to parse JSON
app.use(express.json());

const uri = "mongodb+srv://b122310574:Frzamnddn09@cluster0.7crxdqp.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

// Connect to MongoDB and start the server
async function connectDB() {
    try {
        await client.connect();
        db = client.db("testDB");
        console.log("✅ Connected to MongoDB");

        app.listen(port, () => {
            console.log(`🚀 Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
    }
}

connectDB();

// Root route
app.get("/", (req, res) => {
    res.send("✅ Maxim Ride-Hailing API is running.");
});


// --------------------------
// 🚕 RIDE ENDPOINTS
// --------------------------

// GET /rides - Fetch all rides
app.get("/rides", async (req, res) => {
    try {
        const rides = await db.collection("rides").find().toArray();
        res.status(200).json(rides);
    } catch (error) {
        console.error("❌ Failed to fetch rides:", error);
        res.status(500).json({ error: "Failed to fetch rides" });
    }
});

// POST /rides - Create a new ride
app.post("/rides", async (req, res) => {
    try {
        const { pickup, destination, driver, vehicle, passenger, status } = req.body;

        // Optional: Validate required fields
        if (!pickup || !destination || !driver || !vehicle || !passenger || !status) {
            return res.status(400).json({ error: "Missing required ride fields." });
        }

        const newRide = {
            pickup,
            destination,
            driver,
            vehicle,
            passenger,
            status
        };

        const result = await db.collection("rides").insertOne(newRide);
        res.status(201).json({ insertedId: result.insertedId });

    } catch (error) {
        console.error("❌ Failed to create ride:", error);
        res.status(500).json({ error: "Failed to create ride" });
    }
});

// PATCH /rides/:id - Update ride status only
app.patch("/rides/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ride ID format" });
        }

        const { status } = req.body;
        const result = await db.collection("rides").updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Ride not found" });
        }

        res.status(200).json({ updated: result.modifiedCount });

    } catch (error) {
        console.error("❌ Failed to update ride:", error);
        res.status(500).json({ error: "Failed to update ride" });
    }
});

// DELETE /rides/:id - Delete a ride
app.delete("/rides/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ride ID format" });
        }

        const result = await db.collection("rides").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Ride not found" });
        }

        res.status(200).json({ deleted: true });

    } catch (error) {
        console.error("❌ Failed to delete ride:", error);
        res.status(500).json({ error: "Failed to delete ride" });
    }
});
