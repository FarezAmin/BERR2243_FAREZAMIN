const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://b122310574:<db_password>@cluster0.7crxdqp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB connection string
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    
        const db = client.db("testDB"); // Replace with your database name
        const collection = db.collection("users"); // Replace with your collection name

        await collection.insertOne({ name: "Alice", age: 25 });
        console.log("Document inserted");

        const result = await collection.findOne({ name: "Alice" });
        console.log("Query result:", result);git
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
    finally {
        await client.close();
    }
}
main ();