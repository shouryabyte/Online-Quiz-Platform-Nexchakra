import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 40 },
    earnedAt: { type: Date, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: "" },
    email: { type: String, trim: true, lowercase: true, index: true, unique: true, sparse: true },
    passwordHash: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    provider: { type: String, enum: ["local", "google", "github"], default: "local", index: true },

    googleId: { type: String, unique: true, sparse: true, index: true },
    githubId: { type: String, unique: true, sparse: true, index: true },

    roles: { type: [String], default: ["user"] },

    xp: { type: Number, default: 0, min: 0, index: true },
    streak: { type: Number, default: 0, min: 0 },
    lastQuizAt: { type: Date, default: null },

    quizzesTaken: { type: Number, default: 0, min: 0 },
    totalCorrect: { type: Number, default: 0, min: 0 },
    totalAnswered: { type: Number, default: 0, min: 0 },

    badges: { type: [badgeSchema], default: [] },
    premiumUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.virtual("accuracy").get(function accuracy() {
  if (!this.totalAnswered) return 0;
  return Math.round((this.totalCorrect / this.totalAnswered) * 100);
});

userSchema.virtual("level").get(function level() {
  const xp = this.xp || 0;
  return Math.max(1, Math.floor(xp / 250) + 1);
});

userSchema.virtual("isPremium").get(function isPremium() {
  if (!this.premiumUntil) return false;
  return new Date(this.premiumUntil).getTime() > Date.now();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = mongoose.model("User", userSchema);