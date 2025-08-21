import { Inngest } from "inngest";
import User from "../models/user.js"

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


export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdation];