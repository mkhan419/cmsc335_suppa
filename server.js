const express = require("express"); 
const path = require("path"); 
const app = express(); 
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });   
const port = process.argv[2] || 3000; 

app.use(express.urlencoded({ extended: true })); 
app.set("views", path.resolve(__dirname, "templates")); 
app.set("view engine", "ejs"); 
app.use('/public', express.static('public'));
 
const uri = process.env.MONGO_CONNECTION_STRING; 
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 }); 
const databaseAndCollection = {db: "cmsc335suppa", collection:"reservations"}; 
 
let clientCollection; 

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

app.get("/reservationsConfirm", async (request, response) => {
    response.render("reservationsConfirm");
});

app.get("/diy", async (request, response) => {
    try {
        const apiUrl = "https://www.themealdb.com/api/json/v1/1/search.php?s=soup";
        const res = await fetch(apiUrl);
        const data = await res.json();
        const meals = data.meals || [];

        response.render("diy", { meals });
    } catch (err) {
        console.error("Error fetching soup data:", err);
        response.status(500).send("Unable to load soups.");
    }
});

app.get("/getSoupInstructions", async (request, response) => {
    const soupId = request.query.id;

    if (!soupId) {
        return response.status(400).json({ error: "Soup ID is required" });
    }

    try {
        const apiUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${soupId}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        const meal = data.meals && data.meals[0];

        if (meal) {
            response.json({ instructions: meal.strInstructions }); // Extract strInstructions
        } else {
            response.json({ error: "Soup not found" });
        }
    } catch (err) {
        console.error("Error fetching soup details:", err);
        response.status(500).json({ error: "Unable to fetch soup details" });
    }
});

app.listen(port);
