import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: [
        "admin",
        "kutlubey",
        "agdaci",
        "ulus",
        "kurucasile",
        "osb",
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);