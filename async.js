'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function getPromise(job, timeout) {
	return new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error(`Promise timeout`)), timeout);
		job().then(resolve, reject);
	});
}

function getListTranslates(translates) {
	return translates.reduce((results, translate) => {
		results[translate.ind] = translate.data;

		return results;
	}, [])
};

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
	if (jobs.length === 0) {
		return Promise.resolve([]);
	}
	const promises = jobs.map((job, ind) => {return { ind: ind, promise: getPromise(job, timeout) }});

	let translates = [];

	const amountJobs = promises.length
	
	const startingSeries = promises.splice(0, parallelNum);

	const handler = function (data, ind, resolve) {
		translates.push({ ind: ind, data: data });
		if (promises.length > 0) {
			let promise = promises.shift();

			promise.promise
			    .then(data => handler(data, promise.ind, resolve), 
			        err => handler(err, promise.ind, resolve));
			}
		if (translates.length === amountJobs) {
			resolve(getListTranslates(translates));
		};
	}

	return new Promise((resolve, reject) => {
		startingSeries.forEach((promise) => {
			promise.promise
			    .then(data => handler(data, promise.ind, resolve), 
			        err => handler(err, promise.ind, resolve));
	    	    });
	    	});
}
