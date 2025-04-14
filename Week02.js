
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
    },
    {
        name : "Bob Johnson",
        vehicleType : "Truck",
        isAvailable : true,
        rating : 4.2
    },
    {
        name : "Charlie Brown",
        vehicleType : "Van",
        isAvailable : false,
        rating : 4.9
    },
    {
        name : "Eve Davis",
        vehicleType : "Convertible",
        isAvailable : true,
        rating : 4.7
    }
];

console.log(drivers);


async function main () {
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
 