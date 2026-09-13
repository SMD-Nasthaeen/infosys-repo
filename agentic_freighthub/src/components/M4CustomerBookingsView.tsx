import React, { useState, useEffect } from 'react';
import { PackageCheck, FileText, Calendar, Anchor, MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Booking } from '../types';

export const M4CustomerBookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load bookings');
      }
      setBookings(data.data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePrintBooking = (booking: Booking) => {
    // Generate a printable snapshot view in a new window or trigger browser print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Booking Confirmation - ${booking.bookingRef}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e293b; }
            .title { font-size: 20px; font-weight: 600; color: #10b981; margin-top: 10px; }
            .section { margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .section-title { font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .value { font-size: 15px; font-weight: 500; color: #1e293b; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              .section { border: 1px solid #e2e8f0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FreightHub • Official Booking</div>
            <div class="title">CONFIRMED BOOKING: ${booking.bookingRef}</div>
            <div style="margin-top: 5px; font-size: 14px; color: #64748b;">Issued on: ${new Date(booking.createdAt).toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Logistics Details</div>
            <div class="grid">
              <div>
                <div class="label">Freight Company</div>
                <div class="value">${booking.quoteSnapshot?.companyName || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Shipment Reference</div>
                <div class="value">${booking.shipmentId}</div>
              </div>
              <div>
                <div class="label">Origin</div>
                <div class="value">${booking.quoteSnapshot?.originCode || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Destination</div>
                <div class="value">${booking.quoteSnapshot?.destinationCode || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Commercials</div>
            <div class="grid">
              <div>
                <div class="label">Total Tariff Amount</div>
                <div class="value" style="font-size: 18px; color: #10b981;">
                  ${booking.quoteSnapshot?.currency || 'INR'} ${booking.quoteSnapshot?.tariffAmount?.toLocaleString() || '0'}
                </div>
              </div>
              <div>
                <div class="label">Payment Status</div>
                <div class="value">Pending / Invoice to follow</div>
              </div>
            </div>
          </div>

          <div class="footer">
            This is a computer generated booking note. All transit times are estimated.<br>
            Booking generated from Quote Ref: ${booking.quoteId}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your final bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Final Bookings & Print</h2>
          <p className="text-sm text-slate-500 mt-1">
            These are your finalized, approved bookings ready for dispatch.
          </p>
        </div>
        <button 
          onClick={fetchBookings}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refresh Bookings"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700">No confirmed bookings</h3>
          <p className="text-sm text-slate-500 mt-2">
            Once customs approves your verification requests, the finalized bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div key={booking.bookingRef} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" />
                    {booking.status}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{booking.bookingRef}</h3>
                  <span className="text-sm text-slate-500">Ref: {booking.shipmentId}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Company</div>
                    <div className="text-sm font-bold text-slate-700">{booking.quoteSnapshot?.companyName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Route</div>
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Anchor className="w-3.5 h-3.5 text-blue-500" />
                      {booking.quoteSnapshot?.originCode} <MapPin className="w-3.5 h-3.5 text-slate-300" /> {booking.quoteSnapshot?.destinationCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Date Created</div>
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Total Cost</div>
                    <div className="text-sm font-black text-emerald-600">
                      {booking.quoteSnapshot?.currency || 'INR'} {booking.quoteSnapshot?.tariffAmount?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center md:flex-col gap-3">
                <button
                  onClick={() => handlePrintBooking(booking)}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Print Booking
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
