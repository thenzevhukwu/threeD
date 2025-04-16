import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

// Make sure webhook event is coming from clerk
// if so, listen to user.created event
// make sure the user is saved to the database

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
        }

         
        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("Error occured -- no svix headers", {
                status: 400,
            });
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt:any;

        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as any;
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return new Response("Error occured", {status : 400});
        }

        const eventType = evt.type;

        if (eventType === "user.created" || eventType === "user.updated") {
            const { 
                id, 
                email_addresses, 
                first_name, 
                last_name, 
                image_url,
            } = evt.data;

            const email = email_addresses[0].email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.createUser, {
                    email,
                    fullname: name,
                    image: image_url,
                    clerkId: id,
                    username: email.split("@")[0],
                });
            } catch (error) {
                console.log("Error creating/updating user: ", error);
                return new Response("Error creating/updating user", { status: 500 });
            }
        }

        return new Response("Webhook processed successfully", { status: 200 });

    })
})

export default http;