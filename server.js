import { fetchWeatherApi } from 'openmeteo';
const express = require("express"); 
const path = require("path"); 
const app = express(); 
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });   
const port = process.argv[2]; 

 
app.use(express.urlencoded({ extended: true })); 
app.set("views", path.resolve(__dirname, "templates")); 
app.set("view engine", "ejs"); 
app.use('/public', express.static('public'));
 
const uri = process.env.MONGO_CONNECTION_STRING; 
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); 
const databaseAndCollection = {db: "cmsc335suppa", collection:"reservations"}; 
 
let clientCollection; 

const params = {
    latitude: 38.9897,
    longitude: 76.9378,
    hourly: ["temperature_2m", "precipitation_probability"],
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone: "America/New_York"
};

const url = "https://api.open-meteo.com/v1/forecast";
const responses = await fetchWeatherApi(url, params);

// Helper function to form time ranges
const range = (start, stop, step) =>
    Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step);

// Process first location. Add a for-loop for multiple locations or weather models
const response = responses[0];

// Attributes for timezone and location
const utcOffsetSeconds = response.utcOffsetSeconds();
const timezone = response.timezone();
const timezoneAbbreviation = response.timezoneAbbreviation();
const latitude = response.latitude();
const longitude = response.longitude();

const hourly = response.hourly();

// Note: The order of weather variables in the URL query and the indices below need to match!
const weatherData = {
    hourly: {
        time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
            (t) => new Date((t + utcOffsetSeconds) * 1000)
        ),
        temperature2m: hourly.variables(0).valuesArray(),
        precipitationProbability: hourly.variables(1).valuesArray(),
    },
};

// `weatherData` now contains a simple structure with arrays for datetime and weather data
for (let i = 0; i < weatherData.hourly.time.length; i++) {
    console.log(
        weatherData.hourly.time[i].toISOString(),
        weatherData.hourly.temperature2m[i],
        weatherData.hourly.precipitationProbability[i]
    );
}


client.connect().then(() => { 
    clientCollection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection); 
}).catch((err) => { 
    console.log(err); 
    process.exit(1); 
}) 
 
console.log(`Web server is running at http://localhost:${port}`);  
process.stdout.write("Stop to shutdown the server: ");  
process.stdin.setEncoding("utf8");  
          
process.stdin.on('readable', () => {  
    const dataInput = process.stdin.read();  
    if (dataInput !== null) {  
        const command = dataInput.trim();  
                  
        if (command === "stop") {  
            console.log("Shutting down the server");  
            process.exit(0);  
        } else {  
            console.log(`Invalid command: ${command}`);  
        }   
    }  
}); 
 
app.get("/", (request, response) => {  
    response.render("index");  
});

app.get("/menu", (request, response) => {  
    response.render("menu");  
});

app.get("/reservations", (request, response) => {  
    response.render("reservations");  
});

app.post("/reservations", async (request, response) => {
    try { 
        const {name, guests, date, time, email, info} = request.body; 
    
        if(!name || !guests || !date || !time || !email) { 
            return response.status(400).send("name, guests, date/time, and email are required"); 
        } 
    
        const newRes = { 
            name, 
            guests, 
            date,
            time,
            email,
            info,
        }; 
    
        await clientCollection.insertOne(newRes); 

        response.redirect("/reservationsConfirm")
    } catch (err) { 
        console.log(err); 
        response.status(port).send("an error occurred"); 
    }
});

app.get("/reservationsConfirm", (request, response) => { 
    response.render("reservationsConfirm");  
});

app.get("/events", (request, response) => {  
    response.render("events");  
});

 
app.listen(port);
