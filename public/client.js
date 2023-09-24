console.log('Client-side code running');

const fileInput = document.getElementById('file-input');
const numCopies = document.getElementById('num-copies');
const colorMode = document.getElementById('color-mode');
const printBtn = document.getElementById('print-btn');
const amountBox = document.getElementById('amount-box');
const numPages = document.getElementById('num-pages');

amountBox.innerText = '\u20B9' + numPages.innerText * 3;

const choices = [numCopies, colorMode];

choices.forEach(choice => {
	choice.addEventListener('change', (event) => {
		if (numCopies.value > 0 && colorMode.value !== 'none') {
			printBtn.disabled = false;
		} else {
			printBtn.disabled = true;
		}
		let amount = 0;
		colorMode.value === 'monochrome' ? amount = event.target.value * 3 : amount = event.target.value * 5;
		amountBox.innerText = '\u20B9' + amount;
	});
});
