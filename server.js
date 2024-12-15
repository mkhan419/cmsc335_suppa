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
