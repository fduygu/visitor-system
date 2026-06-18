import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    tcNo: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    plateNumber: {
      type: String,
      default: "",
    },

    visitTo: {
      type: String,
      required: true,
    },

    campus: {
      type: String,
      required: true,
      enum: ["kutlubey", "agdaci", "ulus", "kurucasile", "osb"],
    },

    entryTime: {
      type: Date,
      default: Date.now,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["İÇERİDE", "ÇIKIŞ YAPTI"],
      default: "İÇERİDE",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Visitor", visitorSchema);