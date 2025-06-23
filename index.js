/*const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://b122310574:5dJ9rZDrlVkbZyxj@cluster0.7crxdqp.mongodb.net/"; // Replace with your MongoDB connection string
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    
        const db = client.db("testDB"); // Replace with your database name
        const collection = db.collection("users"); // Replace with your collection name

        await collection.insertOne({ name: "Alice", age: 25 });
        console.log("Document inserted");

        const result = await collection.findOne({ name: "Alice" });
        console.log("Query result:", result);
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
    finally {
        await client.close();
    }
}
main ();*/

const { MongoClient } = require('mongodb');

async function main() {
    // Updated connection string with proper formatting
    const uri = "mongodb+srv://b122310574:<Frzamnddn09>@cluster0.7crxdqp.mongodb.net/";
    
    const client = new MongoClient(uri, {
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true
        }
    });

    try {
        // Connect with timeout configuration
        await client.connect({ connectTimeoutMS: 5000 });
        console.log("✅ Connected successfully to MongoDB Atlas");

        const db = client.db("testDB");
        const collection = db.collection("users");

        // Insert document with error handling
        const insertResult = await collection.insertOne({ 
            name: "Alice", 
            age: 25,
            timestamp: new Date() 
        });
        console.log(`📄 Document inserted with _id: ${insertResult.insertedId}`);

        // Find document with projection
        const foundDoc = await collection.findOne(
            { name: "Alice" },
            { projection: { _id: 0, name: 1, age: 1 } }
        );
        console.log("🔍 Found document:", foundDoc);

    } catch (err) {
        console.error("❌ Error:", err);
        
        // Detailed error analysis
        if (err.code === 8000) {
            console.log("\nTroubleshooting AtlasError 8000:");
            console.log("1. Verify your username/password in the connection string");
            console.log("2. Check IP whitelisting in Atlas (Network Access)");
            console.log("3. Ensure your cluster is running (not paused)");
            console.log("4. Try connecting with MongoDB Compass using same credentials");
        }
    } finally {
        await client.close();
        console.log("🚪 Connection closed");
    }
}

// Execute with proper error handling
main().catch(err => console.error("Unhandled rejection:", err));