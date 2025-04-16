
const { MongoCLient } = require('mongodb');

const drivers = [
    {
        name : "John Doe",
        vehicleType : "Sedan",
        isAvailable : true,
        rating : 4.8
    },
    {
        name : "Alice Smith",
        vehicleType : "SUV",
        isAvailable : false,
        rating : 4.5
    }
];

console.log(drivers);

const newDriver = {
    name : "Muhaimin Azeem",
    vehicleType : "Truck",
    isAvailable : true,
    rating : 4.9
};

drivers.push(newDriver);
console.log(drivers);


async function main () {

    const uri = "mongodb+srv://b122310574:<FdgDob0HZZVNvJ6O>@cluster0.7crxdqp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB connection string
    const client = new MongoClient(uri);


    try {
        await client.connect();
        const db = client.db("testDB");

        const driversCollection = db.collection("drivers");

        drivers.forEach(async (driver) => {
            const result = await driversCollection.insertOne(driver);
            console.log(`New driver created with result: ${result}`);
        });
    } finally {
        await client.close();
    }
}
 