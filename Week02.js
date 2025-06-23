const { MongoClient } = require('mongodb');

const drivers = [
    {
        name: "John Doe",
        vehicleType: "Sedan",
        isAvailable: true,
        rating: 4.8
    },
    {
        name: "Alice Smith",
        vehicleType: "SUV",
        isAvailable: false,
        rating: 4.5
    }
];

console.log("Initial drivers:", drivers);

const newDriver = {
    name: "Muhaimin Azeem",
    vehicleType: "Truck",
    isAvailable: true,
    rating: 2.0
};

drivers.push(newDriver);
console.log("After adding new driver:", drivers);

async function main() {
    const uri = "mongodb+srv://b122310574:Frzamnddn09@cluster0.7crxdqp.mongodb.net/";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");
        const driversCollection = db.collection("drivers");

        await driversCollection.insertMany(drivers);
        console.log("Inserted all drivers successfully.");

        // Clear the collection
        await driversCollection.deleteMany({});

        // Insert drivers
        for (const driver of drivers) {
            const result = await driversCollection.insertOne(driver);
            console.log(`Inserted driver with _id: ${result.insertedId}`);
        }

        // Query available drivers with rating >= 4.5
        const availableDrivers = await driversCollection.find({
            isAvailable: true,
            rating: { $gte: 4.5 }
        }).toArray();
        console.log("Available drivers (isAvailable: true & rating >= 4.5):", availableDrivers);

        // Increase John Doe's rating by 0.1
        const updateResult = await driversCollection.updateMany(
            { isAvailable: true},
            { $inc: { rating: 0.1 } }
        );
        console.log("Drivers' rating updated successfully.");

    
//        const isAvailable: true = await driversCollection.findOne({ isAvailable: true });
//        console.log("Updated Drivers", drivers);
//
        // Delete all unavailable drivers
        const deleteResult = await driversCollection.deleteMany({ isAvailable: true });
        console.log(`Deleted ${deleteResult.deletedCount} unavailable drivers`);

        // Show remaining drivers
        const remainingDrivers = await driversCollection.find().toArray();
        console.log("Remaining drivers in database:", remainingDrivers);

    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    } finally {
        await client.close();
    }
}

main();
