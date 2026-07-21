import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

passport.use(
    // Passport map username field to your schema name field
    new LocalStrategy({ usernameField: 'firstname' }, async (firstname, password, done) => {
        try {
            // Look up the user by their unique name string
            const user = await prisma.user.findUnique({
                where: { name: firstname },
            });

            // Prisma returns null if no user is found
            if (!user) {
                return done(null, false, { message: 'Incorrect username' });
            }

            // Verify the password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: 'Incorrect password' });
            }

            // Success! Pass the user object forward
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        // Fetch the user by their unique integer ID on subsequent requests
        const user = await prisma.user.findUnique({
            where: { id: id },
        });
        
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;