import axiosInstance from './axios'

export const paymentApi = {
  createCheckoutSession: (data) =>
    axiosInstance.post('/Payment/create-checkout-session', data),
  createCustomerPortal: () =>
    axiosInstance.post('/Payment/customer-portal'),
  getSubscriptionStatus: () =>
    axiosInstance.get('/Payment/subscription-status'),
}
