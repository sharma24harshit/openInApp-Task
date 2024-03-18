const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    phone_number: { type: Number, required: true },
    priority: { type: Number, enum: [0, 1, 2],  default: 2  },
},{
    versionKey:false
})

const UserModel = mongoose.model("User", userSchema);

module.exports = {UserModel}