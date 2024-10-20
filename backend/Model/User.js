import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username:String,
  age: Number,
  department: String,
  income: Number,
  spend: Number,
  rules: String, 
});

const User = mongoose.model("User", userSchema);

export default User;
