const checkoutScriptUrl = 'https://checkout.razorpay.com/v1/checkout.js'
let checkoutScriptPromise

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true)
  if (checkoutScriptPromise) return checkoutScriptPromise

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = checkoutScriptUrl
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      script.remove()
      reject(new Error('Razorpay checkout could not be loaded. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })

  checkoutScriptPromise = checkoutScriptPromise.catch((error) => {
    checkoutScriptPromise = undefined
    throw error
  })
  return checkoutScriptPromise
}
