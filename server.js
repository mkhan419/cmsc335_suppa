const express = require("express"); 
const path = require("path"); 
const app = express(); 
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });   
const port = process.argv[2]; 
 
app.use(express.urlencoded({ extended: true })); 
app.set("views", path.resolve(__dirname, "templates")); 
app.set("view engine", "ejs"); 
 
const uri = process.env.MONGO_CONNECTION_STRING; 
const { MongoClient, ServerApiVersion } = require('mongodb'); 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 
const databaseAndCollection = {db: "CMSC335DB", collection:"applications"}; 
 
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
}) 

 
app.listen(port);
