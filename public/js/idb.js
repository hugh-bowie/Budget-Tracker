// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function (event) {
	// save a reference to the database
	const db = event.target.result;

	// create an object store (table) called `new_transaction`, set to auto incrementing primary key
	db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
	// when db is created with its object store or connected, save reference db global variable
	db = event.target.result;

	// check app is online, if true run uploadTransaction() to send local db data to api
	if (navigator.onLine) {
		uploadTransaction();
	}
};

request.onerror = function (event) {
	// log error here
	console.log(event.target.errorCode);
};

// Function executed if we submit a new tranny with no internet connection
function saveRecord(record) {
	// open transaction to database with read and write permissions
	const transaction = db.transaction(['new_transaction'], 'readwrite');

	// access object store for `new_transaction`
	const budgetObjectStore = transaction.objectStore('new_transaction');

	// add record to your store with add method
	budgetObjectStore.add(record);
}

function uploadTransaction() {
	// open a transaction on your db
	const transaction = db.transaction(['new_transaction'], 'readwrite');

	// access your object store
	const budgetObjectStore = transaction.objectStore('new_transaction');

	// get all records from store and set to a variable
	const getAll = budgetObjectStore.getAll();

	getAll.onsuccess = function () {
		// if any data in indexedDb's store, POST to api server
		if (getAll.result.length > 0) {
			fetch('/api/transaction', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then(response => response.json())
				.then(serverResponse => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}

					// open one more transaction
					const transaction = db.transaction(['new_transaction'], 'readwrite');

					// access the new_transaction object store
					const budgetObjectStore = transaction.objectStore('new_transaction');

					// clear all items in your store
					budgetObjectStore.clear();

					alert('All saved transactions has been submitted!');
				})
				.catch(err => {
					console.log(err);
				});
		}
	};
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);
