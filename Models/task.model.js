const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    due_date: { type: Date, required: true },
    priority: { type: Number, required: true },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    user:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    deleted_at: { type: Date },
},{
    versionKey:false
})

const TaskModel = mongoose.model("Task", taskSchema);

module.exports = {TaskModel}