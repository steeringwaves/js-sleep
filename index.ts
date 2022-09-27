import PinkyPromise, { PinkyPromiseOptions, Cancelable, Canceled } from "@steeringwaves/pinkypromise";
// import PinkyPromise, { PinkyPromiseOptions, Cancelable, Canceled } from "../js-pinkypromise/index";

export default function Sleep(ms: number): Cancelable<void> {
	let timer: any;
	return PinkyPromise(
		(resolve: () => any) => {
			timer = setTimeout(resolve, ms);
		},
		<PinkyPromiseOptions>{
			OnCancel: (canceled: Canceled) => {
				clearTimeout(timer);
				throw canceled;
			}
		}
	);
}
