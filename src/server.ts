import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { getEnvVarOrFail } from "./support/envVarUtils";
import { setupDBClientConfig } from "./support/setupDBClientConfig";

dotenv.config(); //Read .env file lines as though they were env vars.

const dbClientConfig = setupDBClientConfig();
const client = new Client(dbClientConfig);

//Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/", async (req, res) => {
    res.json({ msg: "Hello! There's nothing interesting for GET /" });
});

app.get("/health-check", async (req, res) => {
    try {
        //For this to be successful, must connect to db
        await client.query("select now()");
        res.status(200).send("system ok");
    } catch (error) {
        //Recover from error rather than letting system halt
        console.error(error);
        res.status(500).send("An error occurred. Check server logs.");
    }
});

connectToDBAndStartListening();

async function connectToDBAndStartListening() {
    console.log("Attempting to connect to db");
    await client.connect();
    console.log("Connected to db!");

    const port = getEnvVarOrFail("PORT");
    app.listen(port, () => {
        console.log(
            `Server started listening for HTTP requests on port ${port}.  Let's go!`
        );
    });
}

// GET /tasks
app.get("/tasks", async (req, res) => {
    // const allSignatures = getAllTasks();
    // res.status(200).json(allSignatures);
    try {
        const text = "SELECT * FROM tasks";
        const tasks = await client.query(text);
        res.status(200).json(tasks.rows);
    } catch (error) {
        console.error(error);
    }
});

app.post("/tasks", async (req, res) => {
    try {
        const { title, description, due } = req.body;
        const text =
            "INSERT INTO tasks (title, description, due, created) values($1, $2, $3, now())";
        const values = [title, description, due];
        const newTask = await client.query(text, values);
        res.json(newTask);
    } catch (error) {
        console.error(error);
    }
});

app.get("/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const text = "SELECT * FROM tasks WHERE id = $1";
        const values = [id];
        const task = await client.query(text, values);
        res.json(task.rows[0]);
    } catch (error) {
        console.error(error);
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const text = "DELETE FROM tasks WHERE id = $1";
        const values = [id];
        const deletedTask = await client.query(text, values);
        res.json(deletedTask);
    } catch (error) {
        console.error(error);
    }
});

app.patch("/tasks/:id/status", async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const text = "UPDATE tasks SET status = $1 WHERE id = $2";
        const values = [status, id];
        const updatedTask = await client.query(text, values);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
    }
});
