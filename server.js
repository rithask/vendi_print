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
let error = '';

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
			// Handle the upload error
			console.error(err);
			return res.render('index', {message: "Failed to read the number of pages in the PDF."}); // Redirect with an error message, if necessary
		}
	
		if (!req.file) {
			// Handle the case when no file is uploaded
			console.error("No PDF file uploaded");
			return res.render('index', { message: "No PDF file uploaded"});
		}
	
		// Rest of your code to process the uploaded PDF
		try {
			filename = req.file.originalname;
			pdfBytes = await fs.promises.readFile(path.join(__dirname, filename));
			pdfDoc = await PDFDocument.load(pdfBytes);
			numPages = pdfDoc.getPageCount();
			console.log(`File uploaded successfully. The PDF has ${numPages} pages.`);
		} catch (pdfError) {
			console.error(pdfError);
			return res.render('/', { error: "Failed to read the number of pages in the PDF." });
		}
		res.redirect('/customise');
	});	
});

app.post('/print', (req, res) => {
	let msg = {
			"operation-attributes-tag": {
				"requesting-user-name": "InkNext",
				"job-name": "My Test Job",
				"document-format": "application/pdf"
			},
			"job-attributes-tag": {
				"copies": 1,
				"print-color-mode": "monochrome"
			},
			data: pdfBytes
		};

	printer.execute("Print-Job", msg, function(err, res){
		console.log(res);
		console.log(JSON.stringify(res));
	});
	console.log('File sent to printer.');


	upload(req, res, async (err) => {
        // Introduce a 10-second delay before deleting the file
        setTimeout(async () => {
            try {
                // Delete the file
				uploadedFilePath = path.join(__dirname, filename);
                await fs.promises.unlink(uploadedFilePath);
                console.log(`File deleted: ${uploadedFilePath}`);
            } catch (deleteError) {
                console.error(`Error deleting file: ${deleteError}`);
            }
        }, 5000); // 10000 milliseconds = 10 seconds
	});
	

	res.redirect('/status');
});

app.get('/status', (req, res) => {
	res.render('status');
});
