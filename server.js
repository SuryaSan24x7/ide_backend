const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
//const port = process.env.PORT;
const port = 5151;
const fs = require('fs');
const path = require('path');
app.use(cors());
app.use(bodyParser.json());

app.post('/compile', (req, res) => {
    const { code } = req.body;
    const contractPath = path.join(__dirname, 'test','src','Contract.sol');

    // Save the Solidity code to a file
    fs.writeFile(contractPath, code, (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to save the file." });
        }

        // Execute forge build
        exec('forge build --root ./test', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).json({ error: "Failed to compile the contract." });
            }

            // Output will be in stderr if there are compile errors
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return res.status(400).json({ error: stderr });
            }

            // Assuming the build was successful, read the output JSON file
            const buildOutput = path.join(__dirname, 'test', 'out', 'Contract.sol', 'Contract.json');
            fs.readFile(buildOutput, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading the JSON output: ${err}`);
                    return res.status(500).json({ error: "Failed to read the output JSON." });
                }

                // Parse JSON to extract ABI and bytecode
                const outputJson = JSON.parse(data);
                const { abi, bytecode } = outputJson;
                res.json({ abi, bytecode });
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
