const express = require('express');
const http = require('http');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const os = require('os');

//config
require('dotenv/config');

//import routes
const noteRoute = require('./routes/note.route');
const redirectRoute = require('./routes/redirect.route');

//connect to DB
const dbURI = process.env.DB_CONNECTION;
console.log(dbURI)
mongoose.set('strictQuery', false);
mongoose
  .connect(dbURI)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: donenote.`)
		const server = app.listen(process.env.PORT, () => {
		    console.log("Listening on port: " + process.env.PORT);
		});
		let dirPath = path.join(__dirname, "public/static");
		createDir(dirPath);
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err)
  })

function createDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, {recursive: true}, (err) => {
			if (err) {
				console.error('Create dir Error: ', err);
			} else {
				console.log('directory is made!');
			}
		})
	}
}

app.use(morgan("dev"));
app.use('/public', express.static(path.join(__dirname, "public")));
app.use(cors('*'));
app.use(express.json());
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

//routes
app.use(`/api/${process.env.VERSION}`, noteRoute);
app.use(`/i`, redirectRoute);
