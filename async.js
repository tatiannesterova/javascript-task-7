'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function cutJobs(jobs, parallelNum) {
	let result = [];
	let jobsCopy = jobs.slice();

	while (jobsCopy.length > 0) {
		result.push(jobsCopy.slice(0, parallelNum))
		jobsCopy = jobsCopy.splice(parallelNum);
	}

	return result;
}

function getPromise(job, timeout) {
	return new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error(`Promise timeout`)), timeout);
		job().then(resolve, reject);
	});
}

function handler(translates, data, ind, amountJobs) {
	translates.push({ ind: ind, data: data });

	return translates.length == amountJobs;
}

function getListTranslates(translates) {
	return translates.reduce((results, translate) => {
		results[translate.ind] = translate.data;

		return results;
	}, [])
};

function runParallelAll(promises, parallelNum) {
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

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
	const promises = jobs.map((job, ind) => {return { ind: ind, promise: getPromise(job, timeout) }})
	//const queueRun = cutJobs(promises, parallelNum);

	//let promise = Promise.resolve([]);

    return runParallelAll(promises, parallelNum);
}
