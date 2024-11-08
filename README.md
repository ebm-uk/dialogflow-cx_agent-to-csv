# DialogFlow CX to CSV converter

## About

This script converts an export of a DialogFlow CX agent into a CSV file.

It extracts all intents, training phrases, and responses from the DialogFlow CX agent. However, conditional responses are not supported.

The CSV will be generated in the following format:

| Name (Intent Name) | Training Phrases | Responses              |
| ------------------ | ---------------- | ---------------------- |
| Welcome            | Hello            | Welcome to the chatbot |
|                    | Hi               |                        |

## Getting Started

Once installed, ensure that the following two folders are created in the root folder:

./export
./output

## Running the script

- Copy the DialogFlow CX agent export into the ./export folder and unzip it. This should make the export folder structure as follows:

./export/flows
./export/generativeSettings
./export/intents
./export/agent.json

- Open a terminal in the root of this folder and run the following command:

`node index.js`

- The script will run, and the CSV will be generated at:

`./output/cx.csv`
