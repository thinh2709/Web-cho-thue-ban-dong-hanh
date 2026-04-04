const BASE_URL = 'http://localhost:5000/api';

const api = {
  // Booking API calls
  async createBooking(bookingData) {
    try {
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async getBookings(userId, status) {
    try {
      let url = `${BASE_URL}/bookings`;
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (status) params.append('status', status);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  async updateBookingStatus(id, status) {
    try {
      const response = await fetch(`${BASE_URL}/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
};
