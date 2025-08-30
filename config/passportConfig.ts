import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import pool from "./db";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id: number, done) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  done(null, result.rows[0]);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:5001/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await pool.query(
          "SELECT * FROM users WHERE provider_id = $1 AND provider = $2",
          [profile.id, "google"]
        );
        let user = result.rows[0];
        if (!user) {
          const newUser = await pool.query(
            "INSERT INTO users (name, email, provider, provider_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [
              profile.displayName,
              profile.emails?.[0].value,
              "google",
              profile.id,
              "user",
            ]
          );
          user = newUser.rows[0];
        }
        done(null, user);
      } catch (err) {
        console.error("Error in GoogleStrategy verify:", err);
        done(err, false);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: "http://localhost:5001/api/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await pool.query(
          "SELECT * FROM users WHERE provider_id = $1 AND provider = $2",
          [profile.id, "facebook"]
        );
        let user = result.rows[0];

        if (!user) {
          const newUser = await pool.query(
            "INSERT INTO users (name, email, provider, provider_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [
              profile.displayName,
              profile.emails?.[0].value,
              "facebook",
              profile.id,
              "user",
            ]
          );
          user = newUser.rows[0];
        }
        done(null, user);
      } catch (err) {
        console.error("Error in FacebookStrategy verify:", err);
        done(err, null);
      }
    }
  )
);
export default passport;
