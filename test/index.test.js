/* eslint-env node,mocha,jest */

/* eslint-disable no-unused-vars */
const BluebirdPromise = require("bluebird");
const Context = require("@steeringwaves/context").default;
const PinkyPromise = require("@steeringwaves/pinkypromise").default;
const Sleep = require("../index").default;

BluebirdPromise.config({
	// Enable cancellation
	cancellation: true,
	// Enable async hooks
	asyncHooks: true
});

let fakeTimeInterval;

/* eslint-enable no-unused-vars */
describe("Sleep fake time tests", () => {
	beforeEach(() => {
		jest.useRealTimers();
		if (fakeTimeInterval) {
			clearInterval(fakeTimeInterval);
			fakeTimeInterval = undefined;
		}

		fakeTimeInterval = setInterval(() => {
			jest.advanceTimersByTime(100);
		}, 10);
		jest.useFakeTimers();
	});

	afterEach(() => {
		if (fakeTimeInterval) {
			clearInterval(fakeTimeInterval);
			fakeTimeInterval = undefined;
		}
		jest.useRealTimers();
	});

	it("should verify context expires", async () => {
		const callback = jest.fn();

		const ctx = new Context({ Timeout: 1500 });
		ctx.on("done", callback);

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await Sleep(1000);

		expect(callback).not.toBeCalled();

		await Sleep(1000);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("should verify native promise is cancelled properly when Sleep is given context", async () => {
		const callback = jest.fn();

		const parentCtx = new Context();
		const ctx = new Context({ Parent: parentCtx, Timeout: 1500 });

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				new Promise((resolve, reject) => {
					callback(); // should be called
					Sleep(500)
						.setContext(ctx)
						.then(() => {
							callback(); // should be called
							resolve();
						})
						.catch((e) => reject(e));
				})
			)
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);

		await expect(
			new PinkyPromise(
				new Promise((resolve, reject) => {
					callback(); // should be called
					Sleep(2000)
						.setContext(ctx)
						.then(() => {
							callback(); // should not be called
							resolve();
						})
						.catch((e) => reject(e));
				})
			)
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("should verify async is cancelled properly when Sleep is given context", async () => {
		const callback = jest.fn();

		const parentCtx = new Context();
		const ctx = new Context({ Parent: parentCtx, Timeout: 1500 });

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(async () => {
				callback(); // should be called
				await Sleep(500).setContext(ctx);
				callback(); // should be called
			})
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);

		await expect(
			new PinkyPromise(async () => {
				callback(); // should be called
				await Sleep(2000).setContext(ctx);
				callback(); // should not be called
			})
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("should verify async is cancelled properly when Sleep is not given context, but PinkyPromise is", async () => {
		const callback = jest.fn();

		const parentCtx = new Context();
		const ctx = new Context({ Parent: parentCtx, Timeout: 1500 });

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				async () => {
					callback(); // should be called
					await Sleep(500);
					callback(); // should be called
				},
				{ Context: ctx }
			)
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);

		await expect(
			new PinkyPromise(
				async () => {
					callback(); // should be called
					await Sleep(2000);
					callback(); // should not be called
				},
				{ Context: ctx }
			)
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
	});

	it("should verify onCancel fires properly with a cancel function", async () => {
		const callback = jest.fn();
		const pinkyPromiseCancelCallback = jest.fn();
		const sleepCancelCallback = jest.fn();

		const parentCtx = new Context({ Timeout: 1500 });
		const sleepCtx = new Context();

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				() =>
					new Promise((resolve, reject) => {
						callback(); // should be called
						Sleep(500)
							.setContext(sleepCtx)
							.onCancel(sleepCancelCallback)
							.then(() => {
								callback();
								resolve();
							})
							.catch(reject);
					}),
				{ Context: parentCtx }
			).onCancel(() => {
				sleepCtx.cancel();
				pinkyPromiseCancelCallback();
			})
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);
		expect(sleepCancelCallback).not.toBeCalled();
		expect(pinkyPromiseCancelCallback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				() =>
					new Promise((resolve, reject) => {
						callback(); // should be called
						Sleep(2000)
							.setContext(sleepCtx)
							.onCancel(sleepCancelCallback)
							.then(() => {
								callback(); // should not be called
								resolve();
							})
							.catch(reject);
					}),
				{ Context: parentCtx }
			).onCancel(() => {
				sleepCtx.Cancel();
				pinkyPromiseCancelCallback();
			})
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(sleepCancelCallback).toHaveBeenCalledTimes(1);
		expect(pinkyPromiseCancelCallback).toHaveBeenCalledTimes(1);
	});

	it("should verify onCancel fires properly when a promise is specified", async () => {
		const callback = jest.fn();
		const pinkyPromiseCancelCallback = jest.fn();
		const sleepCancelCallback = jest.fn();

		const parentCtx = new Context({ Timeout: 1500 });
		const sleepCtx = new Context();

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				async () => {
					callback(); // should be called
					await Sleep(500).setContext(sleepCtx).onCancel(sleepCancelCallback);
					callback(); // should be called
				},
				{ Context: parentCtx }
			).onCancel(async () => {
				await Sleep(500);
				sleepCtx.cancel();
				pinkyPromiseCancelCallback();
			})
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);
		expect(sleepCancelCallback).not.toBeCalled();
		expect(pinkyPromiseCancelCallback).not.toBeCalled();

		await expect(
			new PinkyPromise(
				async () => {
					callback(); // should be called
					await Sleep(2000).setContext(sleepCtx).onCancel(sleepCancelCallback);
					callback(); // should not be called
				},
				{ Context: parentCtx }
			).onCancel(async () => {
				await Sleep(500);
				sleepCtx.Cancel();
				pinkyPromiseCancelCallback();
			})
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(sleepCancelCallback).toHaveBeenCalledTimes(1);
		expect(pinkyPromiseCancelCallback).toHaveBeenCalledTimes(1);
	});

	it("should verify onCancel fires properly from Sleep", async () => {
		const callback = jest.fn();
		const pinkyPromiseCancelCallback = jest.fn();
		const sleepCancelCallback = jest.fn();

		const parentCtx = new Context();
		const ctx = new Context({ Parent: parentCtx, Timeout: 1500 });

		// At this point in time, the callback should not have been called yet
		expect(callback).not.toBeCalled();

		await expect(
			new PinkyPromise(async () => {
				callback(); // should be called
				await Sleep(500).setContext(ctx).onCancel(sleepCancelCallback);
				callback(); // should be called
			}).onCancel(pinkyPromiseCancelCallback)
		).resolves.not.toThrow();
		expect(callback).toHaveBeenCalledTimes(2);
		expect(sleepCancelCallback).not.toBeCalled();
		expect(pinkyPromiseCancelCallback).not.toBeCalled();

		await expect(
			new PinkyPromise(async () => {
				callback(); // should be called
				await Sleep(2000).setContext(ctx).onCancel(sleepCancelCallback);
				callback(); // should not be called
			}).onCancel(pinkyPromiseCancelCallback) // should not be called
		).rejects.toThrow(/context/gi);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(sleepCancelCallback).toHaveBeenCalledTimes(1);
		expect(pinkyPromiseCancelCallback).toHaveBeenCalledTimes(0);
	});
});
