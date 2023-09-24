const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const ipp = require('ipp');
const bodyParser = require('body-parser'); // Import body-parser

const printer = ipp.Printer("http://172.18.100.235:631/printers/HP-LaserJet-P1006");

const app = express();
const port = 3000;

let filename = '';
let numPages = 0;
let pdfBytes = null;
let pdfDoc = null;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// Multer configuration for file storage
const storage = multer.diskStorage({
    destination: './',
    filename: function(req, file, cb){
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).single('myFile');

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});


app.get('/', (req, res) => {
	res.render('index');
});

app.get('/customise', (req, res) => {
	// console.log(req.body);
	res.render('customise', {filename: filename, numPages: numPages});
});

app.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            res.send('Error uploading file.');
            return;
        }
        
        // Read the number of pages in the uploaded PDF
        try {
			filename = req.file.originalname;
            pdfBytes = await fs.promises.readFile(path.join(__dirname, filename));
            pdfDoc = await PDFDocument.load(pdfBytes);
            numPages = pdfDoc.getPageCount();
            console.log(`File uploaded successfully. The PDF has ${numPages} pages.`);
        } catch (pdfError) {
            console.error(pdfError);
            res.send('Failed to read the number of pages in the PDF.');
        }
		res.redirect('/customise');
    });
});

app.post('/print', (req, res) => {
	// let numCopies = req.body.numCopies;
	// let colorMode = req.body.colorMode;
	// let amount = 0;
	// colorMode === 'monochrome' ? amount = numCopies * numPages * 3 : amount = numCopies * numPages * 5;
	// console.log(`Printing ${numCopies} copies of ${filename} in ${colorMode} mode.`);
	// console.log(`Amount to be paid: \u20B9${amount}`);

	let msg = {
			"operation-attributes-tag": {
				"requesting-user-name": "InkNext",
				"job-name": "My Test Job",
				"document-format": "application/pdf"
			},
			"job-attributes-tag": {
				"copies": 2,
				"print-color-mode": "monochrome"
			},
			data: pdfBytes
		};

	printer.execute("Print-Job", msg, function(err, res){
		console.log(res);
		console.log(JSON.stringify(res));
	});
	console.log('File sent to printer.');

	res.redirect('/status');
});

app.get('/status', (req, res) => {
	res.render('status');
});