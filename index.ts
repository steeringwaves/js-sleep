import PinkyPromise, { PinkyPromiseOptions, Cancelable, Canceled } from "@steeringwaves/pinkypromise";

export default function Sleep(ms: number): Cancelable<void> {
	let timer: any;
	return PinkyPromise(
		new Promise((resolve) => {
			timer = setTimeout(resolve, ms);
		}),
		<PinkyPromiseOptions>{
			OnCancel: (canceled: Canceled) => {
				clearTimeout(timer);
				throw canceled;
			}
		}
	);
}
