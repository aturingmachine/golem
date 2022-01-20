/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Debounce a function.
 *
 * Kindly borrowed from https://gist.github.com/fr-ser/ded7690b245223094cd876069456ed6c
 *
 * @param func The Function to Debounce
 * @param wait how long to debounce
 * @returns The function?
 */
export function debounce<F extends Function>(func: F, wait: number): F {
  let timeoutID: NodeJS.Timeout

  if (!Number.isInteger(wait)) {
    wait = 300
  }

  // conversion through any necessary as it wont satisfy criteria otherwise
  return <any>function (this: any, ...args: any[]) {
    clearTimeout(timeoutID)
    const context = this

    timeoutID = setTimeout(function () {
      func.apply(context, args)
    }, wait)
  }
}
