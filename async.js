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

function runParallelAll(seriesJobs) {
	let translates = [];
	const amountJobs = seriesJobs.length;

	return new Promise((resolve, reject) => {
		seriesJobs.forEach((job, ind) => {
			job
			    .then(data => handler(translates, data, ind, amountJobs), 
			        err => handler(translates, err, ind, amountJobs))
	    	    .then(isFinish => {
	    	    	if (isFinish) {
	    	    		resolve(getListTranslates(translates))
	    	    	}
	    	    });
	    	});
	});
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
	const promises = jobs.map(job => getPromise(job, timeout))
	const queueRun = cutJobs(promises, parallelNum);

	let promise = Promise.resolve([]);

    queueRun.forEach(series => {
    	promise = promise
    	    .then((results) => runParallelAll(series).then(data => results.concat(data)))
    	});

    return promise;
}
