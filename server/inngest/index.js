import { Inngest } from "inngest";
import User from "../models/user.js"
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });




// inngest function to save user data into database
const syncUserCreation = inngest.createFunction(
    {id:'sync-user-creation'},
    {event:'clerk/user.created'},
    async ({event})=>{
        const {id,first_name,last_name,email_addresses,image_url} = event.data;
        const userData = {
            _id : id,
            email: email_addresses[0].email_address,
            name:first_name + ' ' + last_name,
            image : image_url
        }
        await User.create(userData)
    }
)



// inngest function to delete user data from database
const syncUserDeletion = inngest.createFunction(
    {id:'sync-user-deletion'},
    {event:'clerk/user.deleted'},
    async ({event})=>{
          const {id} = event.data
          await User.findByIdAndDelete(id)   
        }
)


// inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
   {id:'sync-user-updation'},
    {event:'clerk/user.updated'},
    async ({event})=>{
          const {id,first_name,last_name,email_addresses,image_url} = event.data
          const userData = {
            _id : id,
            email: email_addresses[0].email_address,
            name:first_name + ' ' + last_name,
            image : image_url
        }
          await User.findByIdAndUpdate(id,userData)   
        }
)


// inngest function to cancel booking if payment is not done in 10 minutes

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {id:'release-seats-delete-booking'},
    {event:'app/checkpayment'},
    async ({event,step})=>{
      const tenMinutesLater = new Date(Date.now() + 10*60*1000);
      await step.sleepUntil('wait-10-minutes',tenMinutesLater);

      await step.run('check-payment-status',async()=>{
        const bookingId = event.data.bookingId;
        const booking = await Booking.findById(bookingId)

        // if payment is not done then delete booking
        if(!booking.isPaid){
          const show = await Show.findById(booking.show);
          booking.bookedSeats.forEach(seat=>{
            delete show.occupiedSeats[seat];
          })  
          show.markModified('occupiedSeats');
          await show.save();
          await Booking.findByIdAndDelete(bookingId);
        }
      })
    }
)


// function to send email
const sendBookingConfirmationEmail = inngest.createFunction(
    {id:'send-booking-confirmation-email'},
    {event:'app/show.booked'},
    async ({event,step})=>{
      const {bookingId} = event.data;
      const booking = await Booking.findById(bookingId).populate({path:'show',populate:{path:'movie',model:'Movie'}}).populate('user');

      await sendEmail({
        to: booking.user.email,
        subject: `Booking Confirmation - "${booking.show.movie.title}" booked!`,
        body: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Hi ${booking.user.name},</h2>
          <p>Thank you for booking with QuickShow! Your booking for the movie "<strong>${booking.show.movie.title}</strong>" has been confirmed.</p>
          <p>
          <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', {timeZone:'Asia/Kolkata'})}<br/>
          <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {timeZone:'Asia/Kolkata'})}<br/>
          </p>
          <p>Enjoy your movie!</p>
          <p>Best regards,<br/>The QuickShow Team</p>
        </div>`,
      })
    }
)




export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdation, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail];